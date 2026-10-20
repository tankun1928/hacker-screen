import { atom, read, update } from 'claude-code'
import type { Elements, EngineInterface, Register } from 'claude-code'

import type { Line, LineKind, Screen } from '../types'

const PANE = 'hacker-screen'
const TICK_MS = 100
const MIN_CHARS_PER_TICK = 7
const MAX_LINES = 200
const IDLE_AFTER_TICKS = 15

const screen = atom({ plugin: 'hacker-screen', key: 'screen' } as const, {
  lines: [],
  isTyping: false,
  files: 0,
  bytes: 0,
  frame: 0,
} as Screen)
const isCenterOff = atom({ plugin: 'hacker-screen', key: 'isCenterOff' } as const, false)

// What the typewriter still has to put on screen, in order.
type Op =
  | { t: 'head'; text: string }
  | { t: 'text'; kind: LineKind; s: string }
  | { t: 'line'; kind: LineKind; text: string }

const queue: Op[] = []

async function openPane($: EngineInterface) {
  const opened = await $.ui.open({ id: PANE, title: 'HACKER MODE' })

  return opened
}
const streamed = new Set<string>()
let idleTicks = 0

const LABEL: Record<string, string> = {
  Write: 'WRITE',
  Edit: 'PATCH',
  NotebookEdit: 'NOTEBOOK',
  Bash: 'EXEC',
}
// The argument whose text pours onto the screen, per JSON key.
const POUR: Record<string, LineKind> = {
  content: 'code',
  new_string: 'code',
  new_source: 'code',
  command: 'cmd',
}
const PATH_KEYS = new Set(['file_path', 'notebook_path'])
const ESC: Record<string, string> = { n: '\n', t: '  ', r: '', b: '', f: '' }

function pushText(s: string, kind: LineKind) {
  if (s === '') return
  const last = queue[queue.length - 1]
  if (last !== undefined && last.t === 'text' && last.kind === kind) last.s += s
  else queue.push({ t: 'text', kind, s })
}

function shortPath(path: string) {
  return path.length > 60 ? '…' + path.slice(-59) : path
}

// Reads a tool call's JSON arguments as they stream in and pours the code
// (or shell command) out character by character, before the call even runs.
class Scanner {
  private inStr = false
  private esc = false
  private uni: string | null = null
  private isKey = false
  private key = ''
  private buf = ''
  private lastPunct = ''
  private pour: LineKind | null = null

  constructor(private label: string) {}

  feed(json: string) {
    for (const ch of json) this.step(ch)
  }

  private step(ch: string) {
    if (!this.inStr) {
      if (ch === '"') {
        this.inStr = true
        this.buf = ''
        this.isKey = this.lastPunct === '{' || this.lastPunct === ','
        this.pour = this.isKey ? null : (POUR[this.key] ?? null)
        if (this.pour === 'cmd') {
          queue.push({ t: 'head', text: `${this.label} ▸ shell` })
          pushText('$ ', 'cmd')
        }
      } else if ('{}[],:'.includes(ch)) {
        this.lastPunct = ch
      }
      return
    }
    if (this.uni !== null) {
      this.uni += ch
      if (this.uni.length === 4) {
        this.char(String.fromCharCode(parseInt(this.uni, 16) || 63))
        this.uni = null
      }
      return
    }
    if (this.esc) {
      this.esc = false
      if (ch === 'u') this.uni = ''
      else this.char(ESC[ch] ?? ch)
      return
    }
    if (ch === '\\') this.esc = true
    else if (ch === '"') this.close()
    else this.char(ch === '\t' ? '  ' : ch)
  }

  private char(c: string) {
    if (this.pour !== null) pushText(c, this.pour)
    else this.buf += c
  }

  private close() {
    this.inStr = false
    if (this.isKey) {
      this.key = this.buf
      return
    }
    if (this.pour !== null) {
      queue.push({ t: 'line', kind: 'sys', text: '' })
      this.pour = null
    } else if (PATH_KEYS.has(this.key)) {
      queue.push({ t: 'head', text: `${this.label} ▸ ${shortPath(this.buf)}` })
    }
  }
}

// For calls the stream did not show (a resumed turn, a call another plugin
// made): pour the whole argument at once.
function pourWhole(tool: string, input: Record<string, unknown>) {
  const label = LABEL[tool]
  if (label === undefined) return
  if (tool === 'Bash') {
    queue.push({ t: 'head', text: `${label} ▸ shell` })
    pushText('$ ' + String(input.command ?? ''), 'cmd')
  } else {
    const path = String(input.file_path ?? input.notebook_path ?? '')
    queue.push({ t: 'head', text: `${label} ▸ ${shortPath(path)}` })
    const code = input.content ?? input.new_string ?? input.new_source ?? ''
    pushText(String(code).replaceAll('\t', '  '), 'code')
  }
  queue.push({ t: 'line', kind: 'sys', text: '' })
}

function pendingChars() {
  let n = 0
  for (const op of queue) n += op.t === 'text' ? op.s.length : 1
  return n
}

// One frame of the typewriter: moves a handful of characters from the queue
// onto the screen, faster when a lot is waiting so the screen never lags far.
async function tick($: EngineInterface) {
  if (queue.length === 0) {
    idleTicks += 1
    if (idleTicks === IDLE_AFTER_TICKS || (idleTicks > IDLE_AFTER_TICKS && idleTicks % 5 === 0)) {
      await update($, screen, s => ({ ...s, isTyping: false, frame: s.frame + 1 }))
    }
    return
  }
  idleTicks = 0
  let budget = Math.max(MIN_CHARS_PER_TICK, Math.ceil(pendingChars() / 25))

  await update($, screen, s => {
    const lines = s.lines.slice()
    let { files, bytes } = s
    const last = () => lines[lines.length - 1]
    while (budget > 0 && queue.length > 0) {
      const op = queue[0]
      if (op === undefined) break
      if (op.t === 'head') {
        lines.push({ kind: 'head', text: op.text })
        files += op.text.startsWith('EXEC') ? 0 : 1
        queue.shift()
        budget -= 1
      } else if (op.t === 'line') {
        lines.push({ kind: op.kind, text: op.text })
        queue.shift()
        budget -= 1
      } else {
        const take = op.s.slice(0, budget)
        op.s = op.s.slice(take.length)
        if (op.s === '') queue.shift()
        budget -= take.length
        bytes += take.length
        const parts = take.split('\n')
        parts.forEach((part: string, i: number) => {
          const tail = last()
          if (i === 0 && tail !== undefined && tail.kind === op.kind) {
            lines[lines.length - 1] = { ...tail, text: tail.text + part }
          } else {
            lines.push({ kind: op.kind, text: part })
          }
        })
      }
    }

    return {
      lines: lines.slice(-MAX_LINES),
      isTyping: true,
      files,
      bytes,
      frame: s.frame + 1,
    }
  })
}

const RAIN = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜ0123456789ABCDEF'

function rain(width: number) {
  let out = ''
  for (let i = 0; i < width; i++) {
    out += Math.random() < 0.55 ? ' ' : RAIN[Math.floor(Math.random() * RAIN.length)]
  }
  return out
}

function bar(frame: number, width: number) {
  const pos = frame % (width * 2)
  const at = pos < width ? pos : width * 2 - pos - 1
  let out = ''
  for (let i = 0; i < width; i++) out += Math.abs(i - at) <= 1 ? '█' : '░'
  return out
}

const COLOR: Record<LineKind, string> = {
  head: '#00e5ff',
  code: '#39ff14',
  cmd: '#ffb000',
  ok: '#39ff14',
  fail: '#ff3355',
  sys: '#1f7a3a',
}

type Ui = Pick<Elements['desktop'], 'Box' | 'Text'>

// The screen itself, drawn the same in the middle of the chat and in a panel.
function drawScreen({ Box, Text }: Ui, s: Screen, cols: number, room: number, isActive: boolean) {
  const shown = s.lines.slice(-room)
  const cursor = s.isTyping || s.frame % 2 === 0 ? '█' : ' '
  const status = s.isTyping ? 'INJECTING CODE' : isActive ? 'SCANNING TARGET' : 'STANDING BY'

  return (
    <Box flexDirection="column" backgroundColor="#000000" paddingX={1} flexGrow={1}>
      <Text color="#39ff14" bold wrap="truncate-end">
        ▓▓ CLAUDE // NEURAL CODE INJECTION TERMINAL ▓▓
      </Text>
      <Text color="#1f7a3a" wrap="truncate-end">
        {isActive ? rain(cols) : ' '.repeat(cols)}
      </Text>
      <Text color="#00e5ff" wrap="truncate-end">
        FILES {s.files} · BYTES {s.bytes.toLocaleString('en-US')} · {status}{' '}
        {isActive ? bar(s.frame, 12) : ''}
      </Text>
      <Text color="#1f7a3a" wrap="truncate-end">
        {'─'.repeat(cols)}
      </Text>
      {shown.length === 0 && (
        <Text color="#39ff14">
          {'> AWAITING TARGET… '}
          {cursor}
        </Text>
      )}
      {shown.map((line: Line, i: number) => (
        <Text
          color={COLOR[line.kind]}
          bold={line.kind === 'head' || line.kind === 'ok' || line.kind === 'fail'}
          wrap="truncate-end"
        >
          {line.kind === 'head' ? `>>> ${line.text}` : line.text === '' ? ' ' : line.text}
          {i === shown.length - 1 ? cursor : ''}
        </Text>
      ))}
    </Box>
  )
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'hacker',
      description: 'Turn the hacker screen in the middle of the chat on or off (/hacker panel: open it as a side panel)',
    })
    $.clock.every(TICK_MS, () => void tick($))

    return next(e)
  })

  on('command.run', { command: 'hacker' }, async ($, e) => {
    if (e.args.trim() === 'panel') {
      const opened = await openPane($)
      if (opened.isPlaced) return { text: 'Hacker panel online.' }
      if (opened.reason.startsWith('no-surface')) {
        return {
          text: 'Nothing that draws Claude Code panels is connected to this session (a web viewer of a cloud session draws none). Run Claude Code in a terminal or the desktop app to see it.',
        }
      }

      return { text: `This screen does not place side panels (${opened.reason}).` }
    }
    const isOff = await update($, isCenterOff, off => !off)

    return {
      text: isOff
        ? 'Hacker screen off. Type /hacker to turn it back on.'
        : 'Hacker screen on: it takes the middle of the chat while Claude works.',
    }
  })

  // Watch the model's response as it streams: each Write/Edit/Bash call's
  // arguments pour onto the screen while Claude is still writing them.
  on('turn.step', async function* ($, e, next) {
    const scanners = new Map<number, Scanner>()
    for await (const chunk of next(e)) {
      try {
        const label = chunk.kind === 'tool' ? LABEL[chunk.name] : undefined
        if (chunk.kind === 'tool' && label !== undefined) {
          scanners.set(chunk.index, new Scanner(label))
          streamed.add(chunk.id)
        } else if (chunk.kind === 'input') {
          scanners.get(chunk.index)?.feed(chunk.json)
        }
      } catch {
        // The screen is decoration: never let it disturb the real stream.
      }
      yield chunk
    }
  })

  on('tool.call', async ($, e, next) => {
    const label = LABEL[e.tool]
    if (label === undefined) return next(e)
    if (!streamed.delete(e.tool_use_id)) {
      pourWhole(e.tool, e as unknown as Record<string, unknown>)
    }
    const ran = await next(e)
    const isOk = ran.deny === undefined && ran.isError !== true
    const verb = e.tool === 'Bash' ? 'EXECUTED' : 'ACCESS GRANTED'
    queue.push({
      t: 'line',
      kind: isOk ? 'ok' : 'fail',
      text: isOk ? `[✓] ${verb}` : '[✗] ACCESS DENIED',
    })
    queue.push({ t: 'line', kind: 'sys', text: '' })

    return ran
  }).catch(($, e, next) => next(e))

  // The main screen: in the middle of the chat, above the prompt, while
  // Claude works; it steps aside once the turn is over.
  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    const s = await read($, screen)
    const isActive = e.props.isWorking || s.isTyping
    if (e.props.hasSurvey || !isActive || (await read($, isCenterOff))) return next(e)
    const cols = Math.max(20, Math.min(160, e.props.bodyColumns - 2))
    const rows = Math.min(e.props.maxRows, 22)

    return drawScreen($.ui.resolve(e), s, cols, Math.max(3, rows - 4), true)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const s = await read($, screen)
    const cols = Math.max(20, Math.min(120, (e.viewport?.columns ?? 80) - 4))
    const room = Math.max(4, (e.viewport?.rows ?? 30) - 8)

    return drawScreen($.ui.resolve(e), s, cols, room, s.isTyping)
  })
}
