# Amazon Lightsail VPS Deployment Guide — IBIS Rice Procurement System

This guide outlines the exact steps to deploy the **IBIS Rice Procurement System** to your existing **Amazon Lightsail VPS running Amazon Linux (2023)** under subdomain **`procurment.icsserver.com`**, running alongside your existing **ICS Server (`icsserver.com`)** without disruption.

---

## 📌 Architecture & Server Layout

| Service | Host / Domain | Internal Port | Technology | Notes |
|---------|---------------|---------------|------------|-------|
| **ICS Server** | `icsserver.com` | `127.0.0.1:9000` | Survey Solutions (Docker container) | Existing container moved from port 80 to 9000 |
| **IBIS Rice Procurement** | `procurment.icsserver.com` | `127.0.0.1:3000` | Next.js + Node.js (PM2 managed) | New procurement system |
| **Reverse Proxy** | Public Port 80 / 443 | - | Nginx | Routes traffic by domain header |
| **Database** | PostgreSQL | `5432` | PostgreSQL (Database: `ibis_db`) | Isolated DB on existing PostgreSQL server |

---

## 🚀 Step 1: Cloudflare DNS Setup

1. Log in to your **Cloudflare Dashboard**.
2. Select your domain **`icsserver.com`**.
3. Navigate to **DNS → Records → Add record**.
4. Configure:
   - **Type**: `A`
   - **Name**: `procurment`
   - **IPv4 Address**: Your Lightsail VPS Static IP (same IP as `icsserver.com`)
   - **Proxy Status**: 🟠 Proxied (Orange Cloud ON)
5. Save the record.

---

## 🛠️ Step 2: Server Dependencies Installation (Amazon Linux 2023)

SSH into your Amazon Lightsail server:
```bash
ssh -i /path/to/your-key.pem ec2-user@YOUR_LIGHTSAIL_STATIC_IP
```

Install required packages using Amazon Linux `dnf`:
```bash
# 1. Update system packages
sudo dnf update -y

# 2. Install Node.js (v18+) if not installed
sudo dnf install -y nodejs

# 3. Install Nginx reverse proxy
sudo dnf install -y nginx

# 4. Install PostgreSQL client tools (for backups & migrations)
sudo dnf install -y postgresql15

# 5. Install PM2 process manager globally
sudo npm install -g pm2
```

---

## 🌐 Step 3: Nginx & Survey Solutions Configuration (Zero Downtime)

### 3.1 Migrate Survey Solutions Docker Container to Port 9000
To allow Nginx to manage port 80 for both domains, move the Survey Solutions container from external port 80 to internal port 9000:

```bash
# Stop and remove current docker container (data in 'hq_data' volume remains 100% safe)
sudo docker stop hq
sudo docker rm hq

# Relaunch on internal port 9000
sudo docker run -d -p 9000:80 --name hq \
    --restart unless-stopped \
    -e "HQ_Headquarters__TenantName=hq" \
    -e "HQ_Headquarters__BaseUrl=https://icsserver.com/" \
    -e "HQ_ConnectionStrings__DefaultConnection=Server=YOUR_POSTGRES_HOST;Port=5432;User Id=dbmasteruser;Password=YOUR_POSTGRES_PASSWORD;Database=SurveySolutions" \
    -e "ASPNETCORE_URLS=http://+:80" \
    -v "hq_data:/app/AppData" \
    surveysolutions/surveysolutions:latest
```

### 3.2 Add Nginx Configuration
Create Nginx configuration at `/etc/nginx/conf.d/procurment.icsserver.com.conf`:

```bash
sudo nano /etc/nginx/conf.d/procurment.icsserver.com.conf
```

Paste content from `deployment/nginx/procurment.icsserver.com.conf`:
```nginx
# ICS Server (Survey Solutions)
server {
    listen 80;
    server_name icsserver.com www.icsserver.com;
    client_max_body_size 500M;

    location / {
        proxy_pass http://127.0.0.1:9000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# IBIS Rice Procurement System
server {
    listen 80;
    server_name procurment.icsserver.com;
    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Validate and start Nginx:
```bash
sudo nginx -t
sudo systemctl enable nginx
sudo systemctl restart nginx
```

---

## 🗄️ Step 4: Create Database

Connect to PostgreSQL and create `ibis_db`:
```bash
psql "postgresql://dbmasteruser:YOUR_POSTGRES_PASSWORD@localhost:5432/postgres" -c "CREATE DATABASE ibis_db;"
```

---

## 📦 Step 5: Application Deployment

### 5.1 Clone Code & Configure `.env`
```bash
cd /home/ec2-user
git clone https://github.com/Laychansetha/digitalization_payment_dev.git ibis-app
cd ibis-app

# Copy production environment template
cp .env.production.example .env
nano .env
```

Set `.env` parameters:
```env
DATABASE_URL="postgresql://dbmasteruser:YOUR_POSTGRES_PASSWORD@localhost:5432/ibis_db?schema=public"
NEXTAUTH_URL="https://procurment.icsserver.com"
NEXTAUTH_SECRET="your-generated-64-character-secret"
PORT=3000
HOSTNAME="0.0.0.0"
```

### 5.2 Build & Initialize Database
```bash
# 1. Install dependencies
npm ci

# 2. Generate Prisma client
npx prisma generate

# 3. Apply schema migrations
npx prisma migrate deploy

# 4. Seed master data (villages, banks, price specs, default accounts)
npm run seed

# 5. Build Next.js application
npm run build
```

### 5.3 Start Application with PM2
```bash
# Start process using ecosystem config
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# Enable PM2 auto-restart on system reboot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user
```

---

## ✅ Verification Checklist

1. `https://icsserver.com` → Survey Solutions loads normally.
2. `https://procurment.icsserver.com` → IBIS Rice Procurement System login loads.
3. `pm2 status` → `ibis-app` status shows `online`.
4. `sudo docker ps` → `hq` container running on `0.0.0.0:9000->80/tcp`.

---

## 🔄 Updating / Re-deploying

To deploy future updates:
```bash
cd /home/ec2-user/ibis-app
bash scripts/deploy.sh
```
