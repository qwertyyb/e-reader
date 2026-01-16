export const getRemoateProgress = (document: string) => {
}

export const updateRemtoeProgress = (document: string, progress: { chapterId: string, cursor: number, percentage: number }) => {
}

export class ProgressSyncService {
  private options: { device: string, deviceId: string }
  constructor(options: {
    server: string,
    username: string,
    password: string,
    device: string,
    deviceId: string
  }) {
    this.options = options
  }
  async init() {
  }
  update(document: string, progress: { chapterId: string, cursor: number, percentage: number }) {
    updateRemtoeProgress(document, progress)
  }
}
