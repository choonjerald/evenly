import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

type ParsedItem = { description: string; priceCents: number };

function parseLinesToItems(lines: string[]): ParsedItem[] {
  const items: ParsedItem[] = [];
  const priceRegex = /\b(?:[$£€])?\d+(?:[.,]\d{2})\b/g;
  const skipRegex = /(subtotal|tax|total|visa|mastercard|balance|change)/i;
  const descriptions: string[] = [];

  for (const raw of lines) {
    const line = raw.replace(/\s+/g, " ").trim();
    if (!line) continue;

    const matches = line.match(priceRegex);
    if (matches && matches.length) {
      const priceToken = matches[matches.length - 1];
      const value = parseFloat(
        priceToken.replace(/[£€$]/g, "").replace(/,/, ".")
      );
      const before = line.slice(0, line.lastIndexOf(priceToken)).trim();
      let description = before.replace(/[£€$]/g, "").trim();
      if (!description) {
        description = descriptions.shift() || "";
      }
      if (description && !isNaN(value) && !skipRegex.test(description)) {
        items.push({
          description,
          priceCents: Math.round(value * 100),
        });
      }
    } else if (!skipRegex.test(line)) {
      if (line.startsWith("-") && descriptions.length) {
        descriptions[descriptions.length - 1] = `${descriptions[descriptions.length - 1]} ${line}`.trim();
      } else {
        descriptions.push(line);
      }
    }
  }

  return items;
}

function parseReceiptItems(data: any): ParsedItem[] {
  const result = data?.ParsedResults?.[0];
  if (!result) return [];

  const overlayLines: string[] =
    result?.TextOverlay?.Lines?.map((l: any) => {
      if (l.LineText) return l.LineText;
      if (l.Words) return l.Words.map((w: any) => w.WordText).join(" ");
      return "";
    }) || [];
  const textLines: string[] = result?.ParsedText
    ? result.ParsedText.split("\n")
    : [];
  const lines = overlayLines.length ? overlayLines : textLines;

  const normalized = lines.map((l) => l.trim()).filter(Boolean);
  console.log("OCR lines", normalized);
  return parseLinesToItems(normalized);
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
      form.append("OCREngine", "2");
      form.append("scale", "true");
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

