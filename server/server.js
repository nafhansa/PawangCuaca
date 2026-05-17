const app = require('./src/app');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`PawangCuaca API server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
