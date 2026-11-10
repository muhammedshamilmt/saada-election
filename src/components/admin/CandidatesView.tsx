"use client";

import React, { useState } from "react";
import {
  Award,
  Search,
  Plus,
  Trash2,
  Pencil,
  LayoutGrid,
  List,
  CheckCircle2,
} from "lucide-react";
import { Candidate } from "@/data/electionData";
import { sortPostsByHierarchy } from "@/lib/utils";

interface CandidatesViewProps {
  candidates: Candidate[];
  onOpenAddModal: () => void;
  onEditCandidate: (candidate: Candidate) => void;
  onDeleteCandidate: (id: string) => void;
}

export const CandidatesView: React.FC<CandidatesViewProps> = ({
  candidates,
  onOpenAddModal,
  onEditCandidate,
  onDeleteCandidate,
}) => {
  const [selectedPost, setSelectedPost] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const postFilters = React.useMemo(() => {
    const fromCandidates = Array.from(
      new Set(candidates.map((c) => c.post).filter(Boolean))
    );
    if (fromCandidates.length > 0) {
      return ["All", ...sortPostsByHierarchy(fromCandidates)];
    }
    return [
      "All",
      "President",
      "General Secretary",
      "Treasurer",
      "Vice President",
      "Arts Secretary",
      "Sports Secretary",
    ];
  }, [candidates]);

  const filteredCandidates = candidates.filter((c) => {
    const matchesPost =
      selectedPost === "All" ||
      c.post.toLowerCase().includes(selectedPost.toLowerCase());
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.adNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.className.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPost && matchesSearch;
  });

  const getPostBadgeColor = (post: string) => {
    switch (post) {
      case "President":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "General Secretary":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "Treasurer":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "Vice President":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "Arts Secretary":
        return "bg-pink-50 text-pink-700 border-pink-200";
      case "Sports Secretary":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-zinc-100 text-zinc-700 border-zinc-200";
    }
  };

  const totalVotes = candidates.reduce((acc, c) => acc + c.votes, 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-none hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold mb-1">
            <Award className="w-4 h-4 text-[#FF5B26]" />
            <span>Nomination & Contestant Registry</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            Election Candidates
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Manage candidates standing for President, General Secretary, Treasurer and executive posts
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-zinc-900">
              {candidates.length} Registered Nominees
            </p>
            <p className="text-[11px] text-zinc-400">Across 6 Official Posts</p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#FF5B26] hover:bg-[#e84c17] text-white text-xs font-bold transition-all border border-[#FF5B26] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Candidate</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white rounded-2xl p-4 border border-zinc-200/90 shadow-none space-y-4">
        {/* Post category filter pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {postFilters.map((post) => (
            <button
              key={post}
              onClick={() => setSelectedPost(post)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                selectedPost === post
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100/80 text-zinc-600 hover:bg-zinc-200/70"
              }`}
            >
              {post}
              {post !== "All" && (
                <span className="ml-1.5 opacity-60 text-[10px]">
                  (
                  {
                    candidates.filter((c) =>
                      c.post.toLowerCase().includes(post.toLowerCase())
                    ).length
                  }
                  )
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Search input & Grid/Table toggle */}
        <div className="flex items-center justify-between gap-4 pt-2 border-t border-zinc-100">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate by name, Ad No, or class..."
              className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl pl-8 pr-3 py-2 text-xs text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
            />
          </div>

          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200/80">
            <button
              onClick={() => setViewMode("grid")}
              title="Grid View"
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "grid"
                  ? "bg-white text-zinc-900 font-semibold"
                  : "text-zinc-400 hover:text-zinc-700"
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              title="Table View"
              className={`p-1.5 rounded-lg text-xs transition-colors ${
                viewMode === "table"
                  ? "bg-white text-zinc-900 font-semibold"
                  : "text-zinc-400 hover:text-zinc-700"
              }`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Candidates List / Empty State */}
      {filteredCandidates.length === 0 ? (
        <div className="bg-white rounded-2xl border border-zinc-200/90 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-orange-50 text-[#FF5B26] border border-orange-200/60 mx-auto flex items-center justify-center">
            <Award className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-zinc-900">No Candidates Found</h3>
            <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
              There are currently no candidates registered in the election database. Click &ldquo;Add Candidate&rdquo; to register nominees.
            </p>
          </div>
          <button
            onClick={onOpenAddModal}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#FF5B26] hover:bg-[#e84c17] text-white text-xs font-bold transition-all shadow-md shadow-orange-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Candidate</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCandidates.map((candidate) => {
            const voteShare = totalVotes
              ? Math.round((candidate.votes / totalVotes) * 100)
              : 0;

            return (
              <div
                key={candidate.id}
                className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-none hover:shadow-xl hover:border-zinc-300 transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  {/* Top row: Avatar, Post badge & Uploaded Symbol */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="relative">
                      <img
                        src={candidate.avatarUrl}
                        alt={candidate.name}
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-2 border-zinc-200 shadow-sm group-hover:border-zinc-300 transition-all"
                      />
                      <div className="absolute -bottom-2 -right-2 w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white border-2 border-zinc-200 flex items-center justify-center p-1.5 overflow-hidden shadow-md">
                        <img
                          src={candidate.symbolUrl}
                          alt="Symbol"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getPostBadgeColor(
                          candidate.post
                        )}`}
                      >
                        {candidate.post}
                      </span>
                      <p className="text-[10px] font-mono font-bold text-zinc-500">
                        {candidate.adNo}
                      </p>
                    </div>
                  </div>

                  {/* Candidate Name & Class */}
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-zinc-900 group-hover:text-[#FF5B26] transition-colors">
                      {candidate.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 text-xs font-bold border border-zinc-200/60">
                        Class {candidate.className}
                      </span>
                    </div>
                    {candidate.tagline && (
                      <p className="text-xs text-zinc-400 italic line-clamp-2 pt-1.5 leading-relaxed">
                        &ldquo;{candidate.tagline}&rdquo;
                      </p>
                    )}
                  </div>
                </div>

                {/* Vote Tally & Actions */}
                <div className="pt-4 mt-4 border-t border-zinc-100 space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-zinc-500 font-medium">Live Votes</span>
                      <span className="font-extrabold text-zinc-900">
                        {candidate.votes}{" "}
                        <span className="text-[10px] text-zinc-400 font-normal">
                          ({voteShare}% share)
                        </span>
                      </span>
                    </div>
                    <div className="w-full bg-zinc-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-[#FF5B26] h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, voteShare * 2)}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 text-xs">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approved
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onEditCandidate(candidate)}
                        title="Edit Candidate Details"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-[#FF5B26] hover:bg-orange-50 transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteCandidate(candidate.id)}
                        title="Withdraw Candidate"
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-zinc-200/90 shadow-none hover:shadow-lg transition-all duration-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F9FAFB] text-zinc-500 font-semibold border-b border-zinc-100 select-none">
                <tr>
                  <th className="py-3 px-5">CANDIDATE</th>
                  <th className="py-3 px-4">POST / SECTION</th>
                  <th className="py-3 px-4">ADMISSION NO</th>
                  <th className="py-3 px-4">CLASS</th>
                  <th className="py-3 px-4">SYMBOL</th>
                  <th className="py-3 px-4">VOTES</th>
                  <th className="py-3 px-4 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 font-medium text-zinc-700">
                {filteredCandidates.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <img
                          src={c.avatarUrl}
                          alt={c.name}
                          className="w-12 h-12 rounded-xl object-cover border border-zinc-200 shrink-0"
                        />
                        <div>
                          <p className="font-bold text-zinc-900">{c.name}</p>
                          <p className="text-[11px] text-zinc-400 truncate max-w-xs">
                            {c.tagline}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getPostBadgeColor(
                          c.post
                        )}`}
                      >
                        {c.post}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-zinc-800">
                      {c.adNo}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-zinc-100 font-bold text-zinc-800">
                        {c.className}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="w-9 h-9 rounded-xl border border-zinc-200 flex items-center justify-center p-1.5 bg-white shadow-2xs">
                        <img
                          src={c.symbolUrl}
                          alt="Symbol"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-black text-zinc-900">
                      {c.votes}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEditCandidate(c)}
                          title="Edit Candidate Details"
                          className="text-zinc-400 hover:text-[#FF5B26] p-1.5 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteCandidate(c.id)}
                          title="Withdraw Candidate"
                          className="text-zinc-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
