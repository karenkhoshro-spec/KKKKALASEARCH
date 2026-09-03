/**
 * PM2 ecosystem file for VPS deployment (see docs/HOSTINGER_DEPLOYMENT.md).
 *
 * Secrets are intentionally NOT here — the app loads them from a `.env` file
 * next to the project (server loads <project>/.env automatically) or from
 * real environment variables set by PM2/Hostinger.
 *
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup   # survive reboots
 */
module.exports = {
  apps: [
    {
      name: "kala-search",
      script: "server/index.mjs",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: "500M",
      kill_timeout: 8000,
      env: {
        NODE_ENV: "production",
      },
      // Logs live in PM2's default location (~/.pm2/logs); set explicit paths
      // here only if you create the directory yourself.
    },
  ],
};
