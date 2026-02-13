# Deployment Guide for TaskFlow Pro

This guide covers multiple options to deploy your web application to a live server.

## Prerequisites

Before deploying, make sure your app is production-ready:

1. **Environment Variables** - Your app already uses `process.env.PORT`, which is good.
2. **Database** - You're using SQLite, which is file-based. This works for small deployments but consider PostgreSQL for production.

---

## Option 1: Render (Recommended - Free Tier Available)

Render is one of the easiest platforms for deploying Node.js apps.

### Steps:

1. **Create a Render account** at [render.com](https://render.com)

2. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
   Then create a repo on GitHub and push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git branch -M main
   git push -u origin main
   ```

3. **Create a new Web Service on Render**
   - Go to Render Dashboard → New → Web Service
   - Connect your GitHub repository
   - Configure:
     - **Name**: taskflow-pro (or your choice)
     - **Environment**: Node
     - **Build Command**: `npm install`
     - **Start Command**: `npm start`
     - **Instance Type**: Free (or paid for better performance)

4. **Add Environment Variables** (if needed)
   - In the Render dashboard, go to Environment tab
   - Add any environment variables your app needs

5. **Deploy**
   - Render will automatically deploy your app
   - You'll get a URL like: `https://taskflow-pro.onrender.com`

### Important Notes for Render:
- Free tier "spins down" after inactivity (first request takes ~30 seconds)
- SQLite database will be **ephemeral** on free tier (data lost on restart)
- For persistent data, upgrade to a paid plan or use external database

---

## Option 2: Railway (Easy Deployment)

Railway offers simple deployment with a generous free tier.

### Steps:

1. **Create a Railway account** at [railway.app](https://railway.app)

2. **Deploy from GitHub**
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway auto-detects Node.js

3. **Configure**
   - Railway automatically sets `PORT` environment variable
   - Add other environment variables in the Variables tab

4. **Get your URL**
   - Go to Settings → Domains
   - Add a custom domain or use the provided `.railway.app` URL

### Railway Notes:
- SQLite works better here as the filesystem persists
- Free tier includes $5/month of usage

---

## Option 3: Fly.io (Great for SQLite Apps)

Fly.io is excellent for apps with SQLite because they offer persistent volumes.

### Steps:

1. **Install Fly CLI**
   ```bash
   brew install flyctl
   ```

2. **Login to Fly**
   ```bash
   fly auth login
   ```

3. **Launch your app**
   ```bash
   fly launch
   ```
   - Follow the prompts
   - When asked about volumes, say **YES** to create a persistent volume for SQLite

4. **Create a persistent volume** (for SQLite database)
   ```bash
   fly volumes create data --size 1
   ```

5. **Update fly.toml** to mount the volume:
   ```toml
   [mounts]
   source = "data"
   destination = "/app/data"
   ```

6. **Deploy**
   ```bash
   fly deploy
   ```

### Fly.io Notes:
- Free tier includes 3 VMs and 3GB volume storage
- Persistent volumes keep your SQLite data safe
- Great performance with edge deployment

---

## Option 4: VPS (Virtual Private Server)

For full control, deploy to a VPS like DigitalOcean, Linode, or AWS EC2.

### Steps (Ubuntu/Debian):

1. **Create a VPS** (e.g., DigitalOcean Droplet - $4/month)

2. **SSH into your server**
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Install PM2** (process manager)
   ```bash
   sudo npm install -g pm2
   ```

5. **Clone your repository**
   ```bash
   git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
   cd YOUR_REPO
   npm install
   ```

6. **Start with PM2**
   ```bash
   pm2 start src/server.js --name taskflow
   pm2 startup
   pm2 save
   ```

7. **Set up Nginx reverse proxy**
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/taskflow
   ```

   Add this configuration:
   ```nginx
   server {
       listen 80;
       server_name YOUR_DOMAIN_OR_IP;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/taskflow /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

8. **Set up SSL with Let's Encrypt** (optional but recommended)
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d YOUR_DOMAIN
   ```

---

## Option 5: Vercel (Serverless)

Vercel is great for frontend apps but requires adjustments for SQLite.

### Limitations:
- SQLite won't work on Vercel (serverless functions are stateless)
- You'd need to migrate to a cloud database (Vercel Postgres, Supabase, etc.)

---

## Database Considerations

### SQLite (Current Setup)
- ✅ Simple, no configuration
- ✅ Works well for small apps
- ❌ Not ideal for production at scale
- ❌ May lose data on some platforms (Render free tier)

### Recommended: Migrate to PostgreSQL

For production, consider migrating to PostgreSQL:

1. **Supabase** - Free PostgreSQL database
2. **Neon** - Serverless PostgreSQL with free tier
3. **Railway PostgreSQL** - Easy setup with Railway deployment
4. **Render PostgreSQL** - Integrated with Render deployment

---

## Quick Comparison

| Platform | Free Tier | SQLite Support | Difficulty |
|----------|-----------|----------------|------------|
| Render | ✅ Yes | ⚠️ Ephemeral | Easy |
| Railway | ✅ $5/month credit | ✅ Persistent | Easy |
| Fly.io | ✅ 3 VMs | ✅ With volumes | Medium |
| VPS | ❌ Paid | ✅ Full control | Hard |

---

## Recommended Path

**For beginners**: Start with **Railway** or **Render** - easiest setup.

**For SQLite persistence**: Use **Fly.io** with persistent volumes.

**For production**: Use a VPS with **PostgreSQL** database.

---

## Need Help?

If you need help with any specific deployment option, let me know and I can provide more detailed instructions!
