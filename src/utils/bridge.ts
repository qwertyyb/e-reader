

type TPayload = {
  type: 'invoke',
  method: string,
  callback: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  args: any[]
} | {
  type: 'callback',
  callback: string,
  error?: Error,
  returnValue?: Error,
}

type Callback = (payload: TPayload) => void

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createBridge = <F extends (...args: any[]) => any>(
  send: Callback,
  on: (callback: Callback) => void,
  functions: Record<string, F>
) => {
  const callbacks = new Map<string, (result: unknown) => void>();

  on(async (data: TPayload) => {
    if (data.type === 'invoke') {
      const { method, args, callback } = data;
      const func = functions[method]
      if (func) {
        return send({
          type: 'callback',
          callback,
          returnValue: await func(...args)
        })
      }
      return send({
        type: 'callback',
        callback,
        error: new Error(`method ${method} is not exits`)
      })
    } else if (data.type === 'callback') {
      const { callback, returnValue } = data
      const cb = callbacks.get(callback);
      if (cb) {
        cb(returnValue);
        callbacks.delete(callback);
      }
    }
  })

  return {
    invoke <R>(method: string, ...args: unknown[]) {
      return new Promise<R>(resolve => {
        const callback = `callback_${Math.random()}`;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        callbacks.set(callback, resolve as any);
        send({
          type: 'invoke',
          callback,
          method,
          args
        })
      })
    }
  }
}
