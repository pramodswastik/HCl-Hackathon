# Deploying Backend on AWS EC2

## Prerequisites
- AWS Account with EC2 access
- Your backend code pushed to a Git repository (GitHub, GitLab, etc.)

---

## Step 1: Launch an EC2 Instance

1. **Go to AWS Console** → EC2 → Launch Instance

2. **Configure the instance:**
   - **Name:** `retail-portal-backend`
   - **AMI:** Amazon Linux 2023 or Ubuntu 22.04 LTS
   - **Instance Type:** `t2.micro` (free tier) or `t3.small` for production
   - **Key Pair:** Create or select an existing key pair (download the `.pem` file)
   - **Security Group:** Create new with these rules:
     | Type | Port | Source |
     |------|------|--------|
     | SSH | 22 | Your IP |
     | HTTP | 80 | 0.0.0.0/0 |
     | HTTPS | 443 | 0.0.0.0/0 |
     | Custom TCP | 5000 | 0.0.0.0/0 |

3. **Storage:** 20 GB gp3 (default is fine)

4. Click **Launch Instance**

---

## Step 2: Connect to Your EC2 Instance

### On Windows (using PowerShell or Git Bash):
```bash
# Move your .pem file to a secure location
# Then connect:
ssh -i "your-key.pem" ec2-user@<your-ec2-public-ip>

# For Ubuntu AMI, use:
ssh -i "your-key.pem" ubuntu@<your-ec2-public-ip>
```

### If you get permission error on Windows:
```powershell
# In PowerShell, run:
icacls "your-key.pem" /inheritance:r
icacls "your-key.pem" /grant:r "$($env:USERNAME):(R)"
```

---

## Step 3: Install Node.js on EC2

### For Amazon Linux 2023:
```bash
# Update system
sudo dnf update -y

# Install Node.js 20.x
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Verify installation
node --version
npm --version
```

### For Ubuntu 22.04:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

---

## Step 4: Install Git and Clone Your Repository

```bash
# Install git (if not installed)
# Amazon Linux:
sudo dnf install git -y

# Ubuntu:
sudo apt install git -y

# Clone your repository
cd ~
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO/backend
```

---

## Step 5: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add your production environment variables:
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database (use MongoDB Atlas for production)
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/retail_portal?retryWrites=true&w=majority

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# JWT Configuration (use strong secrets!)
JWT_ACCESS_SECRET=generate-a-strong-64-char-secret-here-use-openssl-rand
JWT_REFRESH_SECRET=generate-another-strong-64-char-secret-here-openssl
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Email Configuration
SMTP_HOST=smtp.your-email-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
EMAIL_FROM="Retail Portal" <noreply@yourdomain.com>

# Frontend URL
FRONTEND_URL=https://your-frontend-domain.com

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret-access-key
AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=your-s3-bucket-name
```

Save and exit: `Ctrl+X`, then `Y`, then `Enter`

**Generate strong secrets:**
```bash
# Generate random secrets
openssl rand -hex 32
```

---

## Step 6: Install Dependencies and Test

```bash
# Install dependencies
npm install --production

# Test the server
npm start
```

If everything works, you should see:
```
📦 MongoDB Connected: ...
🚀 Server is running on port 5000
```

Press `Ctrl+C` to stop.

---

## Step 7: Install PM2 (Process Manager)

PM2 keeps your app running and auto-restarts on crashes:

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the application with PM2
pm2 start src/server.js --name "retail-backend"

# Configure PM2 to start on system boot
pm2 startup
# Run the command it outputs (sudo env PATH=...)

# Save the PM2 process list
pm2 save
```

### Useful PM2 Commands:
```bash
pm2 status              # Check app status
pm2 logs                # View logs
pm2 logs retail-backend # View specific app logs
pm2 restart retail-backend  # Restart the app
pm2 stop retail-backend     # Stop the app
pm2 delete retail-backend   # Remove from PM2
```

---

## Step 8: Set Up Nginx as Reverse Proxy (Optional but Recommended)

Nginx handles incoming traffic and forwards to your Node.js app:

### Install Nginx:
```bash
# Amazon Linux:
sudo dnf install nginx -y

# Ubuntu:
sudo apt install nginx -y
```

### Configure Nginx:
```bash
sudo nano /etc/nginx/conf.d/retail-backend.conf
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # Or your EC2 public IP

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Start Nginx:
```bash
# Test configuration
sudo nginx -t

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

Now your API is accessible at `http://your-ec2-ip/` (port 80).

---

## Step 9: Set Up SSL with Let's Encrypt (For HTTPS)

If you have a domain pointing to your EC2:

```bash
# Install Certbot
# Amazon Linux:
sudo dnf install certbot python3-certbot-nginx -y

# Ubuntu:
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal (test it)
sudo certbot renew --dry-run
```

---

## Quick Reference

### Your API will be available at:
- **Direct:** `http://<EC2-PUBLIC-IP>:5000`
- **With Nginx:** `http://<EC2-PUBLIC-IP>` or `http://your-domain.com`
- **With SSL:** `https://your-domain.com`

### Update Frontend Environment:
Update your frontend `.env` file:
```env
VITE_API_URL=http://<EC2-PUBLIC-IP>:5000/api
# Or with domain:
VITE_API_URL=https://your-domain.com/api
```

---

## Updating Your Backend

When you push new code to your repository:

```bash
# SSH into your EC2
ssh -i "your-key.pem" ec2-user@<your-ec2-public-ip>

# Navigate to project
cd ~/YOUR_REPO/backend

# Pull latest changes
git pull origin main

# Install any new dependencies
npm install --production

# Restart PM2
pm2 restart retail-backend
```

---

## Troubleshooting

### Check if app is running:
```bash
pm2 status
pm2 logs retail-backend --lines 50
```

### Check if port is open:
```bash
sudo netstat -tlnp | grep :5000
```

### Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
```

### Firewall issues (Amazon Linux):
```bash
# Usually not needed, but if firewall is enabled:
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

---

## Cost Optimization Tips

1. **Use t3.micro or t2.micro** for development (free tier eligible)
2. **Use Reserved Instances** for production (up to 72% savings)
3. **Set up CloudWatch alarms** to monitor costs
4. **Stop instances** when not in use during development
