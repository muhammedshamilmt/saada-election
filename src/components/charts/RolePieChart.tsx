"use client";

import React, { useState } from "react";
import { Candidate } from "@/data/electionData";
import { Crown, Trophy, Award, Users } from "lucide-react";

interface RolePieChartProps {
  postTitle: string;
  candidates: Candidate[];
  roleIndex?: number;
}

const PALETTE = [
  "#FF5B26", // Saada Vibrant Orange
  "#2563EB", // Royal Blue
  "#059669", // Emerald Green
  "#7C3AED", // Violet
  "#D97706", // Amber
  "#DB2777", // Rose
  "#0891B2", // Cyan
  "#4F46E5", // Indigo
];

function polarToCartesian(centerX: number, centerY: number, radius: number, angleInDegrees: number) {
  const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
  return {
    x: centerX + radius * Math.cos(angleInRadians),
    y: centerY + radius * Math.sin(angleInRadians),
  };
}

function describeArc(
  x: number,
  y: number,
  radius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number
) {
  // Clamp angle delta so it doesn't wrap 360 exactly into 0
  const delta = endAngle - startAngle;
  const actualEndAngle = delta >= 359.99 ? startAngle + 359.99 : endAngle;

  const start = polarToCartesian(x, y, radius, actualEndAngle);
  const end = polarToCartesian(x, y, radius, startAngle);
  const innerStart = polarToCartesian(x, y, innerRadius, actualEndAngle);
  const innerEnd = polarToCartesian(x, y, innerRadius, startAngle);

  const largeArcFlag = delta <= 180 ? "0" : "1";

  if (innerRadius === 0) {
    return [
      "M", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "L", x, y,
      "Z"
    ].join(" ");
  }

  return [
    "M", start.x, start.y,
    "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
    "L", innerEnd.x, innerEnd.y,
    "A", innerRadius, innerRadius, 0, largeArcFlag, 1, innerStart.x, innerStart.y,
    "Z"
  ].join(" ");
}

export const RolePieChart: React.FC<RolePieChartProps> = ({
  postTitle,
  candidates,
  roleIndex = 1,
}) => {
  const [hoveredCandidateId, setHoveredCandidateId] = useState<string | null>(null);

  const sortedCandidates = [...candidates].sort((a, b) => b.votes - a.votes);
  const totalVotes = sortedCandidates.reduce((acc, c) => acc + (c.votes || 0), 0);
  const leader = sortedCandidates[0];

  // Calculate slice angles
  let cumulativeAngle = 0;
  const slices = sortedCandidates.map((c, idx) => {
    const votes = c.votes || 0;
    const share = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
    const angle = totalVotes > 0 ? (votes / totalVotes) * 360 : 0;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle = endAngle;

    return {
      candidate: c,
      votes,
      share: Math.round(share * 10) / 10,
      startAngle,
      endAngle,
      color: PALETTE[idx % PALETTE.length],
    };
  });

  const activeCandidate =
    sortedCandidates.find((c) => c.id === hoveredCandidateId) || leader;

  const activeSlice = slices.find((s) => s.candidate.id === activeCandidate?.id);

  return (
    <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 flex flex-col justify-between shadow-xs hover:shadow-xl hover:border-zinc-300 transition-all duration-300 group">
      <div>
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-5 h-5 rounded-lg bg-orange-50 text-[#FF5B26] border border-orange-200/60 flex items-center justify-center text-[10px] font-black">
                {roleIndex}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Official Union Role
              </span>
            </div>
            <h3 className="text-xl font-black text-zinc-900 tracking-tight font-sans">
              {postTitle}
            </h3>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-100 text-zinc-700 border border-zinc-200/60">
              <Users className="w-3 h-3 text-zinc-400" />
              <span>{totalVotes.toLocaleString()} votes</span>
            </span>
          </div>
        </div>

        {/* Donut Chart Visualization */}
        <div className="relative my-6 flex items-center justify-center">
          {totalVotes === 0 ? (
            <div className="relative w-56 h-56 flex flex-col items-center justify-center">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                <circle
                  cx="100"
                  cy="100"
                  r="72"
                  stroke="#F3F4F6"
                  strokeWidth="28"
                  fill="none"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                <Award className="w-7 h-7 text-zinc-300 mb-1" />
                <p className="text-xs font-bold text-zinc-500">Awaiting Votes</p>
                <p className="text-[10px] text-zinc-400">0 ballots recorded</p>
              </div>
            </div>
          ) : (
            <div className="relative w-56 h-56 sm:w-60 sm:h-60">
              <svg
                viewBox="0 0 200 200"
                className="w-full h-full overflow-visible drop-shadow-xs"
              >
                {/* Background track */}
                <circle
                  cx="100"
                  cy="100"
                  r="75"
                  fill="none"
                  stroke="#F4F4F5"
                  strokeWidth="26"
                />

                {/* Slices */}
                {slices.map((slice) => {
                  if (slice.votes === 0) return null;
                  const isHovered = hoveredCandidateId === slice.candidate.id;
                  const radius = isHovered ? 89 : 85;
                  const innerRadius = 55;
                  const pathData = describeArc(
                    100,
                    100,
                    radius,
                    innerRadius,
                    slice.startAngle,
                    slice.endAngle
                  );

                  return (
                    <path
                      key={slice.candidate.id}
                      d={pathData}
                      fill={slice.color}
                      onMouseEnter={() => setHoveredCandidateId(slice.candidate.id)}
                      onMouseLeave={() => setHoveredCandidateId(null)}
                      className="transition-all duration-200 cursor-pointer hover:opacity-95"
                      style={{
                        filter: isHovered
                          ? "drop-shadow(0 4px 10px rgba(0,0,0,0.18))"
                          : "none",
                      }}
                    />
                  );
                })}
              </svg>

              {/* Center Donut Hole Card */}
              <div className="absolute inset-0 m-auto w-24 h-24 rounded-full bg-white shadow-md border border-zinc-100 flex flex-col items-center justify-center text-center p-2 pointer-events-none transition-transform duration-200">
                {activeCandidate ? (
                  <>
                    {activeCandidate.id === leader?.id && totalVotes > 0 && (
                      <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-400 mb-0.5" />
                    )}
                    <span className="text-lg font-black text-zinc-900 leading-tight">
                      {activeSlice ? `${activeSlice.share}%` : "0%"}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-400 truncate max-w-[80px]">
                      {activeCandidate.name.split(" ")[0]}
                    </span>
                  </>
                ) : (
                  <span className="text-xs font-bold text-zinc-400">Total</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Candidate Breakdown & Legend */}
      <div className="space-y-2.5 pt-3 border-t border-zinc-100">
        <p className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
          Contestants ({sortedCandidates.length})
        </p>

        {sortedCandidates.length === 0 ? (
          <p className="text-xs text-zinc-400 italic py-2">
            No contestants registered for this role.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedCandidates.map((c, idx) => {
              const slice = slices.find((s) => s.candidate.id === c.id);
              const color = slice?.color || PALETTE[idx % PALETTE.length];
              const isLead = idx === 0 && totalVotes > 0;
              const isHovered = hoveredCandidateId === c.id;

              return (
                <div
                  key={c.id}
                  onMouseEnter={() => setHoveredCandidateId(c.id)}
                  onMouseLeave={() => setHoveredCandidateId(null)}
                  className={`p-2.5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                    isHovered
                      ? "bg-zinc-50 border-zinc-300 shadow-sm"
                      : "bg-[#F8F9FA]/70 border-zinc-200/70 hover:border-zinc-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Color indicator bar/dot */}
                      <span
                        className="w-3 h-3 rounded-full shrink-0 shadow-2xs"
                        style={{ backgroundColor: color }}
                      />

                      {/* Candidate Avatar & Symbol (Enlarged) */}
                      <div className="relative shrink-0">
                        <img
                          src={c.avatarUrl}
                          alt={c.name}
                          className="w-11 h-11 rounded-xl object-cover border border-zinc-200 shadow-xs"
                        />
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-md bg-white border border-zinc-200 flex items-center justify-center p-0.5 shadow-xs">
                          <img
                            src={c.symbolUrl}
                            alt="Symbol"
                            className="w-full h-full object-contain"
                          />
                        </div>
                      </div>

                      <div className="truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          <p className="text-xs font-bold text-zinc-900 truncate">
                            {c.name}
                          </p>
                          {isLead && (
                            <Crown className="w-3 h-3 text-amber-500 fill-amber-400 shrink-0" />
                          )}
                        </div>
                        <p className="text-[10px] text-zinc-400 font-medium">
                          Class {c.className} &bull; {c.adNo}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-zinc-900">
                        {c.votes.toLocaleString()}{" "}
                        <span className="text-[10px] text-zinc-400 font-normal">
                          ({slice?.share || 0}%)
                        </span>
                      </p>
                      {isLead ? (
                        <span className="text-[10px] font-bold text-emerald-600">
                          Leading
                        </span>
                      ) : (
                        <span className="text-[10px] text-zinc-400">Runner-up</span>
                      )}
                    </div>
                  </div>

                  {/* Micro Progress Bar */}
                  <div className="w-full bg-zinc-200/60 rounded-full h-1 mt-2 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${slice?.share || 0}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

