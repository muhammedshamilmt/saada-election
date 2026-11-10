"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  PieChart as PieChartIcon,
  Vote,
  Sparkles,
  Maximize2,
  Minimize2,
  Clock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
  Award,
} from "lucide-react";
import { Candidate } from "@/data/electionData";
import { sortPostsByHierarchy } from "@/lib/utils";
import {
  fetchCandidates,
  fetchDummyRoleTallies,
  DummyRoleTally,
  supabase,
} from "@/lib/supabaseClient";
import { RolePieChart } from "@/components/charts/RolePieChart";

export default function DisplayPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [dummyTallies, setDummyTallies] = useState<Record<string, DummyRoleTally>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("Just now");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load candidates and dummy tallies, subscribe to Realtime changes on dummy_role_tallies
  useEffect(() => {
    let isMounted = true;

    async function loadData(showLoader = false) {
      if (showLoader) setIsLoading(true);
      try {
        const [cands, tallies] = await Promise.all([
          fetchCandidates(),
          fetchDummyRoleTallies(),
        ]);

        if (isMounted) {
          setCandidates(cands || []);
          setDummyTallies(tallies || {});
          setLastUpdated(
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
        }
      } catch (err) {
        console.error("Error loading display data:", err);
      } finally {
        if (isMounted && showLoader) {
          setIsLoading(false);
        }
      }
    }

    loadData(true);

    // Supabase Realtime subscription on the isolated dummy_role_tallies & dummy_votes table
    const channel = supabase
      .channel(`display-realtime-dummy-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dummy_role_tallies" },
        async () => {
          const tallies = await fetchDummyRoleTallies();
          if (isMounted) setDummyTallies(tallies || {});
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "dummy_votes" },
        async () => {
          const tallies = await fetchDummyRoleTallies();
          if (isMounted) setDummyTallies(tallies || {});
        }
      )
      .subscribe();

    // 2.5-second background polling fallback
    const interval = setInterval(() => {
      loadData(false);
    }, 2500);

    return () => {
      isMounted = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Distinct roles in institutional hierarchy (President -> General Secretary -> Treasurer...)
  const distinctRoles = useMemo(() => {
    const raw = Array.from(
      new Set(candidates.map((c) => c.post).filter(Boolean))
    );
    return sortPostsByHierarchy(
      raw.length > 0 ? raw : ["President", "General Secretary", "Treasurer"]
    );
  }, [candidates]);

  // Candidates mapped with their DUMMY votes (completely separate from real ballots)
  const simulatedCandidates = useMemo(() => {
    return candidates.map((c) => {
      const tally = dummyTallies[c.post];
      let assignedVotes = 0;

      if (tally && tally.allocations && tally.allocations[c.id] !== undefined) {
        assignedVotes = tally.allocations[c.id];
      } else {
        // Fallback demo allocation if admin hasn't set any value yet
        const sameRoleCands = candidates.filter(
          (other) => other.post.toLowerCase() === c.post.toLowerCase()
        );
        const idx = sameRoleCands.findIndex((other) => other.id === c.id);
        assignedVotes = idx === 0 ? 58 : 42;
      }

      return {
        ...c,
        votes: assignedVotes,
      };
    });
  }, [candidates, dummyTallies]);

  // Overall simulated totals
  const totalSimulatedVotes = useMemo(() => {
    return simulatedCandidates.reduce((acc, c) => acc + (c.votes || 0), 0);
  }, [simulatedCandidates]);

  // Fullscreen toggle for auditorium projectors and presentation screens
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

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between text-zinc-900 font-sans antialiased selection:bg-[#FF5B26]/20 selection:text-[#FF5B26]">
      {/* Top Broadcasting Bar */}
      <header className="bg-white border-b border-zinc-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5B26] text-white flex items-center justify-center font-black border border-[#FF5B26] shadow-sm shadow-[#FF5B26]/20">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-zinc-900 font-sans">
                  Saada<span className="text-[#FF5B26]">Live</span> Public Tally Screen
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Broadcast
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                Central Students&apos; Union Election 2026 &bull; Real-time Role Standings
              </p>
            </div>
          </div>

          {/* Action buttons: Fullscreen, Live Sync Timestamp, Links */}
          <div className="flex items-center gap-2.5 self-end md:self-auto flex-wrap">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Live: {lastUpdated}</span>
            </div>

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Projector Fullscreen Mode"}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition-colors cursor-pointer"
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5" />
                  <span>Exit Fullscreen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>Projector Mode</span>
                </>
              )}
            </button>

            <Link
              href="/vote"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-[#FF5B26] border border-orange-200/60 text-xs font-bold transition-colors"
            >
              <Vote className="w-3.5 h-3.5" />
              <span>Voting Booth</span>
            </Link>

            <Link
              href="/admin"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 transition-colors"
            >
              <span>Admin Desk</span>
              <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-6">
        {/* Banner */}
        <div className="bg-white rounded-3xl p-6 border border-zinc-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div>
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold mb-1">
              <Award className="w-4 h-4 text-[#FF5B26]" />
              <span>Executive Council Breakdown</span>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 tracking-tight font-sans">
              Contested Role Pie Charts
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Real-time candidate vote share across President, General Secretary, and Treasurer positions.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-zinc-50 border border-zinc-200 text-right">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                Total Tallied
              </span>
              <span className="text-xl font-black text-zinc-900 font-sans">
                {totalSimulatedVotes.toLocaleString()} votes
              </span>
            </div>
          </div>
        </div>

        {/* The 3 Pie Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {distinctRoles.map((roleName, idx) => {
            const roleCandidates = simulatedCandidates.filter(
              (c) => c.post.toLowerCase() === roleName.toLowerCase()
            );

            return (
              <RolePieChart
                key={roleName}
                postTitle={roleName}
                candidates={roleCandidates}
                roleIndex={idx + 1}
              />
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200/90 py-4 text-center text-xs text-zinc-400">
        <p>Saada Central Election Commission 2026 &bull; Real-time Digital EVM Visualizer</p>
      </footer>
    </div>
  );
}

