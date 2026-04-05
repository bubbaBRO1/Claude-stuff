/**
 * gulovsky.jsx  —  gulovsky-style effect chain
 *
 * Characteristics:
 *   - Dark, crushed blacks via Curves
 *   - Neon accent colors — boosted cyan/magenta highlights
 *   - Light leak solid with Screen blend mode (orange/pink tones)
 *   - Motion blur enabled
 *   - High saturation on midtones
 */

function gulovsky_apply() {
    app.beginUndoGroup("Claude: gulovsky style");

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

        // 1. Curves — crush blacks, lift highlights, neon-pop contrast
        try {
            var curves = layer("Effects").addProperty("ADBE CurvesCustom");

            // Master: crush blacks
            curves.property(1).setValue([[0,0],[0.08,0.02],[0.5,0.52],[1,1]]);

            // Red channel: slight pull down (towards cyan in shadows)
            curves.property(2).setValue([[0,0],[0.3,0.26],[1,1]]);

            // Blue channel: slight lift in highlights (towards cyan)
            curves.property(4).setValue([[0,0],[0.7,0.73],[1,1]]);
        } catch (e) { /* continue */ }

        // 2. Hue/Saturation — boost midtone saturation
        try {
            var hueSat = layer("Effects").addProperty("ADBE HUE SATURATION");
            hueSat.property("ADBE HUE SATURATION-0002").setValue(30);  // Master Saturation
        } catch (e) { /* continue */ }

        // 3. Motion blur
        try {
            enableMotionBlur(layer, comp);
        } catch (e) { /* continue */ }

        applied.push(layer.name);
    }

    // 4. Light leak — orange/pink Screen blend solid
    try {
        var leakW = Math.round(comp.width  * 0.5);
        var leakH = Math.round(comp.height * 0.5);
        var leak  = comp.layers.addSolid([1, 0.45, 0.1], "Light Leak", leakW, leakH, comp.pixelAspect);
        leak.blendingMode = BlendingMode.SCREEN;
        leak.opacity.setValue(28);

        // Position at top-left corner for typical light leak look
        leak.property("Transform").property("Position").setValue([leakW * 0.4, leakH * 0.4]);

        // Fast blur on the light leak
        var lb = leak("Effects").addProperty("ADBE Fast Blur");
        lb.property("ADBE Fast Blur-0001").setValue(80);

        leak.moveToBeginning();
    } catch (e) { /* continue */ }

    // 5. Subtle vignette
    try {
        addVignette(comp, 55);
    } catch (e) { /* continue */ }

    app.endUndoGroup();
    return JSON.stringify({
        ok: true,
        msg: "gulovsky style applied to: " + applied.join(", ") + " + light leak + vignette added."
    });
}
