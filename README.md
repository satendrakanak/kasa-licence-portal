# Kasa Licence Portal

Central licence management for Kasa products and future software releases.

## What This Handles

- Multiple products such as Kasa Enterprise and Kasa Starter Kit
- Buyer records from Envato, direct sales, or manual admin entry
- Unique licence key generation
- One or more allowed activations per licence
- Activation, check-in, deactivation, suspension, refund, and revoke flows
- Signed activation response for client apps
- Audit trail for licence usage

## Local Setup

```bash
cp .env.example .env.local
npm install
npm run setup
npm run dev
```

Open `http://localhost:3000`. The first run opens setup and creates the first admin.

For a ready testing workspace with demo products, buyers, and licences:

```bash
npm run setup:demo
npm run dev
```

Demo admin:

```text
Email: admin@kasa.test
Password: Password@123
```

The seed command prints demo licence keys once. After creation, full keys are not stored, only secure hashes and masked previews.

## Environment

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/kasa_licence_portal?schema=public"
SESSION_SECRET="change-this-to-a-long-random-secret"
LICENSE_SIGNING_SECRET="change-this-to-another-long-random-secret"
NEXT_PUBLIC_APP_NAME="Kasa Licence Portal"
```

## Activation API

Client products call this endpoint during installation and periodic check-ins.

```http
POST /api/v1/licenses/activate
Content-Type: application/json
```

```json
{
  "licenseKey": "KASA-XXXX-XXXX-XXXX-XXXX",
  "productSlug": "kasa-enterprise",
  "instanceId": "stable-installation-id",
  "instanceLabel": "Client production server",
  "productVersion": "1.0.0",
  "metadata": {
    "domain": "client-site.com"
  }
}
```

The portal checks the key, product, status, expiry, and activation limit. A successful response includes a signed token that the client app can cache and recheck periodically.

Example test:

```bash
curl -X POST http://localhost:3000/api/v1/licenses/activate \
  -H "Content-Type: application/json" \
  -d '{
    "licenseKey": "PASTE-SEED-KEY-HERE",
    "productSlug": "kasa-enterprise",
    "instanceId": "demo-installation-0001",
    "instanceLabel": "Local test install",
    "productVersion": "1.0.0"
  }'
```

## Deactivation API

```http
POST /api/v1/licenses/deactivate
Content-Type: application/json
```

```json
{
  "licenseKey": "KASA-XXXX-XXXX-XXXX-XXXX",
  "productSlug": "kasa-enterprise",
  "instanceId": "stable-installation-id"
}
```

## Production Notes

- Use PostgreSQL with backups enabled.
- Set long random values for `SESSION_SECRET` and `LICENSE_SIGNING_SECRET`.
- Keep this portal private behind admin login.
- Do not log full licence keys after creation; store only hashes and masked previews.
- For marketplace sales, store the platform and purchase reference with each licence.
