import express from 'express';
import rateLimit from 'express-rate-limit';
import Groq from 'groq-sdk';

const router = express.Router();

const researchLimiter = rateLimit({
  windowMs: 60_000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many research requests — please wait a minute.' }
});

let groqClient = null;
function getGroqClient() {
  if (groqClient) return groqClient;
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  groqClient = new Groq({ apiKey: key });
  return groqClient;
}

const RESEARCH_SYSTEM_PROMPT = `You are a research assistant. You will be given a set of scraped web items (titles and summaries) and a question from the user. Answer the question using ONLY the information found in the provided items. Be concise, factual, and direct. If the answer cannot be found in the items, say so clearly. Do not make up information.`;

/**
 * POST /api/research
 * Body: { question: string, items: ItemRecord[] }
 * Returns: { answer: string }
 */
router.post('/', researchLimiter, async (req, res) => {
  try {
    const { question, items } = req.body;

    if (!question || typeof question !== 'string' || !question.trim()) {
      return res.status(400).json({ success: false, error: 'Question is required.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No session items provided.' });
    }

    const client = getGroqClient();
    if (!client) {
      return res.status(503).json({ success: false, error: 'AI service not configured (missing GROQ_API_KEY).' });
    }

    // Build context from session items (cap at 30 for prompt size)
    const context = items
      .slice(0, 30)
      .map((item, i) => {
        const summary = item.ai?.summary || item.description || '';
        return `[${i + 1}] ${item.title}\n${summary.slice(0, 200)}`;
      })
      .join('\n\n');

    const userMsg = `Here are the scraped items from this session:\n\n${context}\n\nQuestion: ${question.trim()}`;

    const chat = await client.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        { role: 'system', content: RESEARCH_SYSTEM_PROMPT },
        { role: 'user', content: userMsg },
      ],
      temperature: 0.4,
      max_tokens: 512,
    });

    const answer = chat.choices[0]?.message?.content?.trim() || 'No answer generated.';
    res.json({ success: true, answer });
  } catch (err) {
    console.error('Research route error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
