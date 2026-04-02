"use client";

import { useAuth } from "@/lib/auth-context";
import { CMReportsView } from "@/components/reports/cm-reports-view";
import { GMReportsView } from "@/components/reports/gm-reports-view";

export default function ReportsPage() {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === "clubhouse_manager") {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-gray-100">
          <h1 className="text-xl font-semibold text-gray-900">Player Reports</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <CMReportsView />
        </div>
      </div>
    );
  }

  if (user.role === "general_manager") {
    return (
      <div className="flex flex-col h-full">
        <div className="px-6 py-4 border-b border-gray-100">
          <h1 className="text-xl font-semibold text-gray-900">Player Reports</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <GMReportsView />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 text-sm text-gray-500">Reports are not available for your role.</div>
  );
}
