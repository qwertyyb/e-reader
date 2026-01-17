export const getRemoteProgress = async (options: {
  server: string,
  username: string,
  password: string,
  document: string
}): Promise<{ document: string, percentage: number, progress: string, timestamp: number, device: string, deviceId: string } | null> => {
  const { server, username, password, document } = options
  const url = new URL(`/sync/progress/${document}?remote=1`, server)
  const r = await fetch(url, {
    headers: {
      'content-type': 'application/json',
      'accept': 'application/vnd.koreader.v1+json',
      'x-auth-user': username,
      'x-auth-key': password
    }
  })
  if (r.status === 200) {
    return r.json()
  }
  if (r.ok) {
    return null
  }
  return null
}

export const createUser = async (options: { server: string, username: string, password: string }) => {
  const { server, username, password } = options
  const url = new URL(`/users/create?remote=1`, server)
  const r = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({ username, password })
  })
  if (r.status === 201) {
    return { succes: true }
  }
  if (r.status === 402) {
    return { exists: true }
  }
  throw new Error(`创建用户失败: ${r.status} ${r.statusText}`)
}

export const authUser = async (options: { server: string, username: string, password: string }) => {
  const { server, username, password } = options
  const url = new URL(`/users/auth?remote=1`, server)
  const r = await fetch(url, {
    headers: {
      'x-auth-user': username,
      'x-auth-key': password,
      'content-type': 'application/json',
      'accept': 'application/vnd.koreader.v1+json'
    }
  })
  if (r.ok) {
    return { success: true }
  }
  throw new Error(`认证失败: ${r.status} ${r.statusText}`)
}

export const setRemoteProgress = async (options: {
  server: string,
  username: string,
  password: string,
  document: string,
  device: string,
  deviceId: string,
  progress: string,
  percentage: number
}) => {
  const { server, username, password, document, progress, device, deviceId, percentage } = options
  const url = new URL(`/sync/progress?remote=1`, server)
  const r = await fetch(url, {
    method: 'PUT',
    headers: {
      'content-type': 'application/json',
      'accept': 'application/vnd.koreader.v1+json',
      'x-auth-user': username,
      'x-auth-key': password
    },
    body: JSON.stringify({
      document,
      percentage,
      progress,
      device_id: deviceId,
      device
    })
  })
  if (!r.ok) {
    throw new Error(`更新进度失败: ${r.status} ${r.statusText}`)
  }
}
