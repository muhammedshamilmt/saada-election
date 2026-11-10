"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  Sliders,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  RotateCcw,
  Save,
  Users,
  Award,
  AlertTriangle,
  ArrowRight,
  PieChart,
} from "lucide-react";
import { Candidate } from "@/data/electionData";
import { sortPostsByHierarchy } from "@/lib/utils";
import {
  fetchDummyRoleTallies,
  saveDummyRoleTally,
  DummyRoleTally,
  supabase,
} from "@/lib/supabaseClient";

interface DummyTallyViewProps {
  candidates: Candidate[];
}

interface RoleState {
  totalVotes: number;
  allocations: Record<string, number>;
  isSaving?: boolean;
  savedSuccess?: boolean;
}

export const DummyTallyView: React.FC<DummyTallyViewProps> = ({ candidates }) => {
  const [roleStates, setRoleStates] = useState<Record<string, RoleState>>({});
  const [isLoading, setIsLoading] = useState(true);
  const hasLoadedRef = React.useRef(false);

  // Group candidates by role in standard hierarchy order
  const distinctRoles = useMemo(() => {
    const raw = Array.from(
      new Set(candidates.map((c) => c.post).filter(Boolean))
    );
    return sortPostsByHierarchy(
      raw.length > 0 ? raw : ["President", "General Secretary", "Treasurer"]
    );
  }, [candidates]);

  // Stable signature of candidate IDs and posts so poll intervals don't re-trigger effects
  const candidatesKey = useMemo(() => {
    return candidates.map((c) => `${c.id}:${c.post}:${c.name}`).sort().join("|");
  }, [candidates]);

  // Load existing dummy tallies from Supabase once on mount
  useEffect(() => {
    let isMounted = true;

    async function initTallies() {
      // Only show full loader on initial entry
      if (!hasLoadedRef.current) {
        setIsLoading(true);
      }

      const existing = await fetchDummyRoleTallies();

      if (!isMounted) return;

      setRoleStates((prev) => {
        const next: Record<string, RoleState> = { ...prev };

        for (const role of distinctRoles) {
          const roleCands = candidates.filter(
            (c) => c.post.toLowerCase() === role.toLowerCase()
          );

          // If we already have active state for this role, preserve user edits!
          if (next[role] && hasLoadedRef.current) {
            const currentAlloc = { ...next[role].allocations };
            roleCands.forEach((c) => {
              if (currentAlloc[c.id] === undefined) {
                currentAlloc[c.id] = 0;
              }
            });
            next[role] = {
              ...next[role],
              allocations: currentAlloc,
            };
            continue;
          }

          if (existing[role]) {
            // Use saved tally from database
            const saved = existing[role];
            const allocations = { ...(saved.allocations || {}) };

            // Ensure all current candidates have an entry (defaulting to 0)
            roleCands.forEach((c) => {
              if (allocations[c.id] === undefined) {
                allocations[c.id] = 0;
              }
            });

            next[role] = {
              totalVotes: saved.totalVotes || 162,
              allocations,
            };
          } else {
            // Initialize fresh with each candidate starting at 0 votes and 162 total pool
            const totalVotes = 162;
            const allocations: Record<string, number> = {};

            roleCands.forEach((c) => {
              allocations[c.id] = 0;
            });

            next[role] = {
              totalVotes,
              allocations,
            };
          }
        }

        return next;
      });

      hasLoadedRef.current = true;
      setIsLoading(false);
    }

    initTallies();

    return () => {
      isMounted = false;
    };
  }, [candidatesKey]);

  // Independent vote allocation handler (NO auto-subtraction from other candidates)
  const handleVoteChange = (
    role: string,
    targetCandidateId: string,
    rawNewVotes: number
  ) => {
    setRoleStates((prev) => {
      const current = prev[role];
      if (!current) return prev;

      const total = current.totalVotes || 162;
      const parsed = isNaN(rawNewVotes) ? 0 : rawNewVotes;

      // Calculate other candidates' current sum
      const otherSum = Object.entries(current.allocations)
        .filter(([id]) => id !== targetCandidateId)
        .reduce((sum, [, v]) => sum + (v || 0), 0);

      // Candidate can be set from 0 up to remaining pool (max Total Pool 162)
      const maxAllowed = Math.max(0, total - otherSum);
      const newVotes = Math.max(0, Math.min(parsed, maxAllowed));

      // ONLY update the target candidate. Other candidate is 100% untouched!
      const nextAllocations: Record<string, number> = {
        ...current.allocations,
        [targetCandidateId]: newVotes,
      };

      return {
        ...prev,
        [role]: {
          ...current,
          allocations: nextAllocations,
          savedSuccess: false,
        },
      };
    });
  };

  // Reset all candidates for a role to 0 votes
  const resetRoleToZero = (role: string) => {
    setRoleStates((prev) => {
      const current = prev[role];
      if (!current) return prev;

      const zeroAllocations: Record<string, number> = {};
      Object.keys(current.allocations).forEach((id) => {
        zeroAllocations[id] = 0;
      });

      return {
        ...prev,
        [role]: {
          ...current,
          allocations: zeroAllocations,
          savedSuccess: false,
        },
      };
    });
  };

  // Total votes pool adjustment (defaults to 162)
  const handleTotalPoolChange = (role: string, newTotal: number) => {
    const validTotal = Math.max(1, newTotal);

    setRoleStates((prev) => {
      const current = prev[role];
      if (!current) return prev;

      // Preserve existing candidate votes without forced auto-subtraction
      const nextAllocations: Record<string, number> = {};
      Object.entries(current.allocations).forEach(([id, val]) => {
        nextAllocations[id] = Math.min(val, validTotal);
      });

      return {
        ...prev,
        [role]: {
          totalVotes: validTotal,
          allocations: nextAllocations,
          savedSuccess: false,
        },
      };
    });
  };

  // Quick Preset Helper (e.g. 60/40, 70/30, 50/50)
  const applyPreset = (role: string, ratio1: number) => {
    setRoleStates((prev) => {
      const current = prev[role];
      if (!current) return prev;

      const total = current.totalVotes || 162;
      const roleCands = candidates.filter(
        (c) => c.post.toLowerCase() === role.toLowerCase()
      );

      if (roleCands.length < 2) return prev;

      const v1 = Math.round(total * ratio1);
      const v2 = Math.max(0, total - v1);

      return {
        ...prev,
        [role]: {
          ...current,
          allocations: {
            ...current.allocations,
            [roleCands[0].id]: v1,
            [roleCands[1].id]: v2,
          },
          savedSuccess: false,
        },
      };
    });
  };

  // Save changes to Supabase dummy_role_tallies & dummy_votes table
  const handleSaveRole = async (role: string) => {
    const state = roleStates[role];
    if (!state) return;

    setRoleStates((prev) => ({
      ...prev,
      [role]: { ...prev[role], isSaving: true },
    }));

    await saveDummyRoleTally(
      role,
      state.totalVotes,
      state.allocations,
      candidates
    );

    setRoleStates((prev) => ({
      ...prev,
      [role]: {
        ...prev[role],
        isSaving: false,
        savedSuccess: true,
      },
    }));

    // Auto-clear success banner after 2.5s
    setTimeout(() => {
      setRoleStates((prev) =>
        prev[role]
          ? {
              ...prev,
              [role]: { ...prev[role], savedSuccess: false },
            }
          : prev
      );
    }, 2500);
  };

  // Save all roles at once
  const handleSaveAll = async () => {
    for (const role of distinctRoles) {
      await handleSaveRole(role);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-3xl border border-zinc-200/90 p-12 text-center space-y-3">
        <div className="w-8 h-8 border-3 border-[#FF5B26] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs font-bold text-zinc-500">
          Loading Custom Display Controller...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Isolated Safety Guarantee Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-amber-500/10 border-2 border-amber-300 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/20">
            <ShieldCheck className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-black text-amber-950 uppercase tracking-tight font-sans">
                Dummy / Custom Display Control (Safe Mode)
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                100% Isolated From Real Ballots
              </span>
            </div>
            <p className="text-xs text-amber-900/80 mt-1 max-w-2xl leading-relaxed">
              This controller powers the public <strong>/display</strong> pie chart showcase.
              Values entered here are saved exclusively into the isolated <code>dummy_votes</code> and <code>dummy_role_tallies</code> tables.
              The official <strong>ballots</strong> table, registered voters, and real tally remain strictly intact and unaffected.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end md:self-auto">
          <Link
            href="/display"
            target="_blank"
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-sm shadow-amber-500/20"
          >
            <PieChart className="w-4 h-4" />
            <span>Open Public Dummy Pie Charts →</span>
          </Link>
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-zinc-900">
            Real-Time Auto-Balancing Role Tally
          </h2>
          <p className="text-xs text-zinc-400">
            Entering votes for Candidate 1 automatically subtracts from Candidate 2 in real time.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveAll}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5B26] hover:bg-[#e84c17] text-white text-xs font-bold transition-all border border-[#FF5B26] cursor-pointer shadow-xs active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Broadcast All Roles to Display</span>
          </button>
        </div>
      </div>

      {/* Roles Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {distinctRoles.map((role, rIdx) => {
          const state = roleStates[role] || {
            totalVotes: 100,
            allocations: {},
          };
          const roleCands = candidates.filter(
            (c) => c.post.toLowerCase() === role.toLowerCase()
          );

          const totalAllocated = Object.values(state.allocations).reduce(
            (acc, v) => acc + (v || 0),
            0
          );
          const isBalanced = totalAllocated === state.totalVotes;

          return (
            <div
              key={role}
              className="bg-white rounded-3xl border border-zinc-200/90 p-6 flex flex-col justify-between shadow-xs hover:shadow-xl hover:border-zinc-300 transition-all duration-300"
            >
              <div>
                {/* Role Header */}
                <div className="flex items-start justify-between pb-4 border-b border-zinc-100 gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-5 h-5 rounded-lg bg-orange-50 text-[#FF5B26] border border-orange-200/60 flex items-center justify-center text-[10px] font-black">
                        {rIdx + 1}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                        Contested Position
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-zinc-900 tracking-tight">
                      {role}
                    </h3>
                  </div>

                  {/* Total Pool Setting Input */}
                  <div className="text-right">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-0.5">
                      Total Pool
                    </label>
                    <div className="flex items-center gap-1 justify-end">
                      <input
                        type="number"
                        min={1}
                        value={state.totalVotes}
                        onChange={(e) =>
                          handleTotalPoolChange(
                            role,
                            parseInt(e.target.value) || 1
                          )
                        }
                        className="w-20 px-2.5 py-1 text-xs font-mono font-black text-zinc-900 bg-zinc-50 border border-zinc-200 rounded-lg text-right focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
                      />
                      <span className="text-xs font-bold text-zinc-400">
                        votes
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Presets & Reset to 0 */}
                {roleCands.length >= 2 && (
                  <div className="py-3 flex items-center gap-1.5 border-b border-zinc-100 flex-wrap">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mr-1">
                      Quick:
                    </span>
                    <button
                      type="button"
                      onClick={() => resetRoleToZero(role)}
                      className="px-2 py-1 rounded-lg text-[10px] font-black bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors"
                      title="Set all candidates to 0 votes"
                    >
                      Reset to 0
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(role, 0.5)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                    >
                      50 / 50
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(role, 0.55)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                    >
                      55 / 45
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(role, 0.6)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                    >
                      60 / 40
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset(role, 0.7)}
                      className="px-2 py-1 rounded-lg text-[10px] font-bold bg-zinc-100 hover:bg-zinc-200 text-zinc-700 transition-colors"
                    >
                      70 / 30
                    </button>
                  </div>
                )}

                {/* Candidates List with Auto-Balancing Sliders & Inputs */}
                <div className="py-4 space-y-4">
                  {roleCands.length === 0 ? (
                    <p className="text-xs text-zinc-400 italic text-center py-4">
                      No candidates registered for {role}.
                    </p>
                  ) : (
                    roleCands.map((candidate, cIdx) => {
                      const votes = state.allocations[candidate.id] ?? 0;
                      const share =
                        state.totalVotes > 0
                          ? Math.round((votes / state.totalVotes) * 100)
                          : 0;

                      return (
                        <div
                          key={candidate.id}
                          className="p-3.5 rounded-2xl border border-zinc-200/80 bg-[#F8F9FA]/60 hover:bg-zinc-50 transition-colors space-y-2.5"
                        >
                          <div className="flex items-center justify-between gap-3">
                            {/* Candidate Info */}
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-zinc-200 text-zinc-700 flex items-center justify-center text-[10px] font-bold shrink-0">
                                #{cIdx + 1}
                              </span>
                              <div className="relative shrink-0">
                                <img
                                  src={candidate.avatarUrl}
                                  alt={candidate.name}
                                  className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shadow-xs"
                                />
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-white border border-zinc-200 flex items-center justify-center p-0.5 shadow-xs">
                                  <img
                                    src={candidate.symbolUrl}
                                    alt="Symbol"
                                    className="w-full h-full object-contain"
                                  />
                                </div>
                              </div>
                              <div className="truncate">
                                <p className="text-xs font-bold text-zinc-900 truncate">
                                  {candidate.name}
                                </p>
                                <p className="text-[10px] text-zinc-400">
                                  Class {candidate.className} &bull;{" "}
                                  {candidate.adNo}
                                </p>
                              </div>
                            </div>

                            {/* Votes Input Box */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <input
                                type="number"
                                min={0}
                                max={state.totalVotes}
                                value={votes}
                                onChange={(e) =>
                                  handleVoteChange(
                                    role,
                                    candidate.id,
                                    parseInt(e.target.value) || 0
                                  )
                                }
                                className="w-16 px-2 py-1 text-xs font-mono font-black text-zinc-900 bg-white border border-zinc-200 rounded-lg text-right focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
                              />
                              <span className="text-[11px] font-black text-[#FF5B26] min-w-[36px] text-right">
                                {share}%
                              </span>
                            </div>
                          </div>

                          {/* Interactive Range Slider */}
                          <div className="space-y-1">
                            <input
                              type="range"
                              min={0}
                              max={state.totalVotes}
                              value={votes}
                              onChange={(e) =>
                                handleVoteChange(
                                  role,
                                  candidate.id,
                                  parseInt(e.target.value) || 0
                                )
                              }
                              className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-[#FF5B26]"
                            />
                            <p className="text-[10px] text-zinc-400 font-medium flex items-center justify-between">
                              <span>Allocated independently</span>
                              <span>Max: {state.totalVotes} votes</span>
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Card Footer: Pool Status & Save CTA */}
              <div className="pt-4 border-t border-zinc-100 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-500 font-medium">Allocated Pool:</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-black text-zinc-900">
                      {totalAllocated} / {state.totalVotes} votes
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-zinc-100 text-zinc-600">
                      {Math.max(0, state.totalVotes - totalAllocated)} remaining
                    </span>
                  </div>
                </div>

                {state.savedSuccess && (
                  <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-700 text-center animate-in fade-in">
                    ✓ Updated in dummy_votes & Broadcasted Live!
                  </div>
                )}

                <button
                  type="button"
                  disabled={state.isSaving}
                  onClick={() => handleSaveRole(role)}
                  className="w-full py-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 disabled:opacity-50 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs active:scale-98"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {state.isSaving
                      ? "Saving..."
                      : `Update ${role} on Display`}
                  </span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
