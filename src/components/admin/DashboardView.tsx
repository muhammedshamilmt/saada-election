"use client";

import React, { useState } from "react";
import {
  Users2,
  Vote,
  Award,
  ArrowUpRight,
  Search,
  MoreVertical,
  Clock,
  Building2,
  Trophy,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  Candidate,
  Voter,
  ElectionConfig,
} from "@/data/electionData";
import { LeaderboardPodium } from "./LeaderboardPodium";

interface DashboardViewProps {
  candidates: Candidate[];
  voters: Voter[];
  config: ElectionConfig;
  onNavigateToCandidates: () => void;
  onNavigateToVoters: () => void;
  onNavigateToResults: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  candidates,
  voters,
  config,
  onNavigateToCandidates,
  onNavigateToVoters,
  onNavigateToResults,
}) => {
  const [activeViewMode, setActiveViewMode] = useState<"overview" | "podium">("overview");
  const [pollingSearch, setPollingSearch] = useState("");
  const [recentPage, setRecentPage] = useState(1);
  const recentPageSize = 5;

  const totalVotesPolled = voters.filter((v) => v.hasVoted).length;
  const turnoutPercent = voters.length > 0
    ? Math.round((totalVotesPolled / voters.length) * 100)
    : 0;

  // Dynamic class turnout based on voters in DB
  const dynamicClassTurnout = React.useMemo(() => {
    const classes = Array.from(new Set(voters.map((v) => v.className).filter(Boolean)));
    if (classes.length === 0) return [];
    return classes
      .map((cls) => {
        const inClass = voters.filter((v) => v.className === cls);
        const voted = inClass.filter((v) => v.hasVoted).length;
        const total = inClass.length;
        const percentage = total > 0 ? Math.round((voted / total) * 100) : 0;
        return { className: cls, total, voted, percentage };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [voters]);

  const topClass = dynamicClassTurnout[0];

  // Dynamic hourly distribution from real voters timestamp
  const dynamicHourlyTurnout = React.useMemo(() => {
    const hours = ["09 AM", "10 AM", "11 AM", "12 PM", "01 PM", "02 PM", "03 PM", "04 PM"];
    const votedList = voters.filter((v) => v.hasVoted && v.votedAt);

    const counts = hours.map((hourLabel) => {
      const count = votedList.filter((v) => {
        if (!v.votedAt) return false;
        const timeUpper = v.votedAt.toUpperCase();
        const hourPrefix = hourLabel.split(" ")[0];
        const isPM = hourLabel.includes("PM");
        const isAM = hourLabel.includes("AM");
        if (timeUpper.includes(hourLabel)) return true;
        if (isAM && timeUpper.startsWith(`${hourPrefix}:`)) return true;
        if (isPM && hourPrefix === "12" && timeUpper.startsWith("12:")) return true;
        if (isPM && hourPrefix !== "12") {
          const h24 = String(parseInt(hourPrefix, 10) + 12).padStart(2, "0");
          if (timeUpper.startsWith(`${h24}:`)) return true;
        }
        return false;
      }).length;
      return { time: hourLabel, count, target: Math.max(5, Math.round(voters.length / 8)) };
    });

    const maxCount = Math.max(...counts.map((c) => c.count), 1);
    return counts.map((c) => ({
      ...c,
      isPeak: c.count === maxCount && c.count > 0,
    }));
  }, [voters]);

  const filteredRecent = voters
    .filter((v) => v.hasVoted)
    .filter(
      (v) =>
        v.name.toLowerCase().includes(pollingSearch.toLowerCase()) ||
        v.adNo.toLowerCase().includes(pollingSearch.toLowerCase()) ||
        v.className.toLowerCase().includes(pollingSearch.toLowerCase())
    );

  const recentTotalPages = Math.max(1, Math.ceil(filteredRecent.length / recentPageSize));
  const recentStartIndex = (recentPage - 1) * recentPageSize;
  const paginatedRecent = filteredRecent.slice(
    recentStartIndex,
    recentStartIndex + recentPageSize
  );

  // Sparkline mini bar components for stat cards
  const renderMiniBars = (colorClass: string, heights: number[]) => (
    <div className="flex items-end gap-1 h-9">
      {heights.map((h, i) => (
        <span
          key={i}
          style={{ height: `${h}%` }}
          className={`w-1 rounded-xs transition-all duration-300 ${colorClass}`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards matching Merivo Screenshot */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Card 1: Registered Voters */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/90 shadow-none hover:shadow-xl hover:border-zinc-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold">
              <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600 border border-purple-200/50">
                <Users2 className="w-3.5 h-3.5" />
              </span>
              <span>Total Registered Voters</span>
            </div>
            <button
              onClick={onNavigateToVoters}
              className="text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-end justify-between mt-4">
            <div>
              <p className="text-3xl font-extrabold text-zinc-900 tracking-tight font-sans">
                {voters.length.toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs font-semibold text-emerald-600 flex items-center">
                  ▲ 10 Classes
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
                  certified electoral roll
                </span>
              </div>
            </div>

            {/* Sparkline mini bar chart */}
            {renderMiniBars("bg-purple-500", [30, 45, 60, 40, 75, 90, 65, 80, 100])}
          </div>
        </div>

        {/* Card 2: Votes Polled (Turnout) */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/90 shadow-none hover:shadow-xl hover:border-zinc-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold">
              <span className="p-1.5 rounded-lg bg-orange-50 text-[#FF5B26] border border-orange-200/50">
                <Vote className="w-3.5 h-3.5" />
              </span>
              <span>Votes Polled Today</span>
            </div>
            <button
              onClick={onNavigateToResults}
              className="text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-end justify-between mt-4">
            <div>
              <p className="text-3xl font-extrabold text-zinc-900 tracking-tight font-sans">
                {totalVotesPolled.toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs font-semibold text-[#FF5B26] flex items-center">
                  ▲ {turnoutPercent}% Turnout
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
                  {voters.length - totalVotesPolled} remaining
                </span>
              </div>
            </div>

            {/* Sparkline mini bar chart in Orange */}
            {renderMiniBars("bg-[#FF5B26]", [20, 50, 45, 70, 85, 95, 60, 88, 100])}
          </div>
        </div>

        {/* Card 3: Active Candidates */}
        <div className="bg-white rounded-2xl p-5 border border-zinc-200/90 shadow-none hover:shadow-xl hover:border-zinc-300 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-200/50">
                <Award className="w-3.5 h-3.5" />
              </span>
              <span>Nominated Candidates</span>
            </div>
            <button
              onClick={onNavigateToCandidates}
              className="text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-end justify-between mt-4">
            <div>
              <p className="text-3xl font-extrabold text-zinc-900 tracking-tight font-sans">
                {candidates.length} Contenders
              </p>
              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="text-xs font-semibold text-blue-600 flex items-center">
                  6 Posts
                </span>
                <span className="text-[11px] text-zinc-400 font-medium">
                  President, Secretary, Treasurer...
                </span>
              </div>
            </div>

            {/* Sparkline mini bar chart in Blue */}
            {renderMiniBars("bg-blue-500", [40, 60, 50, 80, 65, 90, 75, 100, 85])}
          </div>
        </div>
      </div>

      {/* Switcher Bar: Standard Analytics vs 3D Podium Leaderboard */}
      <div className="flex items-center justify-between bg-white p-2.5 rounded-2xl border border-zinc-200/90 shadow-none">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveViewMode("overview")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeViewMode === "overview"
                ? "bg-zinc-900 text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            Turnout Velocity & Traffic
          </button>
          <button
            onClick={() => setActiveViewMode("podium")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeViewMode === "podium"
                ? "bg-[#FF5B26] text-white"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>3D Leaderboard Podium</span>
          </button>
        </div>

        <span className="text-[11px] text-zinc-400 hidden sm:inline font-medium">
          Live EVM Sync &bull; Saada College
        </span>
      </div>

      {/* If 3D Podium is chosen, show the Leaderboard Podium */}
      {activeViewMode === "podium" ? (
        <LeaderboardPodium candidates={candidates} isLive={config.status === "live"} />
      ) : (
        /* Middle Section: Turnout Velocity Chart & Class Participation */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Left 2 Cols: Hourly Voting Traffic (Bar Chart) */}
          <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-none hover:shadow-xl hover:border-zinc-300 transition-all duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-zinc-100">
              <div>
                <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold mb-1">
                  <Clock className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Polling Velocity & Hourly Traffic</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-bold text-zinc-900">
                    {totalVotesPolled} Total Cast
                  </p>
                  <span className="text-xs text-emerald-600 font-semibold">
                    ▲ +16.03% Growth Projected
                  </span>
                </div>
              </div>

              {/* Legend & Target Badge */}
              <div className="flex items-center gap-4 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-medium text-[11px] border border-emerald-200">
                  Turnout: {turnoutPercent}%
                </span>
                <div className="hidden sm:flex items-center gap-3 text-zinc-500 text-[11px]">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" /> Above Target
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-[#FF5B26]" /> Peak Traffic
                  </span>
                </div>
              </div>
            </div>

            {/* Bar Chart Visualization */}
            <div className="pt-8">
              <div className="relative h-64 flex items-end justify-between gap-3 px-2 sm:px-6">
                {dynamicHourlyTurnout.map((item, idx) => {
                  const maxCount = Math.max(1, ...dynamicHourlyTurnout.map((d) => d.count));
                  const barHeightPercent = Math.max(
                    item.count > 0 ? 15 : 6,
                    Math.round((item.count / maxCount) * 100)
                  );

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col items-center group relative h-full justify-end"
                    >
                      {/* Floating Tooltip Pill */}
                      <div
                        className={`absolute -top-10 px-2.5 py-1 rounded-md text-[11px] font-bold pointer-events-none transition-all duration-200 ${
                          item.isPeak
                            ? "bg-zinc-900 text-white opacity-100 scale-100"
                            : "bg-zinc-800 text-white opacity-0 group-hover:opacity-100 scale-95 group-hover:scale-100"
                        }`}
                      >
                        {item.count} Votes
                        <div className="w-2 h-2 bg-zinc-900 rotate-45 mx-auto -mb-1 mt-0.5"></div>
                      </div>

                      {/* The Bar */}
                      <div
                        style={{ height: `${barHeightPercent}%` }}
                        className={`w-full max-w-[46px] rounded-t-xl transition-all duration-500 cursor-pointer ${
                          item.isPeak
                            ? "bg-gradient-to-t from-[#FF5B26] to-[#ff7e54] ring-2 ring-[#FF5B26]/30"
                            : item.count > 0
                            ? "bg-orange-200 hover:bg-orange-300"
                            : "bg-zinc-100 hover:bg-zinc-200"
                        }`}
                      />

                      {/* Time Label */}
                      <span
                        className={`mt-3 text-[11px] font-semibold transition-colors ${
                          item.isPeak
                            ? "text-zinc-900 font-bold"
                            : "text-zinc-400 group-hover:text-zinc-600"
                        }`}
                      >
                        {item.time}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right 1 Col: Class Turnout Breakdown */}
          <div className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-none hover:shadow-xl hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 mb-4">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-zinc-400" />
                  <h3 className="text-xs font-bold text-zinc-900 uppercase tracking-wider">
                    Class Turnout
                  </h3>
                </div>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                  Live Feed
                </span>
              </div>

              <div className="space-y-3.5 max-h-[260px] overflow-y-auto pr-1">
                {dynamicClassTurnout.length === 0 ? (
                  <p className="text-xs text-zinc-400 italic py-6 text-center">
                    No voters registered yet.
                  </p>
                ) : (
                  dynamicClassTurnout.map((cls, i) => (
                    <div key={i} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-zinc-800">
                          Class {cls.className}
                        </span>
                        <span className="font-bold text-zinc-900 text-right">
                          {cls.percentage}%{" "}
                          <span className="text-[10px] text-zinc-400 font-normal">
                            ({cls.voted}/{cls.total})
                          </span>
                        </span>
                      </div>
                      <div className="w-full bg-zinc-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            cls.percentage >= 85
                              ? "bg-emerald-500"
                              : cls.percentage >= 80
                              ? "bg-[#FF5B26]"
                              : "bg-blue-500"
                          }`}
                          style={{ width: `${cls.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-zinc-100 flex items-center justify-between text-xs">
              <span className="text-zinc-500">Highest Turnout</span>
              <span className="font-bold text-emerald-600">
                {topClass ? `Class ${topClass.className} (${topClass.percentage}%)` : "N/A"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Section: Recent Polling Activity Table with Pagination */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-none hover:shadow-xl hover:border-zinc-300 transition-all duration-300 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100">
          <div>
            <h3 className="text-base font-bold text-zinc-900 font-sans">
              Recent Polling Activity
            </h3>
            <p className="text-xs text-zinc-400">
              Real-time audit log of cast ballots by Admission No and Class
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                value={pollingSearch}
                onChange={(e) => {
                  setPollingSearch(e.target.value);
                  setRecentPage(1);
                }}
                placeholder="Search voter..."
                className="bg-[#F8F9FA] border border-zinc-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
              />
            </div>
            <button
              onClick={onNavigateToVoters}
              className="text-xs font-bold text-[#FF5B26] hover:text-[#e84c17] px-3 py-1.5 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
            >
              View All Voters →
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] text-zinc-500 font-semibold border-b border-zinc-100 select-none">
              <tr>
                <th className="py-3 px-5 w-10">
                  <input
                    type="checkbox"
                    className="rounded border-zinc-300 text-[#FF5B26] focus:ring-[#FF5B26]"
                  />
                </th>
                <th className="py-3 px-4">ADMISSION NO</th>
                <th className="py-3 px-4">STUDENT NAME</th>
                <th className="py-3 px-4">CLASS</th>
                <th className="py-3 px-4">BALLOT TIME</th>
                <th className="py-3 px-4">STATUS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
              {paginatedRecent.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-400">
                    No recent votes found.
                  </td>
                </tr>
              ) : (
                paginatedRecent.map((voter) => (
                  <tr
                    key={voter.id}
                    className="hover:bg-zinc-50/80 transition-colors group"
                  >
                    <td className="py-3.5 px-5">
                      <input
                        type="checkbox"
                        className="rounded border-zinc-300 text-[#FF5B26] focus:ring-[#FF5B26]"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 border border-zinc-200/60">
                        {voter.adNo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-100 to-amber-100 text-orange-700 border border-orange-200/60 flex items-center justify-center font-bold text-[11px]">
                          {voter.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-zinc-900">{voter.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-zinc-700">
                      Class {voter.className}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-zinc-400" />
                      {voter.votedAt || "Today"}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        Verified Ballot
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md hover:bg-zinc-100 cursor-pointer">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination bar for recent polling activity */}
        <div className="px-5 py-3.5 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500">
          <span>
            Showing{" "}
            <strong className="text-zinc-900">
              {filteredRecent.length === 0 ? 0 : recentStartIndex + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-zinc-900">
              {Math.min(recentStartIndex + recentPageSize, filteredRecent.length)}
            </strong>{" "}
            of <strong className="text-zinc-900">{filteredRecent.length}</strong> cast ballots
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setRecentPage((p) => Math.max(p - 1, 1))}
              disabled={recentPage === 1}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-bold text-zinc-800">
              Page {recentPage} of {recentTotalPages}
            </span>
            <button
              onClick={() => setRecentPage((p) => Math.min(p + 1, recentTotalPages))}
              disabled={recentPage === recentTotalPages}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
