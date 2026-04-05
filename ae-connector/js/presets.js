/**
 * presets.js  —  Preset library manager
 *
 * Scans the ae-connector/presets/ folder for .ffx files and
 * exposes helpers to apply them via ExtendScript.
 */

'use strict';

(function (global) {

  var fs;
  var path;
  try {
    fs   = require('fs');
    path = require('path');
  } catch (e) {
    console.warn('[presets.js] Node fs/path not available:', e.message);
  }

  /**
   * Return a list of .ffx preset names found in the presets/ folder.
   * Returns [] if folder is unreadable.
   */
  function listPresets() {
    if (!fs) return [];
    try {
      var dir = path.join(__dirname, '..', 'presets');
      var files = fs.readdirSync(dir);
      return files
        .filter(function (f) { return f.toLowerCase().endsWith('.ffx'); })
        .map(function (f) { return path.basename(f, '.ffx'); });
    } catch (e) {
      return [];
    }
  }

  /**
   * Build ExtendScript that applies a named .ffx preset to the selected
   * (or first) layer in the active comp.
   *
   * @param {string} presetName  - filename without .ffx extension
   * @returns {string}           - ExtendScript code string
   */
  function buildApplyPresetJsx(presetName) {
    // The ExtendScript File() path must use forward slashes on Windows too
    var presetPath = getPresetsDir() + '/' + presetName + '.ffx';

    return [
      'app.beginUndoGroup("Claude: apply preset ' + presetName + '");',
      'var comp = app.project.activeItem;',
      'if (!comp || !(comp instanceof CompItem)) {',
      '  JSON.stringify({ok:false,msg:"No active composition."});',
      '} else {',
      '  var layer = comp.selectedLayers.length > 0 ? comp.selectedLayers[0] : comp.layers[1];',
      '  var presetFile = new File("' + presetPath + '");',
      '  if (!presetFile.exists) {',
      '    JSON.stringify({ok:false,msg:"Preset file not found: ' + presetName + '.ffx"});',
      '  } else {',
      '    layer.applyPreset(presetFile);',
      '    app.endUndoGroup();',
      '    JSON.stringify({ok:true,msg:"Applied preset: ' + presetName + '"});',
      '  }',
      '}',
    ].join('\n');
  }

  /**
   * Get the absolute path to the presets directory using CEP's extension path.
   */
  function getPresetsDir() {
    try {
      var info = csInterface.getExtensionInfo();
      var base = info.basePath || '';
      // Normalise Windows backslashes to forward slashes for ExtendScript
      return (base + '/presets').replace(/\\/g, '/');
    } catch (e) {
      return './presets';
    }
  }

  global.PresetsManager = {
    listPresets: listPresets,
    buildApplyPresetJsx: buildApplyPresetJsx,
  };

})(window);
