import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Check,
  Loader2,
  Upload,
  Volume2,
  VolumeX
} from 'lucide-react';
import { UserType } from '../../types';
import { uploadPerformanceVideo } from '../../services/performanceService';
import { getFirebaseAuth, getFirestoreDb } from '../../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { permissionService } from '../../services/permissionService';
import RightSidebar from '../../components/RightSidebar';

const PerformanceRecordingPage: React.FC<{ userType: UserType }> = ({ userType }) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [showCaptionInput, setShowCaptionInput] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isAthlete = userType === UserType.ATHLETE;

  // Timer pour l'enregistrement
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (recording) {
      interval = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }
    return () => clearInterval(interval);
  }, [recording]);

  // Démarrer la caméra automatiquement
  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const startCamera = async () => {
    try {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      
      const cameraGranted = await permissionService.requestCamera();
      if (!cameraGranted) {
        alert('Permission caméra refusée. Impossible de filmer.');
        return;
      }

      const micGranted = await permissionService.requestMicrophone();
      
      // Essayer d'abord avec des contraintes flexibles
      let newStream;
      try {
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: cameraFacing,
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            aspectRatio: { ideal: 9/16 }
          },
          audio: micGranted
        });
      } catch (e) {
        // Si ça échoue, essayer sans contraintes strictes
        console.warn('Contraintes vidéo échouées, essai sans contraintes:', e);
        newStream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: cameraFacing
          },
          audio: micGranted
        });
      }
      
      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (e) {
      console.error('Erreur caméra:', e);
      alert("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  };

  const toggleAudio = () => {
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = !audioEnabled;
      });
      setAudioEnabled(!audioEnabled);
    }
  };

  const startRecording = async () => {
    if (!stream || !videoRef.current) return;

    chunksRef.current = [];
    
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = 2160;
    canvas.height = 3840;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasStream = canvas.captureStream(30);

    stream.getAudioTracks().forEach(track => {
      canvasStream.addTrack(track);
    });

    const recorder = new MediaRecorder(canvasStream, {
      mimeType: 'video/webm;codecs=vp9',
      videoBitsPerSecond: 8000000
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedUrl(url);
      setShowCaptionInput(true);

      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
        setStream(null);
      }
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);

    const drawFrame = () => {
      if (!videoRef.current || !ctx || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
        return;
      }

      ctx.save();

      const video = videoRef.current;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      const videoRatio = videoWidth / videoHeight;
      const canvasRatio = canvasWidth / canvasHeight;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (videoRatio > canvasRatio) {
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * videoRatio;
        offsetX = (canvasWidth - drawWidth) / 2;
        offsetY = 0;
      } else {
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / videoRatio;
        offsetX = 0;
        offsetY = (canvasHeight - drawHeight) / 2;
      }

      if (cameraFacing === 'user') {
        ctx.translate(canvasWidth, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(video, canvasWidth - offsetX - drawWidth, offsetY, drawWidth, drawHeight);
      } else {
        ctx.drawImage(video, offsetX, offsetY, drawWidth, drawHeight);
      }

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
      mediaRecorderRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  };

  const switchCamera = () => {
    setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'));
    setTimeout(() => startCamera(), 100);
  };

  const retakeVideo = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedUrl(null);
    setRecordedBlob(null);
    setCaption('');
    setShowCaptionInput(false);
    startCamera();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Veuillez sélectionner un fichier vidéo');
      return;
    }

    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }

    const url = URL.createObjectURL(file);
    setRecordedBlob(file);
    setRecordedUrl(url);
    setShowCaptionInput(true);
  };

  const goToDescriptionPage = () => {
    if (recordedBlob) {
      navigate('/video-description', {
        state: {
          videoBlob: recordedBlob,
          userType: userType
        }
      });
    }
  };

  const handlePublish = async () => {
    if (!recordedBlob || !caption.trim()) {
      alert('Veuillez ajouter une description');
      return;
    }

    setUploading(true);
    try {
      const auth = getFirebaseAuth();
      const db = getFirestoreDb();
      const currentUser = auth.currentUser;

      if (!currentUser) {
        alert('Vous devez être connecté');
        setUploading(false);
        return;
      }

      const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userSnap.data() as any;

      console.log('📤 Publication de la vidéo de performance...');

      await uploadPerformanceVideo(
        currentUser.uid,
        userData?.displayName || currentUser.email || 'Utilisateur',
        userData?.photoUrl,
        recordedBlob,
        caption,
        'performance'
      );

      console.log('✅ Vidéo de performance publiée avec succès');

      navigate('/profile');

      setTimeout(() => {
        alert('Vidéo de performance publiée ! Le transcodage en MP4 prendra ~60 secondes.');
      }, 500);
    } catch (e) {
      console.error('❌ Erreur publication:', e);
      alert('Erreur lors de la publication. Veuillez réessayer.');
      setUploading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 overflow-hidden">
      {/* Vidéo principale - plein écran */}
      <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
        {recordedUrl ? (
          <video
            src={recordedUrl}
            className="w-full h-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : (
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            autoPlay
            muted
            playsInline
            style={{
              transform: cameraFacing === 'user' ? 'scaleX(-1)' : 'none',
              filter: `brightness(${brightness}%)`
            }}
          />
        )}
        
        <canvas ref={canvasRef} className="hidden" />

        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />

        {/* Header */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-20 safe-area-top">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/70 transition-all"
          >
            <X size={24} />
          </button>

          {!recordedUrl && (
            <div className="flex gap-2">
            </div>
          )}
        </div>

        {/* Timer d'enregistrement */}
        {recording && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-red-500/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="text-white font-bold text-sm">{formatTime(recordingTime)}</span>
            </div>
          </div>
        )}

        {/* Indicateur de caméra prête */}
        {!recording && !recordedUrl && stream && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-20">
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full">
              <span className="text-white text-sm font-semibold">
                Appuyez pour enregistrer
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Barre de navigation verticale - superposée */}
      <div className="absolute right-0 top-0 bottom-0 z-30">
        <RightSidebar 
          onSwitchCamera={switchCamera}
          onToggleFlash={() => {}}
          flashEnabled={false}
        />
      </div>

      {/* Contrôles d'enregistrement */}
      {!recordedUrl && (
        <div className="bg-gradient-to-t from-black via-black/95 to-transparent p-6 safe-area-bottom absolute bottom-0 left-0 right-0">
          <div className="flex justify-center items-center gap-6">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/30 flex items-center justify-center group-hover:border-white/50 transition-all">
                <Upload size={24} className="text-white" />
              </div>
              <span className="text-white text-xs font-semibold">Importer</span>
            </button>

            <button
              onClick={recording ? stopRecording : startRecording}
              className="relative group"
              disabled={!stream}
            >
              {recording ? (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#19DB8A] to-[#15a86f] shadow-2xl shadow-[#19DB8A]/50 flex items-center justify-center animate-pulse">
                  <div className="w-10 h-10 bg-white rounded-full" />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full border-4 border-[#19DB8A] flex items-center justify-center group-hover:border-[#19DB8A] group-hover:shadow-lg group-hover:shadow-[#19DB8A]/50 transition-all duration-300">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#19DB8A] to-[#15a86f] group-hover:scale-110 transition-all duration-300" />
                </div>
              )}
            </button>

            <div className="w-14" />
          </div>
        </div>
      )}

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileImport}
      />

      {/* Panneau de légende */}
      {showCaptionInput && recordedUrl && (
        <div className="bg-gradient-to-t from-black via-black/95 to-transparent p-6 safe-area-bottom absolute bottom-0 left-0 right-0">
          <div className="space-y-4">
            <div className="flex gap-3">
              <button
                onClick={retakeVideo}
                className="flex-1 py-4 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold hover:bg-white/20 transition-all"
              >
                Refaire
              </button>
              <button
                onClick={goToDescriptionPage}
                className="flex-1 py-4 rounded-full bg-[#19DB8A] text-black font-bold flex items-center justify-center gap-2 hover:bg-[#19DB8A]/90 transition-all"
              >
                <Check size={20} />
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceRecordingPage;
