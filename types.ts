
export enum UserType {
  ATHLETE = 'athlete',
  RECRUITER = 'recruteur',
  CLUB = 'club',
  PRESS = 'presse',
  VISITOR = 'visiteur'
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
