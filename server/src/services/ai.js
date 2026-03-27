import Groq from 'groq-sdk';

// ─── Groq client (only created if key is present) ─────────────────────────────

let groqClient = null;

function getGroqClient() {
  if (groqClient) return groqClient;
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  groqClient = new Groq({ apiKey: key });
  return groqClient;
}

// ─── Groq analysis ────────────────────────────────────────────────────────────

const GROQ_MODEL = 'llama-3.1-8b-instant'; // free, fast, current

const SYSTEM_PROMPT = `You are a content analysis assistant. Given a scraped web item (title + description), respond with ONLY valid JSON matching this exact schema — no markdown, no explanation:
{
  "summary": "One clear sentence summarising the item (max 160 chars)",
  "tags": ["tag1", "tag2", "tag3"],
  "category": "one of: tutorial|release|event|research|product|announcement|article|resource|offer|alert|other",
  "priority": "one of: high|medium|low",
  "action_items": ["action 1", "action 2"]
}
Rules:
- summary: factual, no fluff, max 160 chars
- tags: 3–6 lowercase keywords, no stopwords
- priority high = urgent/security/breaking; medium = notable update; low = general
- action_items: 1–3 concrete next steps for the reader`;

async function analyzeWithGroq({ title, description, content }) {
  const client = getGroqClient();
  if (!client) return null;

  const body = (description || content || '').slice(0, 800);
  const userMsg = `Title: ${(title || '').slice(0, 200)}\nDescription: ${body}`;

  try {
    const chat = await client.chat.completions.create({
      model: GROQ_MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMsg },
      ],
      temperature: 0.3,
      max_tokens: 300,
    });

    const raw = chat.choices[0]?.message?.content?.trim() || '';
    // Strip any accidental markdown fences
    const json = raw.replace(/^```[a-z]*\n?/i, '').replace(/\n?```$/i, '').trim();
    const parsed = JSON.parse(json);

    return {
      summary:      (parsed.summary      || '').slice(0, 160),
      tags:         Array.isArray(parsed.tags)         ? parsed.tags.slice(0, 6)  : [],
      category:     parsed.category      || 'other',
      priority:     parsed.priority      || 'low',
      action_items: Array.isArray(parsed.action_items) ? parsed.action_items.slice(0, 3) : [],
      model:        GROQ_MODEL,
      generated_at: new Date().toISOString(),
    };
  } catch (err) {
    console.warn(`⚠️  Groq analysis failed: ${err.message} — falling back to heuristic`);
    return null;
  }
}

// ─── Heuristic fallback ───────────────────────────────────────────────────────

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'you', 'your', 'are', 'will', 'our', 'not',
  'have', 'has', 'was', 'were', 'but', 'all', 'any', 'can', 'may', 'into', 'out', 'about', 'their',
  'they', 'them', 'its', 'item', 'link', 'page', 'read', 'more', 'click', 'here', 'view', 'visit'
]);

function normalizeText(text) {
  return (text || '').toString().replace(/\s+/g, ' ').trim();
}

function extractKeywords(text, max = 6) {
  const tokens = normalizeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !STOPWORDS.has(word));

  const counts = new Map();
  tokens.forEach(token => counts.set(token, (counts.get(token) || 0) + 1));

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([word]) => word);
}

function pickCategory(text) {
  const value = text.toLowerCase();

  if (value.includes('tutorial') || value.includes('guide') || value.includes('how to') || value.includes('learn')) return 'tutorial';
  if (value.includes('release') || value.includes('launch') || value.includes('version') || value.includes('update') || value.includes('changelog')) return 'release';
  if (value.includes('event') || value.includes('conference') || value.includes('meetup') || value.includes('workshop') || value.includes('webinar')) return 'event';
  if (value.includes('research') || value.includes('paper') || value.includes('study') || value.includes('report') || value.includes('survey')) return 'research';
  if (value.includes('product') || value.includes('pricing') || value.includes('plan') || value.includes('feature') || value.includes('demo')) return 'product';
  if (value.includes('news') || value.includes('announce') || value.includes('press') || value.includes('official')) return 'announcement';
  if (value.includes('blog') || value.includes('article') || value.includes('post') || value.includes('opinion') || value.includes('review')) return 'article';
  if (value.includes('tool') || value.includes('library') || value.includes('framework') || value.includes('open source') || value.includes('github')) return 'resource';
  if (value.includes('deal') || value.includes('offer') || value.includes('discount') || value.includes('sale') || value.includes('free')) return 'offer';
  if (value.includes('warning') || value.includes('alert') || value.includes('security') || value.includes('vulnerability') || value.includes('breach')) return 'alert';

  return 'other';
}

function scorePriority(text) {
  const value = text.toLowerCase();
  let score = 0;

  if (value.includes('urgent') || value.includes('critical') || value.includes('breaking')) score += 3;
  if (value.includes('deadline') || value.includes('expires') || value.includes('limited time')) score += 2;
  if (value.includes('today') || value.includes('now') || value.includes('immediate')) score += 2;
  if (value.includes('security') || value.includes('vulnerability') || value.includes('breach')) score += 2;
  if (value.includes('new') || value.includes('update') || value.includes('release')) score += 1;

  if (score >= 4) return 'high';
  if (score >= 2) return 'medium';
  return 'low';
}

function buildSummary(title, body) {
  const normalized = normalizeText(body);
  if (!normalized) {
    return normalizeText(title).slice(0, 160) || 'No summary available.';
  }

  const sentence = normalized.split(/(?<=[.!?])\s+/)[0];
  return sentence.length <= 180 ? sentence : `${sentence.slice(0, 177)}...`;
}

function buildActions(text) {
  const actions = [];
  const value = text.toLowerCase();

  actions.push('Open the source link for full details');

  if (value.includes('deadline') || value.includes('expires') || value.includes('limited time')) {
    actions.push('Note the deadline or expiry date');
  }
  if (value.includes('download') || value.includes('install') || value.includes('release')) {
    actions.push('Check download or installation instructions');
  }
  if (value.includes('event') || value.includes('conference') || value.includes('webinar')) {
    actions.push('Register or save the date');
  }
  if (value.includes('security') || value.includes('vulnerability') || value.includes('patch')) {
    actions.push('Review and apply security patches if applicable');
  }

  return actions;
}

export function analyzeItemHeuristic({ title, description, content }) {
  const body = normalizeText(description || content || '');
  const meta = normalizeText(title || '');
  const combined = normalizeText(`${meta} ${body}`);

  const tags = extractKeywords(combined, 6);
  const category = pickCategory(combined);
  const priority = scorePriority(combined);
  const summary = buildSummary(title, body);
  const action_items = buildActions(combined);

  return {
    summary,
    category,
    priority,
    action_items,
    tags,
    model: 'heuristic',
    generated_at: new Date().toISOString()
  };
}

/**
 * Analyse an item with Groq (if GROQ_API_KEY is set) or fall back to heuristics.
 * Always synchronous-safe: returns a plain object (awaits internally).
 */
export async function analyzeItem(data) {
  const groqResult = await analyzeWithGroq(data);
  if (groqResult) return groqResult;
  return analyzeItemHeuristic(data);
}

export default { analyzeItem, analyzeItemHeuristic };
