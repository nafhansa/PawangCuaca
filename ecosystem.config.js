module.exports = {
  apps: [{
    name: 'pawangcuaca-api',
    script: './server/server.js',
    instances: 1,
    exec_mode: 'fork',
    watch: false,
    max_memory_restart: '300M',
    env_production: {
      NODE_ENV: 'production',
      PORT: 3004,
    },
    error_file: '/home/pawangcuaca/logs/error.log',
    out_file: '/home/pawangcuaca/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
  }],
};
