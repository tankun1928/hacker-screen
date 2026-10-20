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

## วิธีติดตั้ง (ภาษาไทย)

**ต้องใช้:** Claude Code ที่รันบนเครื่องของคุณเอง คือ**แอป Claude desktop (แท็บ Code)** หรือ **Claude Code บน terminal** อย่างใดอย่างหนึ่ง
(session บนคลาวด์ที่ดูผ่านหน้าเว็บ claude.ai ใช้ไม่ได้ เพราะไม่มีจอให้วาด)

### ติดตั้งในแอป Claude desktop (ไม่ต้องใช้ terminal)

1. เปิดแอป Claude ไปที่แท็บ **Code** แล้วเริ่ม session บนเครื่องตัวเอง (เลือกโฟลเดอร์ในเครื่อง ไม่ใช่ cloud)
2. กดปุ่ม **+** ข้างช่องพิมพ์ → **Plugins**
3. กด **Add marketplace** แล้วใส่ `tankun1928/hacker-screen`
4. กด **Add plugin** แล้วเลือก **hacker-screen**
5. ปิดแอปแล้วเปิดใหม่ จอดำจะขึ้นตรงกลาง เหนือช่องพิมพ์

### ติดตั้งผ่าน terminal

พิมพ์ `claude` เพื่อเปิด Claude Code แล้วพิมพ์ในช่องแชท:

```
/plugin install hacker-screen --marketplace tankun1928/hacker-screen
```

กด `y` เพื่อเพิ่ม marketplace แล้วกด Enter เพื่อเลือก scope ใช้ได้ทันทีโดยไม่ต้องรีสตาร์ท

หรือพิมพ์ใน shell (นอก Claude Code):

```
claude plugin install hacker-screen --marketplace tankun1928/hacker-screen
```

### วิธีใช้

- จอจะขึ้นเองตรงกลาง เหนือช่องพิมพ์ ลองสั่งให้ Claude เขียนโค้ดอะไรก็ได้ แล้วดูโค้ดไหล
- `/hacker` ปิดจอ พิมพ์อีกครั้งเพื่อเปิด (จำค่าข้ามแชท)
- `/hacker panel` เปิดเป็นแผงด้านข้างแทน

### วิธีอัปเดตเป็นเวอร์ชันใหม่

แอปจะไม่ดึงเวอร์ชันใหม่จาก GitHub ให้เอง ต้องสั่งอัปเดตเอง:

- **terminal:** รันสองคำสั่งนี้ แล้วเปิด Claude Code ใหม่
  ```
  claude plugin marketplace update hacker-screen
  claude plugin update hacker-screen@hacker-screen
  ```
- **แอป desktop:** กด **+** → **Plugins** → ลบ **hacker-screen** และลบ marketplace **hacker-screen** ออก แล้วทำขั้นตอนติดตั้งข้างบนใหม่ จากนั้นปิดแอปเปิดใหม่
  (หรือพิมพ์บอก Claude ในเครื่องว่า "อัปเดต plugin hacker-screen ให้หน่อย" ก็ได้)

### ถอนการติดตั้ง

- **terminal:** `claude plugin uninstall hacker-screen@hacker-screen`
- **แอป desktop:** กด **+** → **Plugins** → ลบ **hacker-screen**

### แก้ปัญหา

| อาการ | สาเหตุ / วิธีแก้ |
| --- | --- |
| ไม่มีอะไรขึ้นเลย | เช็คว่าเป็น session บนเครื่องตัวเอง ไม่ใช่ cloud แล้วพิมพ์ `/hacker` ถ้าตอบว่า "off" ให้พิมพ์อีกครั้งเพื่อเปิด |
| ขึ้นเป็นแผงด้านข้าง ไม่ขึ้นตรงกลาง | ยังเป็นเวอร์ชันเก่า (0.1.0) ให้อัปเดตตามขั้นตอนข้างบน แล้วปิดแอปเปิดใหม่ |
| พิมพ์ `/hacker` แล้ว Claude ตอบว่าไม่รู้จักคำสั่ง | plugin ยังไม่โหลด ให้ปิดแอปเปิดใหม่ หรือติดตั้งใหม่ |

## Install (English)

You need Claude Code running on your own computer: the **Claude desktop app's Code tab** or **Claude Code in a terminal**. A cloud session viewed on the claude.ai web page can't draw it.

**Desktop app:** click **+** next to the prompt box → **Plugins** → **Add marketplace** with `tankun1928/hacker-screen` → **Add plugin** → pick **hacker-screen**, then restart the app.

**Terminal**, at the Claude Code prompt:

```
/plugin install hacker-screen --marketplace tankun1928/hacker-screen
```

Answer `y` to add the marketplace, then pick a scope (Enter for user scope). Or from a shell:

```
claude plugin install hacker-screen --marketplace tankun1928/hacker-screen
```

**Update** (the app doesn't pull new versions by itself), then restart Claude Code:

```
claude plugin marketplace update hacker-screen
claude plugin update hacker-screen@hacker-screen
```

In the desktop app, remove the plugin and the `hacker-screen` marketplace under **+** → **Plugins**, add them again, and restart the app.

**Uninstall:** `claude plugin uninstall hacker-screen@hacker-screen`, or remove it under **+** → **Plugins**.

## Develop

```
claude plugin validate .
claude plugin test .
claude --plugin-dir .
```
