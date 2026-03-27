export interface AiInsight {
  summary?: string;
  tags?: string[];
  category?: string;
  priority?: string;
  action_items?: string[];
}

export interface ItemRecord {
  id?: string;
  item_id?: string;
  title?: string;
  company?: string;
  job_type?: string;
  posted_date?: string;
  location?: string;
  salary?: string;
  description?: string;
  link?: string;
  feed_id?: string;
  source?: string;
  created_at?: string;
  ai?: AiInsight | null;
}

export interface NoticeRecord {
  id?: string;
  item_id?: string;
  title?: string;
  notice_type?: string;
  posted_date?: string;
  content?: string;
  link?: string;
  created_at?: string;
  ai?: AiInsight | null;
}

export interface ScrapeStats {
  newJobsCount: number;
  newNoticesCount: number;
  itemsFound: number;
  newItemsSaved: number;
}

export interface FeedRecord {
  feed_id: string;
  name: string;
  url: string;
  interval_minutes: number;
  last_scraped: string | null;
  active: boolean;
  created_at: string;
  item_count?: number;
}
