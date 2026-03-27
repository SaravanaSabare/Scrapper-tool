import client from './client.js'

export interface HealthData {
  status: string
  timestamp: string
  environment: string
  storage: string
  db: 'connected' | 'disconnected' | 'error'
  ai: 'groq' | 'heuristic'
}

export async function fetchHealth(): Promise<HealthData> {
  const res = await client.get<HealthData>('/health')
  return res.data
}
