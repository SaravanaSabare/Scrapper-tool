import client from './client'

export async function fetchNotices() {
  const response = await client.get('/notifications')
  return response.data?.data || []
}

export async function sendTestSlackNotification() {
  await client.post('/notifications/test/slack')
}
