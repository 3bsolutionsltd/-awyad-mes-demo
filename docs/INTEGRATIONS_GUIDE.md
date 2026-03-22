# Integrations Guide — Kobo Toolbox & Power BI

## Kobo Toolbox Webhook

### How it works

Every time a respondent submits a Kobo form, Kobo's REST Service feature pushes the raw JSON payload to your server. The server stores it in the `kobo_submissions` table with status `pending`. A data manager then reviews the submission and maps it to the correct activity record via the API.

### One-time setup in KoboToolbox

1. Log into **KoboToolbox** → open your form
2. Go to **Settings → REST Services → Register a new service**
3. Fill in the fields:

   | Field | Value |
   |-------|-------|
   | Name | AWYAD MES |
   | Endpoint URL | `https://your-server.com/api/v1/integrations/kobo/webhook` |
   | Method | `POST` |

4. Click **Create** — Kobo will POST every new submission automatically

> **Local testing:** Use [ngrok](https://ngrok.com/) to expose `localhost:3001` publicly:  
> `ngrok http 3001`  
> Then set the Kobo endpoint to the ngrok HTTPS URL.

### API endpoints

#### List submissions

```http
GET /api/v1/integrations/kobo/submissions
Authorization: Bearer <token>
```

Optional query parameters:

| Param | Description | Example |
|-------|-------------|---------|
| `status` | Filter by status | `pending`, `mapped` |
| `form_id` | Filter by Kobo form ID | `aXbYcZ` |
| `page` | Page number (default: 1) | `2` |
| `limit` | Results per page (default: 50) | `25` |

**Example response:**

```json
{
  "success": true,
  "data": {
    "submissions": [
      {
        "id": "uuid",
        "form_id": "aXbYcZ",
        "submission_uuid": "...",
        "status": "pending",
        "payload": { ... },
        "received_at": "2026-03-19T10:00:00Z",
        "mapped_to": null,
        "mapped_activity_name": null
      }
    ],
    "pagination": { "page": 1, "limit": 50, "total": 12 }
  }
}
```

#### Map a submission to an activity

Once you've reviewed a submission, link it to the correct activity:

```http
POST /api/v1/integrations/kobo/:submission_id/map
Authorization: Bearer <token>
Content-Type: application/json

{
  "activity_id": "activity-uuid-here"
}
```

**Response:** Returns the updated submission record with `status: "mapped"` and `mapped_to` set to the activity ID.

**Validation rules:**
- The activity must exist
- The activity must not be locked (`is_locked = false`)

### Payload format (Kobo standard fields)

Kobo submissions arrive as flat JSON. Common fields the server extracts:

| Kobo field | Stored as |
|------------|-----------|
| `_xform_id_string` | `form_id` |
| `_uuid` | `submission_uuid` (unique — duplicate submissions are ignored) |
| Everything | `payload` (full JSON stored for reference) |

### Security note

The webhook endpoint (`POST /kobo/webhook`) accepts unauthenticated requests so Kobo's servers can post to it. If the server is public-facing, it is strongly recommended to add **HMAC signature validation** using the `X-Kobo-Signature` header that Kobo sends. Contact the development team to enable this.

---

## Power BI Feeds

Three read-only JSON feeds are available for connecting directly to Power BI. All require a Bearer token.

### Available feeds

| Feed | Endpoint | Contents |
|------|----------|----------|
| Activities | `GET /api/v1/integrations/powerbi/activities` | Activity metrics, location (lat/lng), budget utilisation %, beneficiary counts, lock status |
| Indicators | `GET /api/v1/integrations/powerbi/indicators` | Baseline, target, current values, achievement % per indicator |
| Projects | `GET /api/v1/integrations/powerbi/projects` | Budget, burn rate %, activity/indicator counts, total beneficiaries per project |

### Connecting in Power BI Desktop

1. Open Power BI Desktop
2. **Home → Get Data → Web**
3. Select **Advanced**
4. Enter the URL, e.g.:
   ```
   http://your-server.com/api/v1/integrations/powerbi/activities
   ```
5. Under **HTTP request header parameters**, click **Add header**:
   - Header name: `Authorization`
   - Header value: `Bearer <your JWT token>`
6. Click **OK**
7. In the Navigator, select the `data` record and click **Transform Data**
8. In Power Query: select the `data` column → **Expand** → choose the fields you need
9. Repeat steps 2–8 for the other two feeds

### Feed field reference

#### Activities feed

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Activity ID |
| `activity_name` | text | Activity name |
| `status` | text | `Planned`, `In Progress`, `Completed`, etc. |
| `planned_date` | date | |
| `completion_date` | date | |
| `location` | text | Text description |
| `latitude` / `longitude` | numeric | GPS coordinates |
| `beneficiary_id` | UUID | Linked beneficiary |
| `total_beneficiaries` | integer | |
| `total_pwd` | integer | Sum of PWD (male + female + other) |
| `budget` | numeric | Planned budget |
| `actual_cost` | numeric | |
| `currency` | text | |
| `budget_utilization_pct` | numeric | `actual_cost / budget × 100` |
| `is_locked` | boolean | |
| `project_name` | text | |
| `indicator_name` | text | |
| `thematic_area` | text | |

#### Indicators feed

| Field | Type | Description |
|-------|------|-------------|
| `indicator_name` | text | |
| `indicator_scope` | text | `awyad` or `project` |
| `baseline_value` | numeric | |
| `target_value` | numeric | |
| `current_value` | numeric | |
| `achievement_pct` | numeric | `current / target × 100` |
| `unit_of_measurement` | text | |
| `reporting_frequency` | text | |
| `project_name` | text | |

#### Projects feed

| Field | Type | Description |
|-------|------|-------------|
| `name` | text | Project name |
| `status` | text | `Active`, `Closed`, etc. |
| `start_date` / `end_date` | date | |
| `budget` / `expenditure` | numeric | |
| `burn_rate_pct` | numeric | `expenditure / budget × 100` |
| `donor` | text | |
| `location` | text | |
| `total_activities` | integer | |
| `total_indicators` | integer | |
| `total_beneficiaries` | integer | Sum across all activities |

### Scheduled refresh (Power BI Service)

Power BI Service's scheduled refresh requires a **static credential** — a JWT expires too quickly. Options:

1. **API Key (recommended):** Ask the development team to generate a long-lived, read-only API key. Pass it as the Bearer token.
2. **On-premises data gateway:** Install the gateway on the server running AWYAD MES. The gateway handles credential storage and refresh automatically.

### Suggested report structure

```
AWYAD MES Report
├── Page 1 — Executive Summary
│   └── Cards: Projects, Activities, Budget, Beneficiaries
├── Page 2 — Activity Performance
│   └── Charts: Status breakdown, Budget utilisation by project, Map (lat/lng)
├── Page 3 — Indicator Tracking
│   └── Charts: Achievement % by indicator, Scope filter (AWYAD vs project)
└── Page 4 — Financial Overview
    └── Charts: Burn rate by project, Budget vs Expenditure waterfall
```
