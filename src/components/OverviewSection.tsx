"use client";

import React from "react";
import { ElectionConfig, Post } from "@/data/electionData";
import { Vote, Users, Award, Clock, ArrowRight, ShieldAlert, CheckCircle } from "lucide-react";

interface OverviewProps {
  config: ElectionConfig;
  posts: Post[];
  totalVotesCast: number;
  onNavigateToVote: () => void;
  onNavigateToResults: () => void;
}

export const OverviewSection: React.FC<OverviewProps> = ({
  config,
  posts,
  totalVotesCast,
  onNavigateToVote,
  onNavigateToResults,
}) => {
  const turnoutPercent = Math.min(
    100,
    Math.round((totalVotesCast / (config.totalRegisteredVoters || 1)) * 100)
  );

  const totalCandidates = posts.reduce((sum, p) => sum + p.candidates.length, 0);

  return (
    <div className="space-y-8 py-6">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-900 via-indigo-950 to-zinc-950 text-white p-8 sm:p-12 shadow-2xl border border-indigo-800/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-20 w-72 h-72 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold uppercase tracking-wider border border-indigo-400/30">
            <span>Academic Year {config.academicYear}</span>
            <span className="w-1 h-1 rounded-full bg-indigo-400" />
            <span>Digital Democracy</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            {config.title}
          </h1>

          <p className="text-base sm:text-lg text-indigo-200/90 leading-relaxed">
            {config.subtitle}. Exercise your fundamental student right to elect your union representatives for the 2025-2026 academic session.
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-4">
            <button
              onClick={onNavigateToVote}
              disabled={config.status !== "live"}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm shadow-xl transition-all ${
                config.status === "live"
                  ? "bg-indigo-500 hover:bg-indigo-400 text-white shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]"
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700"
              }`}
            >
              <Vote className="w-5 h-5" />
              <span>{config.status === "live" ? "Proceed to Voting Booth" : "Ballot Unavailable"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onNavigateToResults}
              className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-sm bg-white/10 hover:bg-white/20 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-[1.02]"
            >
              <Award className="w-5 h-5 text-indigo-300" />
              <span>View Live Standings</span>
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Turnout */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            <span>Voter Turnout</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
              {turnoutPercent}%
            </span>
            <span className="text-xs text-zinc-500">
              ({totalVotesCast} / {config.totalRegisteredVoters})
            </span>
          </div>
          <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-2 overflow-hidden mt-3">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-700"
              style={{ width: `${turnoutPercent}%` }}
            />
          </div>
        </div>

        {/* Total Positions */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            <span>Union Posts</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">
            {posts.length}
          </div>
          <p className="text-xs text-zinc-500">President, GS, VP, Arts & Sports</p>
        </div>

        {/* Total Candidates */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            <span>Nominated Candidates</span>
            <Users className="w-4 h-4 text-violet-500" />
          </div>
          <div className="text-3xl font-extrabold text-zinc-900 dark:text-white">
            {totalCandidates}
          </div>
          <p className="text-xs text-zinc-500">Across all faculties & years</p>
        </div>

        {/* Polling Window */}
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            <span>Polling Window</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-zinc-900 dark:text-white">
            {config.startTime} - {config.endTime}
          </div>
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            {config.status === "live" ? "● Currently in progress" : "● Polling stopped"}
          </p>
        </div>
      </div>

      {/* Guidelines & Integrity Assurance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-white font-bold text-lg">
            <CheckCircle className="w-5 h-5 text-indigo-500" />
            <span>Official Voting Rules & Guidelines</span>
          </div>
          <ul className="space-y-3 text-sm text-zinc-600 dark:text-zinc-300">
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
              <span>Each registered student with a valid College Admission ID can vote only once.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
              <span>You must select your preferred candidate for each official union position.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
              <span>Ballots are completely anonymized; individual vote choices cannot be tracked to student identity.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
              <span>Review your ballot carefully on the confirmation screen before final cryptographic submission.</span>
            </li>
          </ul>
        </div>

        <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="flex items-center gap-2 mb-4 text-zinc-900 dark:text-white font-bold text-lg">
            <ShieldAlert className="w-5 h-5 text-indigo-500" />
            <span>Election Commission Notice</span>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed mb-4">
            The Election Commission of SAADA guarantees fair, unbiased, and tamper-resistant student elections. Any form of impersonation, proxy voting, or coercive campaigning is strictly punishable under university conduct code.
          </p>
          <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-300">
            Helpline Desk: If you experience difficulty accessing your voter slip or authentication token, visit Room 204 (Election Office) or reach out to the returning officer.
          </div>
        </div>
      </div>
    </div>
  );
};
