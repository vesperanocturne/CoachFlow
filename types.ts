
export enum SessionMode {
  SALES_PITCH = 'Sales Pitch',
  JOB_INTERVIEW = 'Job Interview',
  PRESENTATION = 'Public Speaking',
  INVESTOR_DEMO = 'Investor Demo',
}

export interface AnalysisMetrics {
  confidence: number;
  clarity: number;
  engagement: number;
  contentRelevance: number;
  pace?: 'Too Slow' | 'Good' | 'Too Fast';
  fillerWordCount?: number;
}

export interface Suggestion {
  id: string;
  type: 'positive' | 'improvement' | 'critical';
  text: string;
  timestamp: number;
}

export interface AnalysisResult {
  metrics: AnalysisMetrics;
  suggestions: string[];
  sentiment: 'Positive' | 'Neutral' | 'Negative' | 'Anxious' | 'Confident';
}

export interface SessionData {
  id: string;
  mode: SessionMode;
  date: string;
  durationSeconds: number;
  averageMetrics: AnalysisMetrics;
  transcriptSummary: string;
  improvementScript: string;
  transcript?: string;
  videoUrl?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucide icon name or emoji
  unlocked: boolean;
  unlockedAt?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  isPremium: boolean;
  achievements: string[]; // IDs of unlocked achievements
  avatarUrl?: string;
  provider?: 'email' | 'google';
}
