"use client";

import { Archive, CheckCircle2, Save, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  deleteProductAction,
  toggleProductStatusAction,
  updateProductAction,
} from "@/app/actions";

type ProductCardControlsProps = {
  product: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: string;
    licenseCount: number;
  };
};

export function ProductCardControls({ product }: ProductCardControlsProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();
  const [isToggling, startToggling] = useTransition();
  const [name, setName] = useState(product.name);
  const [slug, setSlug] = useState(product.slug);
  const [description, setDescription] = useState(product.description ?? "");

  function updateProduct() {
    startSaving(async () => {
      const formData = new FormData();
      formData.set("productId", product.id);
      formData.set("name", name);
      formData.set("slug", slug);
      formData.set("description", description);

      const result = await updateProductAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  function toggleStatus() {
    startToggling(async () => {
      const formData = new FormData();
      formData.set("productId", product.id);
      formData.set("status", product.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE");
      await toggleProductStatusAction(formData);
      toast.success(product.status === "ACTIVE" ? "Product archived" : "Product restored");
      router.refresh();
    });
  }

  function deleteProduct() {
    if (product.licenseCount > 0) {
      toast.error("Delete or archive licenses for this product before deleting it.");
      return;
    }

    startDeleting(async () => {
      const formData = new FormData();
      formData.set("productId", product.id);
      const result = await deleteProductAction(formData);
      if (result.ok) {
        toast.success(result.message);
        router.refresh();
      } else {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 outline-none"
        />
        <input
          value={slug}
          onChange={(event) => setSlug(event.target.value)}
          className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 font-mono text-sm text-emerald-300 outline-none"
        />
        <textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="min-h-24 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={updateProduct}
          disabled={isSaving}
          className="inline-flex items-center gap-2 rounded-2xl border border-emerald-400/20 px-4 py-2 text-sm text-emerald-200 hover:bg-emerald-500/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={16} /> {isSaving ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={toggleStatus}
          disabled={isToggling}
          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-2 text-sm hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {product.status === "ACTIVE" ? <Archive size={16} /> : <CheckCircle2 size={16} />}
          {isToggling
            ? "Updating..."
            : product.status === "ACTIVE"
              ? "Archive"
              : "Restore"}
        </button>
        <button
          type="button"
          onClick={deleteProduct}
          disabled={product.licenseCount > 0 || isDeleting}
          title={
            product.licenseCount > 0
              ? "Products with licenses cannot be deleted."
              : "Delete product"
          }
          className="inline-flex items-center gap-2 rounded-2xl border border-red-400/20 px-4 py-2 text-sm text-red-200 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Trash2 size={16} /> {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
}
