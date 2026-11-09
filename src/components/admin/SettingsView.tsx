"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldCheck,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { ElectionConfig } from "@/data/electionData";

interface SettingsViewProps {
  config: ElectionConfig;
  onUpdateConfig: (newConfig: ElectionConfig) => void;
  onResetVotes: () => void;
  onRestoreDefaults: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  config,
  onUpdateConfig,
  onResetVotes,
  onRestoreDefaults,
}) => {
  const [formData, setFormData] = useState<ElectionConfig>(config);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formData);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-none hover:shadow-lg transition-all duration-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-zinc-500 text-xs font-semibold mb-1">
            <Settings className="w-4 h-4 text-[#FF5B26]" />
            <span>Control Panel</span>
          </div>
          <h2 className="text-xl font-bold text-zinc-900 tracking-tight">
            Election Settings & Parameters
          </h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Configure election dates, operational mode, and security protocols
          </p>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 animate-in fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Settings Saved
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Election State Controller (Live / Paused / Closed) */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-none hover:shadow-lg transition-all duration-300 space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            1. Polling Status & Operational Mode
          </h3>
          <p className="text-xs text-zinc-500">
            Control whether student voters can cast ballots right now.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Live Option */}
            <label
              className={`p-4 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                formData.status === "live"
                  ? "border-emerald-500 bg-emerald-50/30"
                  : "border-zinc-200 bg-white hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-zinc-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Polling
                </span>
                <input
                  type="radio"
                  name="status"
                  value="live"
                  checked={formData.status === "live"}
                  onChange={() => setFormData({ ...formData, status: "live" })}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                Voting booths are open; real-time votes are registered.
              </p>
            </label>

            {/* Paused Option */}
            <label
              className={`p-4 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                formData.status === "paused"
                  ? "border-amber-500 bg-amber-50/30"
                  : "border-zinc-200 bg-white hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-zinc-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Temporarily Paused
                </span>
                <input
                  type="radio"
                  name="status"
                  value="paused"
                  checked={formData.status === "paused"}
                  onChange={() => setFormData({ ...formData, status: "paused" })}
                  className="text-amber-600 focus:ring-amber-500"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                Booths temporarily on hold during audit or interval.
              </p>
            </label>

            {/* Closed Option */}
            <label
              className={`p-4 rounded-xl border-2 flex flex-col justify-between cursor-pointer transition-all ${
                formData.status === "closed"
                  ? "border-rose-500 bg-rose-50/30"
                  : "border-zinc-200 bg-white hover:bg-zinc-50"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-zinc-900 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  Election Concluded
                </span>
                <input
                  type="radio"
                  name="status"
                  value="closed"
                  checked={formData.status === "closed"}
                  onChange={() => setFormData({ ...formData, status: "closed" })}
                  className="text-rose-600 focus:ring-rose-500"
                />
              </div>
              <p className="text-[11px] text-zinc-500 mt-2">
                Polls closed; final tally locked and winner proclaimed.
              </p>
            </label>
          </div>
        </div>

        {/* General Details */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-none hover:shadow-lg transition-all duration-300 space-y-4">
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            2. General Election Meta
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Election Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                College / Institution Name
              </label>
              <input
                type="text"
                value={formData.collegeName}
                onChange={(e) =>
                  setFormData({ ...formData, collegeName: e.target.value })
                }
                className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Polling Window Timings
              </label>
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="text"
                  value={formData.startTime}
                  onChange={(e) =>
                    setFormData({ ...formData, startTime: e.target.value })
                  }
                  placeholder="09:00 AM"
                  className="bg-[#F8F9FA] border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800"
                />
                <input
                  type="text"
                  value={formData.endTime}
                  onChange={(e) =>
                    setFormData({ ...formData, endTime: e.target.value })
                  }
                  placeholder="04:30 PM"
                  className="bg-[#F8F9FA] border border-zinc-200 rounded-xl px-3 py-2 text-xs text-zinc-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Security & Rules */}
        <div className="bg-white rounded-2xl p-6 border border-zinc-200/90 shadow-none hover:shadow-lg transition-all duration-300 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
              3. Security & Validation Rules
            </h3>
          </div>

          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-zinc-900">
                  Strict Admission No (Ad NO) Verification
                </p>
                <p className="text-[11px] text-zinc-500">
                  Allows strictly 1 ballot cast per registered student admission number.
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                disabled
                className="rounded text-[#FF5B26] focus:ring-[#FF5B26]"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl border border-zinc-200 hover:bg-zinc-50 cursor-pointer">
              <div>
                <p className="text-xs font-bold text-zinc-900">
                  Encrypted Secret Ballot
                </p>
                <p className="text-[11px] text-zinc-500">
                  Decouples student identity from individual ballot selections.
                </p>
              </div>
              <input
                type="checkbox"
                checked={formData.isBallotSecret}
                onChange={(e) =>
                  setFormData({ ...formData, isBallotSecret: e.target.checked })
                }
                className="rounded text-[#FF5B26] focus:ring-[#FF5B26]"
              />
            </label>
          </div>
        </div>

        {/* Submit & Reset actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-[#FF5B26] hover:bg-[#e84c17] text-white text-xs font-bold transition-all border border-[#FF5B26] cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>

          <button
            type="button"
            onClick={onRestoreDefaults}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-zinc-200 text-zinc-600 text-xs font-semibold hover:bg-zinc-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Defaults</span>
          </button>
        </div>

        {/* Danger Zone */}
        <div className="bg-rose-50/40 rounded-2xl p-5 border border-rose-200/80 space-y-3">
          <div className="flex items-center gap-2 text-rose-700">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">
              Danger Zone
            </h4>
          </div>
          <p className="text-xs text-rose-600">
            Clear all cast ballots and reset student voting statuses back to unvoted for a fresh test run.
          </p>
          <button
            type="button"
            onClick={() => {
              if (confirm("Are you sure you want to reset all test votes to 0?")) {
                onResetVotes();
              }
            }}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Reset All Polled Votes
          </button>
        </div>
      </form>
    </div>
  );
};
