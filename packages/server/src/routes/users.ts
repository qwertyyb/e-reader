import { Hono } from 'hono'
import { createUser } from '../services/users.js';
import { createAuthMiddleware } from '../middlewares/auth.js';

const app = new Hono()

const auth = createAuthMiddleware()

app.post('/create', async (c) => {
  const body = await c.req.json()
  const username: string | undefined = body.username?.trim?.();
  const password: string | undefined = body.password?.trim?.();
  if (!username || !password) {
    return c.text('username or password is empty', 400)
  }
  const { exists } = await createUser(username, password)
  if (exists) {
    return c.text('username already exists', 409)
  }
  return c.json({ username }, 201)
})

app.get('/auth', auth, async (c) => {
  return c.json({ authorized: 'OK' }, 200)
})

export default app
