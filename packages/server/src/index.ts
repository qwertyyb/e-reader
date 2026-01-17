import Koa from 'koa'
import bodyParser from '@koa/bodyparser'
import cors from '@koa/cors'

import usersRouter from './routes/users.js'
import syncRouter from './routes/sync.js'

const app = new Koa()

app.use(bodyParser())

app.use(cors())

// 健康检查端点
app.use(async (ctx, next) => {
  if (ctx.path === '/health') {
    ctx.status = 200
    ctx.body = { status: 'ok', timestamp: new Date().toISOString() }
    return
  }
  await next()
})

app.use(usersRouter.routes())
app.use(syncRouter.routes())

const port = process.env.PORT || 3000

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server is running on port ${port}`)
})
