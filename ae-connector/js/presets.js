/**
 * presets.js  —  Preset library manager
 *
 * Scans one or more folders (including sub-folders) for .ffx preset files.
 * Folder paths are persisted in localStorage under 'cc_preset_folders'.
 * The bundled ae-connector/presets/ directory is always included as a fallback.
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

  // ── Storage helpers ───────────────────────────────────────────────────────

  function getDefaultDir() {
    try {
      var info = (typeof csInterface !== 'undefined') ? csInterface.getExtensionInfo() : null;
      if (info && info.basePath) return info.basePath.replace(/\\/g, '/') + '/presets';
    } catch (e) {}
    return null;
  }

  /** Return array of user-configured folder paths from localStorage. */
  function getFolders() {
    try {
      var raw = localStorage.getItem('cc_preset_folders');
      if (raw) {
        var arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length > 0) return arr;
      }
    } catch (e) {}
    var def = getDefaultDir();
    return def ? [def] : [];
  }

  /** Persist a new folder path (does nothing if already present). */
  function addFolder(absPath) {
    var folders = getFolders();
    var norm = absPath.replace(/\\/g, '/').replace(/\/$/, '');
    if (folders.indexOf(norm) === -1) {
      folders.push(norm);
      localStorage.setItem('cc_preset_folders', JSON.stringify(folders));
    }
  }

  /** Remove a folder path from the persisted list. */
  function removeFolder(absPath) {
    var norm = absPath.replace(/\\/g, '/').replace(/\/$/, '');
    var folders = getFolders().filter(function (f) { return f !== norm; });
    localStorage.setItem('cc_preset_folders', JSON.stringify(folders));
  }

  // ── Scanning ──────────────────────────────────────────────────────────────

  /**
   * Recursively scan a directory for .ffx files.
   * Returns [{name, path, folder}]
   */
  function scanFolder(dir) {
    if (!fs || !path) return [];
    var results = [];
    try {
      var entries = fs.readdirSync(dir, { withFileTypes: true });
      entries.forEach(function (entry) {
        var full = path.join(dir, entry.name).replace(/\\/g, '/');
        if (entry.isDirectory()) {
          results = results.concat(scanFolder(full));
        } else if (entry.name.toLowerCase().endsWith('.ffx')) {
          results.push({
            name:   path.basename(entry.name, '.ffx'),
            path:   full,
            folder: dir.replace(/\\/g, '/'),
          });
        }
      });
    } catch (e) {
      // Folder not readable — skip silently
    }
    return results;
  }

  /**
   * Return a deduplicated flat catalog of all presets across all saved folders.
   * Each entry: { name, path, folder }
   */
  function getCatalog() {
    var folders = getFolders();
    var all = [];
    folders.forEach(function (f) {
      all = all.concat(scanFolder(f));
    });
    // Deduplicate by absolute path
    var seen = {};
    return all.filter(function (item) {
      if (seen[item.path]) return false;
      seen[item.path] = true;
      return true;
    });
  }

  /**
   * Quick name list for backward-compat (names without extensions).
   */
  function listPresets() {
    return getCatalog().map(function (p) { return p.name; });
  }

  /**
   * Build ExtendScript to apply a preset by absolute path.
   *
   * @param {string} presetAbsPath  - full path to the .ffx file
   * @returns {string}              - ExtendScript code string
   */
  function buildApplyPresetJsx(presetAbsPath) {
    var safePath = presetAbsPath.replace(/\\/g, '/');
    var presetName = safePath.split('/').pop().replace(/\.ffx$/i, '');

    return [
      'app.beginUndoGroup("Claude: apply preset ' + presetName + '");',
      'var comp = app.project.activeItem;',
      'if (!comp || !(comp instanceof CompItem)) {',
      '  JSON.stringify({ok:false,msg:"No active composition."});',
      '} else {',
      '  var layer = comp.selectedLayers.length > 0 ? comp.selectedLayers[0] : comp.layers[1];',
      '  var presetFile = new File("' + safePath + '");',
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
   * Find a preset by name (case-insensitive) and return its catalog entry.
   * Returns null if not found.
   */
  function findPreset(name) {
    var nameLower = name.toLowerCase().trim();
    var catalog = getCatalog();
    for (var i = 0; i < catalog.length; i++) {
      if (catalog[i].name.toLowerCase() === nameLower) return catalog[i];
    }
    // Fuzzy: partial match
    for (var j = 0; j < catalog.length; j++) {
      if (catalog[j].name.toLowerCase().indexOf(nameLower) !== -1) return catalog[j];
    }
    return null;
  }

  global.PresetsManager = {
    getFolders:          getFolders,
    addFolder:           addFolder,
    removeFolder:        removeFolder,
    scanFolder:          scanFolder,
    getCatalog:          getCatalog,
    listPresets:         listPresets,
    findPreset:          findPreset,
    buildApplyPresetJsx: buildApplyPresetJsx,
  };

})(window);
