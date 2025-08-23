import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

type ParsedItem = { description: string; priceCents: number };

function parseLinesToItems(lines: string[]): ParsedItem[] {
  const items: ParsedItem[] = [];
  const priceRegex = /(\$?\d+[.,]\d{2})$/;
  const skipRegex = /(subtotal|tax|total|visa|mastercard|balance|change)/i;

  // Queue of item descriptions waiting for a price line.
  const pending: string[] = [];

  for (const raw of lines) {
    const line = raw.replace(/[^A-Za-z0-9$.\s:-]/g, "").trim();
    if (!line) continue;

    const priceMatch = line.match(priceRegex);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/[^0-9.]/g, ""));
      let desc = line
        .slice(0, line.length - priceMatch[1].length)
        .replace(/[$:]+$/, "")
        .trim();
      if (!desc) {
        // Pair with the earliest pending description if present.
        desc = pending.shift() || "";
      }
      if (desc && !skipRegex.test(desc) && !isNaN(price)) {
        items.push({ description: desc, priceCents: Math.round(price * 100) });
      }
    } else if (!skipRegex.test(line)) {
      // Treat lines starting with a dash as a continuation of the previous item.
      if (/^[-–•]/.test(line) && pending.length) {
        const continuation = line.replace(/^[-–•]\s*/, "");
        pending[pending.length - 1] += ` - ${continuation}`;
      } else {
        pending.push(line);
      }
    }
    // Skip lines matching the skip regex but don't clear pending descriptions so
    // prices appearing later can still pair with earlier descriptions.
  }

  return items;
}

function parseReceiptItems(data: any): ParsedItem[] {
  const result = data?.ParsedResults?.[0];
  if (!result) return [];

  const overlayLines: string[] =
    result?.TextOverlay?.Lines?.map((l: any) => l.LineText) || [];
  const textLines: string[] = result?.ParsedText
    ? result.ParsedText.split("\n")
    : [];
  const lines = overlayLines.length ? overlayLines : textLines;

  return parseLinesToItems(
    lines.map((l) => l.trim()).filter(Boolean)
  );
}

export const scanReceipt = action({
  args: { receiptStorageId: v.id("_storage") },
  handler: async (ctx, { receiptStorageId }) => {
    const me = await ctx.runQuery(api.auth.getMe, {});
    if (!me) throw new Error("Unauthorized");

    const url = await ctx.storage.getUrl(receiptStorageId);
    if (!url) throw new Error("Receipt not found");

    const key = process.env.OCR_API_KEY;
    if (!key) {
      throw new Error("OCR_API_KEY not configured");
    }

    try {
      // Fetch the image bytes from storage and send as a file to OCR.Space.
      const imgRes = await fetch(url);
      if (!imgRes.ok) {
        throw new Error(`Failed to fetch stored image: ${imgRes.status}`);
      }
      const blob = await imgRes.blob();
      const contentType = blob.type || imgRes.headers.get("content-type") || "image/jpeg";
      let ext = "jpg";
      if (contentType.includes("png")) ext = "png";
      else if (contentType.includes("jpeg")) ext = "jpg";
      else if (contentType.includes("webp")) ext = "webp";

      const form = new FormData();
      form.append("file", blob, `receipt.${ext}`);
      form.append("filetype", ext);
      form.append("isTable", "true");
      const res = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          apikey: key,
        },
        body: form,
      });
      if (!res.ok) {
        throw new Error(`OCR request failed: ${res.status}`);
      }
      const data: any = await res.json();
      if (data.IsErroredOnProcessing) {
        throw new Error(data.ErrorMessage || "OCR returned no results");
      }

      const items = parseReceiptItems(data);

      console.log("OCR raw", data);
      console.log("OCR items", items);
      if (!items.length) {
        throw new Error("OCR returned no line items");
      }
      return { items };
    } catch (err) {
      console.error("OCR failed", err);
      throw err;
    }
  },
});

