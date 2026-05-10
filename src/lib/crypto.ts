import { createHash, randomBytes } from "crypto";

export function sha256(value: string) {
  return createHash("sha256").update(value.trim()).digest("hex");
}

export function createLicenseKey(productPrefix = "KASA") {
  const cleanPrefix = productPrefix
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 8) || "KASA";
  const chunks = Array.from({ length: 3 }, () =>
    randomBytes(3).toString("hex").toUpperCase(),
  );

  return `${cleanPrefix}-${chunks.join("-")}`;
}

export function previewLicenseKey(licenseKey: string) {
  const normalized = licenseKey.trim().toUpperCase();
  return `${normalized.slice(0, 8)}...${normalized.slice(-4)}`;
}
