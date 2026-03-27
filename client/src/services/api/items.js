import client from './client'

export async function fetchItems() {
  const response = await client.get('/jobs')
  return response.data?.data || []
}

export async function scrapeItems(url = '') {
  const trimmed = typeof url === 'string' ? url.trim() : ''
  const payload = trimmed ? { url: trimmed } : {}
  const response = await client.post('/jobs/scrape', payload)
  return response.data?.data || { newJobsCount: 0, newNoticesCount: 0, itemsFound: 0, newItemsSaved: 0 }
}

export async function deleteItem(id) {
  const response = await client.delete(`/jobs/${id}`)
  return response.data
}
