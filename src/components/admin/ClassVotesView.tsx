"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  GraduationCap,
  Users,
  Award,
  Crown,
  Search,
  Filter,
  BarChart3,
  Table as TableIcon,
  LayoutGrid,
  CheckCircle2,
  TrendingUp,
  Flame,
  ShieldCheck,
  Building2,
  Sparkles,
} from "lucide-react";
import { Candidate, Voter, ELECTION_CLASSES, ElectionClass } from "@/data/electionData";
import { sortPostsByHierarchy, sortCandidatesByHierarchy } from "@/lib/utils";
import { fetchBallots, RawBallot, supabase } from "@/lib/supabaseClient";

interface ClassVotesViewProps {
  candidates: Candidate[];
  voters: Voter[];
}

export const ClassVotesView: React.FC<ClassVotesViewProps> = ({
  candidates,
  voters,
}) => {
  const [ballots, setBallots] = useState<RawBallot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"matrix" | "cards" | "classes">("matrix");
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>("All");

  // Load ballots from Supabase and listen to live changes
  useEffect(() => {
    let isMounted = true;

    async function loadBallots() {
      const data = await fetchBallots();
      if (isMounted) {
        setBallots(data);
        setIsLoading(false);
      }
    }

    loadBallots();

    // Supabase Realtime listener for incoming ballots
    const channel = supabase
      .channel(`admin-class-votes-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ballots" },
        async () => {
          const fresh = await fetchBallots();
          if (isMounted) setBallots(fresh);
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Map voter ID to voter object for instant O(1) class lookups
  const voterMap = useMemo(() => {
    const map: Record<string, Voter> = {};
    voters.forEach((v) => {
      map[v.id] = v;
    });
    return map;
  }, [voters]);

  // Distinct posts in institutional hierarchy (President -> General Secretary -> Treasurer)
  const distinctPosts = useMemo(() => {
    const fromCandidates = Array.from(
      new Set(candidates.map((c) => c.post).filter(Boolean))
    );
    return sortPostsByHierarchy(
      fromCandidates.length > 0 ? fromCandidates : ["President", "General Secretary", "Treasurer"]
    );
  }, [candidates]);

  // Compute 2D cross-tabulation: candidateVotesByClass[candidateId][className] = vote count
  const { candidateVotesByClass, candidateTotalFromBallots, classTotalTurnout } = useMemo(() => {
    const candByClass: Record<string, Record<string, number>> = {};
    const candTotals: Record<string, number> = {};
    const classTotals: Record<string, number> = {};

    // Initialize all candidate keys with 0 for all classes
    candidates.forEach((c) => {
      candByClass[c.id] = {};
      ELECTION_CLASSES.forEach((cls) => {
        candByClass[c.id][cls] = 0;
      });
      candTotals[c.id] = 0;
    });

    // Initialize class turnout counts
    ELECTION_CLASSES.forEach((cls) => {
      classTotals[cls] = 0;
    });

    // Tally every ballot
    ballots.forEach((b) => {
      const voter = voterMap[b.voter_id];
      const voterClass = voter?.className || "Unknown";

      if (voterClass && classTotals[voterClass] !== undefined) {
        classTotals[voterClass] = (classTotals[voterClass] || 0) + 1;
      }

      // President selection
      if (b.president_id && candByClass[b.president_id]) {
        candByClass[b.president_id][voterClass] =
          (candByClass[b.president_id][voterClass] || 0) + 1;
        candTotals[b.president_id] = (candTotals[b.president_id] || 0) + 1;
      }

      // General Secretary selection
      if (b.secretary_id && candByClass[b.secretary_id]) {
        candByClass[b.secretary_id][voterClass] =
          (candByClass[b.secretary_id][voterClass] || 0) + 1;
        candTotals[b.secretary_id] = (candTotals[b.secretary_id] || 0) + 1;
      }

      // Treasurer selection
      if (b.treasurer_id && candByClass[b.treasurer_id]) {
        candByClass[b.treasurer_id][voterClass] =
          (candByClass[b.treasurer_id][voterClass] || 0) + 1;
        candTotals[b.treasurer_id] = (candTotals[b.treasurer_id] || 0) + 1;
      }
    });

    return {
      candidateVotesByClass: candByClass,
      candidateTotalFromBallots: candTotals,
      classTotalTurnout: classTotals,
    };
  }, [candidates, ballots, voterMap]);

  // Filtered and sorted candidate list
  const filteredCandidates = useMemo(() => {
    const list = candidates.filter((c) => {
      const matchesPost =
        selectedPost === "All" ||
        c.post.toLowerCase().includes(selectedPost.toLowerCase());
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.adNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.className.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPost && matchesSearch;
    });

    return sortCandidatesByHierarchy(list);
  }, [candidates, selectedPost, searchQuery]);

  // Overall metrics
  const totalBallotsCount = ballots.length;
  const highestTurnoutClass = useMemo(() => {
    let maxClass = "FS1";
    let maxVotes = 0;
    Object.entries(classTotalTurnout).forEach(([cls, count]) => {
      if (count > maxVotes) {
        maxVotes = count;
        maxClass = cls;
      }
    });
    return { className: maxClass, count: maxVotes };
  }, [classTotalTurnout]);

  return (
    <div className="space-y-6">
      {/* Top Banner & Analytical Overview */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-zinc-200/90 shadow-none hover:shadow-xl transition-all duration-300">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold">
              <GraduationCap className="w-4 h-4 text-[#FF5B26]" />
              <span>Demographic Cross-Tabulation &bull; Electoral Registry</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight font-sans">
              Class-wise Vote Breakdown
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 max-w-2xl font-medium">
              Analyze exactly how many votes each candidate received from every academic class (FS1 through PG). Identifies candidate strongholds and voting patterns.
            </p>
          </div>

          {/* Quick Metrics */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="px-4 py-3 rounded-2xl bg-zinc-50 border border-zinc-200/80 text-left">
              <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                Total Ballots
              </p>
              <p className="text-xl font-black text-zinc-900 font-sans">
                {totalBallotsCount.toLocaleString()}
              </p>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-orange-50/70 border border-orange-200/60 text-left">
              <p className="text-[10px] font-bold text-[#FF5B26] uppercase tracking-wider">
                Top Turnout Class
              </p>
              <p className="text-xl font-black text-[#FF5B26] font-sans">
                {highestTurnoutClass.className}{" "}
                <span className="text-xs font-medium text-orange-950/70">
                  ({highestTurnoutClass.count} votes)
                </span>
              </p>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-left">
              <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">
                Active Classes
              </p>
              <p className="text-xl font-black text-emerald-700 font-sans">
                {ELECTION_CLASSES.length} Classes
              </p>
            </div>
          </div>
        </div>

        {/* View Mode & Filter Controls */}
        <div className="mt-6 pt-6 border-t border-zinc-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Post Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <button
              onClick={() => setSelectedPost("All")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedPost === "All"
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              All Posts ({candidates.length})
            </button>
            {distinctPosts.map((post) => (
              <button
                key={post}
                onClick={() => setSelectedPost(post)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedPost === post
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                {post}
              </button>
            ))}
          </div>

          {/* Search & View Switcher */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Search candidate..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-[#F8F9FA] border border-zinc-200 rounded-xl pl-8 pr-4 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
              />
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-zinc-100 p-1 rounded-xl border border-zinc-200 shrink-0">
              <button
                onClick={() => setViewMode("matrix")}
                title="Matrix Grid View"
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "matrix"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Matrix</span>
              </button>

              <button
                onClick={() => setViewMode("cards")}
                title="Candidate Cards View"
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "cards"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cards</span>
              </button>

              <button
                onClick={() => setViewMode("classes")}
                title="Class-centric View"
                className={`p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer ${
                  viewMode === "classes"
                    ? "bg-white text-zinc-900 shadow-xs"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">By Class</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* VIEW 1: Interactive Heatmap Matrix View */}
      {viewMode === "matrix" && (
        <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-none hover:shadow-xl transition-all duration-300 overflow-hidden">
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TableIcon className="w-4 h-4 text-[#FF5B26]" />
              <h2 className="text-sm font-black text-zinc-900 uppercase tracking-wider">
                Class Voting Matrix (Votes Cast by Class)
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400">
              Hover cells for percentage breakdown
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-700">
              <thead className="bg-[#F8F9FA] border-b border-zinc-200/80 text-[11px] font-black uppercase text-zinc-500 tracking-wider select-none">
                <tr>
                  <th className="py-3 px-4 min-w-[220px]">Candidate</th>
                  <th className="py-3 px-3 min-w-[110px]">Contested Post</th>
                  {ELECTION_CLASSES.map((cls) => (
                    <th key={cls} className="py-3 px-3 text-center min-w-[55px]">
                      {cls}
                    </th>
                  ))}
                  <th className="py-3 px-4 text-right min-w-[80px]">Total</th>
                  <th className="py-3 px-4 text-left min-w-[130px]">Top Stronghold</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium">
                {filteredCandidates.map((c) => {
                  const classVotes = candidateVotesByClass[c.id] || {};
                  const total = candidateTotalFromBallots[c.id] || c.votes || 0;

                  // Find stronghold class
                  let bestClass = "";
                  let bestVotes = 0;
                  Object.entries(classVotes).forEach(([cls, count]) => {
                    if (count > bestVotes) {
                      bestVotes = count;
                      bestClass = cls;
                    }
                  });

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-zinc-50/80 transition-colors group"
                    >
                      {/* Candidate Name, Avatar & Symbol */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative shrink-0">
                            <img
                              src={c.avatarUrl}
                              alt={c.name}
                              className="w-10 h-10 rounded-xl object-cover border border-zinc-200"
                            />
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded bg-white border border-zinc-200 flex items-center justify-center p-0.5">
                              <img
                                src={c.symbolUrl}
                                alt="Symbol"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-zinc-900 group-hover:text-[#FF5B26] transition-colors truncate">
                              {c.name}
                            </p>
                            <p className="text-[10px] text-zinc-400">
                              Class {c.className} &bull; {c.adNo}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Post Badge */}
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black border bg-zinc-100 text-zinc-700 border-zinc-200">
                          {c.post}
                        </span>
                      </td>

                      {/* Individual Classes */}
                      {ELECTION_CLASSES.map((cls) => {
                        const count = classVotes[cls] || 0;
                        const classTotal = classTotalTurnout[cls] || 0;
                        const share = classTotal > 0 ? Math.round((count / classTotal) * 100) : 0;
                        const isBest = cls === bestClass && count > 0;

                        return (
                          <td
                            key={cls}
                            className={`py-3 px-3 text-center transition-colors ${
                              count > 10
                                ? "bg-orange-500/15 font-black text-orange-950"
                                : count > 5
                                ? "bg-orange-500/10 font-bold text-orange-900"
                                : count > 0
                                ? "bg-orange-500/5 text-zinc-900 font-semibold"
                                : "text-zinc-300"
                            }`}
                            title={`${count} votes from ${cls} (${share}% of class turnout)`}
                          >
                            <span className="inline-block relative">
                              {count}
                              {isBest && (
                                <span className="absolute -top-1.5 -right-2 text-[8px] text-[#FF5B26]">
                                  ★
                                </span>
                              )}
                            </span>
                          </td>
                        );
                      })}

                      {/* Total */}
                      <td className="py-3 px-4 text-right font-black text-sm text-zinc-900 font-mono">
                        {total}
                      </td>

                      {/* Stronghold Badge */}
                      <td className="py-3 px-4">
                        {bestVotes > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                            <Flame className="w-3 h-3 text-[#FF5B26]" />
                            <span>{bestClass} ({bestVotes} votes)</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-zinc-400">None yet</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 2: Candidate Cards Deep Dive */}
      {viewMode === "cards" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map((c) => {
            const classVotes = candidateVotesByClass[c.id] || {};
            const total = candidateTotalFromBallots[c.id] || c.votes || 0;

            // Sort classes for this candidate by highest to lowest
            const sortedClassEntries = Object.entries(classVotes)
              .map(([cls, count]) => ({ className: cls, count }))
              .sort((a, b) => b.count - a.count);

            const topEntry = sortedClassEntries[0];

            return (
              <div
                key={c.id}
                className="bg-white rounded-3xl border border-zinc-200/90 p-5 shadow-none hover:shadow-xl hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <img
                          src={c.avatarUrl}
                          alt={c.name}
                          className="w-14 h-14 rounded-2xl object-cover border-2 border-zinc-200"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-white border border-zinc-200 flex items-center justify-center p-0.5 shadow-sm">
                          <img
                            src={c.symbolUrl}
                            alt="Symbol"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>
                      <div>
                        <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-zinc-100 text-zinc-700 border border-zinc-200 mb-0.5">
                          {c.post}
                        </span>
                        <h3 className="font-extrabold text-sm text-zinc-900 leading-snug">
                          {c.name}
                        </h3>
                        <p className="text-[10px] text-zinc-400">
                          Class {c.className} &bull; {c.adNo}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-lg font-black text-zinc-900 font-mono">
                        {total}
                      </p>
                      <p className="text-[10px] font-bold text-zinc-400 uppercase">
                        Votes
                      </p>
                    </div>
                  </div>

                  {/* Top Stronghold Callout */}
                  {topEntry && topEntry.count > 0 && (
                    <div className="mb-4 p-2.5 rounded-xl bg-orange-50/70 border border-orange-200/60 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-orange-950 font-bold">
                        <Flame className="w-3.5 h-3.5 text-[#FF5B26]" />
                        <span>Dominant Base: Class {topEntry.className}</span>
                      </div>
                      <span className="font-black text-[#FF5B26]">
                        {topEntry.count} votes
                      </span>
                    </div>
                  )}

                  {/* Class-by-Class Progress Bars */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      Votes by Class
                    </p>
                    <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                      {sortedClassEntries.map(({ className, count }) => {
                        const classTotal = classTotalTurnout[className] || 1;
                        const percentage =
                          total > 0 ? Math.round((count / total) * 100) : 0;

                        return (
                          <div
                            key={className}
                            className="flex items-center justify-between gap-2 text-xs"
                          >
                            <span className="w-9 font-bold text-zinc-700 font-mono shrink-0">
                              {className}
                            </span>
                            <div className="flex-1 bg-zinc-100 rounded-full h-2 overflow-hidden border border-zinc-200/60">
                              <div
                                className="bg-[#FF5B26] h-full rounded-full transition-all duration-500"
                                style={{
                                  width: `${Math.min(
                                    100,
                                    Math.round((count / (topEntry?.count || 1)) * 100)
                                  )}%`,
                                }}
                              />
                            </div>
                            <span className="w-12 text-right font-bold text-zinc-900 shrink-0">
                              {count}{" "}
                              <span className="text-[10px] text-zinc-400 font-normal">
                                ({percentage}%)
                              </span>
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: Class-Centric Drilldown View */}
      {viewMode === "classes" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-5 md:grid-cols-5 lg:grid-cols-10 gap-2">
            {ELECTION_CLASSES.map((cls) => {
              const turnout = classTotalTurnout[cls] || 0;
              const isSelected = selectedClassFilter === cls;

              return (
                <button
                  key={cls}
                  onClick={() => setSelectedClassFilter(cls)}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? "bg-zinc-900 text-white border-zinc-900 shadow-md"
                      : "bg-white border-zinc-200/80 hover:border-zinc-300 text-zinc-700"
                  }`}
                >
                  <p className="text-xs font-black uppercase font-mono">{cls}</p>
                  <p
                    className={`text-[10px] font-bold mt-0.5 ${
                      isSelected ? "text-amber-300" : "text-zinc-400"
                    }`}
                  >
                    {turnout} votes
                  </p>
                </button>
              );
            })}
          </div>

          {/* Drilldown details for classes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(selectedClassFilter === "All"
              ? ELECTION_CLASSES
              : [selectedClassFilter]
            ).map((cls) => {
              const totalClassVotes = classTotalTurnout[cls] || 0;

              return (
                <div
                  key={cls}
                  className="bg-white rounded-3xl border border-zinc-200/90 p-5 shadow-none hover:shadow-xl transition-all"
                >
                  <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF5B26] border border-orange-200 flex items-center justify-center font-black text-xs font-mono">
                        {cls}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-sm text-zinc-900">
                          Class {cls} Results
                        </h3>
                        <p className="text-[10px] text-zinc-400">
                          {totalClassVotes} Total Ballots Cast
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Top Nominees in this class by contested post */}
                  <div className="space-y-4">
                    {distinctPosts.map((post) => {
                      const postCands = candidates.filter(
                        (c) => c.post.toLowerCase() === post.toLowerCase()
                      );

                      const candsWithVotes = postCands
                        .map((c) => ({
                          candidate: c,
                          votes: candidateVotesByClass[c.id]?.[cls] || 0,
                        }))
                        .sort((a, b) => b.votes - a.votes);

                      const leader = candsWithVotes[0];

                      return (
                        <div
                          key={post}
                          className="p-3 rounded-2xl bg-[#F8F9FA] border border-zinc-200/60 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-bold text-zinc-500">{post}</span>
                            {leader && leader.votes > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-black text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                                <Crown className="w-3 h-3 text-amber-600 fill-amber-400" />
                                Won by {leader.candidate.name}
                              </span>
                            )}
                          </div>

                          <div className="space-y-1">
                            {candsWithVotes.map(({ candidate, votes }) => {
                              const share =
                                totalClassVotes > 0
                                  ? Math.round((votes / totalClassVotes) * 100)
                                  : 0;

                              return (
                                <div
                                  key={candidate.id}
                                  className="flex items-center justify-between text-xs"
                                >
                                  <span className="font-medium text-zinc-800 truncate max-w-[160px]">
                                    {candidate.name}
                                  </span>
                                  <span className="font-bold text-zinc-900">
                                    {votes}{" "}
                                    <span className="text-[10px] text-zinc-400 font-normal">
                                      ({share}%)
                                    </span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
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

