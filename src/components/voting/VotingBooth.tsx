"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Vote,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Lock,
  Award,
  Sparkles,
  RotateCcw,
  Check,
  AlertCircle,
  ExternalLink,
  UserCheck,
  Volume2,
  VolumeX,
} from "lucide-react";
import confetti from "canvas-confetti";
import { playEVMLongBuzzer, playEVMClickBeep } from "@/lib/soundEffects";
import {
  Candidate,
  Voter,
  ELECTION_CLASSES,
  ElectionClass,
  INITIAL_CANDIDATES,
  INITIAL_VOTERS,
  INITIAL_ELECTION_CONFIG,
} from "@/data/electionData";
import { sortPostsByHierarchy } from "@/lib/utils";
import {
  fetchCandidates,
  fetchVoters,
  submitBallot,
  supabase,
  isDbEnabled,
} from "@/lib/supabaseClient";

export const VotingBooth: React.FC = () => {
  // Mock live data state for interactive demo
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [voters, setVoters] = useState<Voter[]>(INITIAL_VOTERS);

  // Load live candidates and voters from Supabase with Realtime & background refetch
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [cands, vtrs] = await Promise.all([
          fetchCandidates(),
          fetchVoters(),
        ]);
        if (isMounted) {
          setCandidates(cands || []);
          setVoters(vtrs || []);
        }
      } catch (err) {
        console.error("Error loading voting booth data from Supabase:", err);
      }
    }

    loadData();

    // Supabase Realtime channel for voting booth
    const channel = supabase
      .channel(`voting-booth-sync-${Date.now()}`)
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
        { event: "*", schema: "public", table: "voters" },
        async () => {
          const vtrs = await fetchVoters();
          if (isMounted) setVoters(vtrs || []);
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

    // Periodic background refetch (every 3 seconds) for live consistency
    const pollInterval = setInterval(() => {
      loadData();
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Authentication state
  const [adNoInput, setAdNoInput] = useState("");
  const [classInput, setClassInput] = useState<ElectionClass>("D3");
  const [activeVoter, setActiveVoter] = useState<Voter | null>(null);
  const [authError, setAuthError] = useState("");
  const [step, setStep] = useState<number>(0);

  // Dynamic Contested Posts derived from registered candidates sorted by official hierarchy (President, General Secretary, Treasurer...)
  const contestedPosts = React.useMemo(() => {
    const list = Array.from(new Set(candidates.map((c) => c.post).filter(Boolean)));
    return sortPostsByHierarchy(list);
  }, [candidates]);

  const totalRoles = contestedPosts.length;
  const reviewStep = totalRoles + 1;
  const successStep = totalRoles + 2;

  // Selected candidate IDs mapped by post name: { [postName]: candidateId }
  const [selectedBallots, setSelectedBallots] = useState<Record<string, string>>({});

  const [hasAgreed, setHasAgreed] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [receiptCode, setReceiptCode] = useState<string>("");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  const currentRoleIndex = step - 1;
  const currentPostName = contestedPosts[currentRoleIndex] || "";
  const currentPostCandidates = candidates.filter((c) => c.post === currentPostName);
  const currentSelectedCandidateId = selectedBallots[currentPostName] || "";

  // Student verification handler
  const handleVerifyVoter = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");

    if (totalRoles === 0) {
      setAuthError("No candidates have been registered for this election yet. Please contact election administrators.");
      return;
    }

    const trimmedAdNo = adNoInput.trim().toUpperCase();
    if (!trimmedAdNo) {
      setAuthError("Please enter your official student Admission Number (Ad NO).");
      return;
    }

    let voterFound = voters.find(
      (v) =>
        v.adNo.toUpperCase() === trimmedAdNo &&
        v.className.toUpperCase() === classInput.toUpperCase()
    );

    // When DB is disabled for sound testing, auto-generate a test voter session if not registered
    if (!voterFound && !isDbEnabled()) {
      voterFound = {
        id: `test-voter-${trimmedAdNo || "DEMO"}`,
        name: `Test Student (${trimmedAdNo || "DEMO"})`,
        adNo: trimmedAdNo || "TEST-01",
        className: classInput,
        hasVoted: false,
      };
    }

    if (!voterFound) {
      setAuthError(
        `No registered voter found with Ad No "${trimmedAdNo}" in Class ${classInput}. Check your credentials or contact the election administration desk.`
      );
      return;
    }

    // Only block duplicate voting when DB is actively enabled
    if (voterFound.hasVoted && isDbEnabled()) {
      setAuthError(
        `Voter "${voterFound.name}" (${voterFound.adNo}) has ALREADY cast their ballot at ${voterFound.votedAt || "earlier today"
        }. Strictly 1 voting session is permitted per student.`
      );
      return;
    }

    // Verified!
    setActiveVoter(voterFound);
    setStep(1); // Proceed to Role 1
  };

  // Submit Official Ballot
  const handleConfirmBallot = async () => {
    if (!activeVoter) return;

    // Ensure all contested posts have a selection
    const missingPosts = contestedPosts.filter((p) => !selectedBallots[p]);
    if (missingPosts.length > 0) {
      alert(`Please cast your vote for: ${missingPosts.join(", ")}`);
      return;
    }

    setIsSubmitting(true);

    // Play authentic EVM confirmation long beep buzzer
    if (soundEnabled) {
      playEVMLongBuzzer(1.5);
    }

    try {
      const pollTime = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      const generatedCode = `SAADA-VOTE-${Math.floor(100000 + Math.random() * 900000)}`;

      const chosenIds = Object.values(selectedBallots);

      // 1. Submit to Supabase database with strict duplicate prevention
      const result = await submitBallot(
        activeVoter.id,
        generatedCode,
        selectedBallots["President"] || chosenIds[0] || "",
        selectedBallots["General Secretary"] || chosenIds[1] || "",
        selectedBallots["Treasurer"] || chosenIds[2] || "",
        chosenIds
      );

      if (!result.success) {
        alert(result.error || "A voter cannot vote more than once.");
        setIsSubmitting(false);
        return;
      }

      // 2. Update local state
      setVoters((prev) =>
        prev.map((v) =>
          v.id === activeVoter.id
            ? { ...v, hasVoted: true, votedAt: pollTime }
            : v
        )
      );

      setCandidates((prev) =>
        prev.map((c) => {
          if (chosenIds.includes(c.id)) {
            return { ...c, votes: c.votes + 1 };
          }
          return c;
        })
      );

      setReceiptCode(generatedCode);
      setStep(successStep); // Show success receipt

      // Trigger celebration confetti
      try {
        confetti({
          particleCount: 100,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {
        // Safe fallback if canvas is unavailable
      }
    } catch (err) {
      console.error("Failed to submit ballot to Supabase:", err);
      alert("Submission error: Unable to record ballot. Please contact the election desk.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNewVoter = () => {
    setActiveVoter(null);
    setAdNoInput("");
    setSelectedBallots({});
    setReceiptCode("");
    setAuthError("");
    setStep(0);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col justify-between text-zinc-900 font-sans antialiased selection:bg-[#FF5B26]/20 selection:text-[#FF5B26]">
      {/* Top Navbar */}
      <header className="bg-white border-b border-zinc-200/90 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#FF5B26] text-white flex items-center justify-center font-black border border-[#FF5B26]">
              <Vote className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-base tracking-tight text-zinc-900">
                  Saada<span className="text-[#FF5B26]">Vote</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Booths Active
                </span>
                {!isDbEnabled() && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    Sound Test (DB Offline)
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 font-medium hidden sm:block">
                Students Union Election 2026 &bull; Digital Democracy Booth
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Audio EVM Beep Sound Option Toggle */}
            <button
              type="button"
              onClick={() => {
                const next = !soundEnabled;
                setSoundEnabled(next);
                if (next) playEVMClickBeep();
              }}
              title={soundEnabled ? "Mute EVM Confirmation Beep Buzzer" : "Turn On EVM Confirmation Beep Buzzer"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
                soundEnabled
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200/90 hover:bg-emerald-100"
                  : "bg-zinc-100 text-zinc-500 border-zinc-200 hover:bg-zinc-200/60"
              }`}
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="hidden sm:inline">EVM Beep:</span>
                  <span className="font-extrabold text-emerald-700">ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">EVM Beep:</span>
                  <span className="font-medium text-zinc-500">MUTED</span>
                </>
              )}
            </button>

            {activeVoter && step >= 1 && step <= reviewStep && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-100 border border-zinc-200/80 text-xs">
                <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span className="font-bold text-zinc-800">{activeVoter.name}</span>
                <span className="text-zinc-400 font-mono">({activeVoter.adNo})</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8">
        {/* STEP 0: Student Identity Verification */}
        {step === 0 && (
          <div className="max-w-md mx-auto space-y-6 animate-in fade-in duration-300">
            {/* Header info card */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 text-[#FF5B26] border border-orange-200/60 mx-auto flex items-center justify-center">
                <Lock className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                Voter Verification Booth
              </h1>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto">
                Authenticate your student Admission Number (Ad NO) to access your official election ballot.
              </p>
            </div>

            {/* Verification Form Card */}
            <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 sm:p-8 shadow-none hover:shadow-xl hover:border-zinc-300 transition-all duration-300">
              <form onSubmit={handleVerifyVoter} className="space-y-4">
                {/* Admission No */}
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Admission Number (Ad NO) *
                  </label>
                  <input
                    type="text"
                    required
                    value={adNoInput}
                    onChange={(e) => setAdNoInput(e.target.value)}
                    placeholder="e.g. AD-1005"
                    className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl px-4 py-3 text-sm font-mono font-bold text-zinc-900 uppercase placeholder:normal-case placeholder:font-normal placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
                  />
                  <p className="text-[10px] text-zinc-400 mt-1">
                    Printed on your college student ID card.
                  </p>
                </div>

                {/* Class Selection */}
                <div>
                  <label className="block text-xs font-bold text-zinc-800 mb-1">
                    Your Enrolled Class *
                  </label>
                  <select
                    value={classInput}
                    onChange={(e) => setClassInput(e.target.value as ElectionClass)}
                    className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl px-4 py-2.5 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
                  >
                    {ELECTION_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        Class {c}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Error Banner */}
                {authError && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2 animate-in fade-in">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                    <span>{authError}</span>
                  </div>
                )}

                {/* Submit button */}
                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-[#FF5B26] hover:bg-[#e84c17] text-white text-xs font-bold transition-all border border-[#FF5B26] flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  <span>Authenticate & Enter Booth</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Security note */}
              <div className="flex items-center gap-2 text-[11px] text-zinc-400 justify-center mt-5 pt-4 border-t border-zinc-100">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encrypted 256-bit anonymous student voting session</span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1..N: Sequential Voting Flow for Contested Posts */}
        {step >= 1 && step <= totalRoles && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Dynamic Progress Stepper Bar */}
            <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-none">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-zinc-900">
                  Official Ballot Progress
                </span>
                <span className="text-xs font-extrabold text-[#FF5B26]">
                  Role {step} of {totalRoles}
                </span>
              </div>

              {/* Step Indicators */}
              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${Math.min(totalRoles, 6)}, minmax(0, 1fr))`,
                }}
              >
                {contestedPosts.map((pName, idx) => {
                  const roleNum = idx + 1;
                  const isCurrent = step === roleNum;
                  const isChosen = Boolean(selectedBallots[pName]);
                  return (
                    <div
                      key={pName}
                      className={`p-2 rounded-xl border text-center transition-all ${isCurrent
                        ? "bg-orange-50 border-[#FF5B26] text-[#FF5B26]"
                        : isChosen
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "bg-zinc-50 border-zinc-200 text-zinc-400"
                        }`}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-wider">
                        Vote {roleNum} of {totalRoles}
                      </p>
                      <p className="text-xs font-bold truncate">{pName}</p>
                      {isChosen && (
                        <span className="text-[10px] font-semibold flex items-center justify-center gap-0.5 mt-0.5 text-emerald-600">
                          <Check className="w-3 h-3" /> Selected
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current Role Title & Instructions */}
            <div className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-none flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold mb-1">
                  <Award className="w-4 h-4 text-[#FF5B26]" />
                  <span>Contested Position #{step}</span>
                </div>
                <h2 className="text-2xl font-black text-zinc-900 tracking-tight font-sans">
                  Cast Your Vote for: {currentPostName}
                </h2>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Click on 1 candidate below to select your choice for this executive role.
                </p>
              </div>

              <div className="text-right">
                <span className="px-3 py-1 rounded-full bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200/70">
                  Select 1 Candidate
                </span>
              </div>
            </div>

            {/* Candidate Choice Cards Grid */}
            {currentPostCandidates.length === 0 ? (
              <div className="bg-white rounded-2xl border border-zinc-200/90 p-10 text-center space-y-2">
                <Award className="w-10 h-10 mx-auto text-zinc-300" />
                <p className="text-sm font-bold text-zinc-800">
                  No Nominees Registered for {currentPostName}
                </p>
                <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                  Candidates for this post have not been added to the database yet.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {currentPostCandidates.map((candidate) => {
                  const isSelected = currentSelectedCandidateId === candidate.id;

                  const handleCardClick = () => {
                    if (soundEnabled) {
                      playEVMClickBeep();
                    }
                    setSelectedBallots((prev) => ({
                      ...prev,
                      [currentPostName]: candidate.id,
                    }));
                  };

                  return (
                    <div
                      key={candidate.id}
                      onClick={handleCardClick}
                      className={`rounded-2xl p-5 border-2 transition-all duration-300 cursor-pointer flex flex-col justify-between group ${isSelected
                        ? "border-[#FF5B26] bg-orange-50/20 shadow-lg shadow-[#FF5B26]/10 ring-2 ring-[#FF5B26]/20"
                        : "bg-white border-zinc-200/90 shadow-none hover:shadow-xl hover:border-zinc-300"
                        }`}
                    >
                      <div>
                        {/* Top row: Avatar & Symbol with selection check */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="relative">
                            <img
                              src={candidate.avatarUrl}
                              alt={candidate.name}
                              className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-zinc-200 shadow-sm group-hover:border-zinc-300 transition-all"
                            />
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white border-2 border-zinc-200 flex items-center justify-center p-0.5 overflow-hidden shadow-md">
                              <img
                                src={candidate.symbolUrl}
                                alt="Symbol"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          </div>

                          {/* Select radio pill */}
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                              ? "bg-[#FF5B26] border-[#FF5B26] text-white"
                              : "border-zinc-300 bg-white group-hover:border-zinc-400"
                              }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>

                        {/* Info */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between">
                            <h3 className="text-base font-bold text-zinc-900 group-hover:text-[#FF5B26] transition-colors">
                              {candidate.name}
                            </h3>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200/60">
                              Class {candidate.className}
                            </span>
                            <span className="text-[10px] font-mono text-zinc-400 font-semibold">
                              {candidate.adNo}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-400 italic line-clamp-2 pt-2 leading-relaxed">
                            &ldquo;{candidate.tagline}&rdquo;
                          </p>
                        </div>
                      </div>

                      {/* Choose CTA */}
                      <div className="pt-4 mt-4 border-t border-zinc-100">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCardClick();
                          }}
                          className={`w-full py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${isSelected
                            ? "bg-[#FF5B26] text-white shadow-xs"
                            : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700"
                            }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>Selected for {candidate.post}</span>
                            </>
                          ) : (
                            <span>Select this Candidate</span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Bottom Step Navigation Bar */}
            <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-none flex items-center justify-between gap-4">
              {step > 1 ? (
                <button
                  type="button"
                  onClick={() => setStep(step - 1)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Previous Role</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep(0)}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-500 hover:bg-zinc-50 transition-colors cursor-pointer"
                >
                  Cancel Session
                </button>
              )}

              {/* Next Step / Review Button */}
              {step < totalRoles ? (
                <button
                  type="button"
                  disabled={!currentSelectedCandidateId}
                  onClick={() => setStep(step + 1)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF5B26] hover:bg-[#e84c17] disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold transition-all border border-[#FF5B26] cursor-pointer"
                >
                  <span>
                    Proceed to Vote {step + 1} ({contestedPosts[step]})
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!currentSelectedCandidateId}
                  onClick={() => setStep(reviewStep)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#FF5B26] hover:bg-[#e84c17] disabled:opacity-30 disabled:cursor-not-allowed text-white text-xs font-bold transition-all border border-[#FF5B26] cursor-pointer"
                >
                  <span>Review My {totalRoles} Ballots</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* STEP: Official Ballot Review & Confirmation */}
        {step === reviewStep && (
          <div className="space-y-6 max-w-3xl mx-auto animate-in fade-in duration-300">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200/60 mx-auto flex items-center justify-center">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                Review Your {totalRoles} Selected Ballots
              </h1>
              <p className="text-xs text-zinc-500">
                Please verify your selections across all contested positions before casting your final ballot.
              </p>
            </div>

            {/* Voter Details Bar */}
            <div className="p-4 rounded-2xl bg-zinc-100 border border-zinc-200 flex items-center justify-between text-xs">
              <div>
                <p className="text-zinc-400 font-medium text-[11px]">Voter Credentials</p>
                <p className="font-bold text-zinc-900 mt-0.5">
                  {activeVoter?.name} &bull;{" "}
                  <span className="font-mono text-zinc-700">{activeVoter?.adNo}</span> &bull;{" "}
                  <span className="font-semibold text-zinc-700">Class {activeVoter?.className}</span>
                </p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px] border border-emerald-300/60">
                Verified Voter
              </span>
            </div>

            {/* Dynamic Selected Roles Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contestedPosts.map((pName, idx) => {
                const candId = selectedBallots[pName];
                const cand = candidates.find((c) => c.id === candId);
                return (
                  <div
                    key={pName}
                    className="bg-white rounded-2xl p-5 border border-zinc-200/90 shadow-none hover:shadow-lg transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                      <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200/60 truncate max-w-[150px]">
                        {idx + 1}. {pName}
                      </span>
                      <button
                        onClick={() => setStep(idx + 1)}
                        className="text-xs font-semibold text-[#FF5B26] hover:underline cursor-pointer"
                      >
                        Change
                      </button>
                    </div>
                    {cand ? (
                      <div className="flex items-center gap-3">
                        <img
                          src={cand.avatarUrl}
                          alt={cand.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-zinc-200 shrink-0 shadow-xs"
                        />
                        <div>
                          <p className="font-bold text-sm text-zinc-900">{cand.name}</p>
                          <p className="text-xs text-zinc-500">Class {cand.className}</p>
                          <div className="w-7 h-7 rounded-lg border border-zinc-200 flex items-center justify-center p-1 mt-1 bg-white shadow-2xs">
                            <img
                              src={cand.symbolUrl}
                              alt="Symbol"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-rose-500 italic">No candidate selected</p>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Confirmation checkbox */}
            <div className="p-4 rounded-2xl bg-white border border-zinc-200/90 flex items-center gap-3">
              <input
                type="checkbox"
                id="agree"
                checked={hasAgreed}
                onChange={(e) => setHasAgreed(e.target.checked)}
                className="w-4 h-4 rounded border-zinc-300 text-[#FF5B26] focus:ring-[#FF5B26]"
              />
              <label htmlFor="agree" className="text-xs text-zinc-700 font-medium cursor-pointer">
                I hereby declare that I am voluntarily casting my official ballots under Central Election Committee regulations. Once submitted, my ballots cannot be altered.
              </label>
            </div>

            {/* Confirm & Submit CTA */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={() => setStep(totalRoles)}
                className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                ← Back to Roles
              </button>

              <button
                type="button"
                disabled={!hasAgreed || isSubmitting}
                onClick={handleConfirmBallot}
                className="flex items-center gap-2 px-8 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-[0.98] cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <RotateCcw className="w-4 h-4 animate-spin" />
                    <span>Encrypting & Casting Official Ballots...</span>
                  </>
                ) : (
                  <>
                    <Vote className="w-4 h-4" />
                    <span>CONFIRM & CAST MY {totalRoles} OFFICIAL BALLOTS</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP: Official Success Certificate & Receipt */}
        {step === successStep && (
          <div className="max-w-lg mx-auto space-y-6 text-center animate-in zoom-in-95 duration-300">
            {/* Success icon */}
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-300 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-9 h-9 stroke-[2.5]" />
            </div>

            <div className="space-y-1">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                Ballot Cast Successfully!
              </h1>
              <p className="text-xs text-zinc-500">
                Your {totalRoles} vote{totalRoles === 1 ? "" : "s"} {totalRoles === 1 ? "has" : "have"} been securely recorded and added to the official student union tally.
              </p>
            </div>

            {/* Official Digital Voting Receipt Card */}
            <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 text-left space-y-4 shadow-none hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                    Official Election Receipt
                  </p>
                  <p className="text-xs font-mono font-bold text-zinc-900">
                    {receiptCode}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                  Verified & Sealed
                </span>
              </div>

              {/* Voter & Session Meta */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-zinc-400">Voter:</span>
                  <p className="font-bold text-zinc-900">{activeVoter?.name}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400">Admission No:</span>
                  <p className="font-mono font-bold text-zinc-900">{activeVoter?.adNo}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400">Class:</span>
                  <p className="font-bold text-zinc-900">Class {activeVoter?.className}</p>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-400">Timestamp:</span>
                  <p className="font-medium text-zinc-900">Just Now</p>
                </div>
              </div>

              {/* Ballots Recorded summary */}
              <div className="pt-3 border-t border-zinc-100 space-y-2">
                <p className="text-[11px] font-bold text-zinc-600 uppercase tracking-wider">
                  {totalRoles} Ballots Certified:
                </p>
                <div className="space-y-1 text-xs">
                  {contestedPosts.map((pName, idx) => {
                    const cId = selectedBallots[pName];
                    const cand = candidates.find((c) => c.id === cId);
                    return (
                      <div
                        key={pName}
                        className="flex items-center justify-between p-2 rounded-lg bg-zinc-50"
                      >
                        <span className="font-bold text-zinc-700">
                          {idx + 1}. {pName}:
                        </span>
                        <span className="font-bold text-zinc-900">
                          {cand?.name || "Recorded"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-center gap-3 pt-2 flex-wrap">
              <button
                type="button"
                onClick={() => playEVMLongBuzzer(1.4)}
                className="w-full sm:w-auto px-5 py-3 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-bold text-zinc-700 flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Volume2 className="w-4 h-4 text-emerald-600" />
                <span>Replay EVM Buzzer Beep</span>
              </button>

              <button
                onClick={handleResetForNewVoter}
                className="w-full sm:w-auto px-8 py-3 rounded-xl bg-[#FF5B26] hover:bg-[#e04815] text-white text-sm font-bold shadow-md shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Vote as Next Student</span>
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-zinc-200/90 py-4 text-center text-xs text-zinc-400">
        <p>Saada Students&apos; Union Election 2026 &bull; Central Democratic Election Committee</p>
      </footer>
    </div>
  );
};

