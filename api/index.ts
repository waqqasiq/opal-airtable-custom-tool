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

// ─── Root ─────────────────────────────────────────────────────────────────────
app.get("/", (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Opal Airtable Tool</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          background: #0f0f0f;
          color: #f0f0f0;
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .card {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 16px;
          padding: 48px;
          max-width: 480px;
          width: 90%;
          text-align: center;
        }
        .badge {
          display: inline-block;
          background: #1a3a2a;
          color: #4ade80;
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.05em;
          padding: 4px 12px;
          border-radius: 999px;
          margin-bottom: 24px;
          border: 1px solid #166534;
        }
        h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 8px;
          color: #ffffff;
        }
        p {
          font-size: 15px;
          color: #888;
          line-height: 1.6;
          margin-bottom: 32px;
        }
        .endpoints {
          text-align: left;
          background: #111;
          border: 1px solid #222;
          border-radius: 10px;
          overflow: hidden;
        }
        .endpoint {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-bottom: 1px solid #222;
          font-size: 14px;
        }
        .endpoint:last-child { border-bottom: none; }
        .method {
          font-size: 11px;
          font-weight: 700;
          padding: 3px 8px;
          border-radius: 6px;
          min-width: 42px;
          text-align: center;
        }
        .get  { background: #1a3a2a; color: #4ade80; }
        .post { background: #1a2a3a; color: #60a5fa; }
        .path { color: #e0e0e0; font-family: monospace; }
        .desc { color: #666; font-size: 12px; margin-left: auto; }
        .footer {
          margin-top: 28px;
          font-size: 12px;
          color: #444;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">● Live</div>
        <h1>Opal Airtable Tool</h1>
        <p>A custom tool for Optimizely Opal that fetches records from Airtable and returns structured data.</p>
        <div class="endpoints">
          <div class="endpoint">
            <span class="method get">GET</span>
            <span class="path">/discovery</span>
            <span class="desc">Tool manifest</span>
          </div>
          <div class="endpoint">
            <span class="method post">POST</span>
            <span class="path">/tools/get_airtable_data</span>
            <span class="desc">Fetch records</span>
          </div>
        </div>
        <div class="footer">Deployed on Vercel · Optimizely Opal Custom Tool</div>
      </div>
    </body>
    </html>
  `);
});

export default app;