/**
 * main.js  —  Core panel logic for the Claude AE Connector
 *
 * Wires together the chat UI, Claude API, YouTube transcript fetcher,
 * preset manager, and the ExtendScript bridge (CSInterface).
 */

'use strict';

(function () {

  // ── DOM refs ────────────────────────────────────────────────────────────
  var apiKeySection   = document.getElementById('apiKeySection');
  var chatPanel       = document.getElementById('chatPanel');
  var apiKeyInput     = document.getElementById('apiKeyInput');
  var saveKeyBtn      = document.getElementById('saveKeyBtn');
  var settingsBtn     = document.getElementById('settingsBtn');
  var messagesEl      = document.getElementById('messages');
  var userInput       = document.getElementById('userInput');
  var sendBtn         = document.getElementById('sendBtn');
  var statusDot       = document.getElementById('statusDot');
  var statusText      = document.getElementById('statusText');
  var tutorialOverlay = document.getElementById('tutorialOverlay');
  var tutorialProgressEl = document.getElementById('tutorialProgress');
  var tutorialStepEl  = document.getElementById('tutorialStep');
  var cancelTutorialBtn = document.getElementById('cancelTutorial');
  var chips           = document.querySelectorAll('.chip');

  // ── State ───────────────────────────────────────────────────────────────
  var conversationHistory = [];
  var tutorialCancelled   = false;
  var busy                = false;

  // ── Init ────────────────────────────────────────────────────────────────
  function init() {
    var savedKey = localStorage.getItem('cc_api_key');
    if (savedKey) {
      showChatPanel();
    } else {
      showApiKeySection();
    }

    wireEvents();
  }

  function showApiKeySection() {
    apiKeySection.classList.remove('hidden');
    chatPanel.classList.add('hidden');
  }

  function showChatPanel() {
    apiKeySection.classList.add('hidden');
    chatPanel.classList.remove('hidden');
    userInput.focus();
  }

  // ── Event wiring ─────────────────────────────────────────────────────────
  function wireEvents() {
    saveKeyBtn.addEventListener('click', onSaveKey);
    apiKeyInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') onSaveKey();
    });

    settingsBtn.addEventListener('click', function () {
      localStorage.removeItem('cc_api_key');
      conversationHistory = [];
      showApiKeySection();
    });

    sendBtn.addEventListener('click', onSend);
    userInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    });

    document.getElementById('enhanceBtn').addEventListener('click', function () {
      runEnhancePrompt();
    });

    // Voice mic button (Web Speech API)
    var micBtn = document.getElementById('micBtn');
    if (micBtn) {
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        var recognition = new SpeechRecognition();
        recognition.continuous    = false;
        recognition.interimResults = true;
        recognition.lang          = 'en-US';

        recognition.onresult = function (e) {
          var transcript = Array.from(e.results)
            .map(function (r) { return r[0].transcript; }).join('');
          userInput.value = transcript;
          if (e.results[e.results.length - 1].isFinal) {
            micBtn.classList.remove('mic-active');
          }
        };
        recognition.onerror = function (e) {
          micBtn.classList.remove('mic-active');
          if (e.error !== 'aborted') appendMessage('bot', 'Mic error: ' + e.error);
        };
        recognition.onend = function () { micBtn.classList.remove('mic-active'); };

        micBtn.addEventListener('click', function () {
          if (busy) return;
          if (micBtn.classList.contains('mic-active')) {
            recognition.stop();
          } else {
            micBtn.classList.add('mic-active');
            userInput.value = '';
            recognition.start();
          }
        });
      } else {
        micBtn.disabled = true;
        micBtn.title = 'Speech recognition not supported in this browser';
      }
    }

    // Preset settings modal
    var presetsBtn  = document.getElementById('presetsBtn');
    var presetModal = document.getElementById('presetModal');
    var closePresetModal = document.getElementById('closePresetModal');
    var addFolderBtn = document.getElementById('addFolderBtn');
    var folderPathInput = document.getElementById('folderPathInput');

    if (presetsBtn && presetModal) {
      presetsBtn.addEventListener('click', function () {
        renderFolderList();
        presetModal.classList.toggle('hidden');
      });
      closePresetModal.addEventListener('click', function () {
        presetModal.classList.add('hidden');
      });
      addFolderBtn.addEventListener('click', function () {
        var p = folderPathInput.value.trim();
        if (!p) return;
        PresetsManager.addFolder(p);
        folderPathInput.value = '';
        renderFolderList();
      });
    }

    function renderFolderList() {
      var list = document.getElementById('folderList');
      if (!list) return;
      var folders = PresetsManager.getFolders();
      list.innerHTML = '';
      if (folders.length === 0) {
        list.innerHTML = '<li class="folder-empty">No preset folders added.</li>';
        return;
      }
      folders.forEach(function (f) {
        var li = document.createElement('li');
        li.className = 'folder-item';
        var span = document.createElement('span');
        span.className = 'folder-path';
        span.textContent = f;
        var btn = document.createElement('button');
        btn.className = 'folder-remove';
        btn.textContent = '×';
        btn.addEventListener('click', function () {
          PresetsManager.removeFolder(f);
          renderFolderList();
        });
        li.appendChild(span);
        li.appendChild(btn);
        list.appendChild(li);
      });
      // Show catalog count
      var count = PresetsManager.getCatalog().length;
      var info = document.getElementById('presetCount');
      if (info) info.textContent = count + ' presets found across all folders';
    }

    // Quick-action chips
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        var fill = chip.getAttribute('data-fill');
        if (fill !== null) {
          userInput.value = fill;
          userInput.focus();
          userInput.selectionStart = userInput.selectionEnd = userInput.value.length;
        }
      });
    });

    // "Make edit" chip — prefill the prompt
    var makeEditChip = document.getElementById('makeEditChip');
    if (makeEditChip) {
      makeEditChip.addEventListener('click', function () {
        userInput.value = 'make me an edit ';
        userInput.focus();
        userInput.selectionStart = userInput.selectionEnd = userInput.value.length;
      });
    }

    // Creator style chips — call ExtendScript directly (instant, no API call)
    var styleChips = document.querySelectorAll('.chip-style');
    styleChips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        if (busy) return;
        var fn = chip.getAttribute('data-style');
        var styleName = chip.textContent;
        setBusy(true, 'applying');
        appendMessage('user', 'Apply ' + styleName + ' style');
        setStatus('applying', 'Applying ' + styleName + ' style...');

        csInterface.evalScript(fn + '()', function (res) {
          try {
            var parsed = JSON.parse(res);
            if (parsed.ok) {
              appendMessage('bot', parsed.msg);
              setStatus('idle', 'Done!');
            } else {
              appendMessage('bot', 'Error: ' + parsed.msg);
              setStatus('error', parsed.msg);
            }
          } catch (e) {
            appendMessage('bot', 'Script error: ' + res);
            setStatus('error', 'Script error');
          }
          setBusy(false);
        });
      });
    });

    // Hint clicks inside bot bubbles (delegated)
    messagesEl.addEventListener('click', function (e) {
      if (e.target.classList.contains('hint')) {
        userInput.value = e.target.textContent;
        userInput.focus();
      }
    });

    cancelTutorialBtn.addEventListener('click', function () {
      tutorialCancelled = true;
    });
  }

  // ── Key save ──────────────────────────────────────────────────────────────
  function onSaveKey() {
    var key = apiKeyInput.value.trim();
    if (!key.startsWith('sk-')) {
      apiKeyInput.style.borderColor = 'var(--danger)';
      return;
    }
    localStorage.setItem('cc_api_key', key);
    apiKeyInput.style.borderColor = '';
    showChatPanel();
  }

  // ── Detection helpers (pure, no side-effects) ────────────────────────────

  function isMatchEditCommand(text) {
    return /^(match|copy style|replicate|mimic)\b/i.test(text.trim());
  }

  function detectCharacterEdit(text) {
    var m = text.match(/\bmake\s+(?:me\s+)?(?:a\s+|an\s+)?(.+?)\s+edit\b/i);
    if (!m) return null;
    var subject = m[1].trim();
    if (/^(me|a|an|the|my|your|some|full|complete|quick|fast|slow|cinematic|cool|good|great|nice|awesome|epic|sick|fire|dope|short|long|clean|smooth|dark|moody|chill|hype|tiling?|split|grid|audio|music)$/i.test(subject)) return null;
    return subject;
  }

  function isCreateEditCommand(text) {
    return /\b(make\s+(me\s+)?(a\s+|an\s+)?edit|create\s+(an?\s+)?edit|build\s+(an?\s+)?edit)\b/i.test(text);
  }

  function isAudioSyncCommand(text) {
    return /\b(sync\s+to\s+(the\s+)?audio|use\s+(the\s+)?(audio|music|song|track)|make.*edit.*with\s+(the\s+)?(audio|music|song)|audio.*edit|music.*edit|to\s+the\s+beat)\b/i.test(text);
  }

  function isTilingEditCommand(text) {
    return /\b(tiling?\s+edit|split\s+screen|multi.?screen|grid\s+edit|\d+x\d+\s+(layout|edit|grid))\b/i.test(text);
  }

  function isRenderCommand(text) {
    return /^\s*(auto\s+)?render\b/i.test(text.trim()) ||
      /\b(add to render queue|start render|render (this|the|my) (comp|edit|project))\b/i.test(text);
  }

  function isAnalysisCommand(text) {
    return /\b(what do you think|analyse|analyze|critique|review|feedback|thoughts on)\b.*\b(edit|comp|project|timeline|cut)\b/i.test(text) ||
      /\bhow('?s| does| is)?\s+(my|the)\s+(edit|comp|cut|project)\b/i.test(text);
  }

  /** Detect "apply preset [name]" */
  function detectPresetCommand(text) {
    var m = text.match(/\bapply\s+(preset\s+)?(.+?)\s*(?:preset\s*)?(?:to\s+|$)/i);
    if (!m) return null;
    var name = m[2].trim();
    if (/^(style|effect|filter|grade|look)$/i.test(name)) return null;
    return name;
  }

  function extractFirstUrl(text) {
    var m = text.match(/https?:\/\/\S+/);
    return m ? m[0] : null;
  }

  // ── Send handler ──────────────────────────────────────────────────────────
  async function onSend() {
    if (busy) return;
    var text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    userInput.style.height = '';
    appendMessage('user', text);

    var url = extractFirstUrl(text);

    // 0. Render command — check first (single word, high priority)
    if (isRenderCommand(text)) {
      await runRenderCommand();
      return;
    }

    // 1. "match <youtube-url>"  →  Match Edit mode
    if (isMatchEditCommand(text) && url && YouTubeClient.isYouTubeUrl(url)) {
      await runMatchEditMode(url);
      return;
    }

    // 2. YouTube URL alone  →  Tutorial Follow mode
    if (url && YouTubeClient.isYouTubeUrl(url)) {
      await runTutorialMode(url);
      return;
    }

    // 3. Analysis request
    if (isAnalysisCommand(text)) {
      await runAnalysisMode();
      return;
    }

    // 4. Tiling edit
    if (isTilingEditCommand(text)) {
      await runTilingEditMode(text);
      return;
    }

    // 5. Audio-sync edit
    if (isAudioSyncCommand(text)) {
      await runAudioSyncEditMode(text);
      return;
    }

    // 7. Character edit (e.g. "make a Tai Lung edit")
    var character = detectCharacterEdit(text);
    if (character) {
      await runCharacterEditMode(character, text);
      return;
    }

    // 8. Generic create edit
    if (isCreateEditCommand(text)) {
      await runCreateEditMode(text);
      return;
    }

    // 9. Fallback — normal chat command
    await runChatCommand(text);
  }

  // ── Normal chat command ───────────────────────────────────────────────────
  async function runChatCommand(text) {
    setBusy(true, 'thinking');

    var typingId = appendTyping();

    var result;
    try {
      result = await ClaudeClient.ask(text, conversationHistory);
    } catch (e) {
      removeMessage(typingId);
      appendMessage('bot', 'Error talking to Claude: ' + e.message);
      setBusy(false);
      return;
    }

    // Update conversation history
    conversationHistory.push({ role: 'user', content: text });
    conversationHistory.push({ role: 'assistant', content: result.raw });

    removeMessage(typingId);

    if (!result.jsx) {
      // Pure text response (no AE action)
      appendMessage('bot', result.explanation);
      setBusy(false);
      return;
    }

    // Show explanation + code preview
    appendBotWithCode(result.explanation, result.jsx);

    // Apply in AE
    setStatus('applying', 'Applying in After Effects...');
    csInterface.evalScript(result.jsx, function (res) {
      try {
        var parsed = JSON.parse(res);
        if (parsed.ok) {
          setStatus('idle', 'Done: ' + parsed.msg);
        } else {
          setStatus('error', 'AE error: ' + parsed.msg);
          appendMessage('bot', 'After Effects returned an error: ' + parsed.msg);
        }
      } catch (e) {
        // evalScript returned a non-JSON string (e.g. an error)
        setStatus('error', 'AE script error');
        appendMessage('bot', 'Script error from After Effects: ' + res);
      }
      setBusy(false);
    });
  }

  // ── Tutorial mode ─────────────────────────────────────────────────────────
  async function runTutorialMode(url) {
    setBusy(true, 'thinking');
    tutorialCancelled = false;
    tutorialOverlay.classList.remove('hidden');
    tutorialStepEl.textContent = 'Fetching transcript from YouTube...';
    tutorialProgressEl.textContent = '';

    var transcript;
    try {
      var result = await YouTubeClient.getTranscript(url);
      transcript = result.text;
    } catch (e) {
      tutorialOverlay.classList.add('hidden');
      appendMessage('bot', 'Could not fetch transcript: ' + e.message);
      setBusy(false);
      return;
    }

    if (tutorialCancelled) { finishTutorial(); return; }

    tutorialStepEl.textContent = 'Asking Claude to analyse tutorial steps...';

    var steps;
    try {
      steps = await ClaudeClient.parseTutorial(transcript);
    } catch (e) {
      tutorialOverlay.classList.add('hidden');
      appendMessage('bot', 'Could not parse tutorial: ' + e.message);
      setBusy(false);
      return;
    }

    if (tutorialCancelled) { finishTutorial(); return; }

    var scriptableSteps = steps.filter(function (s) { return s.jsx && s.jsx.trim(); });
    appendMessage('bot',
      'Found ' + steps.length + ' steps in the tutorial (' +
      scriptableSteps.length + ' scriptable). Applying now...'
    );

    // Progress bar
    var barWrap = document.createElement('div');
    barWrap.className = 'progress-bar-wrap';
    var bar = document.createElement('div');
    bar.className = 'progress-bar';
    bar.style.width = '0%';
    barWrap.appendChild(bar);
    tutorialOverlay.querySelector('.tutorial-box').insertBefore(barWrap, cancelTutorialBtn);

    for (var i = 0; i < steps.length; i++) {
      if (tutorialCancelled) break;

      var step = steps[i];
      var pct = Math.round(((i + 1) / steps.length) * 100);
      bar.style.width = pct + '%';
      tutorialProgressEl.textContent = 'Step ' + (i + 1) + ' of ' + steps.length + ' (' + pct + '%)';
      tutorialStepEl.textContent = step.description;

      if (!step.jsx || !step.jsx.trim()) continue;

      setStatus('applying', 'Step ' + (i + 1) + ': ' + step.description);

      // Wrap in a Promise so we can await the evalScript callback
      await new Promise(function (resolve) {
        csInterface.evalScript(step.jsx, function (res) {
          try {
            var parsed = JSON.parse(res);
            if (!parsed.ok) {
              appendMessage('bot', 'Step ' + step.step + ' warning: ' + parsed.msg);
            }
          } catch (e) { /* ignore non-JSON responses */ }
          resolve();
        });
      });

      // Small delay between steps so AE can process
      await sleep(300);
    }

    finishTutorial();

    var doneMsg = tutorialCancelled
      ? 'Tutorial cancelled after ' + i + ' of ' + steps.length + ' steps.'
      : 'Tutorial complete! All ' + scriptableSteps.length + ' scriptable steps applied.';
    appendMessage('bot', doneMsg);
  }

  function finishTutorial() {
    tutorialOverlay.classList.add('hidden');
    setBusy(false);
    setStatus('idle', 'Ready');
  }

  // ── Match Edit mode ───────────────────────────────────────────────────────
  async function runMatchEditMode(url) {
    setBusy(true, 'thinking');
    setStatus('thinking', 'Fetching video info...');

    var videoInfo;
    try {
      videoInfo = await YouTubeClient.getVideoInfo(url);
    } catch (e) {
      appendMessage('bot', 'Could not fetch video info: ' + e.message);
      setBusy(false);
      return;
    }

    var title = videoInfo.title || url;
    setStatus('thinking', 'Analysing style of "' + title + '"...');
    var typingId = appendTyping();

    var result;
    try {
      result = await ClaudeClient.matchEdit(videoInfo);
    } catch (e) {
      removeMessage(typingId);
      appendMessage('bot', 'Error analysing style: ' + e.message);
      setBusy(false);
      return;
    }

    removeMessage(typingId);

    if (!result.jsx) {
      appendMessage('bot', result.explanation);
      setBusy(false);
      return;
    }

    appendBotWithCode(result.explanation, result.jsx);
    setStatus('applying', 'Applying matched style...');

    csInterface.evalScript(result.jsx, function (res) {
      try {
        var parsed = JSON.parse(res);
        setStatus(parsed.ok ? 'idle' : 'error', parsed.ok ? 'Style matched!' : 'AE error: ' + parsed.msg);
        if (!parsed.ok) appendMessage('bot', 'After Effects error: ' + parsed.msg);
      } catch (e) {
        setStatus('error', 'Script error');
        appendMessage('bot', 'Script error: ' + res);
      }
      setBusy(false);
    });
  }

  // ── Create Edit mode ──────────────────────────────────────────────────────
  async function runCreateEditMode(description) {
    setBusy(true, 'thinking');
    setStatus('thinking', 'Reading project...');

    // Step 1: get project/layer info from AE
    var projectInfoJson = await new Promise(function (resolve) {
      csInterface.evalScript('getProjectInfo()', function (res) {
        resolve(res || '{}');
      });
    });

    // Check for empty comp early
    try {
      var info = JSON.parse(projectInfoJson);
      if (!info.ok) {
        appendMessage('bot', 'Cannot create edit: ' + (info.msg || 'No active composition.'));
        setBusy(false);
        return;
      }
      if (info.numLayers === 0) {
        appendMessage('bot', 'Your composition has no layers. Add some footage first, then ask me to make an edit!');
        setBusy(false);
        return;
      }
    } catch (e) { /* proceed anyway */ }

    setStatus('thinking', 'Planning your edit...');
    var typingId = appendTyping();

    var result;
    try {
      result = await ClaudeClient.createEdit(description, projectInfoJson);
    } catch (e) {
      removeMessage(typingId);
      appendMessage('bot', 'Error planning edit: ' + e.message);
      setBusy(false);
      return;
    }

    removeMessage(typingId);

    if (!result.jsx) {
      appendMessage('bot', result.explanation);
      setBusy(false);
      return;
    }

    appendBotWithCode(result.explanation, result.jsx);
    setStatus('applying', 'Building your edit in After Effects...');

    csInterface.evalScript(result.jsx, function (res) {
      try {
        var parsed = JSON.parse(res);
        setStatus(parsed.ok ? 'idle' : 'error', parsed.ok ? 'Edit created!' : 'AE error: ' + parsed.msg);
        if (parsed.ok) {
          appendMessage('bot', 'Edit done! ' + parsed.msg);
        } else {
          appendMessage('bot', 'After Effects error: ' + parsed.msg);
        }
      } catch (e) {
        setStatus('error', 'Script error');
        appendMessage('bot', 'Script error: ' + res);
      }
      setBusy(false);
    });
  }

  // ── Character Edit mode ───────────────────────────────────────────────────
  async function runCharacterEditMode(character, originalText) {
    setBusy(true, 'thinking');
    setStatus('thinking', 'Finding ' + character + ' clips...');

    var projectInfoJson = await new Promise(function (resolve) {
      csInterface.evalScript('getProjectInfo()', function (res) { resolve(res || '{}'); });
    });

    var info;
    try { info = JSON.parse(projectInfoJson); } catch (e) { info = {}; }

    if (!info.ok) {
      appendMessage('bot', 'Cannot create edit: ' + (info.msg || 'No active composition.'));
      setBusy(false);
      return;
    }
    if (!info.numLayers) {
      appendMessage('bot', 'Your composition has no layers. Add footage first!');
      setBusy(false);
      return;
    }

    // Filter layers whose name contains the character name
    var charLower = character.toLowerCase();
    var matchingLayers = (info.layers || []).filter(function (l) {
      return l.name.toLowerCase().indexOf(charLower) !== -1;
    });

    var description = originalText;
    if (matchingLayers.length > 0) {
      description += '\n\nFocus primarily on these layers (matching "' + character + '"): ' +
        matchingLayers.map(function (l) { return '"' + l.name + '"'; }).join(', ') + '.';
    } else {
      description += '\n\nNote: no layers found with "' + character + '" in their name — use all available layers and make the edit feel suited to a "' + character + '" theme.';
    }

    var typingId = appendTyping();
    setStatus('thinking', 'Building ' + character + ' edit...');

    var result;
    try {
      result = await ClaudeClient.createEdit(description, projectInfoJson);
    } catch (e) {
      removeMessage(typingId);
      appendMessage('bot', 'Error planning edit: ' + e.message);
      setBusy(false);
      return;
    }

    removeMessage(typingId);

    if (!result.jsx) {
      appendMessage('bot', result.explanation);
      setBusy(false);
      return;
    }

    appendBotWithCode(result.explanation, result.jsx);
    setStatus('applying', 'Building ' + character + ' edit in After Effects...');

    csInterface.evalScript(result.jsx, function (res) {
      try {
        var parsed = JSON.parse(res);
        setStatus(parsed.ok ? 'idle' : 'error', parsed.ok ? character + ' edit done!' : 'AE error: ' + parsed.msg);
        if (parsed.ok) appendMessage('bot', parsed.msg);
        else appendMessage('bot', 'After Effects error: ' + parsed.msg);
      } catch (e) {
        setStatus('error', 'Script error');
        appendMessage('bot', 'Script error: ' + res);
      }
      setBusy(false);
    });
  }

  // ── Audio-Sync Edit mode ──────────────────────────────────────────────────
  async function runAudioSyncEditMode(text) {
    setBusy(true, 'thinking');
    setStatus('thinking', 'Reading project audio and video...');

    var projectInfoJson = await new Promise(function (resolve) {
      csInterface.evalScript('getProjectInfo()', function (res) { resolve(res || '{}'); });
    });

    var info;
    try { info = JSON.parse(projectInfoJson); } catch (e) { info = {}; }

    if (!info.ok) {
      appendMessage('bot', 'Cannot create edit: ' + (info.msg || 'No active composition.'));
      setBusy(false);
      return;
    }

    var layers = info.layers || [];
    var audioLayers = layers.filter(function (l) { return l.hasAudio && !l.hasVideo; });
    var videoLayers = layers.filter(function (l) { return l.hasVideo; });

    if (audioLayers.length === 0) {
      appendMessage('bot', 'No audio-only layer found in your comp. Add a music/audio layer first, then try again.');
      setBusy(false);
      return;
    }
    if (videoLayers.length === 0) {
      appendMessage('bot', 'No video layers found in your comp. Add some video footage first, then try again.');
      setBusy(false);
      return;
    }

    var audioInfo = audioLayers[0];
    var description = text +
      '\n\nAudio layer: "' + audioInfo.name + '" — duration: ' + audioInfo.duration + 's.' +
      '\nVideo layers available: ' + videoLayers.map(function (l) { return '"' + l.name + '" (' + l.duration + 's)'; }).join(', ') + '.' +
      '\nSet the comp duration to match the audio and sequence video clips to fill it.';

    var typingId = appendTyping();
    setStatus('thinking', 'Syncing edit to audio...');

    var result;
    try {
      result = await ClaudeClient.createEdit(description, projectInfoJson);
    } catch (e) {
      removeMessage(typingId);
      appendMessage('bot', 'Error planning edit: ' + e.message);
      setBusy(false);
      return;
    }

    removeMessage(typingId);

    if (!result.jsx) {
      appendMessage('bot', result.explanation);
      setBusy(false);
      return;
    }

    appendBotWithCode(result.explanation, result.jsx);
    setStatus('applying', 'Building audio-synced edit...');

    csInterface.evalScript(result.jsx, function (res) {
      try {
        var parsed = JSON.parse(res);
        setStatus(parsed.ok ? 'idle' : 'error', parsed.ok ? 'Audio-synced edit done!' : 'AE error: ' + parsed.msg);
        if (parsed.ok) appendMessage('bot', parsed.msg);
        else appendMessage('bot', 'After Effects error: ' + parsed.msg);
      } catch (e) {
        setStatus('error', 'Script error');
        appendMessage('bot', 'Script error: ' + res);
      }
      setBusy(false);
    });
  }

  // ── Render command ────────────────────────────────────────────────────────
  async function runRenderCommand() {
    setBusy(true, 'applying');
    setStatus('applying', 'Rendering...');
    appendMessage('bot', 'Adding your comp to the render queue and starting render. After Effects will be busy until it finishes...');

    await new Promise(function (resolve) {
      csInterface.evalScript('addToRenderQueue()', function (res) {
        try {
          var parsed = JSON.parse(res);
          if (parsed.ok) {
            appendMessage('bot', 'Render complete! ' + parsed.msg);
            setStatus('idle', 'Render done');
          } else {
            appendMessage('bot', 'Render error: ' + parsed.msg);
            setStatus('error', parsed.msg);
          }
        } catch (e) {
          appendMessage('bot', 'Render script error: ' + res);
          setStatus('error', 'Script error');
        }
        resolve();
      });
    });

    setBusy(false);
  }

  // ── Analysis mode ─────────────────────────────────────────────────────────
  async function runAnalysisMode() {
    setBusy(true, 'thinking');
    setStatus('thinking', 'Reading your comp...');

    var projectInfoJson = await new Promise(function (resolve) {
      csInterface.evalScript('getProjectInfo()', function (res) { resolve(res || '{}'); });
    });

    var info;
    try { info = JSON.parse(projectInfoJson); } catch (e) { info = {}; }

    if (!info.ok) {
      appendMessage('bot', 'Cannot analyse: ' + (info.msg || 'No active composition open.'));
      setBusy(false);
      return;
    }

    var typingId = appendTyping();
    setStatus('thinking', 'Forming creative opinion...');

    var feedback;
    try {
      feedback = await ClaudeClient.analyseEdit(projectInfoJson);
    } catch (e) {
      removeMessage(typingId);
      appendMessage('bot', 'Error getting feedback: ' + e.message);
      setBusy(false);
      return;
    }

    removeMessage(typingId);
    appendMessage('bot', feedback);
    setStatus('idle', 'Analysis complete');
    setBusy(false);
  }

  // ── Tiling Edit mode ──────────────────────────────────────────────────────
  async function runTilingEditMode(text) {
    setBusy(true, 'thinking');
    setStatus('thinking', 'Reading project...');

    var projectInfoJson = await new Promise(function (resolve) {
      csInterface.evalScript('getProjectInfo()', function (res) { resolve(res || '{}'); });
    });

    var info;
    try { info = JSON.parse(projectInfoJson); } catch (e) { info = {}; }

    if (!info.ok || !info.numLayers) {
      appendMessage('bot', 'No footage layers found. Add some video layers first!');
      setBusy(false);
      return;
    }

    // Parse grid size from text if specified (e.g. "2x2", "3x2")
    var cols = 2, rows = 2;
    var gridMatch = text.match(/(\d+)\s*x\s*(\d+)/i);
    if (gridMatch) { cols = parseInt(gridMatch[1]); rows = parseInt(gridMatch[2]); }

    var description = text +
      '\n\nApply a ' + cols + 'x' + rows + ' tiling grid layout.' +
      '\nCall buildTilingLayout(' + cols + ', ' + rows + ') to arrange layers in the grid.' +
      '\nCall addCameraShake() on each video layer for energy.' +
      '\nAdd motion blur to all video layers.';

    var typingId = appendTyping();
    setStatus('thinking', 'Planning tiling layout...');

    var result;
    try {
      result = await ClaudeClient.createEdit(description, projectInfoJson);
    } catch (e) {
      removeMessage(typingId);
      appendMessage('bot', 'Error planning tiling edit: ' + e.message);
      setBusy(false);
      return;
    }

    removeMessage(typingId);

    if (!result.jsx) {
      appendMessage('bot', result.explanation);
      setBusy(false);
      return;
    }

    appendBotWithCode(result.explanation, result.jsx);
    setStatus('applying', 'Building tiling layout in After Effects...');

    csInterface.evalScript(result.jsx, function (res) {
      try {
        var parsed = JSON.parse(res);
        setStatus(parsed.ok ? 'idle' : 'error', parsed.ok ? 'Tiling edit done!' : 'AE error: ' + parsed.msg);
        if (parsed.ok) appendMessage('bot', parsed.msg);
        else appendMessage('bot', 'After Effects error: ' + parsed.msg);
      } catch (e) {
        setStatus('error', 'Script error');
        appendMessage('bot', 'Script error: ' + res);
      }
      setBusy(false);
    });
  }

  // ── Prompt Enhancer ───────────────────────────────────────────────────────
  async function runEnhancePrompt() {
    var text = userInput.value.trim();
    if (!text || busy) return;

    setBusy(true, 'thinking');
    setStatus('thinking', 'Enhancing prompt...');

    var enhanced;
    try {
      enhanced = await ClaudeClient.enhancePrompt(text);
    } catch (e) {
      appendMessage('bot', 'Could not enhance prompt: ' + e.message);
      setBusy(false);
      return;
    }

    userInput.value = enhanced;
    // Auto-resize textarea to show full enhanced text
    userInput.style.height = 'auto';
    userInput.style.height = Math.min(userInput.scrollHeight, 160) + 'px';

    setStatus('idle', 'Prompt enhanced — review and send!');
    setBusy(false);
    userInput.focus();
  }

  // ── UI helpers ────────────────────────────────────────────────────────────
  function appendMessage(role, text) {
    var id = 'msg-' + Date.now() + '-' + Math.random();
    var div = document.createElement('div');
    div.className = 'msg ' + role;
    div.id = id;
    var bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.textContent = text;
    div.appendChild(bubble);
    messagesEl.appendChild(div);
    scrollToBottom();
    return id;
  }

  function appendBotWithCode(explanation, jsx) {
    var id = 'msg-' + Date.now() + '-' + Math.random();
    var div = document.createElement('div');
    div.className = 'msg bot';
    div.id = id;
    var bubble = document.createElement('div');
    bubble.className = 'bubble';

    if (explanation) {
      var txt = document.createElement('div');
      txt.textContent = explanation;
      bubble.appendChild(txt);
    }

    var code = document.createElement('div');
    code.className = 'ae-code';
    // Show first 300 chars of script
    code.textContent = jsx.length > 300 ? jsx.slice(0, 300) + '\n...' : jsx;
    bubble.appendChild(code);

    div.appendChild(bubble);
    messagesEl.appendChild(div);
    scrollToBottom();
    return id;
  }

  function appendTyping() {
    var id = 'msg-typing-' + Date.now();
    var div = document.createElement('div');
    div.className = 'msg bot';
    div.id = id;
    var bubble = document.createElement('div');
    bubble.className = 'bubble typing-dots';
    bubble.innerHTML = '<span></span><span></span><span></span>';
    div.appendChild(bubble);
    messagesEl.appendChild(div);
    scrollToBottom();
    return id;
  }

  function removeMessage(id) {
    var el = document.getElementById(id);
    if (el) el.remove();
  }

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function setStatus(state, text) {
    statusDot.className = 'dot dot-' + state;
    statusText.textContent = text;
  }

  function setBusy(isBusy, statusState) {
    busy = isBusy;
    sendBtn.disabled = isBusy;
    var enhBtn = document.getElementById('enhanceBtn');
    if (enhBtn) enhBtn.disabled = isBusy;
    if (isBusy) {
      setStatus(statusState || 'thinking', statusState === 'applying' ? 'Applying...' : 'Thinking...');
    } else {
      setStatus('idle', 'Ready');
    }
  }

  function sleep(ms) {
    return new Promise(function (r) { setTimeout(r, ms); });
  }

  // ── Boot ──────────────────────────────────────────────────────────────────
  document.addEventListener('DOMContentLoaded', init);

})();
