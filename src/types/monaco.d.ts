// Monaco Editor worker 类型声明

declare global {
  interface Window {
    MonacoEnvironment?: {
      getWorker?(workerId: string, label: string): Worker
      getWorkerUrl?(workerId: string, label: string): string
    }
  }

  // 为 self 添加类型支持
  const self: Window & typeof globalThis
}

export {}