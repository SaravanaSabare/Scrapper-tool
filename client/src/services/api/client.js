import axios from 'axios'

// In production (Vercel), VITE_API_URL points to the deployed server.
// In dev, Vite proxies /api → localhost:5000, so we use /api.
const baseURL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api'

const client = axios.create({
  baseURL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json'
  }
})

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error?.response?.data?.error || error.message || 'Request failed'
    return Promise.reject(new Error(message))
  }
)

export default client
