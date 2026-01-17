import Router from '@koa/router'
import { createUser } from '../services/users.js';
import { createAuthMiddleware } from '../middlewares/auth.js';

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

router.get('/auth', createAuthMiddleware(), async (ctx) => {
  ctx.status = 200
  ctx.body = { authorized: 'OK' }
})

export default router
