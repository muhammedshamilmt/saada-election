"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Trophy,
  Crown,
  Sparkles,
  PartyPopper,
  Eye,
  EyeOff,
  CheckCircle2,
  Lock,
  Unlock,
  ExternalLink,
  RotateCcw,
  Sliders,
  Send,
  Radio,
  Flame,
  Award,
  Users,
  Copy,
  Check,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Candidate } from "@/data/electionData";
import { sortPostsByHierarchy } from "@/lib/utils";
import {
  fetchRevealStatuses,
  publishRoleReveal,
  publishAllRoleReveals,
  resetAllRoleReveals,
  fetchDummyRoleTallies,
  RoleRevealStatus,
  DummyRoleTally,
  supabase,
} from "@/lib/supabaseClient";
import { playVictoryFanfare } from "@/lib/soundEffects";

interface RevealControllerViewProps {
  candidates: Candidate[];
}

interface RoleTallySummary {
  post: string;
  totalVotes: number;
  winner: Candidate | null;
  winnerVotes: number;
  winnerPercent: number;
  runnerUp: Candidate | null;
  runnerUpVotes: number;
  allCandidates: Array<{ candidate: Candidate; votes: number; percent: number }>;
}

export const RevealControllerView: React.FC<RevealControllerViewProps> = ({
  candidates,
}) => {
  const [dataSource, setDataSource] = useState<"dummy" | "official">("dummy");
  const [dummyTallies, setDummyTallies] = useState<Record<string, DummyRoleTally>>({});
  const [revealStatuses, setRevealStatuses] = useState<Record<string, RoleRevealStatus>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPublishing, setIsPublishing] = useState<string | null>(null);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const hasLoadedRef = useRef(false);

  // Group roles by official hierarchy
  const distinctRoles = useMemo(() => {
    const raw = Array.from(
      new Set(candidates.map((c) => c.post).filter(Boolean))
    );
    return sortPostsByHierarchy(
      raw.length > 0 ? raw : ["President", "General Secretary", "Treasurer"]
    );
  }, [candidates]);

  // Load reveal statuses & dummy tallies
  const loadData = async () => {
    try {
      const [statuses, dummy] = await Promise.all([
        fetchRevealStatuses(),
        fetchDummyRoleTallies(),
      ]);
      setRevealStatuses(statuses);
      setDummyTallies(dummy);
    } catch (err) {
      console.error("Error loading reveal data:", err);
    } finally {
      setIsLoading(false);
      hasLoadedRef.current = true;
    }
  };

  useEffect(() => {
    loadData();

    // Subscribe to realtime updates on election_reveal_status
    const channel = supabase
      .channel(`admin-reveal-sync-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "election_reveal_status" },
        () => {
          fetchRevealStatuses().then(setRevealStatuses);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Compute tallies and projected winners for each role based on active data source
  const roleSummaries: Record<string, RoleTallySummary> = useMemo(() => {
    const summaries: Record<string, RoleTallySummary> = {};

    for (const post of distinctRoles) {
      const roleCands = candidates.filter(
        (c) => c.post.toLowerCase() === post.toLowerCase()
      );

      let totalVotes = 0;
      let candVotesMap: Record<string, number> = {};

      if (dataSource === "dummy") {
        const dummyTally = dummyTallies[post];
        totalVotes = dummyTally?.totalVotes || 162;
        candVotesMap = dummyTally?.allocations || {};

        // If no allocations set yet, default each candidate to 0
        if (Object.keys(candVotesMap).length === 0 && roleCands.length > 0) {
          roleCands.forEach((c) => {
            candVotesMap[c.id] = 0;
          });
        }
      } else {
        // Official Real Ballots from candidates table
        totalVotes = roleCands.reduce((acc, c) => acc + (c.votes || 0), 0);
        roleCands.forEach((c) => {
          candVotesMap[c.id] = c.votes || 0;
        });
      }

      const all = roleCands
        .map((cand) => {
          const votes = candVotesMap[cand.id] || 0;
          const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
          return { candidate: cand, votes, percent };
        })
        .sort((a, b) => b.votes - a.votes);

      const winnerItem = all[0];
      const runnerUpItem = all[1];

      summaries[post] = {
        post,
        totalVotes,
        winner: winnerItem ? winnerItem.candidate : null,
        winnerVotes: winnerItem ? winnerItem.votes : 0,
        winnerPercent: winnerItem ? winnerItem.percent : 0,
        runnerUp: runnerUpItem ? runnerUpItem.candidate : null,
        runnerUpVotes: runnerUpItem ? runnerUpItem.votes : 0,
        allCandidates: all,
      };
    }

    return summaries;
  }, [distinctRoles, candidates, dataSource, dummyTallies]);

  // Trigger preview confetti
  const triggerCelebration = () => {
    playVictoryFanfare();
    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#FF5B26", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6"],
    });
  };

  // Publish single role
  const handleTogglePublishRole = async (post: string) => {
    const current = revealStatuses[post]?.is_revealed;
    const summary = roleSummaries[post];
    setIsPublishing(post);

    const nextRevealed = !current;

    await publishRoleReveal(post, nextRevealed, {
      source: dataSource,
      winnerId: summary?.winner?.id,
      winnerName: summary?.winner?.name,
      winnerVotes: summary?.winnerVotes,
      totalVotes: summary?.totalVotes,
    });

    if (nextRevealed) {
      triggerCelebration();
    }

    setRevealStatuses((prev) => ({
      ...prev,
      [post]: {
        post,
        is_revealed: nextRevealed,
        revealed_at: nextRevealed ? new Date().toISOString() : undefined,
        data_source: dataSource,
        winner_id: summary?.winner?.id,
        winner_name: summary?.winner?.name,
        winner_votes: summary?.winnerVotes,
        total_votes: summary?.totalVotes,
      },
    }));

    setIsPublishing(null);
  };

  // Publish all roles at once (Total Reveal)
  const handlePublishAll = async () => {
    setIsPublishing("ALL");

    const items = distinctRoles.map((post) => {
      const summary = roleSummaries[post];
      return {
        post,
        isRevealed: true,
        source: dataSource,
        winnerId: summary?.winner?.id,
        winnerName: summary?.winner?.name,
        winnerVotes: summary?.winnerVotes,
        totalVotes: summary?.totalVotes,
      };
    });

    await publishAllRoleReveals(items);
    triggerCelebration();

    const nextStatuses: Record<string, RoleRevealStatus> = { ...revealStatuses };
    items.forEach((item) => {
      nextStatuses[item.post] = {
        post: item.post,
        is_revealed: true,
        revealed_at: new Date().toISOString(),
        data_source: dataSource,
        winner_id: item.winnerId,
        winner_name: item.winnerName,
        winner_votes: item.winnerVotes,
        total_votes: item.totalVotes,
      };
    });
    setRevealStatuses(nextStatuses);

    setIsPublishing(null);
  };

  // Reset all reveals (Lock all)
  const handleResetAll = async () => {
    if (!confirm("Are you sure you want to reset all published reveals back to locked/hidden?")) {
      return;
    }
    setIsPublishing("RESET");
    await resetAllRoleReveals(distinctRoles);

    const resetMap: Record<string, RoleRevealStatus> = {};
    distinctRoles.forEach((post) => {
      resetMap[post] = {
        post,
        is_revealed: false,
        data_source: dataSource,
      };
    });
    setRevealStatuses(resetMap);
    setIsPublishing(null);
  };

  const revealedCount = distinctRoles.filter(
    (p) => revealStatuses[p]?.is_revealed
  ).length;

  const handleCopyUrl = () => {
    if (typeof window !== "undefined") {
      const fullUrl = `${window.location.origin}/reveal`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    }
  };

  if (isLoading && !hasLoadedRef.current) {
    return (
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-12 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#FF5B26] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-zinc-500">
          Loading Result Reveal Controller...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="bg-gradient-to-br from-amber-500 via-[#FF5B26] to-pink-600 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        {/* Decorative background glow & circles */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-black/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-black uppercase tracking-wider text-white border border-white/30 flex items-center gap-1.5 shadow-sm">
                <PartyPopper className="w-3.5 h-3.5 animate-bounce" />
                Live Announcement Studio
              </span>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/80 text-[11px] font-bold text-white border border-white/20">
                {revealedCount} of {distinctRoles.length} Roles Published
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight drop-shadow-sm font-sans">
              Election Result Reveal Controller
            </h1>
            <p className="text-sm text-white/90 max-w-xl font-medium leading-relaxed">
              Broadcast winners to the audience screen in real-time. Publish roles one-by-one for maximum suspense, or publish all at once with full party popper celebrations.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <Link
              href="/reveal"
              target="_blank"
              className="px-5 py-3 rounded-2xl bg-white text-zinc-900 hover:bg-zinc-100 font-extrabold text-xs shadow-lg hover:shadow-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <ExternalLink className="w-4 h-4 text-[#FF5B26]" />
              <span>Open Public Reveal Screen</span>
            </Link>

            <button
              onClick={handleCopyUrl}
              className="px-4 py-3 rounded-2xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-xs backdrop-blur-md transition-all flex items-center gap-2 cursor-pointer"
            >
              {copiedUrl ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>URL Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Public URL</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Master Control Bar */}
        <div className="mt-6 pt-6 border-t border-white/20 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Data Source Selector */}
          <div className="flex items-center gap-2 bg-black/20 backdrop-blur-md p-1.5 rounded-2xl border border-white/20">
            <span className="text-xs font-bold text-white/80 px-2.5">Source:</span>
            <button
              onClick={() => setDataSource("dummy")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dataSource === "dummy"
                  ? "bg-white text-zinc-900 shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Display Simulation (Dummy)
            </button>
            <button
              onClick={() => setDataSource("official")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                dataSource === "official"
                  ? "bg-white text-zinc-900 shadow-md"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Official Ballots
            </button>
          </div>

          {/* Master Publish Buttons */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePublishAll}
              disabled={isPublishing === "ALL"}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isPublishing === "ALL" ? "Publishing..." : "Publish All Results"}</span>
            </button>

            <button
              onClick={handleResetAll}
              disabled={isPublishing === "RESET"}
              className="px-4 py-2.5 rounded-xl bg-white/15 hover:bg-red-500 text-white font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Lock all back to unannounced"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Role-by-Role Cards in Official Hierarchy Order */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
            <span>Contested Roles</span>
            <span className="text-xs text-zinc-400 font-normal">
              (Order: President &rarr; General Secretary &rarr; Treasurer)
            </span>
          </h2>
          <span className="text-xs font-semibold text-zinc-500">
            Realtime sync active &bull; instant audience broadcast
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {distinctRoles.map((post, roleIdx) => {
            const summary = roleSummaries[post];
            const isRevealed = Boolean(revealStatuses[post]?.is_revealed);
            const winner = summary?.winner;
            const runnerUp = summary?.runnerUp;
            const isBusy = isPublishing === post;

            return (
              <div
                key={post}
                className={`bg-white rounded-3xl border-2 transition-all duration-300 overflow-hidden flex flex-col justify-between ${
                  isRevealed
                    ? "border-emerald-500 shadow-lg shadow-emerald-500/10"
                    : "border-zinc-200/90 shadow-none hover:border-zinc-300"
                }`}
              >
                <div>
                  {/* Card Header */}
                  <div
                    className={`p-4 border-b flex items-center justify-between ${
                      isRevealed
                        ? "bg-emerald-50/70 border-emerald-100"
                        : "bg-zinc-50/80 border-zinc-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-zinc-900 text-white flex items-center justify-center text-xs font-black">
                        #{roleIdx + 1}
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-zinc-900">{post}</h3>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          {summary?.totalVotes || 0} Total Votes
                        </p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-1 rounded-full text-[11px] font-black border flex items-center gap-1.5 ${
                        isRevealed
                          ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                          : "bg-amber-50 text-amber-800 border-amber-200"
                      }`}
                    >
                      {isRevealed ? (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>PUBLISHED</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 text-amber-600" />
                          <span>AWAITING</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Projected Winner Showcase */}
                  <div className="p-5 space-y-4">
                    {winner ? (
                      <div className="relative rounded-2xl p-4 bg-gradient-to-b from-amber-50/50 to-orange-50/20 border border-amber-200/80">
                        {/* Winner label */}
                        <div className="flex items-center justify-between mb-3">
                          <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300/60">
                            <Crown className="w-3 h-3 text-amber-600 fill-amber-400" />
                            Projected Winner
                          </span>
                          <span className="text-xs font-black text-[#FF5B26]">
                            {summary.winnerPercent}%
                          </span>
                        </div>

                        {/* Winner Avatar, Symbol & Info */}
                        <div className="flex items-center gap-3.5">
                          <div className="relative shrink-0">
                            <img
                              src={winner.avatarUrl}
                              alt={winner.name}
                              className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-300 shadow-sm"
                            />
                            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-white border border-amber-300 flex items-center justify-center p-0.5 shadow-sm">
                              <img
                                src={winner.symbolUrl}
                                alt="Symbol"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-sm text-zinc-900 truncate">
                              {winner.name}
                            </p>
                            <p className="text-[11px] text-zinc-500 font-medium">
                              Class {winner.className} &bull; {winner.adNo}
                            </p>
                            <p className="text-xs font-black text-amber-900 mt-0.5">
                              {summary.winnerVotes.toLocaleString()} Votes
                            </p>
                          </div>
                        </div>

                        {/* Runner-up Note */}
                        {runnerUp && (
                          <div className="mt-3 pt-3 border-t border-amber-200/60 flex items-center justify-between text-[11px] text-zinc-500">
                            <span className="truncate">Runner-up: {runnerUp.name}</span>
                            <span className="font-bold text-zinc-700">
                              {summary.runnerUpVotes} votes
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-400 italic text-center py-4">
                        No candidates registered for this role.
                      </p>
                    )}

                    {/* Breakdown of Contestants */}
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                        Contestant Standings
                      </p>
                      {summary?.allCandidates.map((item, idx) => (
                        <div
                          key={item.candidate.id}
                          className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 border border-zinc-100 text-xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-4 h-4 rounded-full bg-zinc-200 text-zinc-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-zinc-800 truncate">
                              {item.candidate.name}
                            </span>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="font-bold text-zinc-900">
                              {item.votes}
                            </span>
                            <span className="text-[10px] text-zinc-400 ml-1">
                              ({item.percent}%)
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Individual Role Publish Button */}
                <div className="p-4 bg-zinc-50/80 border-t border-zinc-100">
                  <button
                    onClick={() => handleTogglePublishRole(post)}
                    disabled={isBusy}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      isRevealed
                        ? "bg-zinc-200 hover:bg-zinc-300 text-zinc-800"
                        : "bg-[#FF5B26] hover:bg-[#E04D1C] text-white shadow-md hover:shadow-lg"
                    }`}
                  >
                    {isBusy ? (
                      <span>Updating...</span>
                    ) : isRevealed ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" />
                        <span>Hide / Lock {post}</span>
                      </>
                    ) : (
                      <>
                        <PartyPopper className="w-3.5 h-3.5" />
                        <span>Publish {post} Winner</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
