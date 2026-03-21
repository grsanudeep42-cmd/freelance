import { env } from "../config/env";
import { logger } from "../utils/logger";

export type ScanSeverity = "low" | "medium" | "high";

export interface ScanResult {
  safe: boolean;
  reason: string | null;
  severity: ScanSeverity;
}

export const groqGuard = {
  /**
   * Scans a message for phishing, luring, and scams.
   * Utilizes an initial fast regex pass, then falls back to Groq llama-3.1-8b-instant.
   */
  async scanMessage(content: string): Promise<ScanResult> {
    try {
      // 1. FAST REGEX CHECK (Catch obvious violations without API cost/latency)
      
      if (/(whatsapp|wa\.me)/i.test(content)) {
        return { safe: false, reason: "WhatsApp linking detected", severity: "high" };
      }
      if (/(t\.me\/|@[a-zA-Z0-9_]{5,}.*telegram)/i.test(content)) {
        return { safe: false, reason: "Telegram linking detected", severity: "high" };
      }
      if (/(upi:\/\/|pay.*gpay|pay.*phonepe|pay.*paytm)/i.test(content)) {
        return { safe: false, reason: "Direct UPI/payment link detected", severity: "high" };
      }
      if (/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(content)) {
        return { safe: false, reason: "External email sharing detected", severity: "high" };
      }
      if (/(\+91|0)[6-9]\d{9}/.test(content)) {
        return { safe: false, reason: "Indian phone number detected", severity: "medium" };
      }

      // 2. GROQ API CHECK (For subtle manipulation, fake urgency, scam language)
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

      const systemPrompt = `
You are a security scanner for a freelance marketplace. Your ONLY job
is to detect OBVIOUS scams and phishing attempts. You must be very
conservative — when in doubt, mark as SAFE.
ONLY mark as UNSAFE if the message CLEARLY contains:

Phone numbers shared for contact (e.g. "+91 98765 43210", "call me at...")
WhatsApp/Telegram/Instagram contact requests ("contact me on WhatsApp",
"my telegram is @xyz", "wa.me/...")
External payment requests ("pay me on GPay", "send to my UPI",
"pay outside the platform", "bank transfer")
Email addresses for off-platform communication ("email me at xyz@gmail.com")
Obvious scam offers ("I will pay you double outside", "send me your
bank account", "I need your Aadhaar number")

ALWAYS mark as SAFE:

Any message discussing deadlines, timelines, days, hours
Work progress updates ("I will finish it", "almost done", "working on it")
Questions about requirements ("how many pages?", "what color?")
Greetings and general conversation
Price negotiations within the platform context
Any message that is just normal freelancing talk
Messages mentioning "deadline" in a work context

You must respond with ONLY valid JSON, no other text:
{"safe": true, "reason": null, "severity": "low"}
or
{"safe": false, "reason": "specific reason here", "severity": "high"}
Be VERY conservative. A false positive (blocking a safe message) is
MUCH worse than a false negative. Only block when you are 95%+ confident
it is a real threat.
      `.trim();

      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${env.GROQ_API_KEY}`
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content }
          ],
          response_format: { type: "json_object" }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        logger.error("Groq API returned an error status", { status: response.status });
        return { safe: true, reason: null, severity: "low" }; // Fail open
      }

      const data = await response.json();
      const rawText = data.choices?.[0]?.message?.content;
      
      if (!rawText) {
        return { safe: true, reason: null, severity: "low" }; // Fail open on bad payload
      }

      try {
        const parsed = JSON.parse(rawText) as Record<string, any>;
        return {
          safe: Boolean(parsed.safe),
          reason: typeof parsed.reason === "string" ? parsed.reason : null,
          severity: ["low", "medium", "high"].includes(parsed.severity) ? parsed.severity : "low"
        };
      } catch (jsonErr) {
        logger.error("Failed to parse Groq API JSON response", { rawText });
        return { safe: true, reason: null, severity: "low" }; // Fail open
      }

    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        logger.warn("Groq API timeout reached, failing open", { contentPreview: content.slice(0, 30) });
      } else {
        logger.error("groqGuard scanMessage failed", { message: err instanceof Error ? err.message : String(err) });
      }
      // Critical core platform rule: Never block on AI error, always fail open
      return { safe: true, reason: null, severity: "low" };
    }
  }
};
