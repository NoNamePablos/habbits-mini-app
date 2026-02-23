import { proxyRequest } from 'h3'

const API_TARGET = 'http://localhost:3001'

export default defineEventHandler((event) => {
  const url = getRequestURL(event)
  const target = API_TARGET + url.pathname + url.search
  return proxyRequest(event, target)
})
