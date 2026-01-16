import Koa from 'koa'
import bodyParser from '@koa/bodyparser'

import usersRouter from './routes/users.js'
import syncRouter from './routes/sync.js'


const app = new Koa()

app.use(bodyParser())

app.use(usersRouter.routes())
app.use(syncRouter.routes())

const port = process.env.PORT || 3000

app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
