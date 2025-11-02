// 定义泛型类，接收事件映射类型 E（结构为 { 事件名: 事件类型 }）
export class TypedEventTarget<E extends Record<string, Event>> extends EventTarget {
  // 重写 addEventListener：关联事件名与对应事件类型
  // @ts-expect-error 重新声明以支持类型标注
  addEventListener<K extends keyof E>(
    type: K,
    listener: (event: E[K]) => void,
    options?: boolean | AddEventListenerOptions
  ): void;

  // 兼容原生写法（处理未在泛型中定义的事件，可选）
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void;

  // 实现逻辑（调用父类方法）
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | AddEventListenerOptions
  ): void {
    super.addEventListener(type, listener, options);
  }

  // 重写 removeEventListener：与 addEventListener 类型对应
  // @ts-expect-error 重新声明以支持类型标注
  removeEventListener<K extends keyof E>(
    type: K,
    listener: (event: E[K]) => void,
    options?: boolean | EventListenerOptions
  ): void;

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void;

  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject,
    options?: boolean | EventListenerOptions
  ): void {
    super.removeEventListener(type, listener, options);
  }

  // 重写 dispatchEvent：限制只能派发泛型中定义的事件类型
  dispatchEvent(event: E[keyof E]): boolean {
    return super.dispatchEvent(event);
  }
}