export const ELECTION_CLASSES = [
  "FS1",
  "FS2",
  "FS3",
  "HS1",
  "HS2",
  "DGF",
  "D2",
  "D3",
  "PGF",
  "PG",
] as const;

export type ElectionClass = (typeof ELECTION_CLASSES)[number];

export const DEFAULT_POSTS = [
  "President",
  "General Secretary",
  "Treasurer",
  "Vice President",
  "Arts Secretary",
  "Sports Secretary",
] as const;

export type DefaultPost = (typeof DEFAULT_POSTS)[number];

export interface Candidate {
  id: string;
  name: string;
  post: string;
  adNo: string;
  className: ElectionClass | string;
  tagline: string;
  symbolUrl: string; // Image upload (Data URL or image path)
  avatarUrl: string; // Image upload (Data URL or image path)
  votes: number;
  status: "approved" | "pending" | "withdrawn";
}

export interface Post {
  id: string;
  title: string;
  description: string;
  maxSelections: number;
  candidates: Candidate[];
}

export interface Voter {
  id: string;
  adNo: string;
  name: string;
  className: ElectionClass | string;
  hasVoted: boolean;
  votedAt?: string;
}

export interface ElectionConfig {
  title: string;
  subtitle: string;
  collegeName: string;
  academicYear?: string;
  status: "live" | "paused" | "closed";
  startTime: string;
  endTime: string;
  totalRegisteredVoters: number;
  allowSelfRegistration: boolean;
  isBallotSecret: boolean;
}

export const INITIAL_ELECTION_CONFIG: ElectionConfig = {
  title: "SAADA Students' Union Election",
  subtitle: "Official Central Democratic E-Voting Portal & Live Tallying System",
  collegeName: "Saada Arts & Science College",
  status: "live",
  startTime: "09:00 AM",
  endTime: "04:30 PM",
  totalRegisteredVoters: 0,
  allowSelfRegistration: true,
  isBallotSecret: true,
};

export const INITIAL_CANDIDATES: Candidate[] = [];

export const INITIAL_VOTERS: Voter[] = [];

export const HOURLY_TURNOUT_DATA = [
  { time: "09 AM", count: 85, target: 80, isPeak: false },
  { time: "10 AM", count: 164, target: 140, isPeak: false },
  { time: "11 AM", count: 240, target: 200, isPeak: false },
  { time: "12 PM", count: 195, target: 180, isPeak: false },
  { time: "01 PM", count: 110, target: 120, isPeak: false },
  { time: "02 PM", count: 310, target: 210, isPeak: true },
  { time: "03 PM", count: 210, target: 190, isPeak: false },
  { time: "04 PM", count: 180, target: 150, isPeak: false },
];

export const CLASS_TURNOUT_DATA = [
  { className: "FS1", total: 120, voted: 96, percentage: 80 },
  { className: "FS2", total: 130, voted: 110, percentage: 84 },
  { className: "FS3", total: 125, voted: 106, percentage: 85 },
  { className: "HS1", total: 140, voted: 112, percentage: 80 },
  { className: "HS2", total: 145, voted: 123, percentage: 85 },
  { className: "DGF", total: 160, voted: 144, percentage: 90 },
  { className: "D2", total: 180, voted: 158, percentage: 88 },
  { className: "D3", total: 200, voted: 186, percentage: 93 },
  { className: "PGF", total: 110, voted: 88, percentage: 80 },
  { className: "PG", total: 140, voted: 105, percentage: 75 },
];
