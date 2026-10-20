import { expect, mock, test } from 'claude-code/testing'

const PANE = {
  plugin: 'hacker-screen',
  component: 'Pane',
  requestId: 'hacker-screen',
  props: {
    title: 'HACKER MODE',
    isFocused: false,
    bodyColumns: 60,
    placement: 'dock',
    scroll: { offset: 0, bodyRows: 30 },
    view: {},
  },
} as const

test('a Write pours its code onto the screen, on every surface', async ($, on) => {
  const clock = mock.clock(on)
  on('command.register', () => ({ value: { command: 'hacker' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('tool.call', () => ({ result: {} }))

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  await $.tool.call({
    tool: 'Write',
    file_path: '/app/hello.ts',
    content: 'const answer = 42\nconsole.log(answer)\n',
  })
  await clock.advance(3000)

  for (const surface of ['terminal', 'desktop', 'vscode', 'mobile'] as const) {
    const ui = await $.ui.mount({ ...PANE, surface })
    expect((await ui.find({ type: 'Text', text: /WRITE ▸ \/app\/hello\.ts/ }))?.text).toBeTruthy()
    expect((await ui.find({ type: 'Text', text: /^const answer = 42/ }))?.text).toBeTruthy()
    expect((await ui.find({ type: 'Text', text: /console\.log\(answer\)/ }))?.text).toBeTruthy()
    expect((await ui.find({ type: 'Text', text: /ACCESS GRANTED/ }))?.text).toBeTruthy()
    expect((await ui.find({ type: 'Text', text: /FILES 1/ }))?.text).toBeTruthy()
    await ui.unmount()
  }
})

test('code streams onto the screen while the model is still writing it', async ($, on) => {
  const clock = mock.clock(on)
  on('command.register', () => ({ value: { command: 'hacker' } }))
  on('ui.open', () => ({ value: { isPlaced: true } }))
  on('session.start', (_, e) => ({ cwd: e.cwd }))
  on('turn.step', async function* (_, e) {
    yield { kind: 'tool', ref: 1, index: 0, id: 'tu_1', name: 'Edit' }
    yield { kind: 'input', ref: 2, index: 0, json: '{"file_path":"/src/main.py","old_' }
    yield { kind: 'input', ref: 3, index: 0, json: 'string":"x","new_string":"def hack():\\n\\tret' }
    yield { kind: 'input', ref: 4, index: 0, json: 'urn \\"in\\"\\n"}' }

    return { turnId: e.turnId, index: e.index, answer: '', toolUses: [], stopReason: 'tool_use', usage: null }
  })

  await $.session.start({ cwd: '/', surface: 'desktop', isInteractive: true })
  const stream = $.turn.step({ turnId: 't1', index: 0, model: 'm', messageCount: 1 })
  for await (const _ of stream) {
    // drain
  }
  await clock.advance(3000)

  const ui = await $.ui.mount({ ...PANE, surface: 'desktop' })
  expect((await ui.find({ type: 'Text', text: /PATCH ▸ \/src\/main\.py/ }))?.text).toBeTruthy()
  expect((await ui.find({ type: 'Text', text: /^def hack\(\):/ }))?.text).toBeTruthy()
  expect((await ui.find({ type: 'Text', text: /^ {2}return "in"/ }))?.text).toBeTruthy()
  await ui.unmount()
})
