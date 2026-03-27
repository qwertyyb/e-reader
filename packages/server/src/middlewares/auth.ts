import { authUser } from "../services/users.js"
import { MiddlewareHandler } from 'hono'

// 扩展 Hono 上下文类型以包含用户名
type AuthEnv = {
  Variables: {
    username: string
  }
}

export const createAuthMiddleware = (): MiddlewareHandler<AuthEnv> => {
  return async (c, next) => {
    const username = c.req.header("x-auth-user")?.trim?.()
    const password = c.req.header("x-auth-key")?.trim?.()
    if (!username || !password) {
      return c.text('username or password is empty', 400)
    }
    const user = authUser(username, password)
    if (!user) {
      return c.text('username or password is incorrect', 403)
    }
    c.set('username', username)
    await next()
  }
}
