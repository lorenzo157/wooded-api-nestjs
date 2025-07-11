# Docker Hot Reload Solution for Windows

## Problem

The initial Docker setup wasn't detecting file changes for hot reload on Windows due to file system event limitations between Windows host and Docker containers.

## Solution

We implemented a combination of technologies to ensure reliable hot reload:

### 1. Nodemon Integration

- **What**: Added nodemon as a global dependency in the development Dockerfile
- **Why**: Nodemon is more reliable than NestJS's built-in --watch for Docker on Windows
- **How**: `RUN npm install -g nodemon` in Dockerfile.dev

### 2. Polling Configuration

- **Environment Variables**:
  - `CHOKIDAR_USEPOLLING=true` - Forces polling instead of relying on file system events
  - `CHOKIDAR_INTERVAL=300` - Checks for changes every 300ms (faster than default)

### 3. Nodemon Configuration (nodemon.json)

```json
{
  "watch": ["src"],
  "ext": "ts,js,json",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "npm run start:debug",
  "env": {
    "NODE_ENV": "development"
  },
  "legacyWatch": true,
  "polling": true,
  "delay": 500
}
```

### 4. Volume Mounting

- Source code is mounted as a volume: `.:/usr/src/app`
- Node modules are excluded: `/usr/src/app/node_modules`

## Current Status

✅ Hot reload is working correctly
✅ File changes are detected within ~500ms
✅ Application restarts automatically
✅ Debug mode is enabled

## How to Use

1. **Start Development Environment**:

   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

2. **Monitor Logs**:

   ```bash
   docker logs wooded-nestjs-dev -f
   ```

3. **Make Changes**: Edit any `.ts`, `.js`, or `.json` file in the `src` directory

4. **Observe**: You'll see in the logs:
   ```
   [nodemon] restarting due to changes...
   [nodemon] starting 'npm run start:debug'
   ```

## Environment Switching

- **Development**: `docker-compose -f docker-compose.dev.yml up -d`
- **Production**: `docker-compose up -d`

The hot reload is now fully functional and you should see immediate updates when you modify your NestJS code!
