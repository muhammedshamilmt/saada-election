"use client";

import React, { useState, useEffect } from "react";
import {
  Users2,
  Search,
  Plus,
  Clock,
  Trash2,
  Download,
  UserCheck,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from "lucide-react";
import { Voter, ELECTION_CLASSES } from "@/data/electionData";

interface VotersViewProps {
  voters: Voter[];
  onOpenAddModal: () => void;
  onOpenImportModal: () => void;
  onToggleVoted: (id: string) => void;
  onDeleteVoter: (id: string) => void;
}

export const VotersView: React.FC<VotersViewProps> = ({
  voters,
  onOpenAddModal,
  onOpenImportModal,
  onToggleVoted,
  onDeleteVoter,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [classFilter, setClassFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"All" | "voted" | "pending">(
    "All"
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);

  const filteredVoters = voters.filter((voter) => {
    const matchesSearch =
      voter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter.adNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      voter.className.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClass =
      classFilter === "All" || voter.className === classFilter;

    const matchesStatus =
      statusFilter === "All" ||
      (statusFilter === "voted" ? voter.hasVoted : !voter.hasVoted);

    return matchesSearch && matchesClass && matchesStatus;
  });

  // Reset to page 1 on filter or search
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, classFilter, statusFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredVoters.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedVoters = filteredVoters.slice(
    startIndex,
    startIndex + pageSize
  );

  const totalVotedCount = voters.filter((v) => v.hasVoted).length;
  const pendingCount = voters.length - totalVotedCount;

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredVoters.map((v) => v.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Quick Stat Strip */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-none hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold mb-1">
            <Users2 className="w-4 h-4 text-[#FF5B26]" />
            <span>Official Electoral Roll</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            Voters Register
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Verified student voters with Admission Numbers (Ad NO) and Class
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-800 bg-white hover:bg-zinc-50 transition-colors cursor-pointer shadow-none hover:shadow-xs"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#FF5B26]" />
            <span>Import Voters</span>
          </button>

          <button
            onClick={() => {
              const csvContent =
                "data:text/csv;charset=utf-8," +
                ["Ad No,Name,Class,Status,VotedAt"]
                  .concat(
                    voters.map(
                      (v) =>
                        `${v.adNo},"${v.name}","${v.className}",${
                          v.hasVoted ? "Voted" : "Pending"
                        },${v.votedAt || ""}`
                    )
                  )
                  .join("\n");
              const encodedUri = encodeURI(csvContent);
              const link = document.createElement("a");
              link.setAttribute("href", encodedUri);
              link.setAttribute("download", "saada_voters_list.csv");
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-zinc-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5B26] hover:bg-[#e84c17] text-white text-xs font-bold transition-all border border-[#FF5B26] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Register Voter</span>
          </button>
        </div>
      </div>

      {/* 3 Micro-Metrics for Voters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-none hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400 font-medium">Total Registered</p>
            <p className="text-xl font-extrabold text-zinc-900 mt-0.5">
              {voters.length}
            </p>
          </div>
          <span className="p-2 rounded-lg bg-zinc-100 text-zinc-600 border border-zinc-200/60">
            <Users2 className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-none hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400 font-medium">Ballots Polled</p>
            <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
              {totalVotedCount}
            </p>
          </div>
          <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-200/60">
            <UserCheck className="w-4 h-4" />
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-zinc-200/90 shadow-none hover:shadow-md transition-all flex items-center justify-between">
          <div>
            <p className="text-xs text-zinc-400 font-medium">Pending to Vote</p>
            <p className="text-xl font-extrabold text-[#FF5B26] mt-0.5">
              {pendingCount}
            </p>
          </div>
          <span className="p-2 rounded-lg bg-orange-50 text-[#FF5B26] border border-orange-200/60">
            <Clock className="w-4 h-4" />
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-none space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Search by Ad NO or Name */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Admission No (Ad NO), Name, or Class..."
              className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Class filter dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-zinc-500">Class:</span>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-[#F8F9FA] border border-zinc-200 text-xs font-bold text-zinc-800 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
              >
                <option value="All">All Classes</option>
                {ELECTION_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status pills */}
            <div className="flex items-center bg-zinc-100 p-0.5 rounded-xl border border-zinc-200/80">
              <button
                onClick={() => setStatusFilter("All")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === "All"
                    ? "bg-white text-zinc-900 border border-zinc-200/60"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setStatusFilter("voted")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === "voted"
                    ? "bg-white text-emerald-700 border border-zinc-200/60"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Voted
              </button>
              <button
                onClick={() => setStatusFilter("pending")}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                  statusFilter === "pending"
                    ? "bg-white text-[#FF5B26] border border-zinc-200/60"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                Pending
              </button>
            </div>
          </div>
        </div>

        {/* Selected count action strip */}
        {selectedIds.length > 0 && (
          <div className="p-2.5 bg-zinc-900 text-white rounded-xl flex items-center justify-between text-xs animate-in fade-in">
            <span className="font-medium">
              {selectedIds.length} voter(s) selected
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  selectedIds.forEach((id) => onToggleVoted(id));
                  setSelectedIds([]);
                }}
                className="px-3 py-1 bg-[#FF5B26] hover:bg-[#e84c17] text-white rounded-lg font-bold"
              >
                Toggle Voted Status
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Voters Table with border & hover layer shadow */}
      <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-none hover:shadow-lg transition-all duration-300 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] text-zinc-500 font-semibold border-b border-zinc-100 select-none">
              <tr>
                <th className="py-3 px-5 w-10">
                  <input
                    type="checkbox"
                    checked={
                      paginatedVoters.length > 0 &&
                      paginatedVoters.every((v) => selectedIds.includes(v.id))
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-zinc-300 text-[#FF5B26] focus:ring-[#FF5B26]"
                  />
                </th>
                <th className="py-3 px-4">ADMISSION NO (AD NO)</th>
                <th className="py-3 px-4">STUDENT NAME</th>
                <th className="py-3 px-4">CLASS</th>
                <th className="py-3 px-4">VOTING STATUS</th>
                <th className="py-3 px-4">POLL TIMESTAMP</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
              {paginatedVoters.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-zinc-400">
                    No voters found matching your search.
                  </td>
                </tr>
              ) : (
                paginatedVoters.map((voter) => (
                  <tr
                    key={voter.id}
                    className={`hover:bg-zinc-50/80 transition-colors group ${
                      selectedIds.includes(voter.id) ? "bg-orange-50/30" : ""
                    }`}
                  >
                    <td className="py-3.5 px-5">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(voter.id)}
                        onChange={() => handleSelectRow(voter.id)}
                        className="rounded border-zinc-300 text-[#FF5B26] focus:ring-[#FF5B26]"
                      />
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                      <span className="px-2.5 py-0.5 rounded-md bg-zinc-100 border border-zinc-200/80">
                        {voter.adNo}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-zinc-200 to-zinc-100 text-zinc-700 flex items-center justify-center font-bold text-[11px] border border-zinc-200">
                          {voter.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-zinc-900">{voter.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-800 font-bold border border-zinc-200/60">
                        Class {voter.className}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {voter.hasVoted ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          Voted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          Not Voted
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-zinc-500 text-[11px]">
                      {voter.votedAt ? (
                        <span className="flex items-center gap-1 text-zinc-600 font-semibold">
                          <Clock className="w-3 h-3 text-zinc-400" />
                          {voter.votedAt}
                        </span>
                      ) : (
                        <span className="text-zinc-300">&mdash;</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onToggleVoted(voter.id)}
                          className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                            voter.hasVoted
                              ? "text-zinc-500 hover:bg-zinc-100"
                              : "bg-[#FF5B26] hover:bg-[#e84c17] text-white"
                          }`}
                        >
                          {voter.hasVoted ? "Undo" : "Mark Voted"}
                        </button>
                        <button
                          onClick={() => onDeleteVoter(voter.id)}
                          title="Remove Voter"
                          className="p-1 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Dynamic Pagination Controls */}
        <div className="px-5 py-4 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500">
          <div className="flex items-center gap-2">
            <span>
              Showing{" "}
              <strong className="text-zinc-900 font-bold">
                {filteredVoters.length === 0 ? 0 : startIndex + 1}
              </strong>{" "}
              to{" "}
              <strong className="text-zinc-900 font-bold">
                {Math.min(startIndex + pageSize, filteredVoters.length)}
              </strong>{" "}
              of{" "}
              <strong className="text-zinc-900 font-bold">
                {filteredVoters.length}
              </strong>{" "}
              voters
            </span>

            {/* Page Size selector */}
            <div className="flex items-center gap-1 ml-3 border-l border-zinc-200 pl-3">
              <span className="text-[11px] text-zinc-400">Rows per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="bg-[#F8F9FA] border border-zinc-200 rounded-lg px-2 py-1 text-xs font-semibold text-zinc-700"
              >
                <option value={5}>5</option>
                <option value={8}>8</option>
                <option value={15}>15</option>
                <option value={25}>25</option>
              </select>
            </div>
          </div>

          {/* Page buttons */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentPage === page
                    ? "bg-zinc-900 text-white"
                    : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
