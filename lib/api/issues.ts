import type { SupabaseClient } from "@supabase/supabase-js";
import type { Issue, IssueComment, IssueStatus } from "@/lib/types";

export type IssueWithPlayer = Issue & { player_name: string | null };
export type IssueCommentWithAuthor = IssueComment & { author_name: string | null };

export async function getIssues(
  supabase: SupabaseClient,
  teamId: number
): Promise<IssueWithPlayer[]> {
  const { data, error } = await supabase
    .from("issues")
    .select("*, users!issues_player_id_fkey(user_name)")
    .eq("player_team_id", teamId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data as any[]).map((row) => ({
    ...row,
    player_name: row.users?.user_name ?? null,
  }));
}

export async function getIssueComments(
  supabase: SupabaseClient,
  issueId: number
): Promise<IssueCommentWithAuthor[]> {
  const { data, error } = await supabase
    .from("issue_comments")
    .select("*, users!issue_comments_user_id_fkey(user_name)")
    .eq("issue_id", issueId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as any[]).map((row) => ({
    ...row,
    author_name: row.users?.user_name ?? null,
  }));
}

export async function createIssue(
  supabase: SupabaseClient,
  data: {
    player_id: number;
    player_team_id: number;
    team_context: "home" | "away";
    away_team_name?: string | null;
    description: string;
  }
): Promise<Issue> {
  const { data: row, error } = await supabase
    .from("issues")
    .insert({ ...data, routed_to: "clubhouse_manager" })
    .select()
    .single();
  if (error) throw error;
  return row;
}

export async function updateIssueStatus(
  supabase: SupabaseClient,
  id: number,
  status: IssueStatus
): Promise<void> {
  const { error } = await supabase
    .from("issues")
    .update({ status })
    .eq("id", id);
  if (error) throw error;
}

export async function updateIssueFlag(
  supabase: SupabaseClient,
  id: number,
  gmFlagged: boolean
): Promise<void> {
  const { error } = await supabase
    .from("issues")
    .update({ gm_flagged: gmFlagged })
    .eq("id", id);
  if (error) throw error;
}

export async function addComment(
  supabase: SupabaseClient,
  issueId: number,
  userId: number,
  comment: string
): Promise<IssueCommentWithAuthor> {
  const { data, error } = await supabase
    .from("issue_comments")
    .insert({ issue_id: issueId, user_id: userId, comment })
    .select("*, users!issue_comments_user_id_fkey(user_name)")
    .single();
  if (error) throw error;
  const row = data as any;
  return { ...row, author_name: row.users?.user_name ?? null };
}
