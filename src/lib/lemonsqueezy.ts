import crypto from "crypto";

export function verifyLemonSqueezyWebhook(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    if (!signature || !secret) return false;

    const computed = crypto
      .createHmac("sha256", secret)
      .update(rawBody)
      .digest("hex");

    if (signature.length !== computed.length) return false;

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(computed)
    );
  } catch (err) {
    console.error("[LemonSqueezy Verify] Error:", err);
    return false;
  }
}
