import crypto from 'node:crypto';
import type { Middleware } from 'koa';

export const createLoggerMiddleware = (): Middleware => async (ctx, next) => {
  const requestId = crypto.randomBytes(16).toString('hex');
  console.info(`-> ${requestId} ${ctx.ip} ${ctx.method}: ${ctx.url}, body: ${ctx.method === 'POST' ? JSON.stringify(ctx.request.body) : ''}`);
  try {
    await next();
    console.info(`<- ${requestId} ${ctx.method}: ${ctx.url}, response ${Buffer.isBuffer(ctx.body) ? `Buffer(${ctx.body.length})` : JSON.stringify(ctx.body)}`);
  } catch (err) {
    console.error(`<- ${requestId} ${ctx.method}: ${ctx.url}, error: ${(err as any).message}, stack: ${(err as any).stack}`);
    throw err;
  }
};
