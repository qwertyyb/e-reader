import Router from '@koa/router'
import { createUser } from '../services/users.js';
import { authUser } from '../services/users.js';

const router = new Router({ prefix: '/users' })

router.post('/create', async (ctx) => {
  const username: string | undefined = ctx.request.body.username?.trim?.();
  const password: string | undefined = ctx.request.body.password?.trim?.();
  if (!username || !password) {
    ctx.body = {
      errCode: -1,
      errMsg: 'username or password is empty'
    }
    return
  }
  await createUser(username, password)
  ctx.body = {
    errCode: 0,
    errMsg: 'success'
  }
})

router.post('/auth', async (ctx) => {
  const username: string | undefined = ctx.request.body.username?.trim?.();
  const password: string | undefined = ctx.request.body.password?.trim?.();
  if (!username || !password) {
    ctx.body = {
      errCode: -1,
      errMsg: 'username or password is empty'
    }
    return
  }
  try {
    authUser(username, password)
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
