"use client";

import React, { useState } from "react";
import {
  Trophy,
  Crown,
  Sparkles,
  RotateCw,
  Award,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Candidate } from "@/data/electionData";
import { sortPostsByHierarchy } from "@/lib/utils";

interface LeaderboardPodiumProps {
  candidates: Candidate[];
  isLive: boolean;
}

export const LeaderboardPodium: React.FC<LeaderboardPodiumProps> = ({
  candidates,
  isLive,
}) => {
  const [selectedPost, setSelectedPost] = useState<string>("President");

  // Dynamically derive posts from registered candidates sorted by official hierarchy (President, General Secretary, Treasurer...)
  const availablePosts = React.useMemo(() => {
    const fromCandidates = Array.from(
      new Set(candidates.map((c) => c.post).filter(Boolean))
    );
    if (fromCandidates.length > 0) {
      return [...sortPostsByHierarchy(fromCandidates), "All (Top Voted)"];
    }
    return [
      "President",
      "General Secretary",
      "Treasurer",
      "Vice President",
      "Arts Secretary",
      "Sports Secretary",
      "All (Top Voted)",
    ];
  }, [candidates]);

  // If selectedPost is not in availablePosts, pick the first one
  const currentPost = availablePosts.includes(selectedPost)
    ? selectedPost
    : availablePosts[0] || "All (Top Voted)";

  // Filter & sort candidates
  const filteredSortedCandidates = [...candidates]
    .filter((c) =>
      currentPost === "All (Top Voted)"
        ? true
        : c.post.toLowerCase() === currentPost.toLowerCase()
    )
    .sort((a, b) => b.votes - a.votes);

  const top1 = filteredSortedCandidates[0];
  const top2 = filteredSortedCandidates[1];
  const top3 = filteredSortedCandidates[2];
  const restCandidates = filteredSortedCandidates.slice(3);

  return (
    <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-none hover:shadow-xl hover:border-zinc-300 transition-all duration-300 overflow-hidden">
      {/* Top Header & Post Selector */}
      <div className="p-6 border-b border-zinc-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold mb-1">
            <Trophy className="w-4 h-4 text-amber-500 fill-amber-500" />
            <span>Official Election Standings</span>
          </div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-zinc-900 tracking-tight font-sans">
              Contestant Leaderboard
            </h2>
            {isLive ? (
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Counting
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-zinc-100 text-zinc-600">
                Final
              </span>
            )}
          </div>
          <p className="text-xs text-zinc-400 mt-0.5">
            Dynamic 3D podium tally by contested post
          </p>
        </div>

        {/* Post category selector tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {availablePosts.map((post) => (
            <button
              key={post}
              onClick={() => setSelectedPost(post)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                currentPost === post
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {post}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Podium Arena (Exact Recreation of User Screenshot) */}
      {filteredSortedCandidates.length === 0 ? (
        <div className="py-16 text-center text-zinc-400 space-y-2">
          <Award className="w-10 h-10 mx-auto text-zinc-300" />
          <p className="text-sm font-bold text-zinc-600">
            No Nominees Registered for {currentPost}
          </p>
          <p className="text-xs text-zinc-400">
            Register candidates in the &ldquo;Candidates&rdquo; tab to view their podium standings.
          </p>
        </div>
      ) : (
        <div className="relative pt-10 pb-8 px-4 sm:px-12 bg-gradient-to-b from-amber-50/20 via-white to-zinc-50/50 flex flex-col items-center">
          {/* Soft Radial Ray Effect */}
          <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-100/40 via-transparent to-transparent pointer-events-none" />

          <div className="relative z-10 w-full max-w-xl">
            {/* 3 Podium Positions side-by-side */}
            <div className="flex items-end justify-center gap-3 sm:gap-6 pt-12">
            {/* Rank #2 (Left - Soft Indigo/Blue) */}
            {top2 ? (
              <div className="flex-1 flex flex-col items-center max-w-[150px]">
                {/* Floating Candidate Card */}
                <div className="flex flex-col items-center mb-3 group cursor-pointer text-center">
                  <div className="relative">
                    <img
                      src={top2.avatarUrl}
                      alt={top2.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-zinc-200 group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-white border border-zinc-200 flex items-center justify-center p-1 shadow-xs">
                      <img
                        src={top2.symbolUrl}
                        alt="Symbol"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <p className="font-bold text-xs sm:text-sm text-zinc-900 mt-2 truncate w-full">
                    {top2.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Class {top2.className}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200/60">
                    <span>💎</span>
                    <span>{top2.votes.toLocaleString()}</span>
                  </div>
                </div>

                {/* 3D Blue Podium Block */}
                <div className="w-full relative flex flex-col items-center">
                  {/* Top isometric slope */}
                  <div className="w-full h-4 bg-[#C7D7FE] rounded-t-lg transform skew-x-[-10deg] origin-bottom shadow-xs opacity-90" />
                  {/* Front Face */}
                  <div className="w-full h-36 bg-gradient-to-b from-[#C7D7FE] to-[#DCE7FE] rounded-b-xl flex flex-col items-center justify-center border-t border-white/60 p-2 shadow-xs">
                    <span className="text-4xl sm:text-5xl font-black text-white/95 drop-shadow-sm font-sans">
                      2
                    </span>
                    <div className="flex items-center gap-1 mt-1 text-white/80 text-[11px] font-bold">
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 max-w-[150px]" />
            )}

            {/* Rank #1 (Center - Tallest Gold/Yellow Champion) */}
            {top1 ? (
              <div className="flex-1 flex flex-col items-center max-w-[170px] -mt-6">
                {/* Floating Candidate Card with Crown */}
                <div className="flex flex-col items-center mb-3 group cursor-pointer text-center">
                  <div className="relative">
                    <div className="absolute -top-4 inset-x-0 flex justify-center">
                      <Crown className="w-6 h-6 text-amber-500 fill-amber-400 animate-bounce" />
                    </div>
                    <img
                      src={top1.avatarUrl}
                      alt={top1.name}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-2 border-amber-300 shadow-md ring-2 ring-amber-400/30 group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-white border border-amber-300 flex items-center justify-center p-1 shadow-xs">
                      <img
                        src={top1.symbolUrl}
                        alt="Symbol"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <p className="font-extrabold text-xs sm:text-base text-zinc-900 mt-2 truncate w-full">
                    {top1.name}
                  </p>
                  <p className="text-[11px] text-zinc-500 font-semibold">
                    Class {top1.className} &bull; {top1.post}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs font-black text-amber-700 bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-300/60 shadow-2xs">
                    <span>💎</span>
                    <span>{top1.votes.toLocaleString()} votes</span>
                  </div>
                </div>

                {/* 3D Gold Podium Block */}
                <div className="w-full relative flex flex-col items-center">
                  {/* Top isometric slope */}
                  <div className="w-full h-5 bg-[#FBBF24] rounded-t-lg transform skew-x-[-10deg] origin-bottom shadow-xs" />
                  {/* Front Face */}
                  <div className="w-full h-48 bg-gradient-to-b from-[#F59E0B] via-[#FBBF24] to-[#FDE68A] rounded-b-xl flex flex-col items-center justify-center border-t border-white/60 p-2 shadow-xs">
                    <span className="text-5xl sm:text-6xl font-black text-white drop-shadow font-sans">
                      1
                    </span>
                    <div className="flex items-center gap-1.5 mt-1 text-white text-xs font-black tracking-wider">
                      <span>★★★</span>
                    </div>
                    <div className="text-[10px] text-amber-950 font-black tracking-widest uppercase mt-0.5 opacity-80">
                      LEADER
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* Rank #3 (Right - Coral / Peach) */}
            {top3 ? (
              <div className="flex-1 flex flex-col items-center max-w-[150px]">
                {/* Floating Candidate Card */}
                <div className="flex flex-col items-center mb-3 group cursor-pointer text-center">
                  <div className="relative">
                    <img
                      src={top3.avatarUrl}
                      alt={top3.name}
                      className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-white shadow-sm ring-1 ring-zinc-200 group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute -top-1.5 -right-1.5 w-7 h-7 rounded-full bg-white border border-zinc-200 flex items-center justify-center p-1 shadow-xs">
                      <img
                        src={top3.symbolUrl}
                        alt="Symbol"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                  <p className="font-bold text-xs sm:text-sm text-zinc-900 mt-2 truncate w-full">
                    {top3.name}
                  </p>
                  <p className="text-[10px] text-zinc-400 font-medium">
                    Class {top3.className}
                  </p>
                  <div className="flex items-center gap-1 mt-1 text-xs font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-200/60">
                    <span>💎</span>
                    <span>{top3.votes.toLocaleString()}</span>
                  </div>
                </div>

                {/* 3D Peach Podium Block */}
                <div className="w-full relative flex flex-col items-center">
                  {/* Top isometric slope */}
                  <div className="w-full h-4 bg-[#FED7AA] rounded-t-lg transform skew-x-[-10deg] origin-bottom shadow-xs opacity-90" />
                  {/* Front Face */}
                  <div className="w-full h-28 bg-gradient-to-b from-[#FED7AA] to-[#FFEDD5] rounded-b-xl flex flex-col items-center justify-center border-t border-white/60 p-2 shadow-xs">
                    <span className="text-4xl sm:text-5xl font-black text-white/95 drop-shadow-sm font-sans">
                      3
                    </span>
                    <div className="flex items-center gap-1 mt-1 text-white/80 text-[11px] font-bold">
                      <span>★</span>
                      <span>★</span>
                      <span>★</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 max-w-[150px]" />
            )}
          </div>
        </div>

        {/* Sync timestamp indicator like screenshot */}
        <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-6 pt-3 border-t border-zinc-200/60">
          <RotateCw className="w-3.5 h-3.5" />
          <span>Leaderboard synchronized live &bull; Central Campus Booth</span>
        </div>
      </div>
      )}

      {/* Subsequent Ranks #4, #5, #6... (Exactly like screenshot list) */}
      {restCandidates.length > 0 && (
        <div className="p-6 bg-white border-t border-zinc-100">
          <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-3">
            Subsequent Standings
          </h4>
          <div className="space-y-2.5">
            {restCandidates.map((candidate, idx) => {
              const rankNumber = idx + 4;
              return (
                <div
                  key={candidate.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl border border-zinc-200/80 hover:border-zinc-300 hover:bg-zinc-50/80 transition-all group"
                >
                  <div className="flex items-center gap-3.5">
                    {/* Rank Badge */}
                    <div className="flex items-center gap-1 text-xs font-bold text-zinc-400 w-8">
                      <Trophy className="w-3.5 h-3.5 text-zinc-300 group-hover:text-amber-500 transition-colors" />
                      <span>{rankNumber}</span>
                    </div>

                    {/* Avatar */}
                    <div className="relative">
                      <img
                        src={candidate.avatarUrl}
                        alt={candidate.name}
                        className="w-10 h-10 rounded-xl object-cover border border-zinc-200"
                      />
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-white border border-zinc-200 flex items-center justify-center p-0.5">
                        <img
                          src={candidate.symbolUrl}
                          alt="Symbol"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    {/* Candidate Details */}
                    <div>
                      <p className="font-bold text-xs text-zinc-900 group-hover:text-[#FF5B26] transition-colors">
                        {candidate.name}
                      </p>
                      <p className="text-[11px] text-zinc-400">
                        Class {candidate.className} &bull; {candidate.post}
                      </p>
                    </div>
                  </div>

                  {/* Diamond Vote Count */}
                  <div className="flex items-center gap-1.5 text-xs font-extrabold text-zinc-900 bg-zinc-100 px-3 py-1 rounded-full border border-zinc-200/60">
                    <span>💎</span>
                    <span>{candidate.votes.toLocaleString()}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

