/**
 * PM2 process file (run from the backend directory):
 *   pm2 start ecosystem.config.cjs --env production
 *   pm2 save && pm2 startup
 *
 * Uses a single forked process by default to keep RAM low on small VPSes.
 * For more CPU: set instances to a number or "max" and exec_mode: "cluster".
 */
module.exports = {
  apps: [
    {
      name: 'gigconnection-api',
      cwd: __dirname,
      script: 'src/index.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
      },
    },
  ],
};
