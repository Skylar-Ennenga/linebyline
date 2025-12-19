"use server";

import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export type ParsedLineItem = {
  item_code: string | null;
  raw_description: string;
  normalized_name: string;
  category: string;
  subcategory: string;
  quantity: number;
  total_price: number;
  is_taxable: boolean;
  is_discount: boolean;
};

export type ParsedReceipt = {
  store_name: string;
  store_location: string;
  purchase_date: string;
  subtotal: number;
  tax: number;
  total: number;
  item_count: number;
  line_items: ParsedLineItem[];
};

const PROMPT = `Analyze this receipt and extract all information in JSON format.

Return ONLY valid JSON matching this exact structure:
{
  "store_name": "Store name (e.g., Costco)",
  "store_location": "Full location from receipt",
  "purchase_date": "YYYY-MM-DD format",
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "item_count": 0,
  "line_items": [
    {
      "item_code": "Product code or null if not present",
      "raw_description": "Exactly as shown on receipt",
      "normalized_name": "Human-readable product name",
      "category": "Main category (Grocery, Household, Pet, Personal Care, Baby, Electronics, Automotive, Other)",
      "subcategory": "Subcategory (e.g., Produce, Dairy, Meat, Cleaning, Paper Goods)",
      "quantity": 1,
      "total_price": 0.00,
      "is_taxable": false,
      "is_discount": false
    }
  ]
}

Rules:
- For Costco receipts: "N" suffix means non-taxable (food), "Y" means taxable
- Discount lines have negative prices and is_discount: true
- item_code is the number like "57554" or "1048072"
- normalized_name should be clear: "KS TOWEL" → "Kirkland Signature Paper Towels"
- Return ONLY the JSON, no markdown, no explanation`;

export async function parseReceipt(formData: FormData): Promise<ParsedReceipt> {
  const file = formData.get("receipt") as File;

  if (!file) {
    throw new Error("No file provided");
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const isPdf = file.type === "application/pdf";

  const content: Anthropic.MessageCreateParams["messages"][0]["content"] = isPdf
    ? [
        {
          type: "document",
          source: {
            type: "base64",
            media_type: "application/pdf",
            data: base64,
          },
        },
        { type: "text", text: PROMPT },
      ]
    : [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: file.type as
              | "image/jpeg"
              | "image/png"
              | "image/webp"
              | "image/gif",
            data: base64,
          },
        },
        { type: "text", text: PROMPT },
      ];

  const response = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content,
      },
    ],
  });

  const textContent = response.content.find((block) => block.type === "text");
  if (!textContent || textContent.type !== "text") {
    throw new Error("No text response from Claude");
  }

  try {
    // Sometimes Claude wraps JSON in markdown code blocks
    let jsonText = textContent.text.trim();

    // Remove markdown code blocks if present
    if (jsonText.startsWith("```json")) {
      jsonText = jsonText.slice(7);
    } else if (jsonText.startsWith("```")) {
      jsonText = jsonText.slice(3);
    }
    if (jsonText.endsWith("```")) {
      jsonText = jsonText.slice(0, -3);
    }
    jsonText = jsonText.trim();

    console.log("Claude response:", jsonText.slice(0, 500));

    const parsed = JSON.parse(jsonText);
    return parsed as ParsedReceipt;
  } catch (err) {
    console.error("Raw Claude response:", textContent.text);
    throw new Error(`Failed to parse Claude response as JSON: ${err}`);
  }
}
