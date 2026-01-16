import { Middleware } from "koa"
import { authUser } from "../services/users.js"

export const createAuthMiddleware = (): Middleware => {
  return async (ctx, next) => {
    const username = (ctx.request.headers["x-auth-user"] as string)?.trim?.()
    const password = (ctx.request.headers["x-auth-key"] as string)?.trim?.()
    if (!username || !password) {
      ctx.body = {
        errCode: -1,
        errMsg: 'username or password is empty'
      }
      return
    }
    try {
      authUser(username, password)
      ctx.username = username
      await next()
    } catch(err) {
      ctx.body = {
        errCode: -1,
        errMsg: (err as Error).message
      }
      return
    }
  }
}
