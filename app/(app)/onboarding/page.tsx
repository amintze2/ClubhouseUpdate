"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { defaultAnswers } from "@/lib/api/onboarding";
import { WizardShell } from "@/components/onboarding/wizard-shell";
import { Step1Facility } from "@/components/onboarding/step1-facility";
import { Step2Laundry } from "@/components/onboarding/step2-laundry";
import { Step3Food } from "@/components/onboarding/step3-food";
import { Step4Field } from "@/components/onboarding/step4-field";
import { Step5Medical } from "@/components/onboarding/step5-medical";
import { Step6GameDay } from "@/components/onboarding/step6-gameday";
import { Step7Contacts } from "@/components/onboarding/step7-contacts";
import type { OnboardingAnswers } from "@/lib/api/onboarding";

const TOTAL_STEPS = 7;

export default function OnboardingPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();

  const isRerun = searchParams.get("rerun") === "1";
  const rerunMode = (searchParams.get("mode") as "replace" | "merge") ?? "replace";

  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>(() => ({
    ...defaultAnswers(),
    mode: isRerun ? rerunMode : "replace",
  }));
  const [submitting, setSubmitting] = useState(false);
  const [step1Error, setStep1Error] = useState<string | undefined>();

  // Layout handles redirect for non-CM and boarded CMs — just suppress render here
  if (isLoading || !user) return null;
  if (user.role !== "clubhouse_manager") return null;
  if (user.has_completed_onboarding && !isRerun) return null;

  function handleNext() {
    if (step === 0) {
      if (!answers.step1.roster_size) {
        setStep1Error("Please enter your roster size.");
        return;
      }
      setStep1Error(undefined);
    }
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  function handleBack() {
    setStep1Error(undefined);
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleFinish() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/onboarding/generate-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user!.id,
          team_id: user!.team_id,
          ...answers,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "Request failed");
      }
      router.replace("/recurring-tasks");
    } catch (e) {
      showToast(e instanceof Error ? e.message : "Setup failed — please try again", "error");
    } finally {
      setSubmitting(false);
    }
  }

  function updateAnswers<K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <WizardShell
      step={step}
      totalSteps={TOTAL_STEPS}
      onBack={handleBack}
      onNext={handleNext}
      onFinish={handleFinish}
      submitting={submitting}
    >
      {step === 0 && (
        <Step1Facility
          values={answers.step1}
          onChange={(v) => updateAnswers("step1", v)}
          error={step1Error}
        />
      )}
      {step === 1 && (
        <Step2Laundry values={answers.step2} onChange={(v) => updateAnswers("step2", v)} />
      )}
      {step === 2 && (
        <Step3Food values={answers.step3} onChange={(v) => updateAnswers("step3", v)} />
      )}
      {step === 3 && (
        <Step4Field values={answers.step4} onChange={(v) => updateAnswers("step4", v)} />
      )}
      {step === 4 && (
        <Step5Medical values={answers.step5} onChange={(v) => updateAnswers("step5", v)} />
      )}
      {step === 5 && (
        <Step6GameDay values={answers.step6} onChange={(v) => updateAnswers("step6", v)} />
      )}
      {step === 6 && (
        <Step7Contacts values={answers.step7} onChange={(v) => updateAnswers("step7", v)} />
      )}
    </WizardShell>
  );
}
