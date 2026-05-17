module.exports = {
  apps: [{
    name: 'pawangcuaca-api',
    script: './server/server.js',
    instances: 2,
    exec_mode: 'cluster',
    watch: false,
    max_memory_restart: '300M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3001,
    },
    error_file: '/var/log/pm2/pawangcuaca-error.log',
    out_file: '/var/log/pm2/pawangcuaca-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
