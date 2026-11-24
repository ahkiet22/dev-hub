# Health Check Contract & Monitoring — Dev Hub

## 1. HTTP Health Check Contract

Every registered Backend must expose a `GET` endpoint (default `/health`) returning JSON conforming to this contract:

```json
{
  "status": "healthy",
  "service": "concert-ticket-api",
  "version": "1.0.0",
  "timestamp": "2026-11-25T00:00:00Z",
  "checks": {
    "database": { "status": "healthy" },
    "redis": { "status": "healthy" }
  }
}
```

### Schema Rules (Validated with Zod)
- **Required:** `status` (`"healthy" | "degraded" | "unhealthy"`), `service` (non-empty string), `timestamp` (ISO-8601 datetime string).
- **Optional:** `version` (string), `checks` (record of dependency name → `{ status: "healthy" | "degraded" | "unhealthy", message?: string }`).

### Status Mapping & Consistency

| HTTP Status | JSON `status` | Internal `health_status` |
|---|---|---|
| `200` | `"healthy"` | `HEALTHY` |
| `200` | `"degraded"` | `DEGRADED` |
| `503` | `"unhealthy"` | `UNHEALTHY` |
| `200` with `"unhealthy"` or `503` with `"healthy"` | Mismatch | `INVALID_RESPONSE` |
| Non-200/503 or malformed JSON / Zod failure | Any | `INVALID_RESPONSE` |
| DNS error, connection refused, TLS error, timeout | N/A | `UNREACHABLE` |

## 2. Monitoring Execution & Vercel Architecture

### Due-Check Query
```sql
SELECT id, health_url, timeout_ms
FROM "dev-hub".project_backends
WHERE deleted_at IS NULL
  AND is_active = true
  AND (last_checked_at IS NULL OR last_checked_at + (check_interval_seconds || ' seconds')::interval <= now())
ORDER BY last_checked_at ASC NULLS FIRST
LIMIT 20;
```

### Dual-Trigger Execution
1. **Vercel Cron (`GET /api/internal/health-cron`):** Protected by `Authorization: Bearer ${CRON_SECRET}`. Processes up to 20 due backends with bounded concurrency (`5`) so execution finishes within Vercel Serverless limits.
   - *Note:* Vercel Hobby allows daily crons; Vercel Pro supports 1-minute crons (`* * * * *`).
2. **Standalone Node Worker (`src/workers/health.worker.ts`):** Runs an in-memory interval loop with an active-backend lock set (preventing overlapping checks for the same `backend_id`), graceful `SIGTERM`/`SIGINT` shutdown, and periodic 30-day retention cleanup. Recommended when 60-second polling is needed alongside a Vercel Hobby web deployment.

### Transactional State Update
For each completed check, `HealthService` runs a transaction:
1. `INSERT INTO "dev-hub".backend_health_checks (...)`
2. `UPDATE "dev-hub".project_backends SET health_status = $1, response_time_ms = $2, last_checked_at = now(), last_healthy_at = CASE WHEN $1 = 'HEALTHY' THEN now() ELSE last_healthy_at END WHERE id = $3`

## 3. SSRF & Security Controls

Before any `GET` request (including manual checks and worker checks):
1. **Protocol:** Only `http:` and `https:` are allowed.
2. **DNS Resolution & IP Filtering:** Resolve hostname via `dns.lookup` and block loopback (`127.0.0.0/8`, `::1`), private RFC1918 (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`), link-local / cloud metadata (`169.254.0.0/16`, `fe80::/10`), and CGNAT (`100.64.0.0/10`) unless the target CIDR/host is explicitly configured in `TRUSTED_PRIVATE_NETWORKS`.
3. **Redirects:** `redirect: 'manual'` (reject 3xx redirects or re-validate target before following).
4. **Body Size Limit:** Stream and abort if response exceeds `65536` bytes (64 KB).
5. **Sanitization:** Strip all response headers; store only validated contract fields in `response_body` JSONB.

## 4. Integration Examples

### NestJS (`/health`)
```ts
@Get('health')
async check(@Res() res: Response) {
  const dbOk = await this.db.ping();
  const status = dbOk ? 'healthy' : 'unhealthy';
  return res.status(dbOk ? 200 : 503).json({
    status,
    service: 'my-nestjs-api',
    version: process.env.APP_VERSION ?? '1.0.0',
    timestamp: new Date().toISOString(),
    checks: { database: { status } },
  });
}
```

### Go (`net/http`)
```go
http.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(http.StatusOK)
    json.NewEncoder(w).Encode(map[string]any{
        "status":    "healthy",
        "service":   "my-go-api",
        "version":   "1.0.0",
        "timestamp": time.Now().UTC().Format(time.RFC3339),
        "checks":    map[string]any{"database": map[string]string{"status": "healthy"}},
    })
})
```
