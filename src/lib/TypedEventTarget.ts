// 定义泛型类，接收事件映射类型 E（结构为 { 事件名: 事件类型 }）
export class TypedEventTarget<E extends Record<string, Event>> extends EventTarget {

  // @ts-expect-error 重新声明以支持类型标注
  addEventListener<K extends keyof E>(
    type: K,
    listener: (event: E[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;

  // @ts-expect-error 重新声明以支持类型标注
  removeEventListener<K extends keyof E>(
    type: K,
    listener: (event: E[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;
}