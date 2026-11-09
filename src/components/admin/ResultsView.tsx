"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Crown,
  Download,
  Trophy,
} from "lucide-react";
import { Candidate, Voter } from "@/data/electionData";
import { LeaderboardPodium } from "./LeaderboardPodium";

interface ResultsViewProps {
  candidates: Candidate[];
  voters: Voter[];
  isLive: boolean;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
  candidates,
  voters,
  isLive,
}) => {
  const [selectedPost, setSelectedPost] = useState<string>("All");

  const dynamicPosts = React.useMemo(() => {
    const fromCandidates = Array.from(
      new Set(candidates.map((c) => c.post).filter(Boolean))
    );
    if (fromCandidates.length > 0) return fromCandidates;
    return [
      "President",
      "General Secretary",
      "Treasurer",
      "Vice President",
      "Arts Secretary",
      "Sports Secretary",
    ];
  }, [candidates]);

  const totalPolled = voters.filter((v) => v.hasVoted).length;
  const turnoutPercent = Math.round((totalPolled / (voters.length || 1)) * 100);

  const getPostCandidates = (postName: string) => {
    return candidates
      .filter((c) => c.post.toLowerCase() === postName.toLowerCase())
      .sort((a, b) => b.votes - a.votes);
  };

  const displayedPosts =
    selectedPost === "All"
      ? dynamicPosts
      : dynamicPosts.filter((p) => p.toLowerCase() === selectedPost.toLowerCase());

  return (
    <div className="space-y-6">
      {/* 3D Isometric Leaderboard Podium (matching user reference) */}
      <LeaderboardPodium candidates={candidates} isLive={isLive} />

      {/* Summary Micro Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-none hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-zinc-400">Total Valid Ballots</p>
          <p className="text-2xl font-black text-zinc-900 mt-1">
            {totalPolled.toLocaleString()}{" "}
            <span className="text-xs font-semibold text-zinc-400 font-normal">
              / {voters.length} registered
            </span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-none hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-zinc-400">Voter Turnout Rate</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className="text-2xl font-black text-[#FF5B26]">{turnoutPercent}%</p>
            <span className="text-xs text-emerald-600 font-semibold">
              High Democratic Turnout
            </span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-zinc-200/90 shadow-none hover:shadow-md transition-all">
          <p className="text-xs font-semibold text-zinc-400">Contested Posts</p>
          <p className="text-2xl font-black text-purple-600 mt-1">
            {dynamicPosts.length}{" "}
            <span className="text-xs font-semibold text-zinc-400 font-normal">
              Executive Positions
            </span>
          </p>
        </div>
      </div>

      {/* Post Selector Pills */}
      <div className="flex items-center justify-between gap-4 flex-wrap bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-none">
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <button
            onClick={() => setSelectedPost("All")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedPost === "All"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            All Posts ({dynamicPosts.length})
          </button>
          {dynamicPosts.map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPost(p)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedPost === p
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          onClick={() => alert("Downloading certified election tally report...")}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 bg-white hover:bg-zinc-50 transition-colors cursor-pointer"
        >
          <Download className="w-3.5 h-3.5 text-zinc-400" />
          <span>Export Certified Tally</span>
        </button>
      </div>

      {/* Results by Position Cards */}
      <div className="space-y-6">
        {displayedPosts.map((postName) => {
          const postCandidates = getPostCandidates(postName);
          const totalPostVotes = postCandidates.reduce((acc, c) => acc + c.votes, 0);
          const leader = postCandidates[0];
          const runnerUp = postCandidates[1];
          const leadMargin = leader && runnerUp ? leader.votes - runnerUp.votes : 0;

          return (
            <div
              key={postName}
              className="bg-white rounded-2xl border border-zinc-200/90 p-6 shadow-none hover:shadow-xl hover:border-zinc-300 transition-all duration-300 space-y-5"
            >
              {/* Post Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-100">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-zinc-900 font-sans">
                      {postName}
                    </h3>
                    <span className="text-xs font-semibold text-zinc-400">
                      &bull; {totalPostVotes} total votes counted
                    </span>
                  </div>
                  {leader && (
                    <p className="text-xs text-zinc-500 mt-0.5">
                      Current Lead:{" "}
                      <span className="font-bold text-zinc-900">{leader.name}</span>{" "}
                      {leadMargin > 0 ? (
                        <span className="text-emerald-600 font-semibold">
                          (leading by {leadMargin} votes)
                        </span>
                      ) : (
                        <span className="text-amber-600 font-semibold">(Tied)</span>
                      )}
                    </p>
                  )}
                </div>

                {leader && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold">
                    <Crown className="w-4 h-4 text-amber-500 fill-amber-400" />
                    <span>Projected Winner: {leader.name}</span>
                  </div>
                )}
              </div>

              {/* Candidate Vote Progress Bars */}
              <div className="space-y-4">
                {postCandidates.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-3 text-center">
                    No nominees registered for {postName} yet.
                  </p>
                ) : (
                  postCandidates.map((c, index) => {
                  const share = totalPostVotes
                    ? Math.round((c.votes / totalPostVotes) * 100)
                    : 0;
                  const isLeader = index === 0;

                  return (
                    <div
                      key={c.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isLeader
                          ? "bg-amber-50/40 border-amber-200/80"
                          : "bg-[#F8F9FA] border-zinc-200/70"
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-3">
                          <span
                            className={`w-6 h-6 rounded-full flex items-center justify-center font-black text-xs ${
                              isLeader
                                ? "bg-amber-400 text-amber-950"
                                : "bg-zinc-200 text-zinc-600"
                            }`}
                          >
                            #{index + 1}
                          </span>
                          <img
                            src={c.avatarUrl}
                            alt={c.name}
                            className="w-9 h-9 rounded-xl object-cover border border-zinc-200"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-bold text-zinc-900 text-sm">
                                {c.name}
                              </p>
                              <div className="w-5 h-5 rounded border border-zinc-200 flex items-center justify-center p-0.5 bg-white">
                                <img
                                  src={c.symbolUrl}
                                  alt="Symbol"
                                  className="w-full h-full object-contain"
                                />
                              </div>
                            </div>
                            <p className="text-[11px] text-zinc-500 font-medium">
                              Class {c.className} &bull; {c.adNo}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <p className="text-base font-black text-zinc-900">
                            {c.votes.toLocaleString()}{" "}
                            <span className="text-xs font-semibold text-zinc-500">
                              Votes
                            </span>
                          </p>
                          <p
                            className={`text-xs font-bold ${
                              isLeader ? "text-amber-700" : "text-zinc-500"
                            }`}
                          >
                            {share}% of vote
                          </p>
                        </div>
                      </div>

                      {/* Bar */}
                      <div className="w-full bg-zinc-200/80 rounded-full h-2.5 overflow-hidden mt-2">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isLeader
                              ? "bg-gradient-to-r from-amber-400 to-[#FF5B26]"
                              : "bg-zinc-400"
                          }`}
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </div>
                  );
                }))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
