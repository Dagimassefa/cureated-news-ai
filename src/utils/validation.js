const logger = require('./logger');

function validateEnv(requiredVars = ['SMTP_USER', 'SMTP_PASS']) {
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    logger.warn(`Missing environment variables: ${missingVars.join(', ')}`);
    return false;
  }
  
  return true;
}

module.exports = {
  validateEnv
};