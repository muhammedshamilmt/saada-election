"use client";

import React, { useState, useRef } from "react";
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  Plus,
  Trash2,
  Users2,
  Copy,
} from "lucide-react";
import { Voter, ELECTION_CLASSES, ElectionClass } from "@/data/electionData";

interface ImportVotersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportVoters: (newVoters: Voter[]) => void;
  existingVoters: Voter[];
}

interface ParsedVoterRow {
  adNo: string;
  name: string;
  className: string;
  isValid: boolean;
  error?: string;
}

export const ImportVotersModal: React.FC<ImportVotersModalProps> = ({
  isOpen,
  onClose,
  onImportVoters,
  existingVoters,
}) => {
  const [activeTab, setActiveTab] = useState<"file" | "paste" | "manual">("file");
  const [parsedRows, setParsedRows] = useState<ParsedVoterRow[]>([]);
  const [pasteText, setPasteText] = useState("");
  const [manualRows, setManualRows] = useState<Array<{ adNo: string; name: string; className: ElectionClass }>>([
    { adNo: "", name: "", className: "D3" },
    { adNo: "", name: "", className: "FS1" },
    { adNo: "", name: "", className: "HS2" },
  ]);
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Validate a row against existing voters & allowed classes
  const validateRow = (adNo: string, name: string, className: string): ParsedVoterRow => {
    const cleanAdNo = adNo.trim().toUpperCase();
    const cleanName = name.trim();
    const cleanClass = className.trim().toUpperCase();

    if (!cleanAdNo) {
      return { adNo: cleanAdNo, name: cleanName, className: cleanClass, isValid: false, error: "Missing Ad NO" };
    }
    if (!cleanName) {
      return { adNo: cleanAdNo, name: cleanName, className: cleanClass, isValid: false, error: "Missing Student Name" };
    }

    const matchedClass = ELECTION_CLASSES.find((c) => c.toUpperCase() === cleanClass);
    if (!matchedClass) {
      return {
        adNo: cleanAdNo,
        name: cleanName,
        className: cleanClass,
        isValid: false,
        error: `Invalid Class "${cleanClass}". Must be one of: ${ELECTION_CLASSES.join(", ")}`,
      };
    }

    const isDuplicate = existingVoters.some((v) => v.adNo.toUpperCase() === cleanAdNo);
    if (isDuplicate) {
      return {
        adNo: cleanAdNo,
        name: cleanName,
        className: matchedClass,
        isValid: false,
        error: `Ad No "${cleanAdNo}" is already registered.`,
      };
    }

    return { adNo: cleanAdNo, name: cleanName, className: matchedClass, isValid: true };
  };

  // CSV File Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (!content) return;

      const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
      const rows: ParsedVoterRow[] = [];

      lines.forEach((line, index) => {
        // Skip header if line has "admission" or "ad no"
        if (
          index === 0 &&
          (line.toLowerCase().includes("admission") ||
            line.toLowerCase().includes("ad no") ||
            line.toLowerCase().includes("name"))
        ) {
          return;
        }

        // Support comma or tab separated
        const parts = line.split(/[,\t]/).map((p) => p.replace(/^"|"$/g, "").trim());
        if (parts.length >= 2) {
          const adNo = parts[0] || "";
          const name = parts[1] || "";
          const className = parts[2] || "D3";
          rows.push(validateRow(adNo, name, className));
        }
      });

      setParsedRows(rows);
    };
    reader.readAsText(file);
  };

  // Paste Text Parser
  const handleParsePaste = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.split(/\r?\n/).filter((l) => l.trim().length > 0);
    const rows: ParsedVoterRow[] = [];

    lines.forEach((line, index) => {
      if (
        index === 0 &&
        (line.toLowerCase().includes("admission") ||
          line.toLowerCase().includes("ad no") ||
          line.toLowerCase().includes("name"))
      ) {
        return;
      }

      const parts = line.split(/[,\t]/).map((p) => p.replace(/^"|"$/g, "").trim());
      if (parts.length >= 2) {
        const adNo = parts[0] || "";
        const name = parts[1] || "";
        const className = parts[2] || "D3";
        rows.push(validateRow(adNo, name, className));
      }
    });

    setParsedRows(rows);
  };

  // Manual rows handler
  const handleAddManualRow = () => {
    setManualRows([...manualRows, { adNo: "", name: "", className: "D3" }]);
  };

  const handleRemoveManualRow = (index: number) => {
    setManualRows(manualRows.filter((_, i) => i !== index));
  };

  const handleParseManual = () => {
    const rows: ParsedVoterRow[] = manualRows
      .filter((r) => r.adNo.trim() || r.name.trim())
      .map((r) => validateRow(r.adNo, r.name, r.className));
    setParsedRows(rows);
  };

  // Download Sample CSV
  const handleDownloadSample = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      ["Admission No,Student Name,Class", "AD-2001,Anoop Nambiar,D3", "AD-2002,Safiya Mariyam,FS1", "AD-2003,Gokul Krishna,HS2", "AD-2004,Liyana Fathima,DGF", "AD-2005,Rohan Das,PG"].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "saada_voters_import_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Confirm Import
  const handleCommitImport = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    const newVoters: Voter[] = validRows.map((r, i) => ({
      id: `v-imported-${Date.now()}-${i}`,
      adNo: r.adNo,
      name: r.name,
      className: r.className as ElectionClass,
      hasVoted: false,
    }));

    onImportVoters(newVoters);
    onClose();
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const invalidCount = parsedRows.length - validCount;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-zinc-200 w-full max-w-2xl shadow-none hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-50 text-[#FF5B26] border border-orange-200/60 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-900">
                Bulk Import Voters
              </h3>
              <p className="text-xs text-zinc-400">
                Upload CSV or input multiple students with Ad NO, Name, and Class
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

        {/* Tab Switcher & Sample Download */}
        <div className="px-6 pt-4 border-b border-zinc-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl border border-zinc-200/80">
            <button
              onClick={() => setActiveTab("file")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "file"
                  ? "bg-white text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Upload CSV File
            </button>
            <button
              onClick={() => setActiveTab("paste")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "paste"
                  ? "bg-white text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Paste Rows
            </button>
            <button
              onClick={() => setActiveTab("manual")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === "manual"
                  ? "bg-white text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-800"
              }`}
            >
              Multi-Row Table
            </button>
          </div>

          <button
            onClick={handleDownloadSample}
            className="flex items-center gap-1 text-[11px] font-bold text-[#FF5B26] hover:text-[#e84c17] hover:underline cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download CSV Template</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* TAB 1: FILE UPLOAD */}
          {activeTab === "file" && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-200 hover:border-[#FF5B26] rounded-2xl p-6 text-center cursor-pointer transition-all bg-zinc-50/50 hover:bg-orange-50/20 group"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".csv,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div className="w-10 h-10 rounded-xl bg-white border border-zinc-200 group-hover:border-[#FF5B26] mx-auto flex items-center justify-center text-zinc-500 group-hover:text-[#FF5B26] transition-colors mb-2">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-zinc-800">
                  {fileName ? fileName : "Click to browse and upload CSV voter list"}
                </p>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Expected format: <code className="font-mono text-[#FF5B26]">Admission No, Student Name, Class</code>
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: PASTE TEXT */}
          {activeTab === "paste" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-zinc-800">
                  Paste records from Excel or Sheets
                </label>
                <span className="text-[10px] text-zinc-400">1 line per student</span>
              </div>
              <textarea
                rows={5}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={`AD-2001, Anoop Nambiar, D3\nAD-2002, Safiya Mariyam, FS1\nAD-2003, Gokul Krishna, HS2`}
                className="w-full bg-[#F8F9FA] border border-zinc-200 rounded-xl p-3 text-xs font-mono text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#FF5B26]"
              />
              <button
                type="button"
                onClick={handleParsePaste}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer"
              >
                Parse Pasted Rows
              </button>
            </div>
          )}

          {/* TAB 3: MULTI-ROW MANUAL INPUT TABLE */}
          {activeTab === "manual" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-800">
                  Batch Multi-Row Entry
                </span>
                <button
                  type="button"
                  onClick={handleAddManualRow}
                  className="flex items-center gap-1 text-xs font-bold text-[#FF5B26] hover:text-[#e84c17] cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Row</span>
                </button>
              </div>

              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {manualRows.map((row, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-400 w-5">
                      #{idx + 1}
                    </span>
                    <input
                      type="text"
                      placeholder="Ad NO (e.g. AD-2005)"
                      value={row.adNo}
                      onChange={(e) => {
                        const updated = [...manualRows];
                        updated[idx].adNo = e.target.value;
                        setManualRows(updated);
                      }}
                      className="w-1/3 bg-[#F8F9FA] border border-zinc-200 rounded-xl px-2.5 py-1.5 text-xs font-mono font-bold text-zinc-800"
                    />
                    <input
                      type="text"
                      placeholder="Student Full Name"
                      value={row.name}
                      onChange={(e) => {
                        const updated = [...manualRows];
                        updated[idx].name = e.target.value;
                        setManualRows(updated);
                      }}
                      className="flex-1 bg-[#F8F9FA] border border-zinc-200 rounded-xl px-2.5 py-1.5 text-xs text-zinc-800"
                    />
                    <select
                      value={row.className}
                      onChange={(e) => {
                        const updated = [...manualRows];
                        updated[idx].className = e.target.value as ElectionClass;
                        setManualRows(updated);
                      }}
                      className="w-24 bg-[#F8F9FA] border border-zinc-200 rounded-xl px-2 py-1.5 text-xs font-bold text-zinc-800"
                    >
                      {ELECTION_CLASSES.map((cls) => (
                        <option key={cls} value={cls}>
                          {cls}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => handleRemoveManualRow(idx)}
                      className="text-zinc-400 hover:text-rose-600 p-1 rounded"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleParseManual}
                className="px-4 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-bold cursor-pointer"
              >
                Validate & Prepare Import
              </button>
            </div>
          )}

          {/* PARSED ROWS PREVIEW TABLE */}
          {parsedRows.length > 0 && (
            <div className="space-y-3 pt-4 border-t border-zinc-100">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-zinc-900">
                    Parsed Preview ({parsedRows.length} total)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200 text-[10px]">
                    {validCount} Ready
                  </span>
                  {invalidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 font-bold border border-rose-200 text-[10px]">
                      {invalidCount} Invalid/Duplicate
                    </span>
                  )}
                </div>
              </div>

              <div className="border border-zinc-200 rounded-2xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-50 text-zinc-500 font-bold border-b border-zinc-200">
                    <tr>
                      <th className="py-2 px-3">AD NO</th>
                      <th className="py-2 px-3">STUDENT NAME</th>
                      <th className="py-2 px-3">CLASS</th>
                      <th className="py-2 px-3 text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 text-zinc-700 font-medium">
                    {parsedRows.map((r, i) => (
                      <tr key={i} className={r.isValid ? "hover:bg-zinc-50" : "bg-rose-50/40"}>
                        <td className="py-2 px-3 font-mono font-bold text-zinc-900">
                          {r.adNo || "—"}
                        </td>
                        <td className="py-2 px-3">{r.name || "—"}</td>
                        <td className="py-2 px-3 font-bold text-zinc-800">
                          {r.className || "—"}
                        </td>
                        <td className="py-2 px-3 text-right">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-[10px]" title={r.error}>
                              <AlertCircle className="w-3.5 h-3.5" /> {r.error}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between gap-3 bg-zinc-50/50">
          <span className="text-xs text-zinc-400">
            {validCount > 0 ? `${validCount} voters will be added to the electoral roll.` : "Select or paste records to import."}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-zinc-200 text-xs font-semibold text-zinc-600 hover:bg-zinc-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={validCount === 0}
              onClick={handleCommitImport}
              className="px-5 py-2 rounded-xl bg-[#FF5B26] hover:bg-[#e84c17] disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all border border-[#FF5B26] cursor-pointer"
            >
              Import {validCount} Voters
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

