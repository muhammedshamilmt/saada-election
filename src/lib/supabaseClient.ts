import { createClient } from "@supabase/supabase-js";
import { Candidate, Voter, ElectionConfig } from "@/data/electionData";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://pivvnbbbzknlqsvjenqn.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpdnZuYmJiemtubHFzdmplbnFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQyMzM4OTgsImV4cCI6MjEwOTgwOTg5OH0.dvswnSf3PawIfMOml_v6lJ05AqJPseEJE6HsE5IV-t0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Check if database operations are enabled.
 * Controlled by boolean environment flags:
 * - NEXT_PUBLIC_DB_IS_ENABLE
 * - NEXT_PUBLIC_DB_ENABLED
 * - DB_IS_ENABLE
 * - db_isenble
 * When set to "false" (or false / 0), database storing / putting is completely bypassed
 * so sound, voting animations, and UI can be tested safely without altering database state.
 */
export function isDbEnabled(): boolean {
  const envVal =
    process.env.NEXT_PUBLIC_DB_IS_ENABLE ??
    process.env.NEXT_PUBLIC_DB_ENABLED ??
    process.env.DB_IS_ENABLE ??
    (process.env as Record<string, string | undefined>)["db_isenble"] ??
    "true";

  if (typeof envVal === "string") {
    const clean = envVal.trim().toLowerCase();
    if (clean === "false" || clean === "0" || clean === "no" || clean === "off") {
      return false;
    }
  }
  return true;
}

// Built-in sample candidate roster for offline / sound testing mode
const TEST_FALLBACK_CANDIDATES: Candidate[] = [
  {
    id: "test-c1",
    name: "Fayis PV",
    post: "President",
    adNo: "AD-101",
    className: "D3",
    tagline: "Dedicated to student progress and welfare.",
    symbolUrl: "https://api.iconify.design/fluent-emoji-flat:rocket.svg",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80",
    votes: 0,
    status: "approved",
  },
  {
    id: "test-c2",
    name: "S. Muhsin Thangal",
    post: "President",
    adNo: "AD-102",
    className: "D3",
    tagline: "Empowering students through active leadership.",
    symbolUrl: "https://api.iconify.design/fluent-emoji-flat:star.svg",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80",
    votes: 0,
    status: "approved",
  },
  {
    id: "test-c3",
    name: "Muhammed Ansif",
    post: "General Secretary",
    adNo: "AD-103",
    className: "D2",
    tagline: "Transparent and accessible student governance.",
    symbolUrl: "https://api.iconify.design/fluent-emoji-flat:pen.svg",
    avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80",
    votes: 0,
    status: "approved",
  },
  {
    id: "test-c4",
    name: "Muhammed Sinan P",
    post: "Treasurer",
    adNo: "AD-104",
    className: "DGF",
    tagline: "Accountability and financial integrity for all unions.",
    symbolUrl: "https://api.iconify.design/fluent-emoji-flat:abacus.svg",
    avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=400&auto=format&fit=crop&q=80",
    votes: 0,
    status: "approved",
  },
];

/**
 * Upload an image file directly to the Supabase Storage "election-assets" bucket
 * and return the public URL.
 */
export async function uploadImageToSupabase(
  file: File,
  folder: "avatars" | "symbols" = "avatars"
): Promise<string> {
  // If DB is disabled, bypass cloud storage and generate instant local object URL
  if (!isDbEnabled()) {
    console.log("[DB_DISABLED: TEST MODE] Image upload bypassed, using local object preview");
    return URL.createObjectURL(file);
  }

  try {
    const fileExt = file.name.split(".").pop();
    const cleanFileName = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 9)}.${fileExt}`;
    const filePath = `${folder}/${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("election-assets")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      console.error("Supabase Storage Upload Error:", uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("election-assets")
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error("Failed to upload image to Supabase:", error);
    throw error;
  }
}

/**
 * Fetch all candidates from Supabase
 */
export async function fetchCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabase
    .from("candidates")
    .select("*")
    .order("votes", { ascending: false });

  if (error || !data || data.length === 0) {
    if (!isDbEnabled()) {
      return TEST_FALLBACK_CANDIDATES;
    }
    if (error) console.error("Error fetching candidates:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    name: row.name,
    post: row.post as Candidate["post"],
    adNo: row.ad_no,
    className: row.class_name,
    tagline: row.tagline || "",
    symbolUrl: row.symbol_url || "",
    avatarUrl: row.avatar_url || "",
    votes: row.votes || 0,
    status: (row.status as Candidate["status"]) || "approved",
  }));
}

/**
 * Insert or update a candidate in Supabase
 */
export async function saveCandidate(candidate: Candidate): Promise<boolean> {
  if (!isDbEnabled()) {
    console.log("[DB_DISABLED: TEST MODE] saveCandidate: Bypassed database write");
    return true;
  }

  const { error } = await supabase.from("candidates").upsert({
    id: candidate.id,
    name: candidate.name,
    post: candidate.post,
    ad_no: candidate.adNo,
    class_name: candidate.className,
    tagline: candidate.tagline,
    symbol_url: candidate.symbolUrl,
    avatar_url: candidate.avatarUrl,
    votes: candidate.votes,
    status: candidate.status,
  });

  if (error) {
    console.error("Error saving candidate:", error);
    return false;
  }
  return true;
}

/**
 * Update an existing candidate in Supabase
 */
export async function updateCandidate(candidate: Candidate): Promise<boolean> {
  if (!isDbEnabled()) {
    console.log("[DB_DISABLED: TEST MODE] updateCandidate: Bypassed database update");
    return true;
  }

  const { error } = await supabase
    .from("candidates")
    .update({
      name: candidate.name,
      post: candidate.post,
      ad_no: candidate.adNo,
      class_name: candidate.className,
      tagline: candidate.tagline,
      symbol_url: candidate.symbolUrl,
      avatar_url: candidate.avatarUrl,
      votes: candidate.votes,
      status: candidate.status,
    })
    .eq("id", candidate.id);

  if (error) {
    console.error("Error updating candidate:", error);
    return false;
  }
  return true;
}

/**
 * Delete a candidate from Supabase
 */
export async function deleteCandidate(id: string): Promise<boolean> {
  if (!isDbEnabled()) {
    console.log("[DB_DISABLED: TEST MODE] deleteCandidate: Bypassed database delete");
    return true;
  }

  const { error } = await supabase.from("candidates").delete().eq("id", id);
  if (error) {
    console.error("Error deleting candidate:", error);
    return false;
  }
  return true;
}

/**
 * Fetch all voters from Supabase
 */
export async function fetchVoters(): Promise<Voter[]> {
  const { data, error } = await supabase
    .from("voters")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isDbEnabled()) console.error("Error fetching voters:", error);
    return [];
  }

  return (data || []).map((row) => ({
    id: row.id,
    adNo: row.ad_no,
    name: row.name,
    className: row.class_name,
    hasVoted: Boolean(row.has_voted),
    votedAt: row.voted_at || undefined,
  }));
}

/**
 * Save a single voter in Supabase
 */
export async function saveVoter(voter: Voter): Promise<boolean> {
  if (!isDbEnabled()) {
    console.log("[DB_DISABLED: TEST MODE] saveVoter: Bypassed database write");
    return true;
  }

  const { error } = await supabase.from("voters").upsert({
    id: voter.id,
    ad_no: voter.adNo,
    name: voter.name,
    class_name: voter.className,
    hasVoted: voter.hasVoted,
    voted_at: voter.votedAt || null,
  });

  if (error) {
    console.error("Error saving voter:", error);
    return false;
  }
  return true;
}

/**
 * Bulk save voters in Supabase
 */
export async function bulkSaveVoters(voters: Voter[]): Promise<boolean> {
  if (!isDbEnabled()) {
    console.log("[DB_DISABLED: TEST MODE] bulkSaveVoters: Bypassed database write");
    return true;
  }

  const payload = voters.map((v) => ({
    id: v.id,
    ad_no: v.adNo,
    name: v.name,
    class_name: v.className,
    has_voted: v.hasVoted,
    voted_at: v.votedAt || null,
  }));

  const { error } = await supabase.from("voters").upsert(payload);
  if (error) {
    console.error("Error bulk saving voters:", error);
    return false;
  }
  return true;
}

/**
 * Toggle voter status in Supabase
 */
export async function updateVoterStatus(
  id: string,
  hasVoted: boolean,
  votedAt?: string
): Promise<boolean> {
  if (!isDbEnabled()) {
    console.log("[DB_DISABLED: TEST MODE] updateVoterStatus: Bypassed database write");
    return true;
  }

  const { error } = await supabase
    .from("voters")
    .update({
      has_voted: hasVoted,
      voted_at: hasVoted ? votedAt || new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : null,
    })
    .eq("id", id);

  if (error) {
    console.error("Error updating voter status:", error);
    return false;
  }
  return true;
}

/**
 * Delete a voter from Supabase
 */
export async function deleteVoter(id: string): Promise<boolean> {
  if (!isDbEnabled()) {
    console.log("[DB_DISABLED: TEST MODE] deleteVoter: Bypassed database delete");
    return true;
  }

  const { error } = await supabase.from("voters").delete().eq("id", id);
  if (error) {
    console.error("Error deleting voter:", error);
    return false;
  }
  return true;
}

/**
 * Record a ballot and increment candidate votes
 * Strictly enforces that a voter can only vote ONCE when DB is enabled.
 * When DB is disabled (test mode), simulates immediate success without storing data in the DB.
 */
export async function submitBallot(
  voterId: string,
  receiptCode: string,
  presidentId?: string,
  secretaryId?: string,
  treasurerId?: string,
  allCandidateIds?: string[]
): Promise<{ success: boolean; error?: string }> {
  // If DB is disabled, simulate immediate success without storing anything in Supabase
  if (!isDbEnabled()) {
    console.log(
      `[DB_DISABLED: TEST MODE] submitBallot bypassed database storage. Voter: ${voterId}, Receipt: ${receiptCode}. Zero data stored in DB.`
    );
    return { success: true };
  }

  const pollTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  // 1. Verify in database that this voter has NOT already voted
  const { data: voterData, error: voterCheckError } = await supabase
    .from("voters")
    .select("has_voted, voted_at, name, ad_no")
    .eq("id", voterId)
    .single();

  if (voterCheckError || !voterData) {
    return {
      success: false,
      error: "Voter verification record not found in database.",
    };
  }

  if (voterData.has_voted) {
    return {
      success: false,
      error: `Voter ${voterData.name} (${voterData.ad_no}) has ALREADY cast their ballot at ${
        voterData.voted_at || "earlier"
      }. A voter cannot vote more than once!`,
    };
  }

  // 2. Check if a ballot has already been recorded for this voter
  const { data: existingBallot } = await supabase
    .from("ballots")
    .select("id")
    .eq("voter_id", voterId)
    .maybeSingle();

  if (existingBallot) {
    return {
      success: false,
      error: "A ballot has already been securely cast by this student.",
    };
  }

  // 3. Insert ballot record (protected by DB UNIQUE index on voter_id)
  const { error: ballotError } = await supabase.from("ballots").insert({
    voter_id: voterId,
    receipt_code: receiptCode,
    president_id: presidentId || null,
    secretary_id: secretaryId || null,
    treasurer_id: treasurerId || null,
  });

  if (ballotError) {
    console.error("Ballot insert rejected:", ballotError);
    if (ballotError.code === "23505") {
      return {
        success: false,
        error: "Duplicate ballot blocked! Each student is strictly restricted to one vote.",
      };
    }
    return {
      success: false,
      error: `Failed to record ballot: ${ballotError.message}`,
    };
  }

  // 4. Mark voter as voted
  const { error: voterUpdateError } = await supabase
    .from("voters")
    .update({ has_voted: true, voted_at: pollTime })
    .eq("id", voterId)
    .eq("has_voted", false);

  if (voterUpdateError) {
    console.error("Error updating voter status:", voterUpdateError);
  }

  // 5. Increment candidate votes only after the ballot record is confirmed
  const idsToIncrement = Array.from(
    new Set(
      [
        ...(allCandidateIds || []),
        presidentId,
        secretaryId,
        treasurerId,
      ].filter(Boolean) as string[]
    )
  );

  for (const cid of idsToIncrement) {
    const { data: cand } = await supabase
      .from("candidates")
      .select("votes")
      .eq("id", cid)
      .single();

    if (cand) {
      await supabase
        .from("candidates")
        .update({ votes: (cand.votes || 0) + 1 })
        .eq("id", cid);
    }
  }

  return { success: true };
}

/**
 * Reset all votes to 0 and all voters to unvoted
 */
export async function resetAllElectionVotes(): Promise<boolean> {
  if (!isDbEnabled()) {
    console.log("[DB_DISABLED: TEST MODE] resetAllElectionVotes: Bypassed database reset");
    return true;
  }

  // Clear ballots
  await supabase.from("ballots").delete().neq("id", "none");

  // Reset candidates
  await supabase.from("candidates").update({ votes: 0 }).neq("id", "none");

  // Reset voters
  await supabase
    .from("voters")
    .update({ has_voted: false, voted_at: null })
    .neq("id", "none");

  return true;
}

export interface DummyRoleTally {
  post: string;
  totalVotes: number;
  allocations: Record<string, number>; // candidateId -> vote count
  updatedAt?: string;
}

/**
 * Fetch all dummy role tallies from Supabase.
 * Read strictly from the isolated dummy_role_tallies table.
 */
export async function fetchDummyRoleTallies(): Promise<Record<string, DummyRoleTally>> {
  try {
    const { data, error } = await supabase
      .from("dummy_role_tallies")
      .select("*");

    if (error || !data) {
      return {};
    }

    const result: Record<string, DummyRoleTally> = {};
    for (const row of data) {
      result[row.post] = {
        post: row.post,
        totalVotes: row.total_votes || 0,
        allocations: row.allocations || {},
        updatedAt: row.updated_at,
      };
    }
    return result;
  } catch (err) {
    console.warn("fetchDummyRoleTallies error:", err);
    return {};
  }
}

/**
 * Save / Update dummy role tally in Supabase.
 * Strictly writes to dummy_role_tallies & dummy_votes tables only.
 * Guaranteed 100% isolated: DOES NOT touch ballots, voters, or candidate votes!
 */
export async function saveDummyRoleTally(
  post: string,
  totalVotes: number,
  allocations: Record<string, number>,
  candidates: Candidate[]
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    // 1. Upsert role tally record
    const { error: roleError } = await supabase
      .from("dummy_role_tallies")
      .upsert({
        post,
        total_votes: totalVotes,
        allocations,
        updated_at: now,
      });

    if (roleError) {
      console.error("Error upserting dummy_role_tallies:", roleError);
    }

    // 2. Upsert candidate-level records for relational queries
    const relevantCandidates = candidates.filter(
      (c) => c.post.toLowerCase() === post.toLowerCase()
    );

    if (relevantCandidates.length > 0) {
      const records = relevantCandidates.map((c) => ({
        candidate_id: c.id,
        post: c.post,
        candidate_name: c.name,
        dummy_votes: allocations[c.id] || 0,
        total_role_votes: totalVotes,
        updated_at: now,
      }));

      const { error: candError } = await supabase
        .from("dummy_votes")
        .upsert(records);

      if (candError) {
        console.error("Error upserting dummy_votes:", candError);
      }
    }

    return true;
  } catch (err) {
    console.error("Failed to save dummy role tally:", err);
    return false;
  }
}

export interface RoleRevealStatus {
  post: string;
  is_revealed: boolean;
  revealed_at?: string;
  data_source: "dummy" | "official";
  winner_id?: string;
  winner_name?: string;
  winner_votes?: number;
  total_votes?: number;
  updated_at?: string;
}

/**
 * Fetch all role reveal statuses from Supabase.
 */
export async function fetchRevealStatuses(): Promise<Record<string, RoleRevealStatus>> {
  try {
    const { data, error } = await supabase
      .from("election_reveal_status")
      .select("*");

    if (error) {
      console.error("Error fetching election_reveal_status:", error);
      return {};
    }

    const map: Record<string, RoleRevealStatus> = {};
    (data || []).forEach((row: any) => {
      map[row.post] = {
        post: row.post,
        is_revealed: Boolean(row.is_revealed),
        revealed_at: row.revealed_at,
        data_source: row.data_source || "dummy",
        winner_id: row.winner_id,
        winner_name: row.winner_name,
        winner_votes: row.winner_votes || 0,
        total_votes: row.total_votes || 0,
        updated_at: row.updated_at,
      };
    });
    return map;
  } catch (err) {
    console.error("Failed to fetch reveal statuses:", err);
    return {};
  }
}

/**
 * Update reveal status for a single role.
 */
export async function publishRoleReveal(
  post: string,
  isRevealed: boolean,
  meta?: {
    source?: "dummy" | "official";
    winnerId?: string;
    winnerName?: string;
    winnerVotes?: number;
    totalVotes?: number;
  }
): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const payload = {
      post,
      is_revealed: isRevealed,
      revealed_at: isRevealed ? now : null,
      data_source: meta?.source || "dummy",
      winner_id: meta?.winnerId || null,
      winner_name: meta?.winnerName || null,
      winner_votes: meta?.winnerVotes || 0,
      total_votes: meta?.totalVotes || 0,
      updated_at: now,
    };

    const { error } = await supabase
      .from("election_reveal_status")
      .upsert(payload);

    if (error) {
      console.error("Error publishing role reveal:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed to publish role reveal:", err);
    return false;
  }
}

/**
 * Bulk publish or un-publish all roles at once.
 */
export async function publishAllRoleReveals(
  items: Array<{
    post: string;
    isRevealed: boolean;
    source?: "dummy" | "official";
    winnerId?: string;
    winnerName?: string;
    winnerVotes?: number;
    totalVotes?: number;
  }>
): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const records = items.map((item) => ({
      post: item.post,
      is_revealed: item.isRevealed,
      revealed_at: item.isRevealed ? now : null,
      data_source: item.source || "dummy",
      winner_id: item.winnerId || null,
      winner_name: item.winnerName || null,
      winner_votes: item.winnerVotes || 0,
      total_votes: item.totalVotes || 0,
      updated_at: now,
    }));

    const { error } = await supabase
      .from("election_reveal_status")
      .upsert(records);

    if (error) {
      console.error("Error bulk publishing reveals:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed bulk publishing reveals:", err);
    return false;
  }
}

/**
 * Reset all role reveals to un-revealed.
 */
export async function resetAllRoleReveals(posts: string[]): Promise<boolean> {
  try {
    const now = new Date().toISOString();
    const records = posts.map((post) => ({
      post,
      is_revealed: false,
      revealed_at: null,
      updated_at: now,
    }));

    const { error } = await supabase
      .from("election_reveal_status")
      .upsert(records);

    if (error) {
      console.error("Error resetting reveals:", error);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Failed resetting reveals:", err);
    return false;
  }
}

