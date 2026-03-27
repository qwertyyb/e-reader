import { Hono } from 'hono'
import { createAuthMiddleware } from '../middlewares/auth.js'
import { getProgress, updateProgress } from '../services/sync.js'

const app = new Hono()

const auth = createAuthMiddleware()

app.get('/progress/:document', auth, async (c) => {
  const document = c.req.param('document')
  const username = c.get('username')
  if (!document) {
    return c.text('document is empty', 400)
  }
  const progress = getProgress(username, document)
  if (progress) {
    return c.json({
      ...progress,
      document,
    })
  } else {
    return c.text('Not Found', 404)
  }
})

app.put('/progress', auth, async (c) => {
  const body = await c.req.json()
  const { progress, percentage, device, device_id: deviceId, document } = body
  const username = c.get('username')
  if (!progress || !percentage || !device || !deviceId || !document) {
    return c.text('document、progress、percentage、device or device_id is empty', 400)
  }
  try {
    const timestamp = Date.now()
    await updateProgress(username, document, { progress, percentage, device, deviceId, document, timestamp })
    return c.json({ document, timestamp })
  } catch(err) {
    return c.text((err as Error).message || String(err), 500)
  }
})

export default app
