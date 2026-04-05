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

    // Quick-action chips
    chips.forEach(function (chip) {
      chip.addEventListener('click', function () {
        userInput.value = chip.getAttribute('data-fill');
        userInput.focus();
        // If "Follow tutorial…" chip, position caret at end
        userInput.selectionStart = userInput.selectionEnd = userInput.value.length;
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

  // ── Send handler ──────────────────────────────────────────────────────────
  async function onSend() {
    if (busy) return;
    var text = userInput.value.trim();
    if (!text) return;

    userInput.value = '';
    appendMessage('user', text);

    // Check if the message contains a YouTube URL → tutorial mode
    if (YouTubeClient.isYouTubeUrl(text)) {
      var urlMatch = text.match(/https?:\/\/\S+/);
      if (urlMatch) {
        await runTutorialMode(urlMatch[0]);
        return;
      }
    }

    // Normal chat command
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
