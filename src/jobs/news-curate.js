const logger = require('../utils/logger');
const NewsService = require('../services/news');
const SummarizationService = require('../services/summarization');
const EmailService = require('../services/email');

class NewsCurateJob {
 constructor() {
    this.newsService = new NewsService();
    this.summarizationService = new SummarizationService();
    this.emailService = new EmailService();
    this.startTime = Date.now();
    this.articlesProcessed = 0;
  }


  healthCheck() {
    return {
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    };
  }


  async run() {
    try {
      logger.info('Starting NewsCurate AI process...');
      
      const newsArticles = await this.newsService.fetchNews();
      logger.info(`Fetched ${newsArticles.length} news articles`);
      
      if (newsArticles.length === 0) {
        logger.warn('No articles found. Skipping summary and email.');
        return this.formatResult(true, 0);
      }
      
      const summarizedArticles = await this.summarizationService.summarizeArticles(newsArticles);
      logger.info(`Generated summaries for ${summarizedArticles.length} articles`);
      
      const emailResult = await this.emailService.sendDigest(summarizedArticles);
      logger.info('Daily digest email sent successfully');
      
      this.articlesProcessed = summarizedArticles.length;
      
      return this.formatResult(true, summarizedArticles.length, emailResult.analytics);
    } catch (error) {
      logger.error('Error in NewsCurate process:', error);
      return this.formatResult(false, 0, null, error.message);
    }
  }


  formatResult(success, articlesProcessed, analytics = null, error = null) {
    const result = {
      success,
      articlesProcessed,
      performance: {
        executionTime: Date.now() - this.startTime,
        memoryUsage: process.memoryUsage()
      }
    };
    
    if (analytics) {
      result.analytics = analytics;
    }
    
    if (error) {
      result.error = error;
    }
    
    return result;
  }


  cleanupCache() {
    logger.info('Running scheduled cache cleanup');
    this.newsService.cleanupCache();
  }
}

module.exports = NewsCurateJob;