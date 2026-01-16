import Router from '@koa/router'
import { createAuthMiddleware } from '../middlewares/auth.js'
import { getProgress, updateProgress } from '../services/sync.js'

const router = new Router({ prefix: '/sync' })

router.get('/progress/:document', createAuthMiddleware(), async (ctx) => {
  const { document } = ctx.params
  if (!document) {
    ctx.body = {
      errCode: -1,
      errMsg: 'document is empty'
    }
    return
  }
  try {
    const progress = getProgress(ctx.username, document)
    ctx.body = {
      errCode: 0,
      errMsg: 'success',
      data: progress ? {
        ...progress,
        device_id: progress.deviceId
      } : null
    }
  } catch(err) {
    ctx.body = {
      errCode: -1,
      errMsg: (err as Error).message
    }
    return
  }
})

router.put('/progress', createAuthMiddleware(), async (ctx) => {
  const { progress, percentage, device, device_id: deviceId, document } = ctx.request.body
  if (!progress || !percentage || !device || !deviceId || !document) {
    ctx.body = {
      errCode: -1,
      errMsg: 'progress, percentage, device or device_id is empty'
    }
    return
  }
  try {
    await updateProgress(ctx.username, progress, { progress, percentage, device, deviceId, document, timestamp: Date.now() })
    ctx.body = {
      errCode: 0,
      errMsg: 'success'
    }
  } catch(err) {
    ctx.body = {
      errCode: -1,
      errMsg: (err as Error).message
    }
    return
  }
})

export default router
