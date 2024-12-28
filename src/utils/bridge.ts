

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
  if (!navigator.serviceWorker) {
    return {
      invoke() {}
    }
  }
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
    invoke (method: string, ...args: unknown[]) {
      return new Promise(resolve => {
        const callback = `callback_${Math.random()}`;
        callbacks.set(callback, resolve);
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
