"use client";

import React from "react";
import {
  Calendar,
  SlidersHorizontal,
  Plus,
  Clock,
  Menu,
} from "lucide-react";
import { AdminTab } from "./Sidebar";

interface HeaderProps {
  currentTab: AdminTab;
  onOpenAddModal: () => void;
  status: "live" | "paused" | "closed";
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  onOpenAddModal,
  status,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const getTabActionLabel = () => {
    switch (currentTab) {
      case "candidates":
        return "+ Add Candidate";
      case "voters":
        return "+ Register Voter";
      case "results":
        return "Export Official Tally";
      case "settings":
        return "Save Configuration";
      default:
        return "+ Add Candidate";
    }
  };

  const getStatusBadge = () => {
    if (status === "live") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          Polls Live
        </span>
      );
    }
    if (status === "paused") {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          Polls Paused
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <span className="w-2 h-2 rounded-full bg-rose-500" />
        Voting Concluded
      </span>
    );
  };

  return (
    <header className="px-4 sm:px-8 py-4 sm:py-6 bg-white border-b border-zinc-200/90 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Title & Subtitle with Sidebar Toggle Button */}
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            title={isSidebarOpen ? "Collapse navigation sidebar" : "Open navigation sidebar"}
            className="p-2.5 rounded-xl border border-zinc-200 bg-white text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
            aria-label="Toggle navigation sidebar"
          >
            <Menu className="w-4 h-4" />
          </button>
        )}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 font-sans">
              Welcome Back, Presiding Officer
            </h1>
            {getStatusBadge()}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Clock className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <p className="text-xs text-zinc-500">
              Realtime Synced &bull; Central Campus Booth #1
            </p>
          </div>
        </div>
      </div>

      {/* Action Controls matching Merivo */}
      <div className="flex items-center gap-3 self-stretch sm:self-auto justify-end">
        {/* Quick Filter button */}
        <button
          title="Filter Records"
          className="p-2.5 rounded-xl border border-zinc-200 text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50 transition-colors"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>

        {/* Date / Academic Session Pill */}
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-700 bg-[#F8F9FA] hover:bg-zinc-100 transition-colors cursor-pointer">
          <Calendar className="w-3.5 h-3.5 text-zinc-400" />
          <span>Election Day &bull; Nov 09, 2026</span>
        </div>

        {/* Primary Action Button (Warm Merivo Orange #FF5B26) */}
        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5B26] hover:bg-[#e84c17] text-white text-xs font-bold transition-all border border-[#FF5B26] active:scale-[0.98] cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{getTabActionLabel()}</span>
        </button>
      </div>
    </header>
  );
};
