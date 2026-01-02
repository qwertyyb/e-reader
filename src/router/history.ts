import type { RouteLocation, RouteLocationMatched } from "vue-router"

export type RootRouteHistoryNode = {
  matchedRoute: null
  children: RouteHistoryNode[]
}

export type RouteHistoryNode = {
  matchedRoute: RouteLocationMatched
  children: RouteHistoryNode[]
  location?: RouteLocation
}

const buildHistoryNode = (matched: RouteLocationMatched[], route: RouteLocation) => {
  const node: RouteHistoryNode = {
    matchedRoute: matched[0],
    children: []
  }
  if (matched.length > 1) {
    node.children.push(buildHistoryNode(matched.slice(1), route))
  }
  if (matched.length === 1) {
    node.location = route
  }
  return node
}

const popHistoryNode = (count: number, node: RootRouteHistoryNode | RouteHistoryNode): [number, RootRouteHistoryNode | RouteHistoryNode | null] => {
  if (count === 0) {
    return [0, node]
  }
  let needPopCount = count
  if (node.children.length) {
    for (let i = node.children.length - 1; i >= 0; i -= 1) {
      const result = popHistoryNode(needPopCount, node.children[i])
      needPopCount = result[0]
      node.children[i] = result[1] as RouteHistoryNode
    }
  } else {
    needPopCount -= 1
    if (needPopCount === 0) {
      return [0, null]
    }
  }
  node.children = node.children.filter(c => c !== null)
  return [needPopCount, node]
}

export const push = (route: RouteLocation, root: RootRouteHistoryNode) => {
  const matched = route.matched.filter(r => r.components?.default)
  const newRoot = { ...root }
  let current: RootRouteHistoryNode | RouteHistoryNode = newRoot
  for(let i = 0; i < matched.length; i++) {
    const last: RouteHistoryNode | undefined = current.children[current.children.length - 1]
    if (last && last.matchedRoute === matched[i]) {
      current = last
      continue;
    }
    current.children = [...current.children, buildHistoryNode(matched.slice(i), route)]
    break;
  }
  return newRoot
}

export const pop = (root: RootRouteHistoryNode, count: number = 1) => {
  const newRoot = { ...root }
  popHistoryNode(count, newRoot)
  return newRoot
}

export const replace = (route: RouteLocation, root: RootRouteHistoryNode) => {
  const newRoot = pop(root)
  return push(route, newRoot)
}

export const findLatestHistoryNode = (node: RootRouteHistoryNode | RouteHistoryNode): RouteHistoryNode => {
  if (node.children.length) {
    return findLatestHistoryNode(node.children[node.children.length - 1])
  }
  return node as RouteHistoryNode
}