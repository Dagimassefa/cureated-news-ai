const config = require('../../config');

const NEWS_SOURCES = [
  {
    name: 'NewsAPI',
    url: 'https://newsapi.org/v2/everything',
    params: {
      apiKey: config.apiKeys.newsApi,
      q: config.app.searchQuery,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: config.app.maxArticles
    },
    enabled: !!config.apiKeys.newsApi,
    transform: (data) => data.articles || []
  },
  {
    name: 'GNews',
    url: 'https://gnews.io/api/v4/search',
    params: {
      token: config.apiKeys.gnews,
      q: config.app.searchQuery,
      lang: 'en',
      max: config.app.maxArticles
    },
    enabled: !!config.apiKeys.gnews,
    transform: (data) => data.articles || []
  },
  {
    name: 'MediaStack',
    url: 'http://api.mediastack.com/v1/news',
    params: {
      access_key: config.apiKeys.mediaStack,
      keywords: 'digital marketing,seo,content marketing',
      languages: 'en',
      limit: config.app.maxArticles
    },
    enabled: !!config.apiKeys.mediaStack,
    transform: (data) => data.data || []
  },
  {
    name: 'Reddit',
    url: 'https://www.reddit.com/r/marketing/top.json',
    params: {
      limit: config.app.maxArticles,
      t: 'day'
    },
    enabled: true,
    transform: (data) => {
      return data.data.children.map(post => ({
        title: post.data.title,
        description: post.data.selftext,
        url: `https://reddit.com${post.data.permalink}`,
        imageUrl: post.data.thumbnail || null,
        publishedAt: new Date(post.data.created_utc * 1000).toISOString(),
        source: 'Reddit',
        upvotes: post.data.ups,
        comments: post.data.num_comments
      }));
    }
  }
];

module.exports = NEWS_SOURCES;