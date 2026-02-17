import crypto from "crypto";

export function verifyPaddleWebhook(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  const parts = signature.split(";");
  const ts = parts.find((p) => p.startsWith("ts="))?.split("=")[1];
  const h1 = parts.find((p) => p.startsWith("h1="))?.split("=")[1];
  if (!ts || !h1) return false;

  const payload = `${ts}:${rawBody}`;
  const computed = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(h1), Buffer.from(computed));
  } catch {
    return false;
  }
}
