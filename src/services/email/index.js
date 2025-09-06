const nodemailer = require('nodemailer');
const logger = require('../../utils/logger');
const config = require('../../config');
const { generateTextContent, generateHtmlContent } = require('./templates');

class EmailService {
  constructor() {
    this.transporter = null;
    this.analytics = {
      sent: 0,
      failed: 0,
      lastSent: null
    };
    
    this.initializeTransporter();
  }


  initializeTransporter() {
    if (config.email.user && config.email.pass) {
      this.transporter = nodemailer.createTransport({
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.pass,
        },
        tls: {
          rejectUnauthorized: false 
        }
      });
    }
  }


  isConfigured() {
    return !!this.transporter;
  }

  sortArticlesByPriority(articles) {
    const qualityScore = {
      'high': 3,
      'medium': 2,
      'low': 1
    };
    
    return articles.sort((a, b) => {
      const dateA = new Date(a.publishedAt);
      const dateB = new Date(b.publishedAt);
      
      const scoreA = qualityScore[a.quality] + (dateA.getTime() / 10000000000);
      const scoreB = qualityScore[b.quality] + (dateB.getTime() / 10000000000);
      
      return scoreB - scoreA;
    });
  }


  async sendDigest(articles) {
    if (!this.isConfigured()) {
      logger.warn('Email not sent: SMTP configuration missing');
      
      logger.info('DIGEST CONTENT:');
      articles.forEach((article, index) => {
        logger.info(`${index + 1}. ${article.title}`);
        logger.info(`   Summary: ${article.summary}`);
        logger.info(`   URL: ${article.url}`);
      });

      return { success: false, reason: 'Email not configured' };
    }

    if (config.email.recipients.length === 0) {
      logger.warn('No recipients configured');
      return { success: false, reason: 'No recipients' };
    }

    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified successfully');
      
      const sortedArticles = this.sortArticlesByPriority(articles);
      
      for (const recipient of config.email.recipients) {
        await this.sendEmailToRecipient(sortedArticles, recipient.trim());
      }

      this.analytics.sent += config.email.recipients.length;
      this.analytics.lastSent = new Date();
      
      logger.info(`Email sent successfully to ${config.email.recipients.length} recipients`);
      return { success: true, analytics: this.analytics };
    } catch (error) {
      this.analytics.failed += config.email.recipients.length;
      logger.error('Error sending email:', error);
      throw error;
    }
  }


  async sendEmailToRecipient(articles, recipient) {
    const toName = recipient.split('@')[0];
    const senderName = config.email.senderName;
    const senderEmail = config.email.senderEmail || config.email.user;
    
    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to: recipient,
      subject: `📰 Your Daily NewsCurate AI Digest - ${new Date().toDateString()}`,
      text: generateTextContent(articles, toName),
      html: generateHtmlContent(articles, toName),
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${recipient} - Message ID: ${info.messageId}`);
      return info;
    } catch (error) {
      logger.error(
        `Failed to send email to ${recipient}:`,
        error.response?.data || error.message
      );
      throw error;
    }
  }

  getAnalytics() {
    return this.analytics;
  }
}

module.exports = EmailService;