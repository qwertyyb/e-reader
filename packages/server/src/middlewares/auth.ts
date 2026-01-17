import { Middleware } from "koa"
import { authUser } from "../services/users.js"

export const createAuthMiddleware = (): Middleware => {
  return async (ctx, next) => {
    const username = (ctx.request.headers["x-auth-user"] as string)?.trim?.()
    const password = (ctx.request.headers["x-auth-key"] as string)?.trim?.()
    if (!username || !password) {
      ctx.throw(400, 'username or password is empty')
      return
    }
    const user = authUser(username, password)
    if (!user) {
      ctx.throw(403, 'username or password is incorrect')
      return
    }
    ctx.username = username
    await next()
  }
}
