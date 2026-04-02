import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateTasksStub } from "@/lib/api/onboarding";
import type { OnboardingAnswers, GeneratedTask, KeyContact } from "@/lib/api/onboarding";

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, serviceKey);
}

export async function POST(req: NextRequest) {
  let body: Partial<OnboardingAnswers & { user_id: number; team_id: number }>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { user_id, team_id, step1, step2, step3, step4, step5, step6, step7, mode = "replace" } = body;

  if (!user_id || !team_id || !step1 || !step2 || !step3 || !step4 || !step5 || !step6 || !step7) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const answers: OnboardingAnswers = { step1, step2, step3, step4, step5, step6, step7, mode };

  const supabase = getSupabaseAdmin();

  // Generate tasks (stub — real Claude call goes here later)
  const generated: GeneratedTask[] = generateTasksStub(answers);

  // Filter out any tasks with invalid categories (defensive)
  const validCategories = ["sanitation", "laundry", "food", "equipment", "field", "admin", "medical", "general"];
  const valid = generated.filter((t) => validCategories.includes(t.category));

  // Replace mode: delete existing recurring tasks for this user
  if (mode === "replace") {
    await supabase.from("recurring_tasks").delete().eq("user_id", user_id);
  }

  // Bulk insert generated tasks
  let createdTasks: unknown[] = [];
  if (valid.length > 0) {
    const { data, error } = await supabase
      .from("recurring_tasks")
      .insert(valid.map((t) => ({ ...t, user_id })))
      .select();
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    createdTasks = data ?? [];
  }

  // Upsert key contacts (non-empty names only)
  const createdContacts: unknown[] = [];
  if (step7.contacts) {
    for (const kc of step7.contacts as KeyContact[]) {
      if (!kc.name.trim()) continue;
      const { data } = await supabase
        .from("contacts")
        .insert({
          team_id,
          contact_name: kc.name.trim(),
          contact_role: kc.label,
          phone: kc.phone.trim() || null,
          email: kc.email.trim() || null,
          notes: null,
          display_order: 0,
          created_by: user_id,
        })
        .select()
        .single();
      if (data) createdContacts.push(data);
    }
  }

  // Mark onboarding complete
  await supabase.from("users").update({ has_completed_onboarding: true }).eq("id", user_id);

  return NextResponse.json({ tasks: createdTasks, contacts: createdContacts });
}
