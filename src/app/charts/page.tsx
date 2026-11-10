"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  PieChart as PieChartIcon,
  Vote,
  Sparkles,
  RotateCw,
  Maximize2,
  Minimize2,
  Users,
  Trophy,
  CheckCircle2,
  Clock,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from "lucide-react";
import { Candidate, Voter } from "@/data/electionData";
import { sortPostsByHierarchy } from "@/lib/utils";
import { fetchCandidates, fetchVoters, supabase } from "@/lib/supabaseClient";
import { RolePieChart } from "@/components/charts/RolePieChart";

function ChartsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const roleParam = searchParams.get("role") || "all";

  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [voters, setVoters] = useState<Voter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<string>("Just now");
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Load candidates and voters, subscribe to Supabase Realtime & background refetch
  useEffect(() => {
    let isMounted = true;

    async function loadData(showLoader = false) {
      if (showLoader) setIsLoading(true);
      try {
        const [cands, vtrs] = await Promise.all([
          fetchCandidates(),
          fetchVoters(),
        ]);
        if (isMounted) {
          setCandidates(cands || []);
          setVoters(vtrs || []);
          setLastUpdated(
            new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })
          );
        }
      } catch (err) {
        console.error("Error loading charts data:", err);
      } finally {
        if (isMounted && showLoader) {
          setIsLoading(false);
        }
      }
    }

    // Initial load
    loadData(true);

    // Supabase Realtime subscription
    const channel = supabase
      .channel(`charts-live-pie-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "candidates" },
        async () => {
          const cands = await fetchCandidates();
          if (isMounted) setCandidates(cands || []);
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ballots" },
        async () => {
          const [cands, vtrs] = await Promise.all([
            fetchCandidates(),
            fetchVoters(),
          ]);
          if (isMounted) {
            setCandidates(cands || []);
            setVoters(vtrs || []);
          }
        }
      )
      .subscribe();

    // 3-second background polling fallback
    const interval = setInterval(() => {
      loadData(false);
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Derive distinct roles in official hierarchy (President -> General Secretary -> Treasurer...)
  const distinctRoles = useMemo(() => {
    const rawRoles = Array.from(
      new Set(candidates.map((c) => c.post).filter(Boolean))
    );
    if (rawRoles.length > 0) {
      return sortPostsByHierarchy(rawRoles);
    }
    // Default 3 standard roles if candidates not yet registered
    return ["President", "General Secretary", "Treasurer"];
  }, [candidates]);

  // Roles to display based on GET query param ?role=...
  const activeRolesToDisplay = useMemo(() => {
    if (roleParam.toLowerCase() === "all" || !roleParam) {
      return distinctRoles;
    }
    const filtered = distinctRoles.filter(
      (r) => r.toLowerCase() === roleParam.toLowerCase()
    );
    return filtered.length > 0 ? filtered : distinctRoles;
  }, [distinctRoles, roleParam]);

  // Overall statistics
  const totalVotesCast = useMemo(() => {
    return candidates.reduce((acc, c) => acc + (c.votes || 0), 0);
  }, [candidates]);

  const totalVotersCount = voters.length || 1;
  const votedCount = voters.filter((v) => v.hasVoted).length;
  const turnoutPercent = Math.round((votedCount / totalVotersCount) * 100);

  const topVotedCandidate = useMemo(() => {
    if (candidates.length === 0) return null;
    return [...candidates].sort((a, b) => b.votes - a.votes)[0];
  }, [candidates]);

  // Fullscreen toggle for projector/TV displays
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

  const handleRoleFilterChange = (role: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (role === "all") {
      params.delete("role");
    } else {
      params.set("role", role);
    }
    router.push(`/charts?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between text-zinc-900 font-sans antialiased selection:bg-[#FF5B26]/20 selection:text-[#FF5B26]">
      {/* Top Navigation & Controls Bar */}
      <header className="bg-white border-b border-zinc-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-[1880px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Brand & Page Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FF5B26] text-white flex items-center justify-center font-black border border-[#FF5B26] shadow-sm shadow-[#FF5B26]/20">
              <PieChartIcon className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg tracking-tight text-zinc-900 font-sans">
                  Saada<span className="text-[#FF5B26]">Live</span> Role Charts
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
              <p className="text-xs text-zinc-400 font-medium">
                Official Central Student Union Election 2026 &bull; Real-time Candidate Vote Share
              </p>
            </div>
          </div>

          {/* Quick Action Navigation Links & Fullscreen */}
          <div className="flex items-center gap-2.5 self-end md:self-auto flex-wrap">
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-500 px-3 py-1.5 rounded-xl bg-zinc-50 border border-zinc-200/80">
              <Clock className="w-3.5 h-3.5 text-zinc-400" />
              <span>Synced: {lastUpdated}</span>
            </div>

            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit Fullscreen" : "Enter Projector Fullscreen Mode"}
              className="p-2 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-600 hover:text-zinc-900 transition-colors cursor-pointer"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4" />
              ) : (
                <Maximize2 className="w-4 h-4" />
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

      {/* Main Charts Arena */}
      <main className="flex-1 max-w-[1880px] w-full mx-auto px-4 sm:px-6 md:px-8 lg:px-10 xl:px-12 py-8 space-y-8">
        {/* Metric Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-none hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Total Ballots
            </p>
            <p className="text-2xl font-black text-zinc-900 mt-1 font-sans">
              {votedCount.toLocaleString()}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
              Across all voter batches
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-none hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Voter Turnout
            </p>
            <p className="text-2xl font-black text-emerald-600 mt-1 font-sans">
              {turnoutPercent}%
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium">
              {votedCount} of {totalVotersCount} students
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-none hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Contested Roles
            </p>
            <p className="text-2xl font-black text-[#FF5B26] mt-1 font-sans">
              {distinctRoles.length}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium truncate">
              {distinctRoles.slice(0, 3).join(", ")}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-none hover:shadow-md transition-shadow">
            <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
              Top Voted Nominee
            </p>
            <p className="text-2xl font-black text-zinc-900 mt-1 truncate font-sans">
              {topVotedCandidate ? topVotedCandidate.name.split(" ")[0] : "—"}
            </p>
            <p className="text-[11px] text-zinc-500 mt-0.5 font-medium truncate">
              {topVotedCandidate
                ? `${topVotedCandidate.votes} votes (${topVotedCandidate.post})`
                : "No votes yet"}
            </p>
          </div>
        </div>

        {/* GET URL Parameter Role Filter Tabs */}
        <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            <button
              onClick={() => handleRoleFilterChange("all")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                roleParam.toLowerCase() === "all" || !roleParam
                  ? "bg-zinc-900 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
              }`}
            >
              All Roles ({distinctRoles.length} Pie Charts)
            </button>

            {distinctRoles.map((role) => {
              const isSelected = roleParam.toLowerCase() === role.toLowerCase();
              return (
                <button
                  key={role}
                  onClick={() => handleRoleFilterChange(role)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    isSelected
                      ? "bg-[#FF5B26] text-white shadow-xs"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200/70"
                  }`}
                >
                  {role} Pie Chart
                </button>
              );
            })}
          </div>

          <div className="text-right shrink-0">
            <span className="text-xs text-zinc-400 font-medium font-mono">
              GET /charts{roleParam !== "all" ? `?role=${encodeURIComponent(roleParam)}` : ""}
            </span>
          </div>
        </div>

        {/* The 3 Role Pie Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in duration-300">
          {activeRolesToDisplay.map((roleName, idx) => {
            const roleCandidates = candidates.filter(
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

export default function ChartsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#FF5B26] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-bold text-zinc-500">Loading Election Role Charts...</p>
          </div>
        </div>
      }
    >
      <ChartsContent />
    </Suspense>
  );
}

