import Router from '@koa/router'
import { createUser } from '../services/users.js';
import { authUser } from '../services/users.js';

const router = new Router({ prefix: '/users' })

router.post('/create', async (ctx) => {
  const username: string | undefined = ctx.request.body.username?.trim?.();
  const password: string | undefined = ctx.request.body.password?.trim?.();
  if (!username || !password) {
    ctx.throw(400, 'username or password is empty')
    return
  }
  const { exists } = await createUser(username, password)
  if (exists) {
    ctx.throw(409, 'username already exists')
    return
  }
  ctx.status = 201
  ctx.body = { username }
})

router.post('/auth', async (ctx) => {
  const username: string | undefined = ctx.request.body.username?.trim?.();
  const password: string | undefined = ctx.request.body.password?.trim?.();
  if (!username || !password) {
    ctx.throw(400, 'username or password is empty')
    return
  }
  const user = authUser(username, password)
  if (!user) {
    ctx.throw(403, 'username or password is incorrect')
    return
  }
  ctx.status = 200
  ctx.body = { authorized: 'OK' }
})

export default router
