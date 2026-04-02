"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/toast";
import { createSupabaseClient } from "@/lib/supabase";
import { getPlayerProfile, savePlayerProfile } from "@/lib/api/meals";
import { ProfileForm } from "@/components/player/profile-form";

export default function PlayerInfoPage() {
  const { user, accessToken } = useAuth();
  const { showToast } = useToast();

  const [preferredName, setPreferredName] = useState("");
  const [otherDetails, setOtherDetails] = useState("");
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const supabase = createSupabaseClient(accessToken ?? undefined);

  useEffect(() => {
    if (!user) return;
    getPlayerProfile(supabase, user.id)
      .then(({ preferences, restrictions: r }) => {
        setPreferredName(preferences?.preferred_name ?? "");
        setOtherDetails(preferences?.other_details ?? "");
        setRestrictions(r);
      })
      .catch(() => showToast("Failed to load profile", "error"))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  async function handleSave(data: { preferred_name: string | null; other_details: string | null; restrictions: string[] }) {
    setSaving(true);
    try {
      await savePlayerProfile(supabase, user!.id, data);
      setPreferredName(data.preferred_name ?? "");
      setOtherDetails(data.other_details ?? "");
      setRestrictions(data.restrictions);
      showToast("Profile saved", "success");
    } catch {
      showToast("Failed to save — try again", "error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-lg font-semibold text-gray-900 mb-6">My Info</h1>
      <ProfileForm
        initialPreferredName={preferredName}
        initialOtherDetails={otherDetails}
        initialRestrictions={restrictions}
        onSave={handleSave}
        saving={saving}
      />
    </div>
  );
}
