# Quick Fix for Your Nginx Configuration

## Problem
Your nginx config is missing the `/api/` route to proxy backend requests to port 3001.

## Solution
Add the `/api/` location block **BEFORE** the existing `location /` block.

## Your Complete Fixed Config

```nginx
server {
    server_name basel.articulator.ai;

    # ===== ADD THIS BLOCK =====
    # Backend API (Express on port 3001)
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Increase timeout for file uploads
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
        proxy_send_timeout 300s;
        
        # Allow file uploads up to 10MB
        client_max_body_size 10M;
    }

    # Health check endpoint (optional)
    location /health {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    # ===== END OF ADDITION =====

    # Frontend (Next.js on port 8080) - keep this as is
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

## Steps to Apply

1. **Edit your nginx config:**
   ```bash
   sudo nano /etc/nginx/sites-available/basel.articulator.ai
   # or wherever your config file is located
   ```

2. **Add the `/api/` location block** before the `location /` block

3. **Test the configuration:**
   ```bash
   sudo nginx -t
   ```

4. **Reload nginx:**
   ```bash
   sudo systemctl reload nginx
   # or
   sudo service nginx reload
   ```

5. **Test the backend API:**
   ```bash
   # Should return JSON with system info
   curl https://basel.articulator.ai/api/health
   
   # Should work without SSL errors
   curl https://basel.articulator.ai/api/decode
   ```

## Why This Works

- **Before:** Frontend tried to connect to `https://basel.articulator.ai:3001` → SSL error (port 3001 has no SSL)
- **After:** Frontend connects to `https://basel.articulator.ai/api/decode` → nginx proxies to `http://127.0.0.1:3001/api/decode` → Works!

## Verification

After applying the fix, test in your browser:

1. Open `https://basel.articulator.ai/`
2. Open DevTools (F12) → Network tab
3. Try uploading an image
4. Check the request URL - it should be `https://basel.articulator.ai/api/decode` (not `:3001`)
5. No more `ERR_SSL_PROTOCOL_ERROR`!
