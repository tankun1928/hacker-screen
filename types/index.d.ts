export type LineKind = 'head' | 'code' | 'cmd' | 'ok' | 'fail' | 'sys'
export type Line = { kind: LineKind; text: string }
export type Screen = {
  lines: Line[]
  isTyping: boolean
  files: number
  bytes: number
  frame: number
}

declare module 'claude-code' {
  interface PluginState {
    'hacker-screen': { screen: Screen; isCenterOff: boolean }
  }
}
