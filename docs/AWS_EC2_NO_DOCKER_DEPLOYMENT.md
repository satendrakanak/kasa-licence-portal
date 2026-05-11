# AWS EC2 No-Docker Deployment

This guide runs the Kasa Licence Portal directly on an AWS EC2 Ubuntu server with Node.js, PM2, PostgreSQL, and the shared Caddy reverse proxy.

## Recommended Host

- Ubuntu EC2 instance.
- Node.js 22 LTS or newer.
- PostgreSQL installed on the host.
- PM2 for process management.
- Caddy or another reverse proxy for HTTPS.

## Domain

Point this DNS record to the EC2 public IPv4 address:

```text
license.getkasa.in    A    YOUR_EC2_PUBLIC_IP
```

## Server Packages

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2
```

## Database

```bash
sudo -u postgres psql
```

```sql
CREATE USER kasa_licence WITH PASSWORD 'replace-with-strong-password';
CREATE DATABASE kasa_licence_portal OWNER kasa_licence;
GRANT ALL PRIVILEGES ON DATABASE kasa_licence_portal TO kasa_licence;
\q
```

## App Setup

```bash
sudo mkdir -p /opt/kasa
sudo chown -R "$USER":"$USER" /opt/kasa
cd /opt/kasa
git clone https://github.com/satendrakanak/kasa-licence-portal.git
cd kasa-licence-portal
cp .env.example .env.local
nano .env.local
```

Example production values:

```env
DATABASE_URL="postgresql://kasa_licence:replace-with-strong-password@localhost:5432/kasa_licence_portal?schema=public"
SESSION_SECRET="replace-with-long-random-secret"
LICENSE_SIGNING_SECRET="replace-with-another-long-random-secret"
NEXT_PUBLIC_APP_NAME="Kasa Licence Portal"
```

Then run:

```bash
./scripts/aws-live-setup.sh
```

Open `https://license.getkasa.in/setup` and create the first admin account.

## PM2 Commands

```bash
pm2 status kasa-licence-portal
pm2 logs kasa-licence-portal
pm2 restart kasa-licence-portal
pm2 save
```

## Shared Caddy Route

If Caddy is already running as the central reverse proxy, add:

```caddyfile
license.getkasa.in {
  encode zstd gzip
  reverse_proxy 172.31.16.104:5000
}
```

Use the EC2 private IP shown by `hostname -I`.
