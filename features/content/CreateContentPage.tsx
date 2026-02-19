import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  FlipHorizontal,
  Check,
  Upload,
  Volume2,
  VolumeX,
  Zap,
  Tv,
  Timer,
  ScanLine,
  Sun,
  Aperture,
  Gauge,
  Lightbulb,
  SlidersHorizontal,
  Palette,
  Play,
  Pause,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { UserType } from '../../types';
import { permissionService } from '../../services/permissionService';

const CreateContentPage: React.FC<{ userType: UserType }> = ({ userType }) => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const animationFrameRef = useRef<number | null>(null);
  
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordedUrl, setRecordedUrl] = useState<string | null>(null);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [cameraFacing, setCameraFacing] = useState<'user' | 'environment'>('user');
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [brightness, setBrightness] = useState(100);
  const [beautyMode, setBeautyMode] = useState(false);
  const [liveEffect, setLiveEffect] = useState<'none' | 'warm' | 'cold' | 'bw' | 'cinematic'>('none');
  const [countdown, setCountdown] = useState(0);
  const [countdownLeft, setCountdownLeft] = useState<number | null>(null);
  const [maxDuration, setMaxDuration] = useState(15);
  const [speed, setSpeed] = useState(1);
  const [zoom, setZoom] = useState(1);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchAvailable, setTorchAvailable] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [previewPlaying, setPreviewPlaying] = useState(true);
  const [previewMuted, setPreviewMuted] = useState(false);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [hdMode, setHdMode] = useState(true);

  const stopTimeoutRef = useRef<number | null>(null);
  const effectOptions: Array<{ id: 'none' | 'warm' | 'cold' | 'bw' | 'cinematic'; label: string }> = [
    { id: 'none', label: 'Normal' },
    { id: 'warm', label: 'Warm' },
    { id: 'cold', label: 'Cold' },
    { id: 'bw', label: 'N/B' },
    { id: 'cinematic', label: 'Ciné' }
  ];

  const clearActiveStream = useCallback((activeStream?: MediaStream | null) => {
    const streamToClear = activeStream ?? stream;
    if (streamToClear) {
      streamToClear.getTracks().forEach((t) => t.stop());
    }
  }, [stream]);

  const cancelTimers = useCallback(() => {
    if (stopTimeoutRef.current !== null) {
      window.clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  // Timer affichage enregistrement
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

  // Démarrer/recharger la caméra automatiquement
  useEffect(() => {
    startCamera();
    return () => {
      cancelTimers();
      clearActiveStream();
      if (recordedUrl) {
        URL.revokeObjectURL(recordedUrl);
      }
    };
  }, [cameraFacing, hdMode]);

  const startCamera = useCallback(async () => {
    try {
      clearActiveStream();

      const cameraGranted = await permissionService.requestCamera();
      if (!cameraGranted) {
        alert('Permission caméra refusée. Impossible de filmer.');
        return;
      }

      const micGranted = await permissionService.requestMicrophone();
      
      // Essayer avec les contraintes HD/4K, sinon fallback à des contraintes plus flexibles
      let newStream;
      try {
        const videoConstraints = hdMode 
          ? {
              facingMode: cameraFacing,
              width: { ideal: 3840, min: 1080 },
              height: { ideal: 2160, min: 1920 },
              aspectRatio: { ideal: 9/16 }
            }
          : {
              facingMode: cameraFacing,
              width: { ideal: 1920, min: 720 },
              height: { ideal: 1080, min: 480 },
              aspectRatio: { ideal: 9/16 }
            };

        newStream = await navigator.mediaDevices.getUserMedia({
          video: videoConstraints,
          audio: micGranted
        });
      } catch (constraintError) {
        console.warn('Contraintes strictes échouées, essai avec contraintes flexibles:', constraintError);
        
        // Fallback: contraintes plus flexibles
        newStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: cameraFacing,
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: micGranted
        });
      }

      newStream.getAudioTracks().forEach((track) => {
        track.enabled = audioEnabled;
      });

      const mainVideoTrack = newStream.getVideoTracks()[0];
      const capabilities = mainVideoTrack.getCapabilities?.() as MediaTrackCapabilities & { torch?: boolean };
      setTorchAvailable(Boolean(capabilities?.torch));
      setTorchEnabled(false);

      setStream(newStream);
      if (videoRef.current) {
        videoRef.current.srcObject = newStream;
        videoRef.current.play().catch(() => {});
      }
    } catch (e) {
      console.error('Erreur caméra:', e);
      alert("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  }, [audioEnabled, cameraFacing, clearActiveStream, hdMode]);

  const toggleAudio = () => {
    const next = !audioEnabled;
    setAudioEnabled(next);
    if (stream) {
      stream.getAudioTracks().forEach((track) => {
        track.enabled = next;
      });
    }
  };

  const getBestMimeType = () => {
    const candidates = [
      'video/webm;codecs=vp9',
      'video/webm;codecs=vp8',
      'video/webm',
      'video/mp4'
    ];
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || '';
  };

  const getEffectFilter = () => {
    switch (liveEffect) {
      case 'warm':
        return 'sepia(0.18) saturate(1.18) hue-rotate(-6deg) contrast(1.03)';
      case 'cold':
        return 'saturate(0.9) contrast(1.08) hue-rotate(165deg) brightness(1.03)';
      case 'bw':
        return 'grayscale(1) contrast(1.16) brightness(1.02)';
      case 'cinematic':
        return 'contrast(1.2) saturate(0.78) brightness(0.9) sepia(0.12)';
      default:
        return '';
    }
  };

  const getComposedFilter = () => {
    const parts = [
      `brightness(${brightness}%)`,
      beautyMode ? 'saturate(1.08) contrast(1.04)' : '',
      getEffectFilter()
    ].filter(Boolean);
    return parts.join(' ');
  };

  const beginRecording = async () => {
    if (!stream || !videoRef.current) return;

    chunksRef.current = [];

    const canvas = canvasRef.current;
    if (!canvas) return;

    if (hdMode) {
      canvas.width = 2160;
      canvas.height = 3840;
    } else {
      canvas.width = 1080;
      canvas.height = 1920;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Créer un stream depuis le canvas
    const canvasStream = canvas.captureStream(30);

    stream.getAudioTracks().forEach(track => {
      canvasStream.addTrack(track);
    });

    const videoBitsPerSecond = hdMode ? 8000000 : 4000000;
    const mimeType = getBestMimeType();

    const recorder = new MediaRecorder(canvasStream, mimeType ? {
      mimeType,
      videoBitsPerSecond
    } : {
      videoBitsPerSecond
    });

    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunksRef.current.push(e.data);
      }
    };

    recorder.onstop = () => {
      const resolvedType = recorder.mimeType || mimeType || 'video/webm';
      const blob = new Blob(chunksRef.current, { type: resolvedType });
      const url = URL.createObjectURL(blob);
      setRecordedBlob(blob);
      setRecordedUrl(url);
      cancelTimers();

      clearActiveStream(stream);
      setStream(null);
    };

    recorder.start();
    mediaRecorderRef.current = recorder;
    setRecording(true);
    setRecordingTime(0);

    // Tiktok-like: vitesse impacte le temps réel de capture.
    const realDurationLimit = Math.max(3, Math.floor(maxDuration / speed));
    stopTimeoutRef.current = window.setTimeout(() => {
      if (mediaRecorderRef.current?.state === 'recording') {
        stopRecording();
      }
    }, realDurationLimit * 1000);

    const drawFrame = () => {
      if (!videoRef.current || !ctx || !mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
        return;
      }

      ctx.save();

      // Calculer les dimensions pour remplir le canvas en portrait
      const video = videoRef.current;
      const videoWidth = video.videoWidth;
      const videoHeight = video.videoHeight;
      if (!videoWidth || !videoHeight) {
        ctx.restore();
        animationFrameRef.current = requestAnimationFrame(drawFrame);
        return;
      }
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Calculer le ratio pour remplir le canvas
      const videoRatio = videoWidth / videoHeight;
      const canvasRatio = canvasWidth / canvasHeight;

      let drawWidth, drawHeight, offsetX, offsetY;

      if (videoRatio > canvasRatio) {
        // Vidéo plus large
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * videoRatio;
        offsetX = (canvasWidth - drawWidth) / 2;
        offsetY = 0;
      } else {
        // Vidéo plus haute
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / videoRatio;
        offsetX = 0;
        offsetY = (canvasHeight - drawHeight) / 2;
      }

      ctx.filter = getComposedFilter();

      const zoomedWidth = drawWidth * zoom;
      const zoomedHeight = drawHeight * zoom;
      const zoomedX = offsetX - (zoomedWidth - drawWidth) / 2;
      const zoomedY = offsetY - (zoomedHeight - drawHeight) / 2;

      if (cameraFacing === 'user') {
        try {
          ctx.translate(canvasWidth, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(video, canvasWidth - zoomedX - zoomedWidth, zoomedY, zoomedWidth, zoomedHeight);
        } catch {
          // Si la frame n'est pas encore prête, on continue la boucle.
        }
      } else {
        try {
          ctx.drawImage(video, zoomedX, zoomedY, zoomedWidth, zoomedHeight);
        } catch {
          // Si la frame n'est pas encore prête, on continue la boucle.
        }
      }

      ctx.restore();

      animationFrameRef.current = requestAnimationFrame(drawFrame);
    };

    drawFrame();
  };

  const startRecording = async () => {
    if (!stream || recording || countdownLeft !== null) return;

    if (countdown > 0) {
      setCountdownLeft(countdown);
      return;
    }
    beginRecording();
  };

  useEffect(() => {
    if (countdownLeft === null) return;
    if (countdownLeft === 0) {
      setCountdownLeft(null);
      beginRecording();
      return;
    }
    const timeout = window.setTimeout(() => {
      setCountdownLeft((prev) => (prev === null ? null : prev - 1));
    }, 1000);
    return () => window.clearTimeout(timeout);
  }, [countdownLeft]);

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setRecording(false);
      mediaRecorderRef.current = null;
      cancelTimers();
    }
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

  const switchCamera = async () => {
    if (recording) return;
    setCameraFacing((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const toggleHdMode = () => {
    if (recording) return;
    setHdMode((prev) => !prev);
  };

  const retakeVideo = () => {
    if (recordedUrl) {
      URL.revokeObjectURL(recordedUrl);
    }
    setRecordedUrl(null);
    setRecordedBlob(null);
    setCountdownLeft(null);
    cancelTimers();
    startCamera();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      alert('Veuillez sélectionner un fichier vidéo');
      return;
    }

    // Arrêter la caméra si active
    if (stream) {
      clearActiveStream(stream);
      setStream(null);
    }

    // Créer le blob et l'URL
    const url = URL.createObjectURL(file);
    setRecordedBlob(file);
    setRecordedUrl(url);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTorch = async () => {
    if (!stream || !torchAvailable) return;
    const videoTrack = stream.getVideoTracks()[0];
    if (!videoTrack) return;

    const next = !torchEnabled;
    try {
      await videoTrack.applyConstraints({
        advanced: [{ torch: next } as MediaTrackConstraintSet]
      });
      setTorchEnabled(next);
    } catch (error) {
      console.warn('Torch non supportée:', error);
      setTorchEnabled(false);
    }
  };

  const getEffectPreviewClass = (effectId: 'none' | 'warm' | 'cold' | 'bw' | 'cinematic') => {
    if (effectId === 'warm') return 'bg-gradient-to-r from-amber-300/80 via-orange-300/70 to-rose-300/80';
    if (effectId === 'cold') return 'bg-gradient-to-r from-cyan-300/80 via-sky-300/75 to-indigo-300/70';
    if (effectId === 'bw') return 'bg-gradient-to-r from-zinc-200 via-zinc-400 to-zinc-700';
    if (effectId === 'cinematic') return 'bg-gradient-to-r from-amber-800/90 via-slate-700/95 to-zinc-900';
    return 'bg-gradient-to-r from-[#19DB8A] to-[#FF8A3C]';
  };

  const formatPlayerTime = (seconds: number) => {
    if (!Number.isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePreviewPlay = () => {
    const video = previewVideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
      setPreviewPlaying(true);
    } else {
      video.pause();
      setPreviewPlaying(false);
    }
  };

  const togglePreviewMute = () => {
    const next = !previewMuted;
    setPreviewMuted(next);
    if (previewVideoRef.current) {
      previewVideoRef.current.muted = next;
    }
  };

  const onPreviewSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextTime = Number(e.target.value);
    setPreviewCurrentTime(nextTime);
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = nextTime;
    }
  };

  const togglePreviewFullscreen = async () => {
    const container = previewVideoRef.current?.parentElement;
    if (!container) return;
    if (!document.fullscreenElement) {
      await container.requestFullscreen().catch(() => {});
      setIsFullscreenPreview(Boolean(document.fullscreenElement));
    } else {
      await document.exitFullscreen().catch(() => {});
      setIsFullscreenPreview(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreenPreview(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  useEffect(() => {
    if (!recordedUrl) {
      setPreviewCurrentTime(0);
      setPreviewDuration(0);
      setPreviewPlaying(true);
      return;
    }
    const video = previewVideoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.muted = previewMuted;
    video.play().then(() => {
      setPreviewPlaying(true);
    }).catch(() => {
      setPreviewPlaying(false);
    });
  }, [recordedUrl]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Vidéo Stream - Format portrait mobile */}
      <div className="flex-1 relative overflow-hidden bg-black flex items-center justify-center">
        {recordedUrl ? (
          <>
            <video
              ref={previewVideoRef}
              src={recordedUrl}
              className="absolute inset-0 h-full w-full object-cover"
              autoPlay
              loop
              muted={previewMuted}
              playsInline
              onClick={togglePreviewPlay}
              onLoadedMetadata={(e) => setPreviewDuration(e.currentTarget.duration || 0)}
              onTimeUpdate={(e) => setPreviewCurrentTime(e.currentTarget.currentTime)}
              onPlay={() => setPreviewPlaying(true)}
              onPause={() => setPreviewPlaying(false)}
            />
            <div className="absolute left-3 right-3 bottom-[13rem] z-30">
              <div className="bg-black/60 border border-white/15 backdrop-blur-lg rounded-2xl px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <button
                    onClick={togglePreviewPlay}
                    className="w-9 h-9 rounded-full bg-[#19DB8A] text-black flex items-center justify-center"
                  >
                    {previewPlaying ? <Pause size={18} /> : <Play size={18} />}
                  </button>
                  <button
                    onClick={togglePreviewMute}
                    className="w-9 h-9 rounded-full bg-black/45 border border-[#FF8A3C]/45 text-[#FF8A3C] flex items-center justify-center"
                  >
                    {previewMuted ? <VolumeX size={17} /> : <Volume2 size={17} />}
                  </button>
                  <button
                    onClick={togglePreviewFullscreen}
                    className="w-9 h-9 rounded-full bg-black/45 border border-white/20 text-white flex items-center justify-center"
                  >
                    {isFullscreenPreview ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                  </button>
                  <div className="ml-auto text-[11px] font-bold text-white/85 tabular-nums">
                    {formatPlayerTime(previewCurrentTime)} / {formatPlayerTime(previewDuration)}
                  </div>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(0, previewDuration)}
                  step={0.1}
                  value={Math.min(previewCurrentTime, previewDuration || 0)}
                  onChange={onPreviewSeek}
                  className="mt-2 w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#19DB8A] bg-white/20"
                />
              </div>
            </div>
          </>
        ) : (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            autoPlay
            muted
            playsInline
            style={{
              transform: `${cameraFacing === 'user' ? 'scaleX(-1)' : ''} scale(${zoom})`.trim(),
              filter: getComposedFilter()
            }}
          />
        )}

        {/* Canvas caché pour l'enregistrement */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-transparent to-black/50 pointer-events-none" />

        {/* Header avec contrôles */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10 safe-area-top">
          <button
            onClick={() => navigate(-1)}
            className="w-11 h-11 rounded-full bg-black/50 backdrop-blur-md border border-[#19DB8A]/30 flex items-center justify-center text-[#19DB8A] hover:bg-black/70 transition-all"
          >
            <X size={24} />
          </button>

          {!recordedUrl && (
            <div className="flex gap-2 items-center">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="w-11 h-11 rounded-full bg-black/55 backdrop-blur-md border border-[#FF8A3C]/35 flex items-center justify-center text-[#FF8A3C] hover:bg-black/70 transition-all"
              >
                <SlidersHorizontal size={18} />
              </button>
              <button
                onClick={toggleHdMode}
                className={`min-w-[3.4rem] h-11 px-2 rounded-full backdrop-blur-md border flex items-center justify-center text-xs font-extrabold transition-all ${
                  hdMode
                    ? 'bg-[#19DB8A] text-black border-[#19DB8A]'
                    : 'bg-black/55 text-[#FF8A3C] border-[#FF8A3C]/45'
                }`}
              >
                {hdMode ? '4K' : 'HD'}
              </button>
              <button
                onClick={switchCamera}
                className="w-11 h-11 rounded-full bg-black/55 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-black/70 transition-all"
              >
                <FlipHorizontal size={20} />
              </button>
            </div>
          )}
        </div>

        {!recordedUrl && (
          <div className="absolute right-4 top-28 z-10 flex flex-col gap-3">
            <button
              onClick={() => setBeautyMode((prev) => !prev)}
              className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all ${
                beautyMode ? 'bg-[#19DB8A] text-black border-[#19DB8A]' : 'bg-black/50 text-[#19DB8A] border-[#19DB8A]/40'
              }`}
            >
              <Aperture size={18} />
            </button>
            <button
              onClick={toggleTorch}
              disabled={!torchAvailable}
              className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all ${
                torchEnabled ? 'bg-[#FF8A3C] text-black border-[#FF8A3C]' : 'bg-black/50 text-[#FF8A3C] border-[#FF8A3C]/35'
              } ${!torchAvailable ? 'opacity-40 cursor-not-allowed' : ''}`}
            >
              <Lightbulb size={18} />
            </button>
            <button
              onClick={toggleAudio}
              className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all ${
                audioEnabled ? 'bg-black/50 text-white border-white/20' : 'bg-red-500/80 text-white border-red-400'
              }`}
            >
              {audioEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
            </button>
          </div>
        )}

        {!recordedUrl && (
          <div className="absolute left-3 right-3 bottom-[12.4rem] z-20">
            <div className="bg-black/55 backdrop-blur-lg border border-white/10 rounded-2xl p-2.5">
              <div className="flex items-center gap-2 text-white/80 text-xs font-semibold mb-2 px-1">
                <Palette size={14} className="text-[#FF8A3C]" />
                Effets live
              </div>
              <div className="flex gap-2 overflow-x-auto custom-scrollbar">
                {effectOptions.map((effect) => (
                  <button
                    key={effect.id}
                    onClick={() => setLiveEffect(effect.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition-all flex items-center gap-2 ${
                      liveEffect === effect.id
                        ? 'bg-[#19DB8A] text-black border-[#19DB8A]'
                        : 'bg-black/35 text-white border-white/20'
                    }`}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${getEffectPreviewClass(effect.id)}`} />
                    {effect.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Panneau de réglages */}
        {showSettings && !recordedUrl && (
          <div className="absolute top-20 left-4 bg-black/80 backdrop-blur-md rounded-2xl p-4 z-20 w-[19rem] border border-white/10">
            <div className="space-y-4">
              {/* Contrôle HD */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tv size={18} className={hdMode ? "text-[#19DB8A]" : "text-white/50"} />
                  <span className="text-white text-sm font-semibold">Qualité 4K / HD</span>
                </div>
                <button
                  onClick={toggleHdMode}
                  className={`w-12 h-6 rounded-full transition-all ${
                    hdMode ? 'bg-[#19DB8A]' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      hdMode ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Indicateur de résolution */}
              <div className="bg-white/5 rounded-lg p-2 text-center">
                <p className="text-white/70 text-xs font-semibold">
                  {hdMode ? '4K Ultra • 2160x3840' : 'HD Pro • 1080x1920'}
                </p>
              </div>

              {/* Contrôle audio */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {audioEnabled ? (
                    <Volume2 size={18} className="text-white" />
                  ) : (
                    <VolumeX size={18} className="text-white/50" />
                  )}
                  <span className="text-white text-sm font-semibold">Audio</span>
                </div>
                <button
                  onClick={toggleAudio}
                  className={`w-12 h-6 rounded-full transition-all ${
                    audioEnabled ? 'bg-[#19DB8A]' : 'bg-white/20'
                  }`}
                >
                  <div
                    className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      audioEnabled ? 'translate-x-6' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>

              {/* Contrôle vitesse */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Gauge size={16} className="text-white/80" />
                  <label className="text-white text-sm font-semibold">Vitesse</label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[0.5, 1, 2].map((item) => (
                    <button
                      key={item}
                      onClick={() => setSpeed(item)}
                      className={`py-1.5 rounded-lg text-xs font-bold ${
                        speed === item ? 'bg-[#19DB8A] text-black' : 'bg-white/10 text-white'
                      }`}
                    >
                      {item}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Durée max */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ScanLine size={16} className="text-white/80" />
                  <label className="text-white text-sm font-semibold">Durée max</label>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[15, 60].map((item) => (
                    <button
                      key={item}
                      onClick={() => setMaxDuration(item)}
                      className={`py-1.5 rounded-lg text-xs font-bold ${
                        maxDuration === item ? 'bg-[#19DB8A] text-black' : 'bg-white/10 text-white'
                      }`}
                    >
                      {item}s
                    </button>
                  ))}
                </div>
              </div>

              {/* Compte à rebours */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Timer size={16} className="text-white/80" />
                  <label className="text-white text-sm font-semibold">Compte à rebours</label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[0, 3, 10].map((item) => (
                    <button
                      key={item}
                      onClick={() => setCountdown(item)}
                      className={`py-1.5 rounded-lg text-xs font-bold ${
                        countdown === item ? 'bg-[#19DB8A] text-black' : 'bg-white/10 text-white'
                      }`}
                    >
                      {item === 0 ? 'Off' : `${item}s`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Contrôle luminosité */}
              <div>
                <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                  <Sun size={16} />
                  Luminosité
                </label>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#19DB8A]"
                />
                <div className="text-white/60 text-xs mt-1 text-center">
                  {brightness}%
                </div>
              </div>

              {/* Contrôle zoom */}
              <div>
                <label className="text-white text-sm font-semibold mb-2 flex items-center gap-2">
                  <ScanLine size={16} />
                  Zoom
                </label>
                <input
                  type="range"
                  min="1"
                  max="2"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#19DB8A]"
                />
                <div className="text-white/60 text-xs mt-1 text-center">
                  {zoom.toFixed(1)}x
                </div>
              </div>
            </div>
          </div>
        )}

        {countdownLeft !== null && countdownLeft > 0 && !recording && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 backdrop-blur-[2px]">
            <div className="text-[5rem] leading-none font-black text-white drop-shadow-[0_0_25px_rgba(25,219,138,0.8)]">
              {countdownLeft}
            </div>
          </div>
        )}

        {/* Timer d'enregistrement */}
        {recording && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-red-500/90 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 shadow-lg">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              <span className="text-white font-bold text-sm">{formatTime(recordingTime)}</span>
            </div>
          </div>
        )}

        {/* Indicateur de caméra prête */}
        {!recording && !recordedUrl && stream && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10">
            <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-full">
              <span className="text-white text-xs sm:text-sm font-semibold">
                {countdown > 0 ? `Départ dans ${countdown}s` : 'Appuyez pour enregistrer'} • {maxDuration}s • {speed}x
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Contrôles d'enregistrement (mode caméra) */}
      {!recordedUrl && (
        <div className="absolute left-0 right-0 bottom-[7.4rem] z-30 px-6 pointer-events-none">
          <div className="flex justify-center items-center gap-6 pointer-events-auto">
            {/* Bouton Import */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FF8A3C] to-[#19DB8A] backdrop-blur-md border-2 border-[#19DB8A]/70 flex items-center justify-center shadow-[0_10px_26px_rgba(25,219,138,0.35)] group-hover:scale-105 transition-all">
                <Upload size={24} className="text-black" />
              </div>
              <span className="text-[#19DB8A] text-xs font-extrabold">Importer</span>
            </button>

            {/* Bouton Enregistrer */}
            <button
              onClick={recording ? stopRecording : startRecording}
              className="relative group"
              disabled={!stream || countdownLeft !== null}
            >
              {recording ? (
                <div className="w-20 h-20 rounded-2xl bg-[#FF8A3C] shadow-[0_14px_34px_rgba(255,138,60,0.55)] flex items-center justify-center animate-pulse border-2 border-[#19DB8A]">
                  <div className="w-8 h-8 bg-black rounded-sm" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-full border-4 border-[#19DB8A] bg-black/35 backdrop-blur-md flex items-center justify-center shadow-[0_14px_36px_rgba(25,219,138,0.35)] group-hover:scale-105 transition-all">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#19DB8A] to-[#FF8A3C] transition-all" />
                </div>
              )}
            </button>

            {/* Espace vide pour équilibrer */}
            <div className="w-14" />
          </div>
        </div>
      )}

      {/* Contrôles après enregistrement */}
      {recordedUrl && (
        <div className="bg-gradient-to-t from-black via-black/95 to-transparent px-6 pt-6 pb-28 safe-area-bottom flex gap-3">
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
      )}

      {/* Input file caché */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={handleFileImport}
      />
    </div>
  );
};

export default CreateContentPage;
