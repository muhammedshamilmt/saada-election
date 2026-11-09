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
 * Upload an image file directly to the Supabase Storage "election-assets" bucket
 * and return the public URL.
 */
export async function uploadImageToSupabase(
  file: File,
  folder: "avatars" | "symbols" = "avatars"
): Promise<string> {
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

  if (error) {
    console.error("Error fetching candidates:", error);
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
 * Delete a candidate from Supabase
 */
export async function deleteCandidate(id: string): Promise<boolean> {
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
    console.error("Error fetching voters:", error);
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
  const { error } = await supabase.from("voters").delete().eq("id", id);
  if (error) {
    console.error("Error deleting voter:", error);
    return false;
  }
  return true;
}

/**
 * Record a ballot and increment candidate votes
 * Strictly enforces that a voter can only vote ONCE.
 */
export async function submitBallot(
  voterId: string,
  receiptCode: string,
  presidentId?: string,
  secretaryId?: string,
  treasurerId?: string,
  allCandidateIds?: string[]
): Promise<{ success: boolean; error?: string }> {
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

