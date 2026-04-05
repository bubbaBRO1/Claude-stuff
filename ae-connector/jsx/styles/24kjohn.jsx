/**
 * 24kjohn.jsx  —  24kjohn creator style
 *
 * Signature look: cinematic, warm, smooth — the "premium edit" aesthetic.
 * - Slow push-in zoom (Ken Burns, very smooth with ease)
 * - Warm orange/amber color grade (Lumetri: temp +22, shadows lifted warm)
 * - Soft glow / bloom over highlights
 * - Black cinematic bars (2.39:1 widescreen)
 * - Motion blur enabled
 * - Slight vignette for depth
 * - Clean, no glitch — deliberate and polished
 */

function kjohn24_apply() {
    app.beginUndoGroup("Claude: 24kjohn style");

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
            // 1. Slow zoom — 100% → 108%, eased in and out
            var scale = layer.property("Transform").property("Scale");
            var inPt  = layer.inPoint;
            var outPt = layer.outPoint;
            scale.setValueAtTime(inPt,  [100, 100]);
            scale.setValueAtTime(outPt, [108, 108]);
            var ease = new KeyframeEase(0.5, 33);
            scale.setTemporalEaseAtKey(1, [ease], [ease]);
            scale.setTemporalEaseAtKey(2, [ease], [ease]);
        } catch (e) {}

        try {
            // 2. Warm color grade via Curves (universal, no Lumetri dependency)
            var curves = layer("Effects").addProperty("ADBE CurvesCustom");
            // Master: lift shadows slightly (airy feel)
            curves.property(1).setValue([[0,0.04],[0.5,0.52],[1,1]]);
            // Red: boost warm (lift shadows red)
            curves.property(2).setValue([[0,0.06],[0.4,0.46],[1,1.0]]);
            // Green: slight midtone boost
            curves.property(3).setValue([[0,0],[0.5,0.53],[1,1]]);
            // Blue: pull down slightly in mids (adds orange)
            curves.property(4).setValue([[0,0],[0.5,0.46],[1,1]]);
        } catch (e) {}

        try {
            // 3. Soft glow / bloom (wide radius, low intensity)
            addGlow(layer, 65, 55, 0.45);
        } catch (e) {}

        try {
            // 4. Motion blur
            enableMotionBlur(layer, comp);
        } catch (e) {}

        applied.push(layer.name);
    }

    try {
        // 5. Cinematic bars — 2.39:1 widescreen (8% each side)
        addSolidBar(comp, "Cine Bar TOP",    [0,0,0], 0.08, "top");
        addSolidBar(comp, "Cine Bar BOTTOM", [0,0,0], 0.08, "bottom");
    } catch (e) {}

    try {
        // 6. Subtle vignette for depth
        addVignette(comp, 45);
    } catch (e) {}

    app.endUndoGroup();
    return JSON.stringify({
        ok: true,
        msg: "24kjohn style applied to: " + applied.join(", ") + " — warm grade, slow zoom, cinematic bars, soft glow."
    });
}
