"use client";

import { Check, Copy, Download } from "lucide-react";
import { useState } from "react";

type LicenseKeyActionsProps = {
  licenseKey: string;
  filename?: string;
};

export function LicenseKeyActions({
  licenseKey,
  filename = "kasa-licence-key.txt",
}: LicenseKeyActionsProps) {
  const [copied, setCopied] = useState(false);

  async function copyKey() {
    await navigator.clipboard.writeText(licenseKey);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  function downloadKey() {
    const blob = new Blob([`${licenseKey}\n`], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        onClick={copyKey}
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
      >
        {copied ? <Check size={16} /> : <Copy size={16} />}
        {copied ? "Copied" : "Copy"}
      </button>
      <button
        type="button"
        onClick={downloadKey}
        className="inline-flex items-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm text-slate-200 hover:bg-white/10"
      >
        <Download size={16} />
        Download TXT
      </button>
    </div>
  );
}
