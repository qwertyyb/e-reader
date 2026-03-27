import crypto from 'node:crypto';
import { MiddlewareHandler } from 'hono';

export const createLoggerMiddleware = (): MiddlewareHandler => async (c, next) => {
  const requestId = crypto.randomBytes(16).toString('hex');
  const ip = c.req.header('x-forwarded-for') || c.req.header('cf-connecting-ip') || 'unknown';
  console.info(`-> ${requestId} ${ip} ${c.req.method}: ${c.req.url}, body: ${c.req.method === 'POST' ? JSON.stringify(await c.req.json()) : ''}`);
  try {
    await next();
    console.info(`<- ${requestId} ${c.req.method}: ${c.req.url}, response ${JSON.stringify(c.res)}`);
  } catch (err) {
    const error = err as Error;
    console.error(`<- ${requestId} ${c.req.method}: ${c.req.url}, error: ${error.message}, stack: ${error.stack}`);
    throw err;
  }
};
