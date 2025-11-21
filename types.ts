export enum SessionStatus {
  LOBBY = 'LOBBY',
  VOTING = 'VOTING',
  FINISHED = 'FINISHED',
  ENDED = 'ENDED'
}

export interface Player {
  id: string;
  nickname: string;
  session_code: string;
  is_active: boolean;
  joined_at: number;
}

export interface Session {
  id: string; // Firestore Doc ID
  code: string;
  host_id: string;
  status: SessionStatus;
  created_at: any; // Firestore Timestamp
  current_round_id: string | null;
  round_end_time?: any; // Firestore Timestamp for timer sync
}

export interface Vote {
  id?: string;
  round_id: string;
  voter_id: string;
  target_id: string;
  reason: string;
  session_code?: string;
  timestamp: any;
}

export const VOTE_REASONS = [
  "Missed Sitter",
  "Reckless",
  "Ball Hog",
  "Sleeping",
  "Own Goal",
  "Toxic",
  "Other"
];
