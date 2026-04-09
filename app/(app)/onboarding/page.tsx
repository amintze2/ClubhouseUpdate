"use client";

import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { OnboardingChat } from "@/components/onboarding/onboarding-chat";

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const searchParams = useSearchParams();

  const isRerun = searchParams.get("rerun") === "1";
  const mode = (searchParams.get("mode") as "replace" | "merge") ?? "replace";

  if (isLoading || !user) return null;
  if (user.role !== "clubhouse_manager") return null;
  if (user.has_completed_onboarding && !isRerun) return null;

  return <OnboardingChat mode={mode} />;
}
