# HTTPS Setup and Debugging Guide

## Problem: ERR_SSL_PROTOCOL_ERROR

When accessing `https://basel.articulator.ai/`, the frontend tries to connect to `https://basel.articulator.ai:3001/api/decode`, but port 3001 only serves HTTP (not HTTPS), causing an SSL protocol error.

## Solution Options

### Option 1: Reverse Proxy Configuration (Recommended)

Configure your reverse proxy (nginx, Apache, etc.) to route `/api/*` requests to the backend on port 3001.

#### Nginx Configuration Example

**Your Current Config (Missing Backend Routes):**

```nginx
server {
    server_name basel.articulator.ai;

    location / {
        proxy_pass http://127.0.0.1:8080;
        # ... existing headers ...
    }

    listen 443 ssl; # managed by Certbot
    # ... SSL config ...
}
```

**Updated Config (Add Backend Routes):**

```nginx
server {
    server_name basel.articulator.ai;

    # Backend API (Express on port 3001) - MUST come before location /
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for file uploads (important for image decoding)
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        
        # Increase body size for file uploads
        client_max_body_size 10M;
    }

    # Health check endpoint (optional but useful)
    location /health {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (Next.js on port 8080) - comes after /api/ to catch everything else
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/basel.articulator.ai/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/basel.articulator.ai/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = basel.articulator.ai) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name basel.articulator.ai;
    return 404; # managed by Certbot
}
```

**Important Notes:**
- The `/api/` location block **MUST** come **before** the `/` location block (nginx matches most specific first)
- Use `127.0.0.1` (localhost) since nginx is on the same server
- The `client_max_body_size` allows file uploads up to 10MB
- Timeouts are increased for image processing operations

#### Apache Configuration Example

```apache
<VirtualHost *:443>
    ServerName basel.articulator.ai
    
    SSLEngine on
    SSLCertificateFile /path/to/certificate.crt
    SSLCertificateKeyFile /path/to/private.key

    # Frontend
    ProxyPass / http://43.99.51.105:8080/
    ProxyPassReverse / http://43.99.51.105:8080/

    # Backend API
    ProxyPass /api/ http://43.99.51.105:3001/api/
    ProxyPassReverse /api/ http://43.99.51.105:3001/api/

    # Health check
    ProxyPass /health http://43.99.51.105:3001/health
    ProxyPassReverse /health http://43.99.51.105:3001/health
</VirtualHost>
```

### Option 2: Set Environment Variable

Set `NEXT_PUBLIC_BACKEND_URL` to use HTTP (but this will cause mixed content warnings):

```bash
NEXT_PUBLIC_BACKEND_URL=http://43.99.51.105:3001
```

**Note:** This will cause mixed content warnings in the browser console, but may work if your browser allows it.

### Option 3: Set Up HTTPS on Backend Port 3001

Configure SSL/TLS on the backend server itself. This requires:
1. SSL certificates
2. Modifying `backend/server.js` to use HTTPS
3. Updating the code to use `https` module

## Debugging Steps

### Step 1: Verify Backend is Running

```bash
curl http://43.99.51.105:3001/health
```

Should return JSON with system information.

### Step 2: Test Backend API Directly

```bash
curl -X POST http://43.99.51.105:3001/api/decode \
  -F "image=@test-image.png"
```

### Step 3: Check Browser Console

1. Open browser DevTools (F12)
2. Go to Network tab
3. Try uploading an image
4. Check the failed request:
   - URL: Should be `https://basel.articulator.ai/api/decode` (if proxy configured) or `https://basel.articulator.ai:3001/api/decode` (if not)
   - Error: `ERR_SSL_PROTOCOL_ERROR` means SSL handshake failed

### Step 4: Verify Reverse Proxy Configuration

If using Option 1, test the proxy:

```bash
# Test through proxy (should work)
curl https://basel.articulator.ai/api/health

# Test direct backend (should also work)
curl http://43.99.51.105:3001/health
```

### Step 5: Check Current Backend URL

Add this to your browser console to see what URL is being used:

```javascript
// In browser console on https://basel.articulator.ai/
fetch('/api/health').then(r => r.json()).then(console.log)
```

Or check the Network tab to see the actual request URL.

## Current Code Behavior

The code in `lib/urls.ts` now:
- Uses same origin (no port) when on HTTPS and not localhost
- Uses port 3001 for HTTP/development
- Respects `NEXT_PUBLIC_BACKEND_URL` if set

## Recommended Production Setup

1. **Configure reverse proxy** to route `/api/*` to backend (Option 1)
2. **Set environment variable** as fallback:
   ```bash
   NEXT_PUBLIC_BACKEND_URL=https://basel.articulator.ai
   ```
3. **Test** that `https://basel.articulator.ai/api/health` works

## Troubleshooting

### Issue: Still getting ERR_SSL_PROTOCOL_ERROR

- **Check:** Is reverse proxy configured to route `/api/*`?
- **Check:** Is backend running on port 3001?
- **Check:** Can you access `http://43.99.51.105:3001/health` directly?

### Issue: 404 Not Found on /api/decode

- **Check:** Reverse proxy is routing `/api/*` correctly
- **Check:** Backend server is running
- **Check:** Backend routes are at `/api/decode` (not `/decode`)

### Issue: CORS errors

- **Check:** Backend CORS configuration allows requests from `https://basel.articulator.ai`
- **Check:** Reverse proxy is forwarding headers correctly
