# hacker-screen

A movie-style hacker screen for Claude Code. When Claude writes code, the code flows onto a green-on-black screen as Claude generates it, right in the middle of the chat above the prompt box. There are no popups and no separate windows.

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
- Matrix-style katakana rain, a scanning progress bar and file/byte counters while Claude works

The screen stays in the middle of the chat, above the prompt box. The rain and the scanner run while Claude works; between turns it keeps the last code on screen, `STANDING BY`. A new chat opens with the last screen from the chat before.

It only watches: it never changes what Claude writes or runs, and if anything in it fails, the tool call goes through untouched.

## Requirements

Claude Code running on your own computer: the **Claude desktop app's Code tab** (a local session, not a cloud one) or **Claude Code in a terminal**. A cloud session watched from the claude.ai web page connects no screen, so nothing can be drawn there.

## Install

### Claude desktop app (no terminal needed)

1. Open the Claude app, go to the **Code** tab, and start a session on your computer (pick a local folder, not cloud).
2. Click **+** next to the prompt box → **Plugins**.
3. Click **Add marketplace** and enter `tankun1928/hacker-screen`.
4. Click **Add plugin** and pick **hacker-screen**.
5. Restart the app. The screen appears in the middle of the chat, above the prompt box.

### Terminal

Run `claude` to open Claude Code, then type at its prompt:

```
/plugin install hacker-screen --marketplace tankun1928/hacker-screen
```

Answer `y` to add the marketplace, then press Enter to pick the scope. It works right away, with no restart.

Or from a shell:

```
claude plugin install hacker-screen --marketplace tankun1928/hacker-screen
```

## Use

- The screen shows by itself. Ask Claude to write some code and watch it flow.
- `/hacker` turns the screen off, and on again. The choice carries over to new chats.
- `/hacker panel` opens the same screen as a side panel instead.

## Update

The app doesn't pull new versions from GitHub by itself.

- **Terminal:** run these, then restart Claude Code:
  ```
  claude plugin marketplace update hacker-screen
  claude plugin update hacker-screen@hacker-screen
  ```
- **Desktop app:** click **+** → **Plugins**, remove **hacker-screen** and the **hacker-screen** marketplace, install again as above, then restart the app. Or ask Claude in a local session to update the plugin for you.

## Uninstall

- **Terminal:** `claude plugin uninstall hacker-screen@hacker-screen`
- **Desktop app:** click **+** → **Plugins** → remove **hacker-screen**

## Troubleshooting

| Problem | Cause and fix |
| --- | --- |
| Nothing shows at all | Check that the session runs on your computer, not in the cloud. Type `/hacker`: if it answers "off", type it again to turn the screen on. |
| It shows as a side panel, not in the middle | You have the old version (0.1.0). Update as above, then restart the app. |
| Claude doesn't know the `/hacker` command | The plugin isn't loaded. Restart the app, or install it again. |

## Develop

```
claude plugin validate .
claude plugin test .
claude --plugin-dir .
```
