const natural = require('natural');
const tokenizer = new natural.SentenceTokenizer();
const stopwords = require('natural').stopwords;

function extractKeywords(text) {
  const wordTokenizer = new natural.WordTokenizer();
  const tokens = wordTokenizer.tokenize(text.toLowerCase());
  
  const filteredTokens = tokens.filter(token => 
    token.length > 3 && 
    !stopwords.includes(token) && 
    !/\d/.test(token)
  );
  
  const frequency = {};
  filteredTokens.forEach(token => {
    frequency[token] = (frequency[token] || 0) + 1;
  });
  
  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(entry => entry[0]);
}

function summarizeWithFallback(text) {
  if (!text || text.length < 50) {
    return "No summary available for this article.";
  }
  
  try {
    const keywords = extractKeywords(text);
    const sentences = tokenizer.tokenize(text);
    
    if (sentences.length <= 2) {
      return text;
    }
    
    const scoredSentences = sentences.map(sentence => {
      let score = 0;
      
      keywords.forEach(keyword => {
        if (sentence.toLowerCase().includes(keyword.toLowerCase())) {
          score += 2;
        }
      });
      
      if (sentence.length > 30 && sentence.length < 100) {
        score += 1;
      }
      
      if (sentence.length < 20) {
        score -= 1;
      }
      
      return {
        sentence,
        score
      };
    });
    
    const topSentences = scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(item => item.sentence);
    
    return topSentences.join(' ') + '...';
  } catch (error) {
    return text.substring(0, 200) + (text.length > 200 ? '...' : '');
  }
}

function assessContentQuality(article) {
  const text = `${article.title} ${article.description}`;
  let score = 0;
  
  if (text.length > 500) score += 2;
  else if (text.length > 200) score += 1;
  
  if (article.title && article.title.length > 10) score += 1;
  if (article.description && article.description.length > 50) score += 1;
  if (article.imageUrl) score += 1;
  
  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

module.exports = {
  extractKeywords,
  summarizeWithFallback,
  assessContentQuality
};