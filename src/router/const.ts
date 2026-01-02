/* eslint-disable @typescript-eslint/no-explicit-any */
import type { RouteLocation } from "vue-router"

export const viewDepthKey = Symbol('viewDepth')

export const historyItemKey = Symbol('historyItem')

export const historyKey = Symbol('history')

export const pageEventKey = Symbol('pageEvent')

export type RouteHistoryLifecycle = {
  onForwardTo: (to: RouteLocation, from?: RouteLocation) => any,
  onBackTo: (to: RouteLocation, from: RouteLocation) => any,
  onBackFrom: (current: RouteLocation, prev: RouteLocation) => any,
  onForwardFrom: (current: RouteLocation, next: RouteLocation) => any,
  onReplaceFrom: (current: RouteLocation, next: RouteLocation) => any,
  onReplaceTo: (current: RouteLocation, next: RouteLocation) => any
}

export type RouteHistoryItem = {
  location: RouteLocation
  history?: RouteHistoryItem[]
  lifecycle?: {
    [key in keyof RouteHistoryLifecycle]?: RouteHistoryLifecycle[key][]
  }
  instance?: {
    dispatchPageLeave: () => void,
    dispatchPageBack: () => void,
    dispatchPageEnter: () => void,
    dispatchPageExit: () => void,
  } | null
}

export type RouteHistory = RouteHistoryItem[]
