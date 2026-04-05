/**
 * hostscript.jsx  —  ExtendScript entry point for Claude AE Connector
 *
 * This file is loaded by CEP as the "ScriptPath" in manifest.xml.
 * Sub-scripts are #included below so their functions are globally available.
 */

//@include "effects.jsx"
//@include "edit.jsx"
//@include "styles/xrh4.jsx"
//@include "styles/24kjohn.jsx"
//@include "styles/gulovsky.jsx"

/**
 * Utility: get the active composition. Returns null if none is open.
 */
function getActiveComp() {
    var item = app.project.activeItem;
    if (!item || !(item instanceof CompItem)) return null;
    return item;
}

/**
 * Utility: get selected layers in the active comp, or fall back to layer[1].
 * Returns an array of Layer objects.
 */
function getTargetLayers() {
    var comp = getActiveComp();
    if (!comp) return [];
    if (comp.selectedLayers.length > 0) {
        var layers = [];
        for (var i = 0; i < comp.selectedLayers.length; i++) {
            layers.push(comp.selectedLayers[i]);
        }
        return layers;
    }
    return comp.numLayers > 0 ? [comp.layers[1]] : [];
}

/**
 * Apply a .ffx preset file to the first selected (or first) layer.
 * Called from the panel when the user asks "apply preset X".
 *
 * @param {string} presetAbsPath  - Absolute filesystem path to the .ffx file.
 */
function applyFFXPreset(presetAbsPath) {
    app.beginUndoGroup("Claude: apply preset");
    var comp = getActiveComp();
    if (!comp) {
        app.endUndoGroup();
        return JSON.stringify({ ok: false, msg: "No active composition." });
    }
    var layers = getTargetLayers();
    if (layers.length === 0) {
        app.endUndoGroup();
        return JSON.stringify({ ok: false, msg: "No layers found in composition." });
    }
    var presetFile = new File(presetAbsPath);
    if (!presetFile.exists) {
        app.endUndoGroup();
        return JSON.stringify({ ok: false, msg: "Preset file not found: " + presetAbsPath });
    }
    layers[0].applyPreset(presetFile);
    app.endUndoGroup();
    return JSON.stringify({ ok: true, msg: "Preset applied to: " + layers[0].name });
}

/**
 * Return a JSON summary of the active comp for context injection into Claude prompts.
 */
function getCompInfo() {
    var comp = getActiveComp();
    if (!comp) return JSON.stringify({ ok: false, msg: "No active comp." });

    var layerInfo = [];
    for (var i = 1; i <= comp.numLayers; i++) {
        var l = comp.layers[i];
        layerInfo.push({
            index: i,
            name: l.name,
            selected: l.selected,
            type: (l instanceof AVLayer) ? "AV" : (l instanceof TextLayer) ? "Text" : (l instanceof ShapeLayer) ? "Shape" : "Other"
        });
    }
    return JSON.stringify({
        ok: true,
        name: comp.name,
        width: comp.width,
        height: comp.height,
        duration: comp.duration,
        frameRate: comp.frameRate,
        numLayers: comp.numLayers,
        layers: layerInfo
    });
}
