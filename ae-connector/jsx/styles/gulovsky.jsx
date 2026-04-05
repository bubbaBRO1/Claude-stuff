/**
 * gulovsky.jsx  —  gulovsky creator style
 *
 * Signature look: dark neon-pop aesthetic — cyberpunk/cinematic.
 * - Very dark, crushed blacks (near black-crush)
 * - Neon cyan highlights — Red channel pulled toward cyan in shadows
 * - Magenta / pink accent on edges via chromatic aberration
 * - High saturation boost on mids/highlights
 * - Orange/pink light leak top-left (Screen blend)
 * - Subtle echo trail for motion feel
 * - Motion blur
 * - Moderate vignette
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

        try {
            // 1. Curves — deep crush blacks, pop highlights
            var curves = layer("Effects").addProperty("ADBE CurvesCustom");
            // Master: black crush, mid-contrast boost
            curves.property(1).setValue([[0,0],[0.1,0.02],[0.5,0.54],[0.9,0.95],[1,1]]);
            // Red: pull toward cyan in shadows, neutral in highlights
            curves.property(2).setValue([[0,0],[0.25,0.20],[0.75,0.76],[1,1]]);
            // Green: neutral
            curves.property(3).setValue([[0,0],[0.5,0.5],[1,1]]);
            // Blue: lift in highlights for neon cyan top
            curves.property(4).setValue([[0,0],[0.6,0.64],[1,1.0]]);
        } catch (e) {}

        try {
            // 2. Hue/Saturation — heavy saturation boost
            var hs = layer("Effects").addProperty("ADBE HueSaturation");
            hs.property("ADBE HueSaturation-0002").setValue(38);
        } catch (e) {}

        try {
            // 3. Chromatic aberration — magenta/green fringing for neon look
            addChromaticAberration(layer, 5);
        } catch (e) {}

        try {
            // 4. Echo trail
            addEchoTrail(layer, 3, 0.45);
        } catch (e) {}

        try {
            // 5. Motion blur
            enableMotionBlur(layer, comp);
        } catch (e) {}

        applied.push(layer.name);
    }

    try {
        // 6. Light leak — orange/pink top-left, Screen blend, blurred
        var leakW = Math.round(comp.width  * 0.55);
        var leakH = Math.round(comp.height * 0.55);
        var leak  = comp.layers.addSolid([1.0, 0.38, 0.12], "Light Leak", leakW, leakH, comp.pixelAspect);
        leak.blendingMode = BlendingMode.SCREEN;
        leak.property("Transform").property("Opacity").setValue(26);
        leak.property("Transform").property("Position").setValue([leakW * 0.38, leakH * 0.38]);
        var lb = leak("Effects").addProperty("ADBE Fast Blur2");
        lb.property("ADBE Fast Blur2-0001").setValue(90);
        leak.moveToBeginning();
    } catch (e) {}

    try {
        // 7. Vignette
        addVignette(comp, 60);
    } catch (e) {}

    app.endUndoGroup();
    return JSON.stringify({
        ok: true,
        msg: "gulovsky style applied to: " + applied.join(", ") + " — neon cyan, crushed blacks, chromatic fringe, echo trail, light leak."
    });
}
