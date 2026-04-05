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
    'Known creator styles:',
    '- xrh4: heavy vignette, strong desaturation of shadows, glitch displacement on text, chromatic aberration',
    '- 24kjohn: smooth slow-zoom keyframes on selected layer, warm orange LUT-style color grade (lift shadows warm, push mids orange), black cinematic bars (top/bottom solid layers)',
    '- gulovsky: neon accent colors (cyan/magenta highlights), dark crushed blacks via Curves, light leak solid with Screen blend mode, motion blur enabled',
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

  global.ClaudeClient = {
    ask: ask,
    parseTutorial: parseTutorial,
    matchEdit: matchEdit,
    createEdit: createEdit,
    getApiKey: getApiKey,
  };

})(window);
