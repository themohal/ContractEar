import crypto from "crypto";

export function verifyPaddleWebhook(
  rawBody: string,
  signature: string,
  secret: string
): boolean {
  try {
    const parts = signature.split(";");
    const ts = parts.find((p) => p.startsWith("ts="))?.split("=")[1];
    const h1 = parts.find((p) => p.startsWith("h1="))?.split("=")[1];

    console.log("[Paddle Verify] ts:", ts);
    console.log("[Paddle Verify] h1:", h1 ? h1.substring(0, 16) + "..." : "missing");
    console.log("[Paddle Verify] secret:", secret ? secret.substring(0, 16) + "..." : "missing");
    console.log("[Paddle Verify] secret length:", secret?.length);
    console.log("[Paddle Verify] rawBody length:", rawBody?.length);
    console.log("[Paddle Verify] rawBody first 100:", rawBody?.substring(0, 100));

    if (!ts || !h1) return false;

    const payload = `${ts}:${rawBody}`;
    const computed = crypto
      .createHmac("sha256", secret)
      .update(payload)
      .digest("hex");

    console.log("[Paddle Verify] computed:", computed.substring(0, 16) + "...");
    console.log("[Paddle Verify] expected:", h1.substring(0, 16) + "...");
    console.log("[Paddle Verify] h1 length:", h1.length, "computed length:", computed.length);
    console.log("[Paddle Verify] match:", h1 === computed);

    if (h1.length !== computed.length) {
      console.log("[Paddle Verify] Length mismatch — h1 and computed hash differ in length");
      return false;
    }

    return crypto.timingSafeEqual(Buffer.from(h1), Buffer.from(computed));
  } catch (err) {
    console.error("[Paddle Verify] Error:", err);
    return false;
  }
}
