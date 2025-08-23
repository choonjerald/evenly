import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

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

      const items: { description: string; priceCents: number }[] = [];
      for (const line of lines) {
        const match = line.match(/(.+?)\s+(\d+[\.,]?\d*)$/);
        if (match) {
          const desc = match[1].trim();
          const price = parseFloat(match[2].replace(/,/g, ""));
          if (!isNaN(price)) {
            items.push({ description: desc, priceCents: Math.round(price * 100) });
          }
        }
      }

      return { items };
    } catch (err) {
      console.error("OCR failed", err);
      throw err;
    }
  },
});

