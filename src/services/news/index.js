const axios = require('axios');
const logger = require('../../utils/logger');
const { uuidv4 } = require('../../utils/helpers');
const NewsCache = require('./cache');
const NEWS_SOURCES = require('./sources');
const config = require('../../config');

class NewsService {
  constructor() {
    this.articleCache = new NewsCache(config.app.cacheTTL);
    this.requestCache = new NewsCache(5 * 60 * 1000);
  }


  async cachedRequest(url, params, sourceName) {
    const cacheKey = `${url}-${JSON.stringify(params)}`;
    const cached = this.requestCache.get(cacheKey);
    
    if (cached) {
      logger.debug(`Using cached response for ${sourceName}`);
      return cached;
    }
    
    try {
      logger.debug(`Making API request to ${sourceName}`);
      const response = await axios.get(url, { 
        params,
        timeout: config.app.requestTimeout
      });
      
      this.requestCache.set(cacheKey, response.data);
      return response.data;
    } catch (error) {
      logger.error(`Request failed for ${sourceName}:`, error.message);
      throw error;
    }
  }

  async fetchNews() {
    let allArticles = [];
    
    for (const source of NEWS_SOURCES) {
      if (!source.enabled) continue;
      
      try {
        logger.info(`Fetching news from ${source.name}`);
        const response = await this.cachedRequest(source.url, source.params, source.name);
        
        const articles = source.transform(response);
        const normalizedArticles = articles.map(article => this.normalizeArticle(article, source.name));
        
        allArticles = [...allArticles, ...normalizedArticles];
        logger.info(`Retrieved ${articles.length} articles from ${source.name}`);
      } catch (error) {
        logger.error(`Error fetching from ${source.name}:`, error.message);
      }
    }
    
    this.cleanupCache();
    
    const uniqueArticles = this.removeDuplicates(allArticles);
    return uniqueArticles.slice(0, config.app.maxArticles);
  }

  normalizeArticle(article, source) {
    const baseArticle = {
      id: uuidv4(),
      title: article.title || 'No title',
      description: article.description || article.content || '',
      url: article.url || '#',
      imageUrl: article.imageUrl || article.urlToImage || article.image || null,
      publishedAt: article.publishedAt || article.published_at || new Date().toISOString(),
      source: article.source?.name || article.source || 'Unknown',
      category: this.categorizeArticle(article.title, article.description),
      sentiment: this.analyzeSentiment(article.title, article.description)
    };
    
    if (source === 'Reddit') {
      return {
        ...baseArticle,
        upvotes: article.upvotes || 0,
        comments: article.comments || 0
      };
    }
    
    return baseArticle;
  }

  categorizeArticle(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const categories = {
      'SEO': ['seo', 'search engine'],
      'Social Media': ['social media', 'facebook', 'instagram', 'twitter'],
      'Content Marketing': ['content marketing', 'blog'],
      'Email Marketing': ['email marketing', 'newsletter'],
      'Analytics': ['analytics', 'data'],
      'AI': ['ai', 'artificial intelligence', 'machine learning']
    };
    
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some(keyword => text.includes(keyword))) {
        return category;
      }
    }
    
    return 'General';
  }

  analyzeSentiment(title, description) {
    const text = `${title} ${description}`.toLowerCase();
    const positiveWords = ['success', 'growth', 'improve', 'win', 'best', 'great', 'amazing', 'innovative'];
    const negativeWords = ['fail', 'problem', 'issue', 'challenge', 'bad', 'worst', 'decline'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = text.match(regex);
      if (matches) positiveCount += matches.length;
    });
    
    negativeWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'g');
      const matches = text.match(regex);
      if (matches) negativeCount += matches.length;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  removeDuplicates(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const key = `${article.title.toLowerCase().trim()}-${article.source}`;
      const duplicate = seen.has(key);
      seen.add(key);
      
      const isCached = this.articleCache.get(key);
      if (!isCached) {
        this.articleCache.set(key, article);
      }
      
      return !duplicate && !isCached;
    });
  }


  cleanupCache() {
    this.articleCache.cleanup();
    this.requestCache.cleanup();
  }

  getCacheStats() {
    return {
      articleCache: this.articleCache.stats(),
      requestCache: this.requestCache.stats()
    };
  }
}

module.exports = NewsService;