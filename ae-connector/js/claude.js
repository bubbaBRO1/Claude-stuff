/**
 * claude.js  —  Claude API client for the AE Connector
 *
 * Uses the Node.js runtime that CEP embeds to call @anthropic-ai/sdk.
 * All functions return Promises.
 */

'use strict';

(function (global) {

  // CEP's built-in Node.js require
  var Anthropic;
  try {
    Anthropic = require('@anthropic-ai/sdk');
  } catch (e) {
    console.error('[claude.js] Could not require @anthropic-ai/sdk:', e.message);
  }

  var MODEL = 'claude-sonnet-4-6';
  var MAX_TOKENS = 4096;

  // ── System prompts ────────────────────────────────────────────────────────

  var SYSTEM_AE = [
    'You are an expert Adobe After Effects automation assistant embedded inside a CEP panel.',
    'The user will describe an edit in natural language. You must respond with:',
    '1. A short plain-English explanation of what you are about to do (1-3 sentences).',
    '2. A fenced code block tagged ```extendscript containing valid ExtendScript that performs the edit.',
    '',
    'Rules for ExtendScript output:',
    '- Use app.project.activeItem as the active composition.',
    '- Operate on app.project.activeItem.selectedLayers when the user says "selected layer(s)".',
    '- If no layer is selected, apply to the first layer (index 1) and mention it.',
    '- Always wrap operations in app.beginUndoGroup("Claude: <action>") / app.endUndoGroup().',
    '- Never use alert() or confirm(). Use the returned string for status.',
    '- End the script by returning a JSON string: {"ok":true,"msg":"<what was applied>"}',
    '- If you cannot do something, return {"ok":false,"msg":"<reason>"}',
    '',
    '== AVAILABLE HELPER FUNCTIONS (defined globally in ExtendScript) ==',
    'Core:',
    '  getActiveComp()                             → CompItem or null',
    '  getTargetLayers()                           → selected layers or [layers[1]]',
    '',
    'Color & grade:',
    '  applyCurve(layer, channel, points)          → Curves (1=Master 2=R 3=G 4=B, normalised 0-1 points)',
    '  addGlow(layer, threshold, radius, intensity)',
    '  addHueSat(layer, saturation, hue)           → Hue/Saturation effect',
    '  applyLumetri(layer, {temperature,tint,saturation,contrast,highlights,shadows})',
    '  addChromaticAberration(layer, amount)       → Channel Blur R+B channel shift',
    '',
    'Motion & dynamics:',
    '  addCameraShake(layer, frequency, amplitude) → wiggle() expression on Position',
    '  addZoomPulse(layer, peakScale, duration)    → Scale punch keyframes (e.g. 100→115→100)',
    '  addSlowZoom(layer, startScale, endScale)    → Ken Burns push-in over layer duration',
    '  addSpeedRamp(layer, slowFactor)             → Time Remap: fast→slow→fast',
    '  addMotionTile(layer, outputWidth, outputHeight) → Motion Tile effect (tiling/repeat)',
    '',
    'Texture & atmosphere:',
    '  addFilmGrain(layer, amount, type)           → Noise effect ("soft"|"hard")',
    '  addVHSLook(layer)                           → noise + hue shift + channel blur scan lines',
    '  addGlitchEffect(layer, intensity, fps)      → Turbulent Displace + Posterize Time + chroma',
    '  addEchoTrail(layer, numEchoes, decay)       → Echo effect for motion smear',
    '  addLensFlare(layer, position)               → Lens Flare at [x,y]',
    '  addVignette(comp, opacity)                  → black ellipse subtract mask on solid',
    '  addSolidBar(comp, name, color, heightRatio, "top"|"bottom", blendMode)',
    '  enableMotionBlur(layer, comp)',
    '',
    '== USER VOCABULARY → FUNCTION MAPPING ==',
    '"shake", "camera shake", "wiggle"           → addCameraShake',
    '"zoom pulse", "punch", "zoom hit"           → addZoomPulse',
    '"push in", "slow zoom", "ken burns"         → addSlowZoom',
    '"speed ramp", "ramp", "slow mo", "time remap" → addSpeedRamp',
    '"grain", "film grain", "noise"              → addFilmGrain',
    '"glitch", "corrupt", "databend"             → addGlitchEffect',
    '"VHS", "tape", "retro", "scanlines"         → addVHSLook',
    '"echo", "trail", "ghost", "smear"           → addEchoTrail',
    '"lens flare", "flare"                       → addLensFlare',
    '"tile", "tiling", "repeat", "kaleidoscope"  → addMotionTile',
    '"chromatic", "aberration", "colour fringe"  → addChromaticAberration',
    '"vignette", "dark edges"                    → addVignette',
    '"cinematic bars", "letterbox", "2.39"       → addSolidBar (top + bottom, black)',
    '',
    '== CREATOR STYLES (when user mentions these creators) ==',
    'xrh4: crushed blacks S-curve, -40 desaturation, chromatic aberration (6px), addCameraShake(freq=10,amp=8), film grain, addEchoTrail, heavy vignette (85). Dark, punchy AMV/edit style with turbulent energy.',
    '24kjohn: addSlowZoom(100,108), warm Curves (lift R+G shadows, pull B), soft addGlow(65,55,0.45), cinematic bars, motion blur, subtle vignette (45). Premium, deliberate, warm cinematic look.',
    'gulovsky: deep black crush Curves (pull R to cyan, lift B highlights), +38 saturation, addChromaticAberration(5), addEchoTrail(3,0.45), orange Screen light leak solid top-left, vignette (60). Neon-pop dark aesthetic.',
  ].join('\n');

  var SYSTEM_MATCH_EDIT = [
    'You are an expert Adobe After Effects colorist and editor. You will receive information about a YouTube video',
    '(title, channel, and transcript/captions). Your job is to analyse the video\'s visual style and editing aesthetic,',
    'then produce ExtendScript that replicates that style in the user\'s current After Effects project.',
    '',
    'You must respond with:',
    '1. A plain-English analysis of the style (2-4 sentences): colour mood, pacing, key effects you detected.',
    '2. A fenced code block tagged ```extendscript that applies the matched style to the active comp.',
    '',
    'Rules for ExtendScript output:',
    '- Use app.project.activeItem as the active composition.',
    '- Apply color grade + effects to selectedLayers, or layer[1] if nothing is selected.',
    '- Always wrap in app.beginUndoGroup("Claude: match edit style") / app.endUndoGroup().',
    '- Never use alert() or confirm().',
    '- End with: JSON.stringify({ok:true, msg:"Matched style from: <title>"})',
    '- If you cannot determine a style, return JSON.stringify({ok:false, msg:"<reason>"})',
    '',
    'Style detection hints — look for these cues in the transcript/title:',
    '- Words like "dark", "moody", "cinematic" → crushed blacks, vignette, desaturated',
    '- Words like "warm", "golden", "sunset" → lifted warm shadows, orange mids',
    '- Words like "neon", "cyber", "glitch" → chromatic aberration, high saturation, neon glow',
    '- Fast-cut music videos → enable motion blur, set short layer durations',
    '- Slow cinematic → slow zoom keyframes, soft glow, anamorphic bars',
  ].join('\n');

  var SYSTEM_CREATE_EDIT = [
    'You are an expert Adobe After Effects editor. The user will describe an edit they want to create.',
    'You will also receive a JSON summary of their current AE project (compositions and footage/layers).',
    '',
    'Your job is to produce a COMPLETE edit as a single ExtendScript script.',
    '',
    'You must respond with:',
    '1. A plain-English description of the edit plan (3-5 sentences): what you will cut, how you will order it, effects.',
    '2. A fenced code block tagged ```extendscript containing the full edit script.',
    '',
    'Rules for the ExtendScript:',
    '- Work with app.project.activeItem (the open composition).',
    '- Use existing layers already in the comp — do not import new footage.',
    '- Set layer.inPoint and layer.outPoint to create cuts and pacing.',
    '- Reorder layers using layer.moveAfter() / layer.moveBefore() to sequence clips.',
    '- Add transitions: opacity fade-in/out keyframes between clips for cross-dissolves.',
    '- Apply color grade (Lumetri or Curves) matching the mood described by the user.',
    '- Create a text layer with app.project.activeItem.layers.addText() for titles if requested.',
    '- Enable motion blur on fast-cut sequences.',
    '- Wrap everything in app.beginUndoGroup("Claude: create edit") / app.endUndoGroup().',
    '- Never use alert() or confirm().',
    '- End with: JSON.stringify({ok:true, msg:"Edit created: <brief description>"})',
    '- If there are no layers or the comp is empty, return JSON.stringify({ok:false, msg:"No footage in comp to edit."})',
    '',
    'Pacing guidance:',
    '- "fast cuts" → each clip 0.5–1.5s, overlap transitions 0.1s',
    '- "slow/cinematic" → each clip 3–6s, slow-zoom keyframes on Scale property, 0.5s dissolves',
    '- "medium" → 1.5–3s clips, 0.2s dissolves',
    '',
    'Character/franchise edit guidance:',
    '- If the edit is for a specific character or franchise (e.g. "Tai Lung edit", "Spider-Man edit"):',
    '  • Look for layers whose names contain that character/franchise name (case-insensitive substring match)',
    '  • Build the edit primarily around those matching layers; treat others as B-roll or cut them short',
    '  • Match the character\'s energy: action character → fast cuts (0.5–1s), motion blur, chromatic aberration',
    '                                  emotional/dramatic → slow dissolves (0.5s), vignette, warm grade',
    '',
    'Audio-sync edit guidance:',
    '- If an audio layer is present (hasAudio:true, hasVideo:false in the project JSON):',
    '  • Set comp.duration to match the audio layer\'s duration',
    '  • Divide video layers into equal-length clips that together fill that total duration',
    '  • Sequence them end-to-end with 0.1s dissolve overlaps',
    '  • Enable motion blur on each video layer',
    '  • Do NOT trim or modify the audio layer — just set its startTime to 0',
  ].join('\n');

  var SYSTEM_ENHANCE_PROMPT = [
    'You are an Adobe After Effects creative director. The user has typed a rough brief for a video edit.',
    'Rewrite it as a detailed, specific AE edit brief in 3-5 sentences covering all of these aspects:',
    '- Mood and color palette (e.g. "crushed blacks, warm orange highlights, heavy vignette")',
    '- Pacing and cut style (e.g. "fast cuts every 0.5-1s in the first half, slow dissolves in the second half")',
    '- Transitions between clips (e.g. "opacity cross-dissolves, no hard cuts")',
    '- Effects to apply (pick from: glow, chromatic aberration, camera shake/wiggle, zoom pulse, film grain, glitch, VHS look, echo trail, lens flare, motion blur, cinematic bars, vignette, light leak, speed ramp)',
    '- Any title text, lower-thirds, or overlay text requested',
    'Return ONLY the enhanced brief as plain text. No preamble, no code, no bullet points — just flowing sentences.',
  ].join('\n');

  var SYSTEM_ANALYSE_EDIT = [
    'You are a creative director and After Effects expert reviewing an editor\'s current project.',
    'You will receive a JSON description of the active composition — its layers, durations, and structure.',
    'Give honest, specific, actionable creative feedback in 4-8 sentences covering:',
    '- Pacing: are clips too long, too short, or well-varied? Is the overall duration appropriate?',
    '- Structure: is there a clear beginning, middle, and end? Does the cut flow make sense?',
    '- Effects and color: based on layer names and comp structure, what grade or effects would elevate it?',
    '- One concrete "try this next" suggestion the editor could execute immediately.',
    '',
    'Speak directly in second person ("Your edit...", "You could try..."). Be specific about what you see in the data.',
    'Do NOT generate any ExtendScript code. Return plain conversational text only.',
  ].join('\n');

  var SYSTEM_TUTORIAL = [
    'You are an expert Adobe After Effects editor. You will receive a YouTube video transcript from an AE tutorial.',
    'Your job is to extract every concrete After Effects action described in the tutorial and convert each one into a',
    'valid ExtendScript snippet.',
    '',
    'Return ONLY a JSON array of step objects, no other text:',
    '[',
    '  { "step": 1, "description": "human-readable description", "jsx": "...ExtendScript code..." },',
    '  ...',
    ']',
    '',
    'Rules:',
    '- Each jsx string must be self-contained and runnable.',
    '- Wrap each in app.beginUndoGroup / app.endUndoGroup.',
    '- Skip steps that are non-technical (e.g. "subscribe to my channel").',
    '- If a step cannot be scripted (e.g. "import footage"), output jsx: "" and the description explains why.',
    '- Maximum 30 steps.',
  ].join('\n');

  // ── Helpers ───────────────────────────────────────────────────────────────

  function getApiKey() {
    return localStorage.getItem('cc_api_key') || '';
  }

  function makeClient() {
    var key = getApiKey();
    if (!key) throw new Error('No API key set. Please enter your Anthropic API key.');
    if (!Anthropic) throw new Error('@anthropic-ai/sdk not loaded. Run npm install inside ae-connector/.');
    return new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Send a natural-language command to Claude and get back
   * { explanation: string, jsx: string | null }
   */
  async function ask(userMessage, conversationHistory) {
    var client = makeClient();

    var messages = (conversationHistory || []).slice();
    messages.push({ role: 'user', content: userMessage });

    var response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_AE,
      messages: messages,
    });

    var raw = response.content[0].text;
    return extractExplanationAndJsx(raw);
  }

  /**
   * Parse a YouTube transcript into an ordered array of AE steps.
   * Returns [{ step, description, jsx }, ...]
   */
  async function parseTutorial(transcript) {
    var client = makeClient();

    var truncated = transcript.slice(0, 12000); // stay within token budget

    var response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_TUTORIAL,
      messages: [
        {
          role: 'user',
          content: 'Here is the tutorial transcript:\n\n' + truncated,
        },
      ],
    });

    var raw = response.content[0].text.trim();

    // Strip markdown fences if Claude wrapped the JSON
    raw = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/, '');

    var steps;
    try {
      steps = JSON.parse(raw);
    } catch (e) {
      throw new Error('Claude returned invalid JSON for tutorial steps: ' + e.message);
    }

    return steps;
  }

  /**
   * Analyse a YouTube video's style and generate ExtendScript to replicate it.
   *
   * @param {{ videoId, title, transcript, combinedText }} videoInfo
   * @returns {Promise<{ explanation: string, jsx: string|null }>}
   */
  async function matchEdit(videoInfo) {
    var client = makeClient();

    // Truncate to keep within token budget
    var context = videoInfo.combinedText.slice(0, 10000);

    var response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_MATCH_EDIT,
      messages: [
        {
          role: 'user',
          content: 'Analyse this video and match its editing style in my After Effects project:\n\n' + context,
        },
      ],
    });

    var raw = response.content[0].text;
    return extractExplanationAndJsx(raw);
  }

  /**
   * Generate a full edit based on a user prompt and the current project's layer info.
   *
   * @param {string} description     - User's natural-language edit brief
   * @param {string} projectInfoJson - JSON string from getProjectInfo() ExtendScript call
   * @returns {Promise<{ explanation: string, jsx: string|null }>}
   */
  async function createEdit(description, projectInfoJson) {
    var client = makeClient();

    var userContent = [
      'Edit brief: ' + description,
      '',
      'Current project info:',
      projectInfoJson,
    ].join('\n');

    var response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_CREATE_EDIT,
      messages: [
        { role: 'user', content: userContent },
      ],
    });

    var raw = response.content[0].text;
    return extractExplanationAndJsx(raw);
  }

  /** Shared helper: extract explanation text + fenced JSX block from Claude's response. */
  function extractExplanationAndJsx(raw) {
    var explanation = raw;
    var jsx = null;
    var fenceMatch = raw.match(/```(?:extendscript|jsx|javascript)\n([\s\S]*?)```/i);
    if (fenceMatch) {
      jsx = fenceMatch[1].trim();
      explanation = raw.replace(fenceMatch[0], '').trim();
    }
    return { explanation: explanation, jsx: jsx, raw: raw };
  }

  /**
   * Rewrite a rough edit brief into a detailed, specific AE brief.
   * Returns the enhanced text string (no JSX, just plain text).
   *
   * @param {string} text  - The user's rough prompt
   * @returns {Promise<string>}
   */
  async function enhancePrompt(text) {
    var client = makeClient();

    var response = await client.messages.create({
      model: MODEL,
      max_tokens: 512,
      system: SYSTEM_ENHANCE_PROMPT,
      messages: [
        { role: 'user', content: text },
      ],
    });

    return response.content[0].text.trim();
  }

  /**
   * Read the current comp state and give creative feedback (no code generated).
   *
   * @param {string} projectInfoJson  - JSON string from getProjectInfo()
   * @returns {Promise<string>}        - plain-text critique
   */
  async function analyseEdit(projectInfoJson) {
    var client = makeClient();

    var response = await client.messages.create({
      model: MODEL,
      max_tokens: 700,
      system: SYSTEM_ANALYSE_EDIT,
      messages: [
        {
          role: 'user',
          content: 'Here is my current After Effects composition:\n\n' + projectInfoJson,
        },
      ],
    });

    return response.content[0].text.trim();
  }

  global.ClaudeClient = {
    ask: ask,
    parseTutorial: parseTutorial,
    matchEdit: matchEdit,
    createEdit: createEdit,
    enhancePrompt: enhancePrompt,
    analyseEdit: analyseEdit,
    getApiKey: getApiKey,
  };

})(window);
