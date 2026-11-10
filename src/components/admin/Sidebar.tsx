"use client";

import React from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Award,
  Users2,
  BarChart3,
  Settings,
  ShieldCheck,
  ChevronDown,
  Search,
  Vote,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  X,
  LogOut,
  PieChart,
  Sliders,
  Tv,
  PartyPopper,
} from "lucide-react";

export type AdminTab = "dashboard" | "candidates" | "voters" | "results" | "settings" | "simulation" | "reveal";

interface SidebarProps {
  currentTab: AdminTab;
  onSelectTab: (tab: AdminTab) => void;
  candidateCount: number;
  totalVoters: number;
  pendingVotesCount: number;
  isLive: boolean;
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  postCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  candidateCount,
  totalVoters,
  pendingVotesCount,
  isLive,
  isOpen,
  onClose,
  onToggle,
  postCount,
}) => {
  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      window.location.href = "/admin/login";
    } catch {
      window.location.href = "/admin/login";
    }
  };

  const handleTabClick = (tab: AdminTab) => {
    onSelectTab(tab);
    // Auto-hide in mobile screen when tab selected
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      onClose();
    }
  };

  return (
    <>
      {/* Mobile backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Dynamic Collapsible Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-zinc-200/90 h-screen select-none shadow-2xl lg:shadow-none transition-all duration-300 ease-in-out shrink-0 ${
          isOpen
            ? "w-72 translate-x-0 lg:static lg:w-72 lg:translate-x-0"
            : "w-72 -translate-x-full lg:w-0 lg:border-r-0 lg:overflow-hidden lg:-translate-x-full pointer-events-none lg:pointer-events-auto"
        }`}
      >
        <div className="w-72 flex flex-col justify-between h-full overflow-hidden">
          {/* Top Header & Org Selector */}
          <div className="p-5 pb-3">
            {/* Brand logo & collapse toggle */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#FF5B26] text-white flex items-center justify-center font-black border border-[#FF5B26]">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[17px] tracking-tight text-zinc-900 font-sans">
                      Saada<span className="text-[#FF5B26]">Admin</span>
                    </span>
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-[#FF5B26]/10 text-[#FF5B26] uppercase border border-[#FF5B26]/20">
                      v2.6
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 font-medium">Central Election Bureau</p>
                </div>
              </div>

              {/* Close on mobile / Collapse on desktop */}
              <button
                type="button"
                onClick={onClose}
                title="Hide / Collapse Sidebar"
                className="w-8 h-8 rounded-lg border border-zinc-200/80 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4 lg:hidden" />
                <ChevronLeft className="w-4 h-4 hidden lg:block" />
              </button>
            </div>

        {/* Election Session Pill Selector */}
        <div className="flex items-center justify-between p-2.5 rounded-xl border border-zinc-200/90 bg-zinc-50/70 hover:bg-zinc-100/70 hover:border-zinc-300 transition-all cursor-pointer group">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-lg bg-white border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0">
              <Vote className="w-4 h-4 text-[#FF5B26]" />
            </div>
            <div className="truncate text-left">
              <p className="text-xs font-semibold text-zinc-900 truncate">Union Election 2026</p>
              <div className="flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isLive ? "bg-emerald-500 animate-pulse" : "bg-zinc-400"
                  }`}
                />
                <p className="text-[10px] text-zinc-500 font-medium">
                  {isLive ? "Live Polling Mode" : "Session Paused"}
                </p>
              </div>
            </div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 transition-colors shrink-0" />
        </div>

        {/* Quick Search Input */}
        <div className="mt-4 relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search candidates, voters..."
            className="w-full bg-[#F8F9FA] border border-zinc-200/90 rounded-xl pl-8 pr-10 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FF5B26] transition-all"
          />
          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-zinc-400 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
            ⌘K
          </span>
        </div>
      </div>

      {/* Main Navigation Links */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-6">
        {/* Main Section */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-zinc-400 tracking-wider uppercase mb-2">
            Main Menu
          </p>
          <div className="space-y-1">
            {/* Dashboard / Overview */}
            <button
              onClick={() => handleTabClick("dashboard")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                currentTab === "dashboard"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard
                  className={`w-4 h-4 ${
                    currentTab === "dashboard" ? "text-white" : "text-zinc-500"
                  }`}
                />
                <span className="font-semibold">Dashboard</span>
              </div>
            </button>

            {/* Candidates */}
            <button
              onClick={() => handleTabClick("candidates")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                currentTab === "candidates"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <Award
                  className={`w-4 h-4 ${
                    currentTab === "candidates" ? "text-white" : "text-zinc-500"
                  }`}
                />
                <span className="font-semibold">Candidates</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentTab === "candidates"
                    ? "bg-[#FF5B26] text-white"
                    : "bg-[#FF5B26]/10 text-[#FF5B26]"
                }`}
              >
                {candidateCount}
              </span>
            </button>

            {/* Voters */}
            <button
              onClick={() => handleTabClick("voters")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                currentTab === "voters"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <Users2
                  className={`w-4 h-4 ${
                    currentTab === "voters" ? "text-white" : "text-zinc-500"
                  }`}
                />
                <span className="font-semibold">Voters Register</span>
              </div>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  currentTab === "voters"
                    ? "bg-white/20 text-white"
                    : "bg-zinc-100 text-zinc-600 border border-zinc-200/60"
                }`}
              >
                {totalVoters}
              </span>
            </button>

            {/* Live Results */}
            <button
              onClick={() => handleTabClick("results")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                currentTab === "results"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart3
                  className={`w-4 h-4 ${
                    currentTab === "results" ? "text-white" : "text-zinc-500"
                  }`}
                />
                <span className="font-semibold">Live Results & Tally</span>
              </div>
              {isLive && (
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              )}
            </button>

            {/* Display Simulation / Dummy Votes Controller */}
            <button
              onClick={() => handleTabClick("simulation")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                currentTab === "simulation"
                  ? "bg-purple-900 text-white"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-purple-50/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <Sliders
                  className={`w-4 h-4 ${
                    currentTab === "simulation" ? "text-purple-300" : "text-purple-600"
                  }`}
                />
                <span className="font-semibold">Display Simulation</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentTab === "simulation"
                    ? "bg-purple-700 text-white"
                    : "bg-purple-100 text-purple-700 border border-purple-200"
                }`}
              >
                Dummy Tally
              </span>
            </button>

            {/* Result Reveal Studio / Winner Announcement */}
            <button
              onClick={() => handleTabClick("reveal")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                currentTab === "reveal"
                  ? "bg-amber-500 text-white font-bold"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-amber-50/80"
              }`}
            >
              <div className="flex items-center gap-3">
                <PartyPopper
                  className={`w-4 h-4 ${
                    currentTab === "reveal" ? "text-white" : "text-amber-500"
                  }`}
                />
                <span className="font-semibold">Result Reveal Studio</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentTab === "reveal"
                    ? "bg-black/20 text-white"
                    : "bg-amber-100 text-amber-800 border border-amber-300"
                }`}
              >
                Publish Mode
              </span>
            </button>

            {/* Link to Student Voting Booth */}
            <Link
              href="/vote"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  onClose();
                }
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-orange-50/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Vote className="w-4 h-4 text-[#FF5B26] group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-zinc-800">Student Voting Booth</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-50 text-[#FF5B26] border border-orange-200/60">
                {postCount ? `${postCount} Post${postCount === 1 ? "" : "s"}` : "Live Booth"}
              </span>
            </Link>

            {/* Link to 3-Role Pie Charts */}
            <Link
              href="/charts"
              target="_blank"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  onClose();
                }
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <PieChart className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-zinc-800">3-Role Pie Charts</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Official
              </span>
            </Link>

            {/* Link to Public Display (Dummy Showcase) */}
            <Link
              href="/display"
              target="_blank"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  onClose();
                }
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-purple-50/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <Tv className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-zinc-800">Public Live Display</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200">
                Projector / Screen
              </span>
            </Link>

            {/* Link to Public Winner Reveal Screen */}
            <Link
              href="/reveal"
              target="_blank"
              onClick={() => {
                if (typeof window !== "undefined" && window.innerWidth < 1024) {
                  onClose();
                }
              }}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-amber-50/60 transition-all cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <PartyPopper className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="font-semibold text-zinc-800">Public Winner Reveal</span>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                Stage / TV
              </span>
            </Link>
          </div>
        </div>

        {/* Management & Audit */}
        <div>
          <p className="px-3 text-[11px] font-semibold text-zinc-400 tracking-wider uppercase mb-2">
            System & Security
          </p>
          <div className="space-y-1">
            <button
              onClick={() => handleTabClick("settings")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                currentTab === "settings"
                  ? "bg-zinc-900 text-white"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/70"
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings
                  className={`w-4 h-4 ${
                    currentTab === "settings" ? "text-white" : "text-zinc-500"
                  }`}
                />
                <span className="font-semibold">Election Settings</span>
              </div>
            </button>

            <div className="px-3.5 py-2 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4 text-zinc-400" />
                <span>Audit Enforced</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                SSL 256
              </span>
            </div>
          </div>
        </div>

        {/* Live Status Card widget */}
        <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/90 text-left hover:border-zinc-300 transition-colors">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-5 h-5 rounded-md bg-[#FF5B26] text-white flex items-center justify-center text-[10px] font-bold">
              ✓
            </div>
            <span className="text-xs font-bold text-zinc-900">Election Desk Status</span>
          </div>
          <p className="text-[11px] text-zinc-500 leading-relaxed mb-3">
            {pendingVotesCount} voters have yet to cast their ballots today.
          </p>
          <div className="w-full bg-zinc-200/70 rounded-full h-1.5 mb-2 overflow-hidden">
            <div
              className="bg-[#FF5B26] h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.round(((totalVoters - pendingVotesCount) / (totalVoters || 1)) * 100)}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-semibold text-zinc-500">
            <span>Turnout</span>
            <span className="text-zinc-900 font-bold">
              {Math.round(((totalVoters - pendingVotesCount) / (totalVoters || 1)) * 100)}%
            </span>
          </div>
        </div>
      </div>

      {/* Admin Profile & Logout (Merivo Style) */}
      <div className="p-4 border-t border-zinc-200/90 space-y-2">
        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-50 hover:border hover:border-zinc-200/60 transition-colors">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Liam"
              className="w-9 h-9 rounded-full object-cover border border-zinc-200 shrink-0"
            />
            <div className="text-left truncate">
              <p className="text-xs font-bold text-zinc-900 truncate">Election Commissioner</p>
              <p className="text-[11px] text-zinc-400 font-medium truncate">Chief Presiding Officer</p>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-zinc-400" />
        </div>

        <div className="flex items-center justify-between pt-1 px-1">
          <button
            onClick={() => handleTabClick("settings")}
            className="flex items-center gap-1.5 text-xs font-medium text-zinc-500 hover:text-zinc-900 transition-colors cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Settings</span>
          </button>
          <button
            onClick={handleLogout}
            title="Log Out / Lock Admin Session"
            className="flex items-center gap-1.5 text-xs font-bold text-rose-500 hover:text-rose-600 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock & Sign Out</span>
          </button>
        </div>
      </div>
        </div>
      </aside>
    </>
  );
};
