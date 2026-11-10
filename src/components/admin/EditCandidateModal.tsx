"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Award, Upload, Image as ImageIcon, Check, Loader2, Pencil } from "lucide-react";
import { Candidate, ELECTION_CLASSES, ElectionClass } from "@/data/electionData";
import { uploadImageToSupabase } from "@/lib/supabaseClient";

interface EditCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: Candidate | null;
  onUpdateCandidate: (candidate: Candidate) => Promise<void> | void;
  existingPosts?: string[];
}

export const EditCandidateModal: React.FC<EditCandidateModalProps> = ({
  isOpen,
  onClose,
  candidate,
  onUpdateCandidate,
  existingPosts = [],
}) => {
  const [name, setName] = useState("");
  const [selectedPostOption, setSelectedPostOption] = useState<string>("President");
  const [customPost, setCustomPost] = useState<string>("");
  const [adNo, setAdNo] = useState("");
  const [className, setClassName] = useState<ElectionClass>("D3");
  const [tagline, setTagline] = useState("");
  const [symbolUrl, setSymbolUrl] = useState<string>("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  const [isUploadingSymbol, setIsUploadingSymbol] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const symbolFileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    if (candidate) {
      setName(candidate.name);
      setAdNo(candidate.adNo);
      setClassName((candidate.className as ElectionClass) || "D3");
      setTagline(candidate.tagline || "");
      setSymbolUrl(candidate.symbolUrl || "");
      setAvatarUrl(candidate.avatarUrl || "");

      if (allAvailablePosts.includes(candidate.post)) {
        setSelectedPostOption(candidate.post);
        setCustomPost("");
      } else {
        setSelectedPostOption("__custom__");
        setCustomPost(candidate.post);
      }
    }
  }, [candidate]);

  if (!isOpen || !candidate) return null;

  const isCustomPost = selectedPostOption === "__custom__";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !adNo.trim()) return;

    setIsSubmitting(true);
    const finalPost = (isCustomPost ? customPost.trim() : selectedPostOption) || candidate.post;

    const updatedCandidate: Candidate = {
      ...candidate,
      name: name.trim(),
      post: finalPost,
      adNo: adNo.trim().toUpperCase(),
      className,
      tagline: tagline.trim(),
      symbolUrl: symbolUrl || candidate.symbolUrl,
      avatarUrl: avatarUrl || candidate.avatarUrl,
    };

    try {
      await onUpdateCandidate(updatedCandidate);
      onClose();
    } catch (err) {
      console.error("Failed to update candidate:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-lg shadow-2xl transition-shadow duration-300 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF5B26] border border-orange-200/60 flex items-center justify-center">
              <Pencil className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Edit Candidate
              </h3>
              <p className="text-xs text-zinc-400">
                Modify candidate details, post, or campaign assets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl border border-zinc-200 flex items-center justify-center text-zinc-400 hover:text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer"
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
                  placeholder="Type new post title..."
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
                Admission Number *
              </label>
              <input
                type="text"
                required
                value={adNo}
                onChange={(e) => setAdNo(e.target.value.toUpperCase())}
                placeholder="e.g. AD-1045"
                className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
              />
            </div>
          </div>

          {/* Class Selection */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              Enrolled Class / Batch *
            </label>
            <select
              value={className}
              onChange={(e) => setClassName(e.target.value as ElectionClass)}
              className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
            >
              {ELECTION_CLASSES.map((cls) => (
                <option key={cls} value={cls}>
                  Class {cls}
                </option>
              ))}
            </select>
          </div>

          {/* Campaign Tagline / Manifesto Quote */}
          <div>
            <label className="block text-xs font-bold text-zinc-800 mb-1">
              Campaign Tagline / Manifesto Quote
            </label>
            <input
              type="text"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              placeholder="e.g. For unity, transparency, and student empowerment."
              className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
            />
          </div>

          {/* Image Uploads: Avatar & Symbol */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-100">
            {/* Candidate Avatar Upload */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Candidate Photo
              </label>
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-2xl border-2 border-zinc-200 overflow-hidden bg-zinc-50 shrink-0">
                  <img
                    src={avatarUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <input
                    type="file"
                    ref={avatarFileInputRef}
                    onChange={handleAvatarFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => avatarFileInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-[11px] font-bold text-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#FF5B26]" />
                    <span>{isUploadingAvatar ? "Uploading..." : "Change Photo"}</span>
                  </button>
                  <p className="text-[10px] text-zinc-400">PNG, JPG, WebP</p>
                </div>
              </div>
            </div>

            {/* Election Symbol Upload */}
            <div>
              <label className="block text-xs font-bold text-zinc-800 mb-1.5">
                Election Symbol
              </label>
              <div className="flex items-center gap-3">
                <div className="relative w-14 h-14 rounded-2xl border-2 border-zinc-200 p-2 bg-zinc-50 shrink-0 flex items-center justify-center">
                  <img
                    src={symbolUrl}
                    alt="Symbol Preview"
                    className="w-full h-full object-contain"
                  />
                  {isUploadingSymbol && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Loader2 className="w-5 h-5 text-white animate-spin" />
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <input
                    type="file"
                    ref={symbolFileInputRef}
                    onChange={handleSymbolFileChange}
                    accept="image/*,.svg"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => symbolFileInputRef.current?.click()}
                    disabled={isUploadingSymbol}
                    className="px-3 py-1.5 rounded-xl border border-zinc-200 bg-white hover:bg-zinc-50 text-[11px] font-bold text-zinc-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#FF5B26]" />
                    <span>{isUploadingSymbol ? "Uploading..." : "Change Symbol"}</span>
                  </button>
                  <p className="text-[10px] text-zinc-400">SVG, PNG, JPG</p>
                </div>
              </div>
            </div>
          </div>

          {/* Current Live Votes Display */}
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200/80 flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium">Recorded Tally</span>
            <span className="font-bold text-zinc-900">{candidate.votes} votes</span>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-zinc-200 text-xs font-bold text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploadingAvatar || isUploadingSymbol}
              className="px-5 py-2.5 rounded-xl bg-[#FF5B26] hover:bg-[#e84c17] disabled:opacity-50 text-white text-xs font-bold transition-all border border-[#FF5B26] shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Update Candidate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

