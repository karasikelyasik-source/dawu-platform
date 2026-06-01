module.exports = {
  apps: [
    {
      name: 'dawu-api',
      script: 'dist/src/main.js',
      cwd: '/root/dawu-platform/apps/api',
      env: {
        NODE_ENV: 'production',
        PORT: '3000',
        DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/dawu?schema=public',
        JWT_SECRET: 'dawu_super_secret',
        REDIS_HOST: 'localhost',
        REDIS_PORT: '6379',
      },
      autorestart: true,
      max_restarts: 20,
      restart_delay: 5000,
    },
  ],
};
