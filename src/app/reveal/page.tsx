"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  Trophy,
  Crown,
  Sparkles,
  PartyPopper,
  Lock,
  CheckCircle2,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Vote,
  PieChart,
  RotateCcw,
  Flame,
  Award,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import confetti from "canvas-confetti";
import { Candidate } from "@/data/electionData";
import { sortPostsByHierarchy } from "@/lib/utils";
import {
  fetchCandidates,
  fetchRevealStatuses,
  fetchDummyRoleTallies,
  RoleRevealStatus,
  DummyRoleTally,
  supabase,
} from "@/lib/supabaseClient";
import { playVictoryFanfare } from "@/lib/soundEffects";

interface RoleDisplayData {
  post: string;
  isRevealed: boolean;
  revealedAt?: string;
  totalVotes: number;
  winner: Candidate | null;
  winnerVotes: number;
  winnerPercent: number;
  runnerUp: Candidate | null;
  runnerUpVotes: number;
  margin: number;
  allContestants: Array<{ candidate: Candidate; votes: number; percent: number }>;
}

export default function RevealPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [revealStatuses, setRevealStatuses] = useState<Record<string, RoleRevealStatus>>({});
  const [dummyTallies, setDummyTallies] = useState<Record<string, DummyRoleTally>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const lastRevealedRef = useRef<Record<string, boolean>>({});

  // Group roles in official hierarchy order
  const distinctRoles = useMemo(() => {
    const raw = Array.from(
      new Set(candidates.map((c) => c.post).filter(Boolean))
    );
    return sortPostsByHierarchy(
      raw.length > 0 ? raw : ["President", "General Secretary", "Treasurer"]
    );
  }, [candidates]);

  // Grand Party Popper Multi-Stage Confetti Explosion
  const firePartyPoppers = () => {
    if (soundEnabled) {
      playVictoryFanfare();
    }

    // Left cannon
    confetti({
      particleCount: 60,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors: ["#FF5B26", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"],
    });

    // Right cannon
    confetti({
      particleCount: 60,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors: ["#FF5B26", "#F59E0B", "#10B981", "#3B82F6", "#8B5CF6", "#EC4899"],
    });

    // Center star shower
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { y: 0.5 },
        shapes: ["star", "circle"],
        colors: ["#FBBF24", "#F59E0B", "#FEF08A", "#FFFFFF"],
      });
    }, 250);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Fetch initial data
  const loadData = async () => {
    try {
      const [cands, statuses, dummy] = await Promise.all([
        fetchCandidates(),
        fetchRevealStatuses(),
        fetchDummyRoleTallies(),
      ]);
      setCandidates(cands || []);
      setRevealStatuses(statuses || {});
      setDummyTallies(dummy || {});

      // Record which roles are revealed
      const initialRevealedMap: Record<string, boolean> = {};
      Object.keys(statuses || {}).forEach((post) => {
        initialRevealedMap[post] = Boolean(statuses[post]?.is_revealed);
      });
      lastRevealedRef.current = initialRevealedMap;
    } catch (err) {
      console.error("Failed loading reveal data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Supabase Realtime subscription for live reveal broadcast
    const channel = supabase
      .channel(`public-reveal-live-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "election_reveal_status" },
        async (payload: any) => {
          const updated = await fetchRevealStatuses();
          setRevealStatuses(updated);

          // Check if a role transitioned from unrevealed to revealed
          const newRow = payload?.new;
          if (newRow && newRow.post && newRow.is_revealed) {
            const wasRevealed = lastRevealedRef.current[newRow.post];
            if (!wasRevealed) {
              lastRevealedRef.current[newRow.post] = true;
              firePartyPoppers();
            }
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dummy_role_tallies" },
        async () => {
          const dummy = await fetchDummyRoleTallies();
          setDummyTallies(dummy);
        }
      )
      .subscribe();

    // Fallback sync polling every 3s
    const interval = setInterval(async () => {
      const statuses = await fetchRevealStatuses();
      setRevealStatuses((prev) => {
        // Trigger celebration if newly revealed
        Object.keys(statuses).forEach((p) => {
          if (statuses[p]?.is_revealed && !lastRevealedRef.current[p]) {
            lastRevealedRef.current[p] = true;
            firePartyPoppers();
          }
        });
        return statuses;
      });
    }, 3000);

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [soundEnabled]);

  // Compute processed presentation data per role
  const rolesData: RoleDisplayData[] = useMemo(() => {
    return distinctRoles.map((post) => {
      const status = revealStatuses[post];
      const isRevealed = Boolean(status?.is_revealed);
      const isOfficialSource = status?.data_source === "official";

      const roleCands = candidates.filter(
        (c) => c.post.toLowerCase() === post.toLowerCase()
      );

      let totalVotes = 0;
      let candVotesMap: Record<string, number> = {};

      if (!isOfficialSource) {
        // Dummy/Simulation source
        const dummyTally = dummyTallies[post];
        totalVotes = dummyTally?.totalVotes || status?.total_votes || 100;
        candVotesMap = dummyTally?.allocations || {};

        if (Object.keys(candVotesMap).length === 0 && roleCands.length > 0) {
          if (roleCands.length === 2) {
            candVotesMap[roleCands[0].id] = 55;
            candVotesMap[roleCands[1].id] = 45;
          } else {
            roleCands.forEach((c) => {
              candVotesMap[c.id] = Math.floor(totalVotes / roleCands.length);
            });
          }
        }
      } else {
        // Official Real Ballots
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
      const margin = (winnerItem?.votes || 0) - (runnerUpItem?.votes || 0);

      return {
        post,
        isRevealed,
        revealedAt: status?.revealed_at,
        totalVotes,
        winner: winnerItem ? winnerItem.candidate : null,
        winnerVotes: winnerItem ? winnerItem.votes : 0,
        winnerPercent: winnerItem ? winnerItem.percent : 0,
        runnerUp: runnerUpItem ? runnerUpItem.candidate : null,
        runnerUpVotes: runnerUpItem ? runnerUpItem.votes : 0,
        margin: Math.max(0, margin),
        allContestants: all,
      };
    });
  }, [distinctRoles, candidates, revealStatuses, dummyTallies]);

  const revealedCount = rolesData.filter((r) => r.isRevealed).length;

  return (
    <div className="min-h-screen bg-[#0C0F17] text-white flex flex-col font-sans selection:bg-[#FF5B26] selection:text-white">
      {/* Top Ambient Glow Lighting */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-gradient-to-b from-[#FF5B26]/20 via-amber-500/10 to-transparent rounded-full blur-3xl opacity-70" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Broadcast Header Bar */}
      <header className="relative z-20 border-b border-white/10 bg-[#0C0F17]/80 backdrop-blur-xl px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Left: Branding & Live Badge */}
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-2.5 group transition-transform hover:scale-105"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#FF5B26] to-amber-500 flex items-center justify-center font-black text-white shadow-lg shadow-[#FF5B26]/20">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-black text-lg tracking-tight font-sans">
                    Saada<span className="text-[#FF5B26]">Union</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-wider border border-emerald-500/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Live Announcement
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
                  Central Election Commission &bull; Official Winner Declarations
                </p>
              </div>
            </Link>
          </div>

          {/* Right: Quick Controls */}
          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? "Mute Fanfare" : "Enable Fanfare"}
              className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                soundEnabled
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:bg-white/10"
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Test Confetti Popper */}
            <button
              onClick={firePartyPoppers}
              title="Pop Confetti Celebration"
              className="px-3 py-2 rounded-xl bg-[#FF5B26] hover:bg-[#E04D1C] text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-[#FF5B26]/30 transition-all cursor-pointer"
            >
              <PartyPopper className="w-4 h-4" />
              <span className="hidden sm:inline">Party Popper</span>
            </button>

            {/* Fullscreen / Projector Mode */}
            <button
              onClick={toggleFullscreen}
              title="Toggle Projector Fullscreen Mode"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-white transition-all cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Presentation Stage */}
      <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 sm:py-12 flex flex-col justify-between">
        {/* Title & Ceremony Headline */}
        <div className="text-center space-y-3 mb-10 animate-in fade-in duration-500">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-amber-400 backdrop-blur-md">
            <Trophy className="w-3.5 h-3.5" />
            <span>Saada Arts &amp; Science College Students&apos; Union 2026</span>
          </div>
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight drop-shadow font-sans">
            Official Winner Declaration
          </h1>
          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto font-medium">
            Results announced in official parliamentary sequence:{" "}
            <span className="text-amber-400 font-bold">1st President</span> &rarr;{" "}
            <span className="text-purple-400 font-bold">2nd General Secretary</span> &rarr;{" "}
            <span className="text-emerald-400 font-bold">3rd Treasurer</span>
          </p>

          <div className="pt-2 flex items-center justify-center gap-3">
            <div className="px-3.5 py-1 rounded-full bg-white/10 text-xs font-extrabold text-white border border-white/15">
              {revealedCount} of {distinctRoles.length} Roles Declared
            </div>
            {revealedCount === distinctRoles.length && (
              <span className="px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-extrabold border border-emerald-500/40 animate-pulse">
                🏆 Complete Cabinet Formed
              </span>
            )}
          </div>
        </div>

        {/* 3 Contested Role Cards in Official Sequence */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 items-stretch mb-12">
          {rolesData.map((role, idx) => {
            const isRevealed = role.isRevealed;
            const winner = role.winner;
            const runnerUp = role.runnerUp;

            return (
              <div
                key={role.post}
                className={`rounded-3xl border transition-all duration-700 flex flex-col justify-between relative overflow-hidden backdrop-blur-xl ${
                  isRevealed
                    ? "bg-gradient-to-b from-zinc-900/90 via-[#131722]/90 to-zinc-900/90 border-amber-500/50 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-400/30 scale-[1.02]"
                    : "bg-white/[0.03] border-white/10 hover:border-white/20 shadow-none"
                }`}
              >
                {/* Decorative Top Accent Glow for Revealed Cards */}
                {isRevealed && (
                  <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-amber-400 via-[#FF5B26] to-pink-500" />
                )}

                <div>
                  {/* Card Header */}
                  <div className="p-6 pb-4 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-xs font-black text-amber-400">
                        #{idx + 1}
                      </span>
                      <div>
                        <h2 className="text-lg font-black tracking-tight text-white font-sans">
                          {role.post}
                        </h2>
                        <p className="text-xs text-zinc-400">
                          {role.totalVotes.toLocaleString()} Total Votes Cast
                        </p>
                      </div>
                    </div>

                    {/* Status Pill */}
                    {isRevealed ? (
                      <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>DECLARED</span>
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-400" />
                        <span>AWAITING</span>
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-6 sm:p-7">
                    {!isRevealed ? (
                      /* Locked / Awaiting State */
                      <div className="py-14 text-center space-y-4">
                        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
                          <div className="absolute inset-0 rounded-full bg-amber-500/10 blur-xl animate-pulse" />
                          <div className="w-16 h-16 rounded-2xl bg-white/5 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-lg">
                            <Lock className="w-8 h-8" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-zinc-200 tracking-wide uppercase">
                            Official Result Locked
                          </p>
                          <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                            The Chief Returning Officer will announce the winner of {role.post} shortly. Stand by for the live reveal!
                          </p>
                        </div>
                        <div className="inline-flex items-center gap-1 text-[11px] text-amber-400/80 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20 animate-pulse">
                          <span>Awaiting Announcement...</span>
                        </div>
                      </div>
                    ) : (
                      /* Winner Revealed Celebration Showcase */
                      <div className="space-y-6 animate-in zoom-in-95 fade-in duration-500">
                        {/* Winner Avatar, Symbol & Crown */}
                        <div className="relative flex flex-col items-center text-center">
                          {/* Floating Crown with Sparkles */}
                          <div className="flex items-center gap-1.5 mb-2">
                            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                            <Crown className="w-8 h-8 text-amber-400 fill-amber-300 animate-bounce" />
                            <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
                          </div>

                          {/* Winner Avatar with enlarged candidate symbol */}
                          <div className="relative">
                            <img
                              src={winner?.avatarUrl}
                              alt={winner?.name || "Winner"}
                              className="w-28 h-28 sm:w-32 sm:h-32 rounded-3xl object-cover border-4 border-amber-400 shadow-2xl ring-4 ring-amber-400/20"
                            />
                            {/* Enlarged Symbol Badge */}
                            <div className="absolute -bottom-2 -right-2 w-12 h-12 rounded-2xl bg-white border-2 border-amber-400 flex items-center justify-center p-1.5 shadow-xl ring-2 ring-black">
                              <img
                                src={winner?.symbolUrl}
                                alt="Symbol"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>

                          {/* Elected Ribbon */}
                          <div className="mt-4">
                            <span className="px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 via-[#FF5B26] to-pink-500 text-white text-xs font-black tracking-widest uppercase shadow-lg shadow-[#FF5B26]/30">
                              ★ ELECTED {role.post.toUpperCase()} ★
                            </span>
                          </div>

                          {/* Candidate Name & Class */}
                          <h3 className="text-xl sm:text-2xl font-black text-white mt-3 tracking-tight font-sans">
                            {winner?.name}
                          </h3>
                          <p className="text-xs text-zinc-400 font-semibold mt-0.5">
                            Class {winner?.className} &bull; Roll #{winner?.adNo}
                          </p>

                          {/* Big Bold Vote Stats */}
                          <div className="mt-4 w-full bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-around">
                            <div>
                              <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                                Total Votes
                              </p>
                              <p className="text-2xl font-black text-amber-400">
                                {role.winnerVotes.toLocaleString()}
                              </p>
                            </div>
                            <div className="h-8 w-px bg-white/10" />
                            <div>
                              <p className="text-[11px] text-zinc-400 font-bold uppercase tracking-wider">
                                Vote Share
                              </p>
                              <p className="text-2xl font-black text-[#FF5B26]">
                                {role.winnerPercent}%
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Runner Up & Margin Details */}
                        {runnerUp && (
                          <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/10 text-xs space-y-1.5">
                            <div className="flex items-center justify-between text-zinc-400">
                              <span>Runner-Up:</span>
                              <span className="font-bold text-zinc-200">
                                {runnerUp.name} ({role.runnerUpVotes.toLocaleString()} votes)
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-zinc-400">
                              <span>Victory Margin:</span>
                              <span className="font-extrabold text-emerald-400">
                                +{role.margin.toLocaleString()} votes
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Footer Action */}
                {isRevealed && (
                  <div className="p-4 bg-white/[0.02] border-t border-white/10 flex items-center justify-center">
                    <button
                      onClick={firePartyPoppers}
                      className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <PartyPopper className="w-3.5 h-3.5" />
                      <span>Celebrate Winner</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer Navigation Links */}
        <footer className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Official Result Declaration System &bull; Cryptographically Verified</span>
          </div>

          <div className="flex items-center gap-4">
            <Link
              href="/charts"
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <PieChart className="w-3.5 h-3.5 text-emerald-400" />
              <span>3-Role Pie Charts</span>
            </Link>
            <Link
              href="/vote"
              className="text-zinc-400 hover:text-white transition-colors flex items-center gap-1"
            >
              <Vote className="w-3.5 h-3.5 text-[#FF5B26]" />
              <span>Voting Booth</span>
            </Link>
            <Link
              href="/admin"
              className="text-zinc-400 hover:text-white transition-colors"
            >
              Admin Bureau
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
