"use client";

import { PauseCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";
import { deactivateActivationAction } from "@/app/actions";

export function ActivationDeactivateButton({ activationId }: { activationId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function deactivate() {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("activationId", activationId);
      const result = await deactivateActivationAction(formData);

      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={deactivate}
      disabled={isPending}
      className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-400/20 px-3 py-2 text-sm text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50"
    >
      <PauseCircle size={16} /> {isPending ? "Deactivating..." : "Deactivate"}
    </button>
  );
}
