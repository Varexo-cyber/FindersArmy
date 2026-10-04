"use client";

import { useTransition } from "react";
import { adminToggleChecklist } from "@/lib/server/actions/admin";
import { Checkbox } from "@/components/ui/input";

export function ChecklistItem({ id, label, done }: { id: string; label: string; done: boolean }) {
  const [pending, start] = useTransition();
  return (
    <label className="flex items-start gap-3 py-2 text-sm">
      <Checkbox checked={done} disabled={pending} onChange={(e) => start(async () => void (await adminToggleChecklist(id, e.target.checked)))} />
      <span className={done ? "text-subtle line-through" : ""}>{label}</span>
    </label>
  );
}
