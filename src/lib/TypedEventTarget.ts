// 定义泛型类，接收事件映射类型 E（结构为 { 事件名: 事件类型 }）
export class TypedEventTarget<E extends Record<string, Event>> extends EventTarget {

  // @ts-expect-error - 类型签名不兼容，但运行时行为正确
  addEventListener<K extends keyof E>(
    type: K,
    listener: (event: E[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void {
    super.addEventListener(type as string, listener as EventListener, options)
  }

  // @ts-expect-error - 类型签名不兼容，但运行时行为正确
  removeEventListener<K extends keyof E>(
    type: K,
    listener: (event: E[K]) => void,
    options?: boolean | EventListenerOptions
  ): void {
    super.removeEventListener(type as string, listener as EventListener, options)
  }
}