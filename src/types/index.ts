export interface Prediction {
  pick: string;
  score: string;
  reason: string;
  confidence?: number;
}

export interface MatchResult {
  homeScore?: number;
  awayScore?: number;
  outcome: '승' | '무' | '패' | '미정';
}

export type GameType = 'soccer' | 'basketball';

export interface Match {
  id: string;
  matchNumber: number;
  league: string;
  homeTeam: string;
  awayTeam: string;
  datetime: string;
  venue: string;
  gameType: GameType;
  prediction: Prediction;
  result?: MatchResult;
  status?: 'scheduled' | 'in_progress' | 'finished';
}

export interface GameData {
  round: string;
  gmId: string;
  gmTs: string;
  matches: Match[];
}

export interface PredictionData {
  lastUpdated: string;
  soccer: GameData;
  basketball: GameData;
}
