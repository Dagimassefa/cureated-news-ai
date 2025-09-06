const { HfInference } = require('@huggingface/inference');
const logger = require('../../utils/logger');
const config = require('../../config');
const { summarizeWithFallback, assessContentQuality } = require('./strategies');

class SummarizationService {
  constructor() {
    this.hf = config.apiKeys.huggingFace 
      ? new HfInference(config.apiKeys.huggingFace) 
      : null;
  }


  async summarizeWithHuggingFace(article) {
    try {
      const textToSummarize = article.description || article.title;
      
      if (!textToSummarize || textToSummarize.length < 50) {
        return null;
      }
      
      const summary = await this.hf.summarization({
        model: "facebook/bart-large-cnn",
        inputs: textToSummarize,
        parameters: {
          max_length: 130,
          min_length: 30,
          do_sample: false
        }
      });
      
      return summary.summary_text;
    } catch (error) {
      logger.warn(`Hugging Face summarization failed for: ${article.title} - ${error.message}`);
      return null;
    }
  }

  async summarizeArticle(article) {
    try {
      logger.info(`Summarizing: ${article.title}`);
      
      let summary;
      
      if (this.hf) {
        summary = await this.summarizeWithHuggingFace(article);
      }
      
      if (!summary) {
        const text = article.description || article.title;
        summary = summarizeWithFallback(text);
      }
      
      return {
        ...article,
        summary: summary,
        quality: assessContentQuality(article)
      };
    } catch (error) {
      logger.error(`Error summarizing article "${article.title}":`, error.message);
      
      const text = article.description || article.title;
      return {
        ...article,
        summary: summarizeWithFallback(text),
        quality: assessContentQuality(article)
      };
    }
  }

  async summarizeArticles(articles) {
    const summarizedArticles = [];
    
    for (const article of articles) {
      const summarizedArticle = await this.summarizeArticle(article);
      summarizedArticles.push(summarizedArticle);
      
      if (this.hf) {
        await new Promise(resolve => setTimeout(resolve, 1100));
      }
    }
    
    return summarizedArticles;
  }
}

module.exports = SummarizationService;