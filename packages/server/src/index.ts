import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'

import usersRouter from './routes/users.js'
import syncRouter from './routes/sync.js'

const app = new Hono()

app.use('*', cors())
app.use('*', logger())

// 健康检查端点
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.route('/users', usersRouter)
app.route('/sync', syncRouter)

const port = Number(process.env.PORT || 3000)

serve({
  fetch: app.fetch,
  port
})

console.log(`Server is running on port ${port}`)

export default app
