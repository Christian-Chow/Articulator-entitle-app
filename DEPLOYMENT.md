# Deployment Guide for Alibaba Cloud

This guide explains how to deploy the Articulator Entitle App on Alibaba Cloud using Docker.

## Prerequisites

- Alibaba Cloud ECS instance (Ubuntu 22.04 or similar)
- Docker and Docker Compose installed
- Domain name (optional, for production)

## Quick Start

### 1. Build and Run with Docker Compose

```bash
# Clone your repository
git clone <your-repo-url>
cd articulator-entitle-app

# Build and start containers
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

### 2. Build and Run with Docker

```bash
# Build the image
docker build -t articulator-app .

# Run the container
docker run -d \
  --name articulator-app \
  -p 3000:3000 \
  -p 3001:3001 \
  -e NODE_ENV=production \
  articulator-app
```

## Environment Variables

Create a `.env` file or set environment variables:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key

# Other environment variables as needed
```

## Production Deployment on Alibaba Cloud

### Option 1: Using Alibaba Cloud Container Service (ACK)

1. Push your Docker image to Alibaba Cloud Container Registry (ACR)
2. Create an ACK cluster
3. Deploy using Kubernetes manifests

### Option 2: Using ECS with Docker

1. **SSH into your ECS instance**
   ```bash
   ssh root@your-ecs-ip
   ```

2. **Install Docker and Docker Compose**
   ```bash
   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sh get-docker.sh
   
   # Install Docker Compose
   curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   chmod +x /usr/local/bin/docker-compose
   ```

3. **Clone and deploy**
   ```bash
   git clone <your-repo-url>
   cd articulator-entitle-app
   docker-compose up -d --build
   ```

4. **Configure firewall**
   ```bash
   # Allow ports 3000 and 3001
   ufw allow 3000/tcp
   ufw allow 3001/tcp
   ```

### Option 3: Using Nginx as Reverse Proxy

For production, it's recommended to use Nginx as a reverse proxy:

1. **Install Nginx**
   ```bash
   apt-get update
   apt-get install nginx
   ```

2. **Create Nginx configuration** (`/etc/nginx/sites-available/articulator`)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       # Frontend (Next.js)
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }

       # Backend API
       location /api {
           proxy_pass http://localhost:3001;
           proxy_http_version 1.1;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
       }
   }
   ```

3. **Enable the site**
   ```bash
   ln -s /etc/nginx/sites-available/articulator /etc/nginx/sites-enabled/
   nginx -t
   systemctl reload nginx
   ```

## Health Checks

Check if services are running:

```bash
# Check container status
docker ps

# Check Next.js
curl http://localhost:3000

# Check backend API
curl http://localhost:3001/api/encode
```

## Troubleshooting

### View logs
```bash
docker-compose logs -f
# or
docker logs articulator-app -f
```

### Restart services
```bash
docker-compose restart
# or
docker restart articulator-app
```

### Rebuild after code changes
```bash
docker-compose up -d --build
```

## Security Considerations

1. **Use HTTPS**: Set up SSL certificates (Let's Encrypt) for production
2. **Environment Variables**: Never commit `.env` files
3. **Firewall**: Only expose necessary ports
4. **Regular Updates**: Keep Docker images and dependencies updated

## Monitoring

Consider setting up:
- Alibaba Cloud Application Real-Time Monitoring Service (ARMS)
- Log monitoring
- Resource usage alerts
