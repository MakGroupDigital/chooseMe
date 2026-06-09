import React, { useEffect, useMemo, useRef, useState } from 'react';
import { FileText, ImagePlus, Newspaper, Send, Video, X } from 'lucide-react';
import { UserProfile } from '../../../types';
import { PRESS_CONTENT_CATEGORIES, createPressContent, type PressContentKind } from '../../../services/reportageService';

interface PressDashboardProps {
  user: UserProfile;
}

const categories = [...PRESS_CONTENT_CATEGORIES];

const getPublicationErrorMessage = (error: unknown): string => {
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return 'Publication impossible pour le moment. Vérifiez le média puis réessayez.';
};

const PressDashboard: React.FC<PressDashboardProps> = ({ user }) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [kind, setKind] = useState<PressContentKind>('article');
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [category, setCategory] = useState(categories[0]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const mediaPreview = useMemo(() => {
    if (!mediaFile) return '';
    return URL.createObjectURL(mediaFile);
  }, [mediaFile]);

  useEffect(() => {
    return () => {
      if (mediaPreview) URL.revokeObjectURL(mediaPreview);
    };
  }, [mediaPreview]);

  const resetForm = () => {
    setTitle('');
    setDetail('');
    setCategory(categories[0]);
    setMediaFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setError('');
    setSuccess('');

    if (!file) {
      setMediaFile(null);
      return;
    }

    const isSupported = file.type.startsWith('image/') || file.type.startsWith('video/');
    if (!isSupported) {
      setError('Ajoutez une photo ou une vidéo.');
      event.target.value = '';
      return;
    }

    if (file.size > 500 * 1024 * 1024) {
      setError('Le média ne doit pas dépasser 500MB.');
      event.target.value = '';
      return;
    }

    setMediaFile(file);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Ajoutez un titre.');
      return;
    }

    if (!detail.trim()) {
      setError('Ajoutez le contenu ou la description.');
      return;
    }

    setSubmitting(true);
    try {
      await createPressContent({
        authorId: user.uid,
        authorName: user.displayName || user.email || 'Média Choose Me',
        authorAvatar: user.avatarUrl,
        title,
        detail,
        kind,
        category,
        mediaFile
      });

      resetForm();
      setSuccess(kind === 'article' ? 'Article publié.' : 'Reportage publié.');
    } catch (err) {
      console.error('Publication presse impossible:', err);
      setError(getPublicationErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#050505] px-5 pb-32 pt-10 text-white">
      <header className="mb-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-[#19DB8A]/30 bg-[#19DB8A]/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-[#19DB8A]">
          <Newspaper size={13} />
          Espace presse
        </div>
        <h1 className="mt-4 text-3xl font-readex font-bold">Créer une publication média</h1>
        <p className="mt-2 text-sm text-white/45">
          Publiez un article ou un reportage avec photo ou vidéo.
        </p>
      </header>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setKind('article')}
            className={`rounded-2xl border p-4 text-left transition ${
              kind === 'article'
                ? 'border-[#19DB8A] bg-[#19DB8A]/12'
                : 'border-white/10 bg-[#0A0A0A]'
            }`}
          >
            <FileText className={kind === 'article' ? 'text-[#19DB8A]' : 'text-white/45'} size={22} />
            <span className="mt-3 block text-sm font-bold">Article</span>
            <span className="mt-1 block text-xs text-white/40">Texte, photo ou vidéo.</span>
          </button>
          <button
            type="button"
            onClick={() => setKind('reportage')}
            className={`rounded-2xl border p-4 text-left transition ${
              kind === 'reportage'
                ? 'border-[#19DB8A] bg-[#19DB8A]/12'
                : 'border-white/10 bg-[#0A0A0A]'
            }`}
          >
            <Video className={kind === 'reportage' ? 'text-[#19DB8A]' : 'text-white/45'} size={22} />
            <span className="mt-3 block text-sm font-bold">Reportage</span>
            <span className="mt-1 block text-xs text-white/40">Sujet terrain, image ou vidéo.</span>
          </button>
        </div>

        <div className="space-y-2">
          <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Titre</label>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex: Les jeunes talents qui montent"
            className="w-full rounded-2xl border border-white/10 bg-[#0A0A0A] px-4 py-4 text-white outline-none transition focus:border-[#19DB8A]"
          />
        </div>

        <div className="space-y-2">
          <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Catégorie</label>
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            {categories.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap ${
                  category === item
                    ? 'border-[#19DB8A] bg-[#19DB8A] text-black'
                    : 'border-white/10 bg-[#0A0A0A] text-white/45'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="ml-1 text-[10px] font-bold uppercase tracking-[0.18em] text-white/45">Contenu</label>
          <textarea
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            rows={7}
            placeholder="Rédigez votre article, votre angle, le contexte ou la description du reportage..."
            className="w-full resize-none rounded-2xl border border-white/10 bg-[#0A0A0A] px-4 py-4 text-white outline-none transition focus:border-[#19DB8A]"
          />
        </div>

        <div className="space-y-3">
          <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
          {!mediaFile ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-3 rounded-2xl border border-dashed border-white/15 bg-[#0A0A0A] px-4 py-6 text-sm font-bold text-white/65"
            >
              <ImagePlus size={20} />
              Ajouter une photo ou une vidéo
            </button>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0A0A0A]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <span className="truncate text-sm font-semibold">{mediaFile.name}</span>
                <button
                  type="button"
                  onClick={() => setMediaFile(null)}
                  className="rounded-full bg-white/10 p-1.5 text-white/70"
                >
                  <X size={15} />
                </button>
              </div>
              {mediaFile.type.startsWith('video/') ? (
                <video src={mediaPreview} controls className="h-56 w-full bg-black object-contain" />
              ) : (
                <img src={mediaPreview} className="h-56 w-full object-cover" />
              )}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && <p className="text-sm text-[#19DB8A]">{success}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#19DB8A] px-4 py-4 text-sm font-black uppercase tracking-[0.12em] text-black transition disabled:opacity-50"
        >
          <Send size={18} />
          {submitting ? 'Publication...' : kind === 'article' ? 'Publier l’article' : 'Publier le reportage'}
        </button>
      </form>
    </div>
  );
};

export default PressDashboard;
