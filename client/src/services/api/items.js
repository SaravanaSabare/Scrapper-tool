import client from './client'

export async function fetchItems() {
  const response = await client.get('/jobs')
  return response.data?.data || []
}

export async function scrapeItems(url = '') {
  const trimmed = typeof url === 'string' ? url.trim() : ''
  const payload = trimmed ? { url: trimmed } : {}
  const response = await client.post('/jobs/scrape', payload)
  // Session scrapes return { items: ItemRecord[], itemsFound: number }
  // Default feed scrapes return the old stats shape — normalise both
  const data = response.data?.data
  if (data && Array.isArray(data.items)) {
    return data // { items, itemsFound }
  }
  return { items: [], itemsFound: 0, ...data }
}

/**
 * Ask a research question against the current session items.
 * @param {string} question
 * @param {import('../../types/scraper').ItemRecord[]} items
 * @returns {Promise<string>} answer text
 */
export async function researchItems(question, items) {
  const response = await client.post('/research', { question, items })
  return response.data?.answer || ''
}

export async function deleteItem(id) {
  const response = await client.delete(`/jobs/${id}`)
  return response.data
}
