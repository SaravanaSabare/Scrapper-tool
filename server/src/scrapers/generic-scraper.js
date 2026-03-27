import axios from 'axios';
import * as cheerio from 'cheerio';
import { Job } from '../models/index.js';
import { createItemId } from '../utils/ids.js';

export const GenericScraper = {
  async scrapeUrl(url) {
    try {
      const rawUrl = (url || '').trim();
      const normalizedUrl = rawUrl.match(/^https?:\/\//i) ? rawUrl : `https://${rawUrl}`;

      if (!rawUrl) {
        throw new Error('URL is required');
      }

      console.log(`\n🔍 Scraping a custom URL: ${normalizedUrl}...`);

      let siteDetails;
      try {
        siteDetails = new URL(normalizedUrl);
      } catch (err) {
        throw new Error('Invalid URL format');
      }

      const response = await axios.get(normalizedUrl, {
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      const items = [];
  const baseUrl = siteDetails.origin;
  const sitename = siteDetails.hostname.replace('www.', '');

      // Heuristic approach: look for all links within reasonable contextual elements
      // Typically articles/jobs are inside h1, h2, h3, or a generic item container.
      $('a').each((index, element) => {
        const $el = $(element);
        const link = $el.attr('href');
        const text = $el.text().trim();
        
        // Filter out junk links
        if (!link || !text || text.split(' ').length < 3 || link.startsWith('javascript:')) return;

        // Determine description by looking at parent/sibling text
        let description = $el.parent().text().replace(text, '').trim().slice(0, 200);
        if (!description) {
          description = $el.parent().parent().text().replace(text, '').trim().slice(0, 200) || text;
        }

        // Format link
        const finalLink = link.startsWith('http') ? link : (link.startsWith('/') ? `${baseUrl}${link}` : `${baseUrl}/${link}`);

        items.push({
          job_id: `custom-${Buffer.from(finalLink).toString('base64').slice(0, 15)}-${index}`,
          title: text,
          // Storing the scraped site name so we know where it came from
          company: `Scraped from ${sitename}`,
          location: 'Web',
          description: description,
          salary: '',
          job_type: 'Custom Scrape',
          posted_date: new Date(),
          link: finalLink
        });
      });

      // Deduplicate by link
      const uniqueItems = Array.from(new Map(items.map(item => [item.link, item])).values())
        // Limit to top 50 to avoid database spam from giant pages
        .slice(0, 50);

  console.log(`✅ Found ${uniqueItems.length} unique items on ${normalizedUrl}`);

      // Save to database instantly
      let newItemsCount = 0;
      for (const itemData of uniqueItems) {
        try {
          const item_id = createItemId({
            title: itemData.title,
            link: itemData.link,
            posted_date: itemData.posted_date
          });
          const existing = await Job.findByItemId(item_id);
          if (!existing) {
            await Job.create({ ...itemData, item_id });
            newItemsCount++;
          }
        } catch (err) {
          console.error(`Error saving custom item ${itemData.job_id}:`, err.message);
        }
      }

      return {
        url: normalizedUrl,
        itemsFound: uniqueItems.length,
        newItemsSaved: newItemsCount
      };
    } catch (err) {
      console.error(`❌ Custom scrape error for ${url}:`, err.message);
      throw new Error(`Failed to scrape ${url}: ${err.message}`);
    }
  }
};

export default GenericScraper;
