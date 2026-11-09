"use client";

import React, { useState } from "react";
import { X, Users2 } from "lucide-react";
import { Voter, ELECTION_CLASSES, ElectionClass } from "@/data/electionData";

interface AddVoterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddVoter: (voter: Voter) => void;
}

export const AddVoterModal: React.FC<AddVoterModalProps> = ({
  isOpen,
  onClose,
  onAddVoter,
}) => {
  const [adNo, setAdNo] = useState("");
  const [name, setName] = useState("");
  const [className, setClassName] = useState<ElectionClass>("D3");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adNo.trim() || !name.trim()) return;

    const newVoter: Voter = {
      id: `v-${Date.now()}`,
      adNo: adNo.trim().toUpperCase(),
      name: name.trim(),
      className,
      hasVoted: false,
    };

    onAddVoter(newVoter);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-md shadow-none hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF5B26] border border-orange-200/60 flex items-center justify-center">
              <Users2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Register Student Voter
              </h3>
              <p className="text-xs text-zinc-400">
                Add verified student by Admission No and Class
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Ad No */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              Admission Number (Ad NO) *
            </label>
            <input
              type="text"
              required
              value={adNo}
              onChange={(e) => setAdNo(e.target.value)}
              placeholder="e.g. AD-1042"
              className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
            />
          </div>

          {/* Student Name */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              Student Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fathima Thasneem"
              className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
            />
          </div>

          {/* Class (Exact options: FS1, FS2, FS3, HS1, HS2, DGF, D2, D3, PGF, PG) */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              Class *
            </label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value as ElectionClass)}
              className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
            >
              {ELECTION_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-zinc-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#FF5B26] hover:bg-[#e84c17] text-white text-xs font-bold transition-all border border-[#FF5B26] cursor-pointer"
            >
              Register Voter
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
