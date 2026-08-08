export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  location?: string;
  website?: string;
  joinedAt: string;
  reputation: number;
  badges: {
    gold: number;
    silver: number;
    bronze: number;
  };
  topTech: string[];
  askedCount: number;
  answeredCount: number;
}

export interface Answer {
  id: string;
  questionId: string;
  author: User;
  content: string;
  createdAt: string;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  isAccepted: boolean;
  isAiGenerated?: boolean;
}

export interface Question {
  id: string;
  title: string;
  content: string;
  tags: string[];
  author: User;
  createdAt: string;
  views: number;
  upvotes: number;
  downvotes: number;
  userVote?: 'up' | 'down' | null;
  answersCount: number;
  isSaved?: boolean;
  hasAcceptedAnswer?: boolean;
}

export interface Tag {
  id: string;
  name: string;
  description: string;
  questionCount: number;
  isFollowed?: boolean;
}

export interface JobPerk {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  type: 'Full-time' | 'Remote' | 'Contract' | 'Hybrid';
  salary: string;
  tags: string[];
  description: string;
  postedAt: string;
}

export type ActiveTab = 'home' | 'collections' | 'find-jobs' | 'tags' | 'community' | 'profile';

export type FilterType = 'newest' | 'recommended' | 'frequent' | 'unanswered';
