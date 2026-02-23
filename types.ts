
export enum UserType {
  ATHLETE = 'athlete',
  RECRUITER = 'recruteur',
  PRESS = 'presse',
  VISITOR = 'visiteur'
}

export function normalizeUserType(rawType: unknown, fallback: UserType = UserType.VISITOR): UserType {
  const value = String(rawType || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (value === UserType.ATHLETE || value === 'talent') return UserType.ATHLETE;
  if (value === UserType.RECRUITER || value === 'recruiter' || value === 'club') return UserType.RECRUITER;
  if (value === UserType.PRESS || value === 'press' || value === 'media') return UserType.PRESS;
  if (value === UserType.VISITOR || value === 'visitor' || value === 'fan') return UserType.VISITOR;
  return fallback;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  type: UserType;
  country: string;
  city?: string;
  avatarUrl?: string;
  sport?: string;
  position?: string;
  height?: number;
  weight?: number;
  stats?: {
    matchesPlayed: number;
    goals?: number;
    assists?: number;
    points?: number;
  };
}

export interface FeedPost {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'video' | 'photo';
  url: string;
  thumbnail: string;
  caption: string;
  likes: number;
  shares: number;
  comments: number;
  createdAt: string;
  hashtags?: string[];
  // chemin Firestore complet du document "publication" pour brancher les sous-collections
  docPath?: string;
}

export interface PostComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  text: string;
  createdAt: string;
   likes: number;
}

export interface NewsArticle {
  id: string;
  authorId: string;
  authorName: string;
  title: string;
  content: string;
  imageUrl: string;
  category: string;
  createdAt: string;
  views: number;
}

export interface MatchData {
  id: string;
  teamA: string;
  teamB: string;
  logoA: string;
  logoB: string;
  scoreA: number;
  scoreB: number;
  status: 'scheduled' | 'live' | 'finished';
  minute?: number;
  startTime: string;
}

export interface Wallet {
  balance: number;
  points: number;
  monthlyGains: number;
  pendingWithdrawals: number;
}
