# opal-airtable-custom-tool

A custom tool for [Optimizely Opal](https://www.optimizely.com/opal) that fetches records from an Airtable base and returns them as structured JSON. Built with TypeScript and Express, deployed on Vercel.

---

## Endpoints

| Method | Path | Description |
|---|---|---|
| `GET` | `/discovery` | Returns the Opal tool manifest |
| `POST` | `/tools/get_airtable_data` | Fetches records from Airtable |

---

## Tool Parameters

| Parameter | Type | Required | Description |
|---|---|---|---|
| `filter_field` | string | No | Airtable field name to filter by (e.g. `Status`) |
| `filter_value` | string | No | Value to match against `filter_field` |
| `max_records` | number | No | Max records to return (default: 20, max: 100) |

---

## Project Structure

```
opal-airtable-custom-tool/
├── api/
│   └── index.ts        # Discovery + execution endpoints
├── .gitignore
├── package.json
├── tsconfig.json
└── vercel.json
```

---

## Local Development

**1. Clone the repo**
```bash
git clone https://github.com/waqqasiq/opal-airtable-custom-tool.git
cd opal-airtable-custom-tool
```

**2. Install dependencies**
```bash
npm install
```

**3. Create a `.env` file**
```bash
AIRTABLE_TOKEN=your_airtable_personal_access_token
```

**4. Run locally**
```bash
npm run dev
```

The server will be available at `http://localhost:3000`. Test your endpoints:
```bash
# Discovery
curl http://localhost:3000/discovery

# Fetch all records
curl -X POST http://localhost:3000/tools/get_airtable_data \
  -H "Content-Type: application/json" \
  -d '{"max_records": 10}'

# Fetch with filter
curl -X POST http://localhost:3000/tools/get_airtable_data \
  -H "Content-Type: application/json" \
  -d '{"filter_field": "Status", "filter_value": "Active"}'
```

---

## Deployment (Vercel)

**1. Push to GitHub**
```bash
git add .
git commit -m "your message"
git push
```

**2. Connect to Vercel**
- Go to [vercel.com](https://vercel.com) and import your GitHub repo
- Add `AIRTABLE_TOKEN` under **Project → Settings → Environment Variables**
- Click **Deploy**

Your tool will be live at:
```
https://opal-airtable-custom-tool.vercel.app
```

> Always use the production URL (no random hash) when registering in Opal. Preview URLs are protected by Vercel authentication by default.

---

## Registering in Optimizely Opal

1. Go to **Tools → Registries** in your Opal instance
2. Click **Add tool registry**
3. Enter the following:
   - **Registry Name:** `airtable_tool`
   - **Discovery URL:** `https://opal-airtable-custom-tool.vercel.app/discovery`
   - **Bearer Token:** leave blank
4. Click **Save**

---

## Airtable Setup

- **Base ID:** `appz6jRQD8kic0SRd`
- **Table ID:** `tblHKPp0726iXRIfh`

To generate a Personal Access Token, go to [airtable.com/create/tokens](https://airtable.com/create/tokens) and create a token with `data.records:read` scope, giving it access to your base.

---

## Environment Variables

| Variable | Description |
|---|---|
| `AIRTABLE_TOKEN` | Airtable Personal Access Token |