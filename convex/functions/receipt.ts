import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

type ParsedItem = { description: string; priceCents: number };

function parseLinesToItems(lines: string[]): ParsedItem[] {
  const items: ParsedItem[] = [];
  let pendingDesc: string | null = null;
  const priceRegex = /(\$?\d+[.,]\d{2})$/;
  const skipRegex = /(subtotal|tax|total|visa|mastercard|balance|change)/i;

  for (const raw of lines) {
    const line = raw.replace(/[^A-Za-z0-9$.\s:-]/g, "").trim();
    if (!line) continue;
    const priceMatch = line.match(priceRegex);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1].replace(/[^0-9.]/g, ""));
      const desc = line
        .slice(0, line.length - priceMatch[1].length)
        .replace(/[$:]+$/, "")
        .trim() || pendingDesc;
      if (desc && !skipRegex.test(desc) && !isNaN(price)) {
        items.push({ description: desc, priceCents: Math.round(price * 100) });
      }
      pendingDesc = null;
    } else if (!skipRegex.test(line)) {
      pendingDesc = line;
    } else {
      pendingDesc = null;
    }
  }

  return items;
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
      if (data.IsErroredOnProcessing || !data.ParsedResults?.length) {
        throw new Error(data.ErrorMessage || "OCR returned no results");
      }
      const text: string = data.ParsedResults[0].ParsedText || "";
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);

      const items = parseLinesToItems(lines);

      console.log("OCR lines", lines);
      console.log("OCR items", items);
      return { items };
    } catch (err) {
      console.error("OCR failed", err);
      throw err;
    }
  },
});

