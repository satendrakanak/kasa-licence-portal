import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";

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

function getEncryptionKey() {
  const secret = process.env.LICENSE_SIGNING_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.length < 24) {
    throw new Error("LICENSE_SIGNING_SECRET must be at least 24 characters long.");
  }

  return createHash("sha256").update(secret).digest();
}

export function encryptLicenseKey(licenseKey: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(licenseKey.trim().toUpperCase(), "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  return [iv, tag, encrypted].map((part) => part.toString("base64url")).join(".");
}

export function decryptLicenseKey(payload: string | null | undefined) {
  if (!payload) return null;

  try {
    const [ivValue, tagValue, encryptedValue] = payload.split(".");
    if (!ivValue || !tagValue || !encryptedValue) return null;

    const decipher = createDecipheriv(
      "aes-256-gcm",
      getEncryptionKey(),
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));

    return Buffer.concat([
      decipher.update(Buffer.from(encryptedValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    return null;
  }
}
