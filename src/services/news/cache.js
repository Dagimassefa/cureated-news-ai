class NewsCache {
  constructor(ttl = 24 * 60 * 60 * 1000) {
    this.cache = new Map();
    this.ttl = ttl;
  }


  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }


  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  cleanup() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }


  clear() {
    this.cache.clear();
  }


  stats() {
    return {
      size: this.cache.size,
      ttl: this.ttl
    };
  }
}

module.exports = NewsCache;