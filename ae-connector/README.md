# Claude Connector for After Effects

A CEP panel inside Adobe After Effects that lets you chat with Claude to control your project. Supports:

- **Natural language commands** — "add a glow to the selected layer", "scale the text layer to 120% over 2 seconds"
- **Creator styles** — apply xrh4, 24kjohn, and gulovsky editing aesthetics with one click
- **Tutorial follower** — paste a YouTube tutorial URL and Claude fetches the transcript, parses every AE step, and applies them one by one
- **Preset manager** — drop any `.ffx` file into `presets/` and apply it via chat

---

## Requirements

- Adobe After Effects CC 2019 or later (AE 16.0+)
- Windows 10 / 11
- Node.js 14+ (only needed for `npm install` — CEP has its own Node runtime)
- An [Anthropic API key](https://console.anthropic.com/)

---

## Installation

### 1. Install npm dependencies

```bat
cd ae-connector
npm install
```

### 2. Copy extension to the CEP extensions folder

Copy the entire `ae-connector` folder to:

```
%APPDATA%\Adobe\CEP\extensions\com.claudeconnect.ae\
```

You can do this by running in Command Prompt:

```bat
xcopy /E /I ae-connector "%APPDATA%\Adobe\CEP\extensions\com.claudeconnect.ae"
```

### 3. Enable unsigned extensions (developer mode)

Open **Registry Editor** (`regedit`) and add the following DWORD value `PlayerDebugMode = 1` under each of these keys (create the key if it doesn't exist):

```
HKEY_CURRENT_USER\Software\Adobe\CSXS.9
HKEY_CURRENT_USER\Software\Adobe\CSXS.10
HKEY_CURRENT_USER\Software\Adobe\CSXS.11
```

Or run in an **elevated PowerShell**:

```powershell
$keys = "HKCU:\Software\Adobe\CSXS.9","HKCU:\Software\Adobe\CSXS.10","HKCU:\Software\Adobe\CSXS.11"
foreach ($k in $keys) {
    if (!(Test-Path $k)) { New-Item -Path $k -Force }
    Set-ItemProperty -Path $k -Name "PlayerDebugMode" -Value "1" -Type String
}
Write-Host "Done — restart After Effects."
```

### 4. Open the panel in After Effects

1. Launch After Effects
2. Go to **Window → Extensions → Claude Connector**
3. Enter your Anthropic API key and click **Save & Connect**

---

## Usage

### Chat commands

Type anything in the chat box and press Enter or click the send button:

| Example command | What happens |
|---|---|
| `add a glow effect to selected layer` | Applies Glow effect via ExtendScript |
| `create a 3s fade in on layer 2` | Keyframes opacity from 0 to 100 |
| `apply xrh4 style` | Vignette + crushed blacks + chromatic aberration |
| `apply 24kjohn style` | Slow zoom + warm grade + cinematic bars |
| `apply gulovsky style` | Dark curves + neon pop + light leak |
| `follow https://youtube.com/watch?v=...` | Fetches transcript → applies all tutorial steps |
| `apply preset Cinematic` | Looks for `presets/Cinematic.ffx` and applies it |

### Quick-action chips

Click the chips above the text input to prefill common commands.

### Tutorial follower

1. Find an After Effects tutorial on YouTube
2. Paste the full URL into the chat and press Enter (or click **Follow tutorial…** chip and add the URL)
3. A progress overlay shows each step as it's applied in After Effects
4. Click **Cancel** at any time to stop

### Presets

Drop any `.ffx` preset file into the `ae-connector/presets/` folder.  
Then tell Claude: `apply preset <filename without .ffx>`.

---

## Project structure

```
ae-connector/
├── CSXS/
│   └── manifest.xml          ← CEP extension config
├── css/
│   └── style.css             ← Dark panel UI
├── js/
│   ├── lib/
│   │   └── CSInterface.js    ← Adobe bridge (included)
│   ├── main.js               ← Panel logic, chat loop
│   ├── claude.js             ← Claude API client
│   ├── youtube.js            ← YouTube transcript fetcher
│   └── presets.js            ← Preset manager
├── jsx/
│   ├── hostscript.jsx        ← ExtendScript entry point
│   ├── effects.jsx           ← AE effect helpers
│   └── styles/
│       ├── xrh4.jsx
│       ├── 24kjohn.jsx
│       └── gulovsky.jsx
├── presets/                  ← Drop .ffx files here
├── index.html                ← Panel HTML (chatbot UI)
├── package.json
└── README.md
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Panel doesn't appear in Window menu | Check `PlayerDebugMode = 1` in registry; restart AE |
| `@anthropic-ai/sdk not loaded` error | Run `npm install` inside `ae-connector/` |
| YouTube transcript fails | Video may have no captions; try a different tutorial |
| `EvalScript error` in panel | Open AE's ExtendScript Toolkit to debug JSX errors |
| Script changes not reflected | Edit files, then close and reopen the panel |

---

## Extending creator styles

Each style file (`jsx/styles/*.jsx`) exposes a single function.  
Copy one as a template, rename the function, and place it in the same folder.  
`hostscript.jsx` will pick it up via the `#include` directives at the top.
