# hacker-screen

A movie-style hacker screen for Claude Code. When Claude writes code, the code flows onto a green-on-black screen as Claude generates it, in a pane next to the chat. There are no popups and no separate windows.

หน้าจอแฮกเกอร์แบบในหนังสำหรับ Claude Code: เวลา Claude เขียนโค้ด โค้ดจะไหลขึ้นจอดำตัวอักษรเขียวแบบเรียลไทม์ ระหว่างที่ Claude กำลังพิมพ์อยู่ แสดงในแผงข้างแชทของ Claude เลย ไม่มีป๊อปอัปหรือหน้าต่างแยก

```
▓▓ CLAUDE // NEURAL CODE INJECTION TERMINAL ▓▓
 ｱ 7  ﾊ   F ｼ    2 ﾙ  ｴ   9   ﾈ B   ｿ  ﾐ  4
FILES 3 · BYTES 12,480 · INJECTING CODE ░░░░███░░░░░
────────────────────────────────────────────
>>> WRITE ▸ /src/app.ts
import { serve } from './server'
const port = 3000
serve(port)█
```

## What it shows

- **Write / Edit / NotebookEdit**: the new code, typed out as Claude generates it (`>>> WRITE ▸ path`, `>>> PATCH ▸ path`)
- **Bash**: the command, in amber (`>>> EXEC ▸ shell`)
- `[✓] ACCESS GRANTED` when a write succeeds, `[✗] ACCESS DENIED` when it is refused or fails
- Matrix-style katakana rain, a scanning progress bar and file/byte counters while code is flowing; a blinking `AWAITING TARGET…` cursor when idle

The screen opens by itself when a session starts. Type `/hacker` to bring it back if you close it.

It only watches: it never changes what Claude writes or runs, and if anything in it fails, the tool call goes through untouched.

## Install

At the prompt of a terminal session:

```
/plugin install hacker-screen --marketplace tankun1928/hacker-screen
```

Answer `y` to add the marketplace, then pick a scope (Enter for user scope).

From a shell:

```
claude plugin install hacker-screen --marketplace tankun1928/hacker-screen
```

In the desktop app, where `/plugin` does not run: click **+** next to the prompt box, then **Plugins**, **Add marketplace** with `tankun1928/hacker-screen`, then **Add plugin**.

## Develop

```
claude plugin validate .
claude plugin test .
claude --plugin-dir .
```
