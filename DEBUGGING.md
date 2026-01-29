# Debugging Guide for Backend API

## Debug Endpoints

### 1. Health Check
**GET** `http://your-backend-url:3001/health`

Returns comprehensive system information including:
- Environment details (Node version, platform, arch)
- Binary status (decoder/encoder existence and permissions)
- Directory permissions (uploads/public)
- File paths

**Example:**
```bash
curl http://43.99.51.105:3001/health
```

### 2. Decoder Debug
**GET** `http://your-backend-url:3001/debug/decoder`

Checks if the decoder binary exists and is executable.

**Example:**
```bash
curl http://43.99.51.105:3001/debug/decoder
```

## Debugging Steps

### Step 1: Check Backend Health
```bash
curl http://43.99.51.105:3001/health | jq
```

Look for:
- `binaries.decoder.exists: true`
- `binaries.decoder.executable: true`
- `directories.uploads.writable: true`

### Step 2: Check Decoder Binary
```bash
curl http://43.99.51.105:3001/debug/decoder
```

Should return:
```json
{
  "status": "decoder_binary_ok",
  "path": "/app/backend/decoder",
  "executable": true
}
```

### Step 3: Test Decode Endpoint
```bash
curl -X POST \
  http://43.99.51.105:3001/api/decode \
  -F "image=@/path/to/test-image.png" \
  -v
```

Check the response headers for `X-Request-ID` - use this to track logs.

### Step 4: Check Server Logs
Look for log entries with the request ID:
```
[<request-id>] Decoding image: /app/backend/uploads/...
[<request-id>] Decoder process exited with code ...
```

## Common Issues

### Issue: Decoder binary not found
**Symptoms:** Health check shows `binaries.decoder.exists: false`

**Solutions:**
1. Check Dockerfile - ensure decoder is copied correctly
2. Verify build process completed successfully
3. Check file permissions in container

### Issue: Decoder not executable
**Symptoms:** Health check shows `binaries.decoder.executable: false`

**Solutions:**
1. Ensure `chmod +x` is run in Dockerfile
2. Check file ownership (should be readable by nodejs user)
3. Verify no SELinux/AppArmor restrictions

### Issue: Process exits with code null
**Symptoms:** Logs show `code: null, signal: SIGKILL`

**Possible causes:**
1. Process timeout (killed after 8 seconds)
2. Out of memory
3. Missing system dependencies
4. File path issues

**Debug:**
- Check if file exists before spawning decoder
- Verify file permissions
- Check system resources (memory, disk)

### Issue: Multiple deployments sharing backend
**Symptoms:** File conflicts, unexpected behavior

**Solutions:**
- Each deployment should have its own backend instance
- If sharing is necessary, use unique upload directories per deployment
- Check `NEXT_PUBLIC_BACKEND_URL` environment variable

## Logging

All requests now include:
- Request ID in logs: `[<request-id>]`
- Request ID in response headers: `X-Request-ID`
- Detailed process information (PID, paths, exit codes)

## Testing Locally vs Production

### Local Development
- Backend runs on `localhost:3001`
- Files stored in `backend/uploads/`
- Decoder binary: `backend/decoder`

### Production/Docker
- Backend runs on `0.0.0.0:3001` (or configured hostname)
- Files stored in `/app/backend/uploads/`
- Decoder binary: `/app/backend/decoder`
- Runs as `nextjs` user (UID 1001)

## Environment Variables

Check these environment variables:
- `HOSTNAME` - Backend bind address (default: `0.0.0.0`)
- `NODE_ENV` - Environment mode
- `NEXT_PUBLIC_BACKEND_URL` - Frontend backend URL override

## File Upload Debugging

When debugging file uploads, check:
1. File size (should be > 0 bytes)
2. MIME type (should start with `image/`)
3. File permissions (should be readable)
4. Upload directory exists and is writable
5. Filename doesn't contain problematic characters

## Process Debugging

The decoder process logs include:
- Process PID
- Exit code and signal
- stdout and stderr output
- File paths used
- Timing information

Use the request ID to correlate logs across the request lifecycle.
