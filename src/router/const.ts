import type { RouteLocation } from "vue-router"

export const viewDepthKey = Symbol('viewDepth')

export const matchRouteKey = Symbol('matchRoute')

export const historyKey = Symbol('history')

export const pageEventKey = Symbol('pageEvent')

export type RouteHistoryItem = RouteLocation & {
  history?: RouteHistoryItem[]
  instance?: {
    dispatchPageLeave: () => void,
    dispatchPageBack: () => void,
    dispatchPageEnter: () => void,
    dispatchPageExit: () => void,
  } | null
}

export type RouteHistory = RouteHistoryItem[]