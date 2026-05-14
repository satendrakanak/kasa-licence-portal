"use client";

import { Download, ShieldOff, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteUnusedLicenseAction,
  revokeLicenseAccessAction,
  updateLicenseStatusAction,
} from "@/app/actions";

const LICENSE_STATUSES = ["ACTIVE", "SUSPENDED", "EXPIRED", "REVOKED", "REFUNDED"] as const;

type LicenseStatusControlProps = {
  licenseId: string;
  status: string;
};

export function LicenseStatusControl({ licenseId, status }: LicenseStatusControlProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState(status);
  const [isPending, startTransition] = useTransition();

  function saveStatus() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("licenseId", licenseId);
      formData.set("status", selectedStatus);

      const result = await updateLicenseStatusAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-2">
      <select
        value={selectedStatus}
        onChange={(event) => setSelectedStatus(event.target.value)}
        className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm outline-none"
      >
        {LICENSE_STATUSES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={saveStatus}
        disabled={isPending || selectedStatus === status}
        className="w-full rounded-xl border border-white/10 px-3 py-2 text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Saving..." : "Save status"}
      </button>
    </div>
  );
}

type LicenseRowActionsProps = {
  licenseId: string;
  status: string;
  canDelete: boolean;
  hasDownload: boolean;
};

export function LicenseRowActions({ licenseId, status, canDelete, hasDownload }: LicenseRowActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isRevoked = status !== "ACTIVE";

  function revokeAccess() {
    if (isRevoked) {
      toast.info("License access is already stopped.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("licenseId", licenseId);
      const result = await revokeLicenseAccessAction(formData);

      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function deleteLicense() {
    if (!canDelete) {
      toast.error("Deactivate active installations before deleting this license.");
      return;
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.set("licenseId", licenseId);
      const result = await deleteUnusedLicenseAction(formData);

      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="flex flex-col items-stretch gap-2">
      {hasDownload ? (
        <a
          href={`/api/admin/licenses/${licenseId}/download`}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2 hover:bg-white/10"
        >
          <Download size={14} /> TXT
        </a>
      ) : null}
      <button
        type="button"
        onClick={revokeAccess}
        disabled={isRevoked || isPending}
        title={isRevoked ? "Access is already stopped" : "Stop this buyer's access and deactivate all installs"}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-amber-300/20 px-3 py-2 text-amber-100 hover:bg-amber-500/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ShieldOff size={14} /> {isPending ? "Working..." : "Revoke"}
      </button>
      <button
        type="button"
        onClick={deleteLicense}
        disabled={!canDelete || isPending}
        title={canDelete ? "Delete unused license" : "Deactivate active installations before deleting this license."}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/20 px-3 py-2 text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Trash2 size={14} /> {isPending ? "Deleting..." : "Delete"}
      </button>
    </div>
  );
}
