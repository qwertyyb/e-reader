/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RouteLocation } from "vue-router"

export const viewDepthKey = Symbol('viewDepth')

export const historyItemKey = Symbol('historyItem')

export const historyKey = Symbol('history')

export const pageEventKey = Symbol('pageEvent')

export type RouteHistoryItem = {
  location: RouteLocation
  uniqueId: string,
  lifecycle?: {
    [key in keyof RouteHistoryLifecycle]?: RouteHistoryLifecycle[key][]
  }
}

export type RouteHistoryLifecycle = {
  onForwardTo: (to: RouteHistoryItem, from?: RouteHistoryItem) => any,
  onBackTo: (to: RouteHistoryItem, from: RouteHistoryItem) => any,
  onBackFrom: (current: RouteHistoryItem, prev: RouteHistoryItem) => any,
  onForwardFrom: (current: RouteHistoryItem, next: RouteHistoryItem) => any,
  onReplaceFrom: (current: RouteHistoryItem, next: RouteHistoryItem) => any,
  onReplaceTo: (current: RouteHistoryItem, next: RouteHistoryItem) => any
}
