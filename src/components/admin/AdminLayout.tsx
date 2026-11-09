"use client";

import React, { useState, useEffect } from "react";
import { Sidebar, AdminTab } from "./Sidebar";
import { Header } from "./Header";
import { DashboardView } from "./DashboardView";
import { CandidatesView } from "./CandidatesView";
import { VotersView } from "./VotersView";
import { ResultsView } from "./ResultsView";
import { SettingsView } from "./SettingsView";
import { AddCandidateModal } from "./AddCandidateModal";
import { AddVoterModal } from "./AddVoterModal";
import { ImportVotersModal } from "./ImportVotersModal";
import {
  INITIAL_CANDIDATES,
  INITIAL_VOTERS,
  INITIAL_ELECTION_CONFIG,
  Candidate,
  Voter,
  ElectionConfig,
} from "@/data/electionData";
import {
  supabase,
  fetchCandidates,
  saveCandidate,
  deleteCandidate,
  fetchVoters,
  saveVoter,
  bulkSaveVoters,
  updateVoterStatus,
  deleteVoter,
  resetAllElectionVotes,
} from "@/lib/supabaseClient";

export const AdminLayout: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<AdminTab>("dashboard");
  const [candidates, setCandidates] = useState<Candidate[]>(INITIAL_CANDIDATES);
  const [voters, setVoters] = useState<Voter[]>(INITIAL_VOTERS);
  const [config, setConfig] = useState<ElectionConfig>(INITIAL_ELECTION_CONFIG);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddCandidateOpen, setIsAddCandidateOpen] = useState(false);
  const [isAddVoterOpen, setIsAddVoterOpen] = useState(false);
  const [isImportVotersOpen, setIsImportVotersOpen] = useState(false);

  // Dynamic responsive sidebar state (starts open on desktop >= 1024px, auto-hidden on mobile < 1024px)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsSidebarOpen(window.innerWidth >= 1024);

      const handleResize = () => {
        if (window.innerWidth < 1024) {
          setIsSidebarOpen(false);
        } else {
          setIsSidebarOpen(true);
        }
      };

      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, []);

  // Sync with Supabase on mount, listen to Realtime changes, and background refetch
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
        }
      } catch (err) {
        console.error("Supabase load error:", err);
      } finally {
        if (isMounted && showLoader) {
          setIsLoading(false);
        }
      }
    }

    // Initial load
    loadData(true);

    // Supabase Realtime subscription across candidates, voters, and ballots
    const channel = supabase
      .channel(`admin-live-election-${Date.now()}`)
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
          // Immediately refresh candidates & voters when any ballot is cast
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

    // Background refetch interval (every 3 seconds) for guaranteed synchronization
    const pollInterval = setInterval(() => {
      loadData(false);
    }, 3000);

    return () => {
      isMounted = false;
      clearInterval(pollInterval);
      supabase.removeChannel(channel);
    };
  }, []);

  // Candidate management
  const handleAddCandidate = async (newCandidate: Candidate) => {
    setCandidates((prev) => [newCandidate, ...prev]);
    await saveCandidate(newCandidate);
  };

  const handleDeleteCandidate = async (id: string) => {
    setCandidates((prev) => prev.filter((c) => c.id !== id));
    await deleteCandidate(id);
  };

  // Voter management
  const handleAddVoter = async (newVoter: Voter) => {
    setVoters((prev) => [newVoter, ...prev]);
    await saveVoter(newVoter);
  };

  const handleImportVoters = async (newVoters: Voter[]) => {
    setVoters((prev) => [...newVoters, ...prev]);
    await bulkSaveVoters(newVoters);
  };

  const handleDeleteVoter = async (id: string) => {
    setVoters((prev) => prev.filter((v) => v.id !== id));
    await deleteVoter(id);
  };

  const handleToggleVoted = async (id: string) => {
    const voter = voters.find((v) => v.id === id);
    if (!voter) return;

    const nextVoted = !voter.hasVoted;
    const votedAtTime = nextVoted
      ? new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
      : undefined;

    setVoters((prev) =>
      prev.map((v) =>
        v.id === id
          ? { ...v, hasVoted: nextVoted, votedAt: votedAtTime }
          : v
      )
    );

    await updateVoterStatus(id, nextVoted, votedAtTime);
  };

  // Reset test votes
  const handleResetVotes = async () => {
    setVoters((prev) =>
      prev.map((v) => ({ ...v, hasVoted: false, votedAt: undefined }))
    );
    setCandidates((prev) =>
      prev.map((c) => ({ ...c, votes: 0 }))
    );
    await resetAllElectionVotes();
  };

  const handleRestoreDefaults = async () => {
    const [cands, vtrs] = await Promise.all([fetchCandidates(), fetchVoters()]);
    setCandidates(cands || []);
    setVoters(vtrs || []);
    setConfig(INITIAL_ELECTION_CONFIG);
  };

  const pendingVotesCount = voters.filter((v) => !v.hasVoted).length;
  const postCount = new Set(candidates.map((c) => c.post).filter(Boolean)).size;

  const handleHeaderAction = () => {
    if (currentTab === "voters") {
      setIsAddVoterOpen(true);
    } else {
      setIsAddCandidateOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex text-zinc-900 font-sans antialiased overflow-x-hidden">
      {/* Dynamic Collapsible Admin Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={setCurrentTab}
        candidateCount={candidates.length}
        totalVoters={voters.length}
        pendingVotesCount={pendingVotesCount}
        isLive={config.status === "live"}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onToggle={() => setIsSidebarOpen((prev) => !prev)}
        postCount={postCount}
      />

      {/* Main Administrative Work Area */}
      <div className="flex-1 flex flex-col min-w-0 transition-all duration-300">
        <Header
          currentTab={currentTab}
          onOpenAddModal={handleHeaderAction}
          status={config.status}
          onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
          isSidebarOpen={isSidebarOpen}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {currentTab === "dashboard" && (
            <DashboardView
              candidates={candidates}
              voters={voters}
              config={config}
              onNavigateToCandidates={() => setCurrentTab("candidates")}
              onNavigateToVoters={() => setCurrentTab("voters")}
              onNavigateToResults={() => setCurrentTab("results")}
            />
          )}

          {currentTab === "candidates" && (
            <CandidatesView
              candidates={candidates}
              onOpenAddModal={() => setIsAddCandidateOpen(true)}
              onDeleteCandidate={handleDeleteCandidate}
            />
          )}

          {currentTab === "voters" && (
            <VotersView
              voters={voters}
              onOpenAddModal={() => setIsAddVoterOpen(true)}
              onOpenImportModal={() => setIsImportVotersOpen(true)}
              onToggleVoted={handleToggleVoted}
              onDeleteVoter={handleDeleteVoter}
            />
          )}

          {currentTab === "results" && (
            <ResultsView
              candidates={candidates}
              voters={voters}
              isLive={config.status === "live"}
            />
          )}

          {currentTab === "settings" && (
            <SettingsView
              config={config}
              onUpdateConfig={setConfig}
              onResetVotes={handleResetVotes}
              onRestoreDefaults={handleRestoreDefaults}
            />
          )}
        </main>
      </div>

      {/* Modals */}
      <AddCandidateModal
        isOpen={isAddCandidateOpen}
        onClose={() => setIsAddCandidateOpen(false)}
        onAddCandidate={handleAddCandidate}
        existingPosts={Array.from(new Set(candidates.map((c) => c.post).filter(Boolean)))}
      />

      <AddVoterModal
        isOpen={isAddVoterOpen}
        onClose={() => setIsAddVoterOpen(false)}
        onAddVoter={handleAddVoter}
      />

      <ImportVotersModal
        isOpen={isImportVotersOpen}
        onClose={() => setIsImportVotersOpen(false)}
        onImportVoters={handleImportVoters}
        existingVoters={voters}
      />
    </div>
  );
};
