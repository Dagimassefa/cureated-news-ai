const { v4: uuidv4 } = require('uuid');


function formatDate(date, format = 'long') {
  const d = new Date(date);
  
  if (format === 'short') {
    return d.toLocaleDateString();
  }
  
  return d.toLocaleString();
}


function truncateText(text, maxLength = 200) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
}


function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function getTimeBasedGreeting() {
  const hour = new Date().getHours();
  
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

module.exports = {
  formatDate,
  truncateText,
  generateId,
  getTimeBasedGreeting,
  uuidv4
};