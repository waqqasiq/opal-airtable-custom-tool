import express, { Request, Response } from "express";

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const AIRTABLE_BASE_ID = "appz6jRQD8kic0SRd";
const AIRTABLE_TABLE_ID = "tblHKPp0726iXRIfh";
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

// ─── Discovery ────────────────────────────────────────────────────────────────
app.get("/discovery", (req: Request, res: Response) => {
  res.json({
    functions: [
      {
        name: "get_airtable_data",
        description: "Fetches records from an Airtable base. Use this when the user asks about data stored in Airtable. Supports optional filtering by field name and value, and limiting the number of records returned.",
        parameters: [
          {
            name: "filter_field",
            type: "string",
            description: "Field name to filter records by (e.g. 'Status', 'Name')",
            required: false,
          },
          {
            name: "filter_value",
            type: "string",
            description: "Value to match against the filter_field",
            required: false,
          },
          {
            name: "max_records",
            type: "number",
            description: "Maximum number of records to return (default 20, max 100)",
            required: false,
          },
        ],
        endpoint: "/tools/get_airtable_data",
        http_method: "POST",
        auth_requirements: [],
      },
    ],
  });
});

// ─── Tool execution ───────────────────────────────────────────────────────────
app.post("/tools/get_airtable_data", async (req: Request, res: Response) => {
  if (!AIRTABLE_TOKEN) {
    return res.status(500).json({ error: "AIRTABLE_TOKEN env var is not set" });
  }

  const { filter_field, filter_value, max_records } = req.body ?? {};

  const params = new URLSearchParams({
    maxRecords: String(max_records ?? 20),
  });

  if (filter_field && filter_value) {
    params.set("filterByFormula", `{${filter_field}}="${filter_value}"`);
  }

  const url =
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}` +
    `?${params.toString()}`;

  try {
    const airtableRes = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
    });

    if (!airtableRes.ok) {
      const err = await airtableRes.text();
      return res.status(airtableRes.status).json({ error: err });
    }

    const data = (await airtableRes.json()) as {
      records: { id: string; fields: Record<string, unknown> }[];
    };

    return res.json({
      total: data.records.length,
      records: data.records.map((r) => ({ id: r.id, ...r.fields })),
    });
  } catch (err) {
    return res.status(500).json({ error: String(err) });
  }
});

export default app;