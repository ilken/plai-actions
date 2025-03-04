export type Team = {
  id: number;
  name: string;
  shortName: string;
  tla: string;
  crest: string;
}

export type StandingEntry = {
  position: number;
  team: Team;
  playedGames: number;
  won: number;
  draw: number;
  lost: number;
  points: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  form: string;
}

export type Match = {
  id: number;
  homeTeam: Team;
  awayTeam: Team;
  utcDate: string;
  status: string;
}

export type FormattedStanding = {
  position: number;
  team: string;
  MP: number;
  W: number;
  D: number;
  L: number;
  F: number;
  A: number;
  GD: number;
  P: number;
  form: string;
}

export type PredictionResult = {
  prediction: string;
  probability: number;
  analysis: string;
}

export type MatchPrediction = {
  match: string;
  potentialScore: string;
  result: PredictionResult;
  overUnder: PredictionResult;
  bothTeamsToScore: PredictionResult;
}

export type PredictionResponse = {
  predictions: MatchPrediction[];
} 