# Fix for ERR_SSL_PROTOCOL_ERROR

## Problem
The frontend is still trying to connect to `https://basel.articulator.ai:3001/api/decode` instead of `https://basel.articulator.ai/api/decode`.

## Root Cause
The frontend code was updated, but the **deployed application needs to be rebuilt** to include the changes.

## Solution: Rebuild and Redeploy

### If using Docker:

1. **Rebuild the Docker image:**
   ```bash
   docker build -t articulator-app .
   ```

2. **Stop the current container:**
   ```bash
   docker stop <container-name>
   # or
   docker ps  # find container ID
   docker stop <container-id>
   ```

3. **Start the new container:**
   ```bash
   docker run -d -p 8080:8080 -p 3001:3001 articulator-app
   ```

### If running directly (without Docker):

1. **Navigate to your app directory:**
   ```bash
   cd /var/www/entitle-app/Articulator-entitle-app
   ```

2. **Pull latest code (if using git):**
   ```bash
   git pull
   ```

3. **Rebuild the frontend:**
   ```bash
   npm run build
   ```

4. **Restart the application:**
   ```bash
   # If using PM2:
   pm2 restart all
   
   # If using systemd:
   sudo systemctl restart your-app-service
   
   # Or manually:
   # Stop current process, then:
   npm start
   ```

### Quick Test After Deployment

1. **Clear browser cache** (important!):
   - Chrome/Edge: Ctrl+Shift+Delete (Cmd+Shift+Delete on Mac)
   - Or use Incognito/Private mode
   - Or hard refresh: Ctrl+F5 (Cmd+Shift+R on Mac)

2. **Test the API endpoint:**
   ```bash
   curl https://basel.articulator.ai/api/health
   ```

3. **Check browser console:**
   - Open DevTools (F12)
   - Go to Network tab
   - Try uploading an image
   - The request should be to `https://basel.articulator.ai/api/decode` (NO `:3001`)

## Verify the Fix

After rebuilding, check the browser console. The request URL should be:
- ✅ `https://basel.articulator.ai/api/decode` (correct)
- ❌ `https://basel.articulator.ai:3001/api/decode` (old code)

## If Still Not Working

1. **Check if environment variable is set:**
   ```bash
   # In your deployment, check if NEXT_PUBLIC_BACKEND_URL is set
   echo $NEXT_PUBLIC_BACKEND_URL
   ```
   
   If it's set to something with `:3001`, either:
   - Remove it, OR
   - Set it to: `NEXT_PUBLIC_BACKEND_URL=https://basel.articulator.ai`

2. **Verify nginx config is correct:**
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Check browser cache:**
   - Use Incognito/Private mode to test
   - Or clear cache completely

## Summary

The nginx config is correct ✅  
The code is fixed ✅  
**You just need to rebuild and redeploy the frontend** ⚠️
