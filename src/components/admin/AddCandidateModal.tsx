"use client";

import React, { useState, useRef } from "react";
import { X, Award, Upload, Image as ImageIcon, Check, Loader2 } from "lucide-react";
import { Candidate, ELECTION_CLASSES, ElectionClass } from "@/data/electionData";
import { uploadImageToSupabase } from "@/lib/supabaseClient";

interface AddCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddCandidate: (candidate: Candidate) => void;
  existingPosts?: string[];
}

export const AddCandidateModal: React.FC<AddCandidateModalProps> = ({
  isOpen,
  onClose,
  onAddCandidate,
  existingPosts = [],
}) => {
  const [name, setName] = useState("");
  const [selectedPostOption, setSelectedPostOption] = useState<string>("President");
  const [customPost, setCustomPost] = useState<string>("");
  const [adNo, setAdNo] = useState("");
  const [className, setClassName] = useState<ElectionClass>("D3");
  const [tagline, setTagline] = useState("");

  const isCustomPost = selectedPostOption === "__custom__";

  const allAvailablePosts = Array.from(
    new Set([
      "President",
      "General Secretary",
      "Treasurer",
      "Vice President",
      "Arts Secretary",
      "Sports Secretary",
      ...existingPosts,
    ])
  );

  // Upload states
  const [symbolUrl, setSymbolUrl] = useState<string>(
    "https://api.iconify.design/fluent-emoji-flat:rocket.svg"
  );
  const [avatarUrl, setAvatarUrl] = useState<string>(
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80"
  );

  const [isUploadingSymbol, setIsUploadingSymbol] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const symbolFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSymbolFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingSymbol(true);
      try {
        const publicUrl = await uploadImageToSupabase(file, "symbols");
        setSymbolUrl(publicUrl);
      } catch (err) {
        console.warn("Fallback to local preview:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setSymbolUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingSymbol(false);
      }
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingAvatar(true);
      try {
        const publicUrl = await uploadImageToSupabase(file, "avatars");
        setAvatarUrl(publicUrl);
      } catch (err) {
        console.warn("Fallback to local preview:", err);
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === "string") {
            setAvatarUrl(reader.result);
          }
        };
        reader.readAsDataURL(file);
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !adNo.trim()) return;

    const finalPost = (isCustomPost ? customPost.trim() : selectedPostOption) || "President";

    const newCandidate: Candidate = {
      id: `c-${Date.now()}`,
      name: name.trim(),
      post: finalPost,
      adNo: adNo.trim().toUpperCase(),
      className,
      tagline: tagline.trim() || "Dedicated to student representation.",
      symbolUrl: symbolUrl || "https://api.iconify.design/fluent-emoji-flat:star.svg",
      avatarUrl:
        avatarUrl ||
        "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&auto=format&fit=crop&q=80",
      votes: 0,
      status: "approved",
    };

    onAddCandidate(newCandidate);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-lg shadow-none hover:shadow-2xl transition-shadow duration-300 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF5B26] border border-orange-200/60 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Nominate Candidate
              </h3>
              <p className="text-xs text-zinc-400">
                Register candidate for student union election
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
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Contested Section / Executive Post */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              Contested Section / Executive Post *
            </label>
            <select
              value={selectedPostOption}
              onChange={(e) => setSelectedPostOption(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
            >
              {allAvailablePosts.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
              <option value="__custom__">+ Enter Custom / New Post...</option>
            </select>

            {isCustomPost && (
              <div className="mt-2 animate-in fade-in">
                <input
                  type="text"
                  required
                  placeholder="Type new post title (e.g. Magazine Editor, Class Rep)..."
                  value={customPost}
                  onChange={(e) => setCustomPost(e.target.value)}
                  className="w-full bg-white border border-[#FF5B26] rounded-xl px-3.5 py-2 text-xs font-semibold text-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#FF5B26]/30"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Full Name & Ad No */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                Candidate Full Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Adil Rahman"
                className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1">
                Admission No (Ad NO) *
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
          </div>

          {/* Class (No department, No academic year!) */}
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

          {/* Tagline */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              Campaign Tagline
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. Transparent student leadership & progress"
              className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl px-3.5 py-2 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
            />
          </div>

          {/* Image Upload: Election Symbol */}
          <div className="p-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-zinc-800">
                Election Symbol (Upload Image) *
              </label>
              {symbolUrl && (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center p-1.5 shrink-0 overflow-hidden">
                <img
                  src={symbolUrl}
                  alt="Symbol Preview"
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  ref={symbolFileInputRef}
                  accept="image/*"
                  onChange={handleSymbolFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingSymbol}
                  onClick={() => symbolFileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUploadingSymbol ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-[#FF5B26] animate-spin" />
                      <span>Uploading to Supabase Bucket...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Upload Symbol File (Supabase)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Image Upload: Photo Avatar */}
          <div className="p-3.5 rounded-2xl border border-zinc-200 bg-zinc-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-zinc-800">
                Candidate Photo Avatar (Upload Image) *
              </label>
              {avatarUrl && (
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check className="w-3 h-3" /> Selected
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white border border-zinc-200 flex items-center justify-center shrink-0 overflow-hidden">
                <img
                  src={avatarUrl}
                  alt="Avatar Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-1">
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  disabled={isUploadingAvatar}
                  onClick={() => avatarFileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isUploadingAvatar ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 text-[#FF5B26] animate-spin" />
                      <span>Uploading to Supabase Bucket...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Upload Photo File (Supabase)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
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
              Save Candidate
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
