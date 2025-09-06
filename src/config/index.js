require('dotenv').config();

const config = {
  app: {
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'INFO',
    maxArticles: parseInt(process.env.MAX_ARTICLES) || 10,
    searchQuery: process.env.SEARCH_QUERY || 'digital marketing OR seo OR content marketing',
    cacheTTL: parseInt(process.env.CACHE_TTL) || 86400000, 
    requestTimeout: parseInt(process.env.REQUEST_TIMEOUT) || 10000,
  },
  apiKeys: {
    newsApi: process.env.NEWS_API_KEY,
    gnews: process.env.GNEWS_API_KEY,
    mediaStack: process.env.MEDIASTACK_API_KEY,
    huggingFace: process.env.HUGGINGFACE_API_KEY,
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    senderName: process.env.DIGEST_SENDER_NAME || 'NewsCurate AI',
    senderEmail: process.env.DIGEST_SENDER_EMAIL,
    recipients: process.env.DIGEST_RECIPIENTS 
      ? process.env.DIGEST_RECIPIENTS.split(',') 
      : [],
  },
  cron: {
    schedule: process.env.CRON_SCHEDULE || '0 9 * * *', 
  },
};

module.exports = config;