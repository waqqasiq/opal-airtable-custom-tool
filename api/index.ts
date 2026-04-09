import "reflect-metadata";
import express from "express";
import { z } from "zod";
import { ToolsService, registerTool } from "@optimizely-opal/opal-tools-sdk";

const app = express();
app.use(express.json());

// CORS — required for Opal to reach your endpoints from the cloud
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Instantiating ToolsService wires up the /discovery endpoint automatically
new ToolsService(app);

// ─── Airtable config ──────────────────────────────────────────────────────────
const AIRTABLE_BASE_ID = "appz6jRQD8kic0SRd";
const AIRTABLE_TABLE_ID = "tblHKPp0726iXRIfh";
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

if (!AIRTABLE_TOKEN) throw new Error("AIRTABLE_TOKEN env var is not set");

// ─── Tool definition ──────────────────────────────────────────────────────────
// registerTool signature: (name, options, handler)
registerTool(
  "get_airtable_data",
  {
    description: `
      Fetches records from an Airtable base.
      Use this tool when the user asks about data, records, entries, or content
      stored in Airtable. Supports optional filtering by a field value and
      limiting the number of records returned.
      Do NOT use this tool for questions unrelated to the Airtable data.
    `.trim(),
    inputSchema: {
      filter_field: z
        .string()
        .optional()
        .describe("Field name to filter records by (e.g. 'Status', 'Name')"),
      filter_value: z
        .string()
        .optional()
        .describe("Value to match against the filter_field"),
      max_records: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .describe("Maximum number of records to return (default 20, max 100)"),
    },
  },
  async ({ filter_field, filter_value, max_records }) => {
    const params = new URLSearchParams({
      maxRecords: String(max_records ?? 20),
    });

    // Build a simple filterByFormula if both field + value are provided
    if (filter_field && filter_value) {
      params.set("filterByFormula", `{${filter_field}}="${filter_value}"`);
    }

    const url =
      `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}` +
      `?${params.toString()}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Airtable API error ${res.status}: ${err}`);
    }

    const data = (await res.json()) as {
      records: { id: string; fields: Record<string, unknown> }[];
    };

    // Return a clean, LLM-friendly payload
    return {
      total: data.records.length,
      records: data.records.map((r) => ({ id: r.id, ...r.fields })),
    };
  }
);

// ─── Export for Vercel (serverless) ──────────────────────────────────────────
export default app;