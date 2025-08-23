import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireUser } from "../auth";

export const scanReceipt = mutation({
  args: { receiptStorageId: v.id("_storage") },
  handler: async (ctx, { receiptStorageId }) => {
    await requireUser(ctx);

    const url = await ctx.storage.getUrl(receiptStorageId);
    if (!url) throw new Error("Receipt not found");

    try {
      const res = await fetch("https://api.ocr.space/parse/image", {
        method: "POST",
        headers: {
          apikey: process.env.OCR_API_KEY || "",
        },
        body: new URLSearchParams({
          url,
        }),
      });
      const data: any = await res.json();
      const text: string = data?.ParsedResults?.[0]?.ParsedText || "";
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
      return { items: [] };
    }
  },
});

