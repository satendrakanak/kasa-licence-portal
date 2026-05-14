import { LicenseKeyActions } from "@/components/license-key-actions";

type NewLicenseKeyBannerProps = {
  licenseKey?: string;
};

export function NewLicenseKeyBanner({ licenseKey }: NewLicenseKeyBannerProps) {
  if (!licenseKey) return null;

  return (
    <section className="rounded-2xl border border-emerald-300/30 bg-emerald-400/10 p-5">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-200">
            New license key generated
          </p>
          <p className="mt-2 break-all font-mono text-base text-white md:text-lg">
            {licenseKey}
          </p>
          <p className="mt-1 text-sm text-slate-400">
            Stored encrypted for admin recovery.
          </p>
        </div>
        <LicenseKeyActions licenseKey={licenseKey} />
      </div>
    </section>
  );
}
