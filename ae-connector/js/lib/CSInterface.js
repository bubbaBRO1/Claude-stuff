/**
 * CSInterface.js  —  Adobe CEP (Common Extensibility Platform) bridge library
 * Sourced from: https://github.com/Adobe-CEP/CEP-Resources
 * Version: 9.x  (trimmed to essentials for this extension)
 *
 * This file is the official Adobe-provided bridge between the HTML/JS panel
 * and the ExtendScript host application (After Effects).
 */

'use strict';

var csInterface = (function () {
  var PANEL_VERSION = '9.0';

  /** @private */
  function requiredParamsAreValid(requiredParams) {
    for (var i = 0; i < requiredParams.length; i++) {
      if (requiredParams[i] === null || requiredParams[i] === undefined) return false;
    }
    return true;
  }

  /**
   * Retrieve the runtime information about the current extension.
   */
  function getExtensionInfo() {
    return window.__adobe_cep__ ? JSON.parse(window.__adobe_cep__.getExtensionInfo()) : {};
  }

  /**
   * Call an ExtendScript function defined in the host script.
   *
   * @param {string}   script   - The ExtendScript code to evaluate.
   * @param {function} callback - Called with the return value as a string.
   */
  function evalScript(script, callback) {
    if (!window.__adobe_cep__) {
      console.warn('[CSInterface] __adobe_cep__ not found — running outside AE?');
      if (typeof callback === 'function') callback('EvalScript error: not inside AE');
      return;
    }
    if (typeof callback !== 'function') {
      callback = function () {};
    }
    window.__adobe_cep__.evalScript(script, callback);
  }

  /**
   * Open a URL in the default system browser.
   */
  function openURLInDefaultBrowser(url) {
    if (window.__adobe_cep__) {
      window.__adobe_cep__.openURLInDefaultBrowser(url);
    } else {
      window.open(url, '_blank');
    }
  }

  /**
   * Register a callback for events dispatched from ExtendScript.
   * @param {string}   type     - Event type string.
   * @param {function} listener - Callback(event).
   */
  function addEventListener(type, listener) {
    if (window.__adobe_cep__) {
      window.__adobe_cep__.addEventListener(type, function (event) {
        listener(JSON.parse(event));
      });
    }
  }

  /**
   * Get the path to the extension root.
   */
  function getSystemPath(pathType) {
    if (window.__adobe_cep__) {
      return window.__adobe_cep__.getSystemPath(pathType);
    }
    return '';
  }

  /**
   * Convenience: get the extension's own directory path.
   */
  function getExtensionDir() {
    return getExtensionInfo().basePath || '';
  }

  return {
    evalScript: evalScript,
    openURLInDefaultBrowser: openURLInDefaultBrowser,
    addEventListener: addEventListener,
    getSystemPath: getSystemPath,
    getExtensionDir: getExtensionDir,
    getExtensionInfo: getExtensionInfo,
  };
})();
