# hacker-screen

A movie-style hacker screen for Claude Code. When Claude writes code, the code flows onto a green-on-black screen as Claude generates it, right in the middle of the chat above the prompt box. There are no popups and no separate windows.

หน้าจอแฮกเกอร์แบบในหนังสำหรับ Claude Code: เวลา Claude เขียนโค้ด โค้ดจะไหลขึ้นจอดำตัวอักษรเขียวแบบเรียลไทม์ ระหว่างที่ Claude กำลังพิมพ์อยู่ จอค้างอยู่ตรงกลางแชทเหนือช่องพิมพ์ตลอด ไม่มีป๊อปอัปหรือหน้าต่างแยก

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

The screen stays in the middle of the chat, above the prompt box. The rain and the scanner run while Claude works; between turns it keeps the last code on screen, `STANDING BY`. A new chat opens with the last screen from the chat before.

- `/hacker` turns the middle screen off, and on again. The choice carries over to new chats.
- `/hacker panel` opens the same screen as a side panel instead.

It only watches: it never changes what Claude writes or runs, and if anything in it fails, the tool call goes through untouched.

## Where it shows

The screen draws in **Claude Code in a terminal** and in the **Claude desktop app's Code tab**, in a session running on your own computer. A cloud session watched from the claude.ai web page connects no screen, so nothing can be drawn there (`/hacker panel` tells you when that's the case).

หน้าจอจะแสดงใน **Claude Code บน terminal** และ **แอป Claude desktop (แท็บ Code)** ที่รัน session บนเครื่องของคุณ ส่วน session บนคลาวด์ที่ดูผ่านหน้าเว็บ claude.ai จะไม่มีจอให้วาด

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
