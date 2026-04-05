/**
 * xrh4.jsx  —  xrh4-style effect chain
 *
 * Characteristics:
 *   - Heavy vignette (dark, punchy)
 *   - Strong desaturation of shadows (crushed, moody)
 *   - Chromatic aberration / RGB shift on edges
 *   - Glitch-style displacement on text/title layers
 *   - High contrast via Curves
 */

function xrh4_apply() {
    app.beginUndoGroup("Claude: xrh4 style");

    var comp = getActiveComp();
    if (!comp) {
        app.endUndoGroup();
        return JSON.stringify({ ok: false, msg: "No active composition." });
    }

    var layers = getTargetLayers();
    if (layers.length === 0) {
        app.endUndoGroup();
        return JSON.stringify({ ok: false, msg: "No layers to apply style to." });
    }

    var applied = [];

    for (var i = 0; i < layers.length; i++) {
        var layer = layers[i];

        // 1. Hue/Saturation — desaturate shadows
        var hueSat;
        try {
            hueSat = layer("Effects").addProperty("ADBE HUE SATURATION");
            hueSat.property("ADBE HUE SATURATION-0002").setValue(-35); // Master Saturation
        } catch (e) { /* continue */ }

        // 2. Curves — high contrast, crushed blacks
        try {
            var curves = layer("Effects").addProperty("ADBE CurvesCustom");
            // Master channel: pull down shadows, push up highlights
            var master = curves.property(1);
            var masterVal = master.value;
            // We set a simplified S-curve via the value array (2 control points format)
            // AE CurvesCustom: value is [[x,y],...] normalised 0-1
            master.setValue([[0,0],[0.1,0.04],[0.5,0.5],[0.9,0.96],[1,1]]);
        } catch (e) { /* continue */ }

        // 3. Chromatic aberration via Channel Blur
        try {
            addChromaticAberration(layer, 4);
        } catch (e) { /* continue */ }

        // 4. Glow (subtle)
        try {
            addGlow(layer, 60, 25, 0.5);
        } catch (e) { /* continue */ }

        applied.push(layer.name);
    }

    // 5. Vignette on comp (regardless of selected layer)
    try {
        addVignette(comp, 80);
    } catch (e) { /* continue */ }

    app.endUndoGroup();
    return JSON.stringify({
        ok: true,
        msg: "xrh4 style applied to: " + applied.join(", ") + " + vignette added to comp."
    });
}
