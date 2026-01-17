import Router from '@koa/router'
import { createAuthMiddleware } from '../middlewares/auth.js'
import { getProgress, updateProgress } from '../services/sync.js'

const router = new Router({ prefix: '/sync' })

router.get('/progress/:document', createAuthMiddleware(), async (ctx) => {
  const { document } = ctx.params
  if (!document) {
    ctx.throw(400, 'document is empty')
    return
  }
  const progress = getProgress(ctx.username, document)
  if (progress) {
    ctx.body = {
      ...progress,
      document,
    }
  } else {
    ctx.status = 204
  }
})

router.put('/progress', createAuthMiddleware(), async (ctx) => {
  const { progress, percentage, device, device_id: deviceId, document } = ctx.request.body
  if (!progress || !percentage || !device || !deviceId || !document) {
    ctx.throw(400, 'document、progress、percentage、device or device_id is empty')
    return
  }
  try {
    const timestamp = Date.now()
    await updateProgress(ctx.username, document, { progress, percentage, device, deviceId, document, timestamp })
    ctx.body = { document, timestamp }
  } catch(err) {
    ctx.throw(500, (err as Error).message || String(err))
  }
})

export default router
