import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, Star, MapPin, ChevronRight, Newspaper, TrendingUp, Heart, Share2, Check, UserPlus, PlayCircle, FileText, MessageCircle } from 'lucide-react';
import { UserType } from '../../types';
import { PRESS_CONTENT_CATEGORIES, fetchReportages, incrementReportageShare, toggleReportageLike, type ReportageItem } from '../../services/reportageService';
import { fetchTalentExplorerItems, type TalentExplorerItem } from '../../services/talentService';
import { SPORTS_POSITIONS } from '../../utils/sportsData';
import { getFirebaseAuth } from '../../services/firebase';
import { followAthlete, getFollowing, isFollowing, unfollowAthlete } from '../../services/followService';

const ALL_SPORT_FILTERS: string[] = [
  ...Object.keys(SPORTS_POSITIONS),
  'Lutte',
  'MMA',
  'Judo',
  'Karaté',
  'Taekwondo',
  'Rugby',
  'Natation',
  'Gymnastique',
  'Haltérophilie',
  'Escrime',
  'Badminton',
  'Tennis de table',
  'Baseball',
  'Cricket'
];

const normalizeSport = (value: string): string =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const BASE_ARTICLE_CATEGORIES = ['Tout', ...PRESS_CONTENT_CATEGORIES] as const;
type ArticleCategory = string;

const ExplorerPage: React.FC<{ userType: UserType }> = ({ userType }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSport, setSelectedSport] = useState('Tous');
  const [popularOnly, setPopularOnly] = useState(false);
  const [selectedArticleCategory, setSelectedArticleCategory] = useState<ArticleCategory>('Tout');
  const [reportages, setReportages] = useState<ReportageItem[]>([]);
  const [loadingReportages, setLoadingReportages] = useState(false);
  const [likedReportages, setLikedReportages] = useState<Set<string>>(new Set());
  const [followingMedia, setFollowingMedia] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<Set<string>>(new Set());
  const [currentUserId, setCurrentUserId] = useState('');
  const [talents, setTalents] = useState<TalentExplorerItem[]>([]);
  const [loadingTalents, setLoadingTalents] = useState(false);
  const isScout = userType === UserType.RECRUITER || userType === UserType.CLUB;
  const isPress = userType === UserType.PRESS;
  const navigate = useNavigate();

  useEffect(() => {
    setCurrentUserId(getFirebaseAuth().currentUser?.uid || '');
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!isScout) {
        setLoadingReportages(true);
        const items = await fetchReportages();
        setReportages(items);
        setLoadingReportages(false);
        return;
      }

      setLoadingTalents(true);
      const items = await fetchTalentExplorerItems();
      setTalents(items);
      setLoadingTalents(false);
    };

    void load();
  }, [isScout]);

  useEffect(() => {
    if (isScout || !currentUserId) return;

    setLikedReportages(new Set(
      reportages
        .filter((item) => item.likedBy.includes(currentUserId))
        .map((item) => item.id)
    ));
  }, [currentUserId, isScout, reportages]);

  useEffect(() => {
    if (isScout || !currentUserId) return;
    getFollowing(currentUserId)
      .then((ids) => setFollowingMedia(new Set(ids)))
      .catch(() => {});
  }, [currentUserId, isScout]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const extraSportsFromData = Array.from(
    new Set(talents.map((talent) => String(talent.sport || '').trim()).filter(Boolean))
  ).filter((sport) => !ALL_SPORT_FILTERS.some((baseSport) => normalizeSport(baseSport) === normalizeSport(sport)));
  const availableSports = [...ALL_SPORT_FILTERS, ...extraSportsFromData];

  const filteredTalents = talents.filter((talent) => {
    if (
      selectedSport !== 'Tous' &&
      normalizeSport(talent.sport || '') !== normalizeSport(selectedSport)
    ) {
      return false;
    }
    if (popularOnly && talent.totalLikes < 2) return false;

    if (!normalizedSearch) return true;
    return [
      talent.displayName,
      talent.sport,
      talent.position,
      talent.country,
      talent.city
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const availableArticleCategories = useMemo(() => {
    const seen = new Set<string>();
    const categories: string[] = [];

    [...BASE_ARTICLE_CATEGORIES, ...reportages.map((item) => item.category)]
      .map((category) => String(category || '').trim())
      .filter(Boolean)
      .forEach((category) => {
        const key = normalizeSport(category);
        if (seen.has(key)) return;
        seen.add(key);
        categories.push(category);
      });

    return categories;
  }, [reportages]);

  const inferArticleCategory = (reportage: ReportageItem): ArticleCategory => {
    const explicitCategory = String(reportage.category || '').trim();
    if (explicitCategory) return explicitCategory;

    const haystack = `${reportage.title} ${reportage.detail}`.toLowerCase();
    if (haystack.includes('transfert') || haystack.includes('mercato')) return 'Transferts';
    if (haystack.includes('can 2026') || haystack.includes('can') || haystack.includes('afcon')) return 'CAN 2026';
    if (haystack.includes('interview') || haystack.includes('entretien')) return 'Interview';
    if (haystack.includes('football') || haystack.includes('foot')) return 'Football';
    if (haystack.includes('basket')) return 'Basketball';
    if (haystack.includes('athlétisme') || haystack.includes('athletisme')) return 'Athlétisme';
    if (haystack.includes('formation') || haystack.includes('academie') || haystack.includes('académie')) return 'Formation';
    if (
      haystack.includes('équipe') ||
      haystack.includes('equipe') ||
      haystack.includes('club') ||
      haystack.includes('sélection') ||
      haystack.includes('selection')
    ) {
      return 'Équipes';
    }
    return 'Tout';
  };

  const filteredReportages = reportages.filter((reportage) => {
    if (
      selectedArticleCategory !== 'Tout' &&
      normalizeSport(inferArticleCategory(reportage)) !== normalizeSport(selectedArticleCategory)
    ) {
      return false;
    }
    if (!normalizedSearch) return true;
    return `${reportage.title} ${reportage.detail} ${reportage.reporter} ${reportage.category}`
      .toLowerCase()
      .includes(normalizedSearch);
  });

  const setLoadingKey = (key: string, loading: boolean) => {
    setActionLoading((prev) => {
      const next = new Set(prev);
      if (loading) next.add(key);
      else next.delete(key);
      return next;
    });
  };

  const updateReportage = (id: string, updater: (item: ReportageItem) => ReportageItem) => {
    setReportages((prev) => prev.map((item) => (item.id === id ? updater(item) : item)));
  };

  const handleLikeReportage = async (event: React.MouseEvent, item: ReportageItem) => {
    event.stopPropagation();
    if (!currentUserId) {
      navigate('/login');
      return;
    }

    const key = `like-${item.id}`;
    if (actionLoading.has(key)) return;

    const isLiked = likedReportages.has(item.id);
    setLoadingKey(key, true);
    setLikedReportages((prev) => {
      const next = new Set(prev);
      if (isLiked) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
    updateReportage(item.id, (current) => ({
      ...current,
      likes: isLiked ? Math.max(0, current.likes - 1) : current.likes + 1,
      likedBy: isLiked
        ? current.likedBy.filter((id) => id !== currentUserId)
        : [...new Set([...current.likedBy, currentUserId])]
    }));

    try {
      await toggleReportageLike(item, currentUserId, isLiked);
    } catch (error) {
      console.error('Like reportage impossible:', error);
      setLikedReportages((prev) => {
        const next = new Set(prev);
        if (isLiked) next.add(item.id);
        else next.delete(item.id);
        return next;
      });
      updateReportage(item.id, (current) => ({
        ...current,
        likes: isLiked ? current.likes + 1 : Math.max(0, current.likes - 1),
        likedBy: isLiked
          ? [...new Set([...current.likedBy, currentUserId])]
          : current.likedBy.filter((id) => id !== currentUserId)
      }));
    } finally {
      setLoadingKey(key, false);
    }
  };

  const handleShareReportage = async (event: React.MouseEvent, item: ReportageItem) => {
    event.stopPropagation();
    const url = `${window.location.origin}/#/explorer/reportage/${item.id}`;
    const text = `${item.title} - ${item.reporter}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: item.title, text, url });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      }

      updateReportage(item.id, (current) => ({ ...current, shares: current.shares + 1 }));
      await incrementReportageShare(item);
    } catch {
      // Partage annulé ou compteur indisponible: on ne bloque pas l'utilisateur.
    }
  };

  const handleFollowMedia = async (event: React.MouseEvent, item: ReportageItem) => {
    event.stopPropagation();
    if (!currentUserId) {
      navigate('/login');
      return;
    }
    if (!item.reporterId || item.reporterId === currentUserId) return;

    const key = `follow-${item.reporterId}`;
    if (actionLoading.has(key)) return;

    setLoadingKey(key, true);
    const currentlyFollowing = followingMedia.has(item.reporterId);
    setFollowingMedia((prev) => {
      const next = new Set(prev);
      if (currentlyFollowing) next.delete(item.reporterId);
      else next.add(item.reporterId);
      return next;
    });

    try {
      if (currentlyFollowing) {
        await unfollowAthlete(currentUserId, item.reporterId);
      } else {
        const alreadyFollowing = await isFollowing(currentUserId, item.reporterId);
        if (!alreadyFollowing) await followAthlete(currentUserId, item.reporterId);
      }
    } catch (error) {
      console.error('Abonnement média impossible:', error);
      setFollowingMedia((prev) => {
        const next = new Set(prev);
        if (currentlyFollowing) next.add(item.reporterId);
        else next.delete(item.reporterId);
        return next;
      });
    } finally {
      setLoadingKey(key, false);
    }
  };

  return (
    <div className="p-6 pb-32 min-h-full bg-[#050505]">
      <header className="mb-6 pt-4">
        <h1 className="text-3xl font-readex font-bold">
          {isScout ? 'Recrutement' : isPress ? 'Presse' : 'Actualités'}
        </h1>
        <p className="text-white/40 mt-1">
          {isScout ? 'Trouvez les meilleurs talents sportifs' : 'Articles, reportages et médias sportifs'}
        </p>
      </header>

      {/* Search Bar */}
      <div className="relative mb-8">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
        <input
          type="text"
          placeholder={isScout ? 'Nom, poste, pays...' : 'Rechercher un article...'}
          className="w-full bg-[#0A0A0A] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-[#19DB8A] transition-all"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-[#208050] rounded-xl">
          <Filter size={18} />
        </button>
      </div>

      {isScout ? (
        /* TALENT SEARCH VIEW */
        <div className="space-y-4">
          <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar">
            <button
              onClick={() => setSelectedSport('Tous')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border ${
                selectedSport === 'Tous'
                  ? 'bg-[#19DB8A] border-[#19DB8A] text-black'
                  : 'bg-transparent border-white/10 text-white/55'
              }`}
            >
              Tous
            </button>
            {availableSports.map((sport) => (
              <button
                key={sport}
                onClick={() => setSelectedSport(sport)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border ${
                  selectedSport === sport
                    ? 'bg-[#19DB8A] border-[#19DB8A] text-black'
                    : 'bg-transparent border-white/10 text-white/55'
                }`}
              >
                {sport}
              </button>
            ))}
            <button
              onClick={() => setPopularOnly((prev) => !prev)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap border ${
                popularOnly
                  ? 'bg-[#FF8A3C] border-[#FF8A3C] text-black'
                  : 'bg-transparent border-white/10 text-white/55'
              }`}
            >
              Populaire
            </button>
          </div>

          <div className="flex justify-between items-center mb-2">
            <h2 className="font-bold flex items-center gap-2">
              <TrendingUp size={18} className="text-[#19DB8A]" /> Talents Emergents
            </h2>
            <span className="text-[#19DB8A] text-xs font-bold">{filteredTalents.length} TALENTS</span>
          </div>

          {loadingTalents && (
            <div className="py-8 text-center text-white/40 text-sm">Chargement des talents...</div>
          )}

          {!loadingTalents && filteredTalents.length === 0 && (
            <div className="py-8 text-center text-white/40 text-sm">
              Aucun talent trouvé pour cette recherche.
            </div>
          )}

          {!loadingTalents &&
            filteredTalents.map((talent) => (
              <div
                key={talent.id}
                className="bg-[#0A0A0A] border border-white/5 p-4 rounded-3xl flex items-center gap-4 active:scale-[0.98] transition-all cursor-pointer"
                onClick={() => navigate(`/athlete/${talent.id}`)}
              >
                <img
                  src={talent.avatarUrl}
                  className="w-20 h-20 rounded-2xl object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/assets/images/app_launcher_icon.png';
                  }}
                />
                <div className="flex-1">
                  <h3 className="font-bold">
                    {talent.displayName}
                    <span className="bg-white/5 text-[8px] px-1 py-0.5 rounded ml-1 text-white/40 uppercase">
                      {talent.sport}
                    </span>
                  </h3>
                  <p className="text-white/40 text-xs mt-0.5">
                    {talent.position}
                    {talent.height ? ` • ${(talent.height / 100).toFixed(2)}m` : ''}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center gap-1 text-[#FF8A3C] text-[10px] font-bold">
                      <Star size={12} fill="currentColor" /> {talent.rating.toFixed(1)}
                    </div>
                    <div className="flex items-center gap-1 text-white/30 text-[10px]">
                      <MapPin size={10} /> {talent.country || 'N/A'}
                    </div>
                    <div className="text-[#19DB8A] text-[10px] font-bold">{talent.totalLikes} likes</div>
                  </div>
                </div>
                <ChevronRight className="text-white/20" />
              </div>
            ))}
        </div>
      ) : (
        /* PRESS / NEWS VIEW */
        <div className="space-y-6">
          {/* Filtres catégories */}
          <div className="sticky top-0 z-20 -mx-6 -mt-2 border-b border-white/[0.06] bg-[#050505]/92 px-6 py-3 backdrop-blur-xl">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-[0.22em] text-white/35">Catégories</span>
              <span className="rounded-full bg-[#19DB8A]/10 px-2 py-1 text-[10px] font-black text-[#19DB8A]">
                CAN 2026
              </span>
            </div>
            <div className="flex overflow-x-auto gap-2 pb-1 custom-scrollbar">
            {availableArticleCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedArticleCategory(cat)}
                className={`px-3.5 py-2 rounded-full text-[11px] font-black whitespace-nowrap border transition ${
                  cat === selectedArticleCategory
                    ? 'bg-[#19DB8A] border-[#19DB8A] text-black shadow-[0_10px_22px_rgba(25,219,138,0.18)]'
                    : 'bg-[#0A0A0A] border-white/10 text-white/50'
                }`}
              >
                {cat}
              </button>
            ))}
            </div>
          </div>

          {/* SECTION REPORTAGES VIDÉO */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-sm font-bold text-white">
                <Newspaper size={16} className="text-[#19DB8A]" />
                Articles et reportages
              </h2>
              {loadingReportages && <span className="text-white/40 text-[10px]">Chargement...</span>}
            </div>
            {!loadingReportages && filteredReportages.length === 0 && (
              <p className="text-white/30 text-xs">Aucun reportage trouvé pour ce filtre.</p>
            )}
            <div className="space-y-4">
              {filteredReportages.map((r) => {
                const isLiked = likedReportages.has(r.id);
                const isFollowingMedia = Boolean(r.reporterId && followingMedia.has(r.reporterId));
                const canFollow = Boolean(r.reporterId && r.reporterId !== currentUserId);

                return (
                <div
                  key={r.id}
                  className="bg-[#0A0A0A] border border-white/5 rounded-3xl overflow-hidden shadow-md group active:scale-95 transition-transform cursor-pointer"
                  onClick={() => navigate(`/explorer/reportage/${r.id}`, { state: { reportage: r } })}
                >
                  <div className="relative min-h-44">
                    {r.mediaType === 'video' && r.videoUrl ? (
                      <video
                        src={r.videoUrl}
                        className="h-48 w-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                        muted
                        loop
                        playsInline
                        preload="metadata"
                      />
                    ) : r.imageUrl ? (
                      <img
                        src={r.imageUrl}
                        className="h-48 w-full object-cover group-hover:scale-[1.03] transition-transform duration-700"
                      />
                    ) : (
                      <div className="min-h-44 w-full bg-gradient-to-br from-[#122116] via-[#0A0A0A] to-[#2A1A10] p-5">
                        <FileText size={22} className="text-[#19DB8A]" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-[#19DB8A]">
                      {r.kind === 'article' ? 'Article' : 'Reportage'}
                    </div>
                    {r.mediaType === 'video' && (
                      <div className="absolute right-3 top-3 rounded-full bg-black/65 p-2 text-white">
                        <PlayCircle size={18} />
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3 right-3">
                      <h3 className="text-sm font-semibold text-white line-clamp-2">{r.title}</h3>
                      <p className="text-white/50 text-[10px] mt-1">
                        Par {r.reporter} • {r.date}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 p-4">
                    {r.detail && <p className="line-clamp-2 text-xs leading-relaxed text-white/55">{r.detail}</p>}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(event) => handleLikeReportage(event, r)}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-bold transition ${
                            isLiked ? 'bg-[#19DB8A]/18 text-[#19DB8A]' : 'bg-white/[0.08] text-white/65'
                          }`}
                        >
                          <Heart size={15} className={isLiked ? 'fill-current' : ''} />
                          {r.likes}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => handleShareReportage(event, r)}
                          className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-2 text-xs font-bold text-white/65"
                        >
                          <Share2 size={15} />
                          {r.shares}
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/explorer/reportage/${r.id}`, { state: { reportage: r } });
                          }}
                          className="flex items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-2 text-xs font-bold text-white/65"
                        >
                          <MessageCircle size={15} />
                          {r.comments || 0}
                        </button>
                      </div>
                      {canFollow && (
                        <button
                          type="button"
                          onClick={(event) => handleFollowMedia(event, r)}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-black uppercase tracking-tight ${
                            isFollowingMedia
                              ? 'bg-[#19DB8A] text-black'
                              : 'bg-white/10 text-white'
                          }`}
                        >
                          {isFollowingMedia ? <Check size={14} /> : <UserPlus size={14} />}
                          {isFollowingMedia ? 'Suivi' : 'Suivre'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          </div>

          {/* SECTION ARTICLES / NEWS (désactivée – on affiche uniquement les vrais reportages Firestore) */}
        </div>
      )}
    </div>
  );
};

export default ExplorerPage;
