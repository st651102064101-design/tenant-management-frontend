module.exports = {
  apps: [
    {
      name: 'tenant-management-frontend',
      cwd: '/Users/kriang/tenant-management-frontend',
      script: 'npm',
      args: 'run dev -- --host 0.0.0.0',
      env: {
        NODE_ENV: 'development',
      },
    },
  ],
};