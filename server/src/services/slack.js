import axios from 'axios';
import { config } from '../config/environment.js';

export const SlackService = {
  async sendNewItemNotification(item) {
    if (!config.slack.webhookUrl) {
      console.warn('⚠️ Slack webhook URL not configured');
      return;
    }

    try {
      const payload = {
        text: `🆕 New Item: ${item.title}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🆕 New Item',
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Title:*\n${item.title}`
              },
              {
                type: 'mrkdwn',
                text: `*Category:*\n${item.category || 'uncategorized'}`
              },
              {
                type: 'mrkdwn',
                text: `*Priority:*\n${item.priority || 'low'}`
              },
              {
                type: 'mrkdwn',
                text: `*Source:*\n${item.source || 'N/A'}`
              }
            ]
          },
          ...(item.description ? [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: item.description
            }
          }] : []),
          ...(item.link ? [{
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Open Link'
                },
                url: item.link,
                style: 'primary'
              }
            ]
          }] : [])
        ]
      };

      await axios.post(config.slack.webhookUrl, payload);
      console.log(`✅ Slack notification sent for item: ${item.title}`);
    } catch (err) {
      console.error(`❌ Error sending Slack notification for item ${item.item_id}:`, err.message);
      throw err;
    }
  },

  async sendNewNoticeNotification(notice) {
    if (!config.slack.webhookUrl) {
      console.warn('⚠️ Slack webhook URL not configured');
      return;
    }

    try {
      const payload = {
        text: `📢 New Notice: ${notice.title}`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📢 New Notice',
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Title:*\n${notice.title}`
              },
              {
                type: 'mrkdwn',
                text: `*Type:*\n${notice.notice_type || 'General'}`
              }
            ]
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${notice.content || 'No content available'}`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Open Link'
                },
                url: notice.link,
                style: 'primary'
              }
            ]
          }
        ]
      };

      await axios.post(config.slack.webhookUrl, payload);
      console.log(`✅ Slack notification sent for notice: ${notice.title}`);
    } catch (err) {
      console.error(`❌ Error sending Slack notification for notice ${notice.notice_id}:`, err.message);
      throw err;
    }
  },

  async sendBatchNotification(jobs, notices) {
    if (!config.slack.webhookUrl) {
      console.warn('⚠️ Slack webhook URL not configured');
      return;
    }

    try {
      const jobsSummary = jobs.map(j => `• *${j.title}*${j.source ? ` — ${j.source}` : ''}`).join('\n');
      const noticesSummary = notices.map(n => `• *${n.title}*`).join('\n');

      const payload = {
        text: `📊 Scraper Digest — ${jobs.length} Items & ${notices.length} Notices`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '📊 Scraper Digest',
              emoji: true
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `You have *${jobs.length}* new items and *${notices.length}* new notices.`
            }
          },
          ...(jobs.length > 0 ? [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*📋 New Items:*\n${jobsSummary}`
            }
          }] : []),
          ...(notices.length > 0 ? [{
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*📢 New Notices:*\n${noticesSummary}`
            }
          }] : [])
        ]
      };

      await axios.post(config.slack.webhookUrl, payload);
      console.log('✅ Slack batch notification sent');
    } catch (err) {
      console.error('❌ Error sending Slack batch notification:', err.message);
      throw err;
    }
  }
};

export default SlackService;
