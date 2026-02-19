import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import { fetchReportages, type ReportageItem } from '../../services/reportageService';

type LocationState = {
  reportage?: ReportageItem;
};

const ReportageDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as LocationState | null;

  const [item, setItem] = useState<ReportageItem | null>(state?.reportage ?? null);
  const [loading, setLoading] = useState(!state?.reportage);

  useEffect(() => {
    if (!item && id) {
      const load = async () => {
        setLoading(true);
        const all = await fetchReportages();
        const found = all.find((r) => r.id === id) ?? null;
        setItem(found);
        setLoading(false);
      };
      void load();
    }
  }, [id, item]);

  const handleShare = () => {
    if (!item) return;
    const url = `${window.location.origin}/#/explorer/reportage/${item.id}`;
    const text = `${item.title} - ${item.reporter}`;

    if (navigator.share) {
      navigator
        .share({
          title: item.title,
          text,
          url
        })
        .catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        alert('Lien du reportage copié dans le presse-papiers.');
      });
    } else {
      alert(url);
    }
  };

  if (!id) {
    navigate('/explorer', { replace: true });
    return null;
  }

  if (loading || !item) {
    return (
      <div className="h-full flex flex-col bg-[#050505]">
        <header className="px-4 pt-10 pb-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-black/40 border border-white/10 text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-white font-semibold text-sm">Reportage</h1>
        </header>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-white/50 text-sm">Chargement du reportage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[#050505]">
      {/* Header */}
      <header className="px-4 pt-10 pb-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-black/40 border border-white/10 text-white"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex flex-col">
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#19DB8A] font-semibold">
              Reportage
            </span>
            <h1 className="text-white font-semibold text-sm line-clamp-1">
              {item.title}
            </h1>
          </div>
        </div>
        <button
          onClick={handleShare}
          className="p-2 rounded-full bg-black/40 border border-white/10 text-white"
        >
          <Share2 size={16} />
        </button>
      </header>

      {/* Video */}
      <div className="px-4">
        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-black shadow-xl">
          <video
            src={item.videoUrl}
            className="w-full h-56 object-cover"
            controls
            playsInline
            preload="metadata"
          />
        </div>
      </div>

      {/* Infos */}
      <div className="flex-1 px-4 pt-4 pb-24 overflow-y-auto custom-scrollbar space-y-4">
        <div>
          <h2 className="text-white text-lg font-bold leading-snug">
            {item.title}
          </h2>
          <p className="text-white/50 text-xs mt-1">
            Par {item.reporter} • {item.date}
          </p>
        </div>

        {item.detail && (
          <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-4">
            <h3 className="text-white text-xs font-semibold mb-2 uppercase tracking-[0.18em]">
              Description
            </h3>
            <p className="text-white/80 text-sm whitespace-pre-wrap leading-relaxed">
              {item.detail}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportageDetailPage;

