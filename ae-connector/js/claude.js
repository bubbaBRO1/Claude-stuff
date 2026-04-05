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
    var explanation = raw;
    var jsx = null;

    // Extract fenced extendscript block
    var fenceMatch = raw.match(/```(?:extendscript|jsx|javascript)\n([\s\S]*?)```/i);
    if (fenceMatch) {
      jsx = fenceMatch[1].trim();
      explanation = raw.replace(fenceMatch[0], '').trim();
    }

    return { explanation: explanation, jsx: jsx, raw: raw };
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

  global.ClaudeClient = { ask: ask, parseTutorial: parseTutorial, getApiKey: getApiKey };

})(window);
