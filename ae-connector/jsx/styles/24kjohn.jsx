/**
 * 24kjohn.jsx  —  24kjohn-style effect chain
 *
 * Characteristics:
 *   - Smooth slow-zoom keyframes (Ken Burns style push-in)
 *   - Warm, orange-tinted color grade (lifted shadows warm, orange mids)
 *   - Black cinematic bars (top and bottom solid layers, 2.39:1 aspect)
 *   - Soft motion blur
 *   - Slight glow/softness
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

        // 1. Slow zoom — scale from 100% to 108% over the layer's duration
        try {
            var scale = layer.property("Transform").property("Scale");
            var startTime = layer.inPoint;
            var endTime   = layer.outPoint;
            scale.setValueAtTime(startTime, [100, 100]);
            scale.setValueAtTime(endTime,   [108, 108]);
            // Ease both keyframes
            var easyEase = new KeyframeEase(0.5, 33);
            scale.setTemporalEaseAtKey(1, [easyEase], [easyEase]);
            scale.setTemporalEaseAtKey(2, [easyEase], [easyEase]);
        } catch (e) { /* continue */ }

        // 2. Warm color grade via Lumetri / Color Balance
        try {
            // Use ADBE Lumetri if available (CC 2015+)
            var lumetri = layer("Effects").addProperty("ADBE Lumetri");
            // Colour wheels: lift (shadows), gamma (mids), gain (highlights)
            // Shadow tint warm (+orange)
            lumetri.property("ADBE Lumetri-0003").property("ADBE Lumetri-0030").setValue(15);  // Shadow Tint
            // Temperature warm
            lumetri.property("ADBE Lumetri-0002").property("ADBE Lumetri-0009").setValue(18);  // Temperature
            lumetri.property("ADBE Lumetri-0002").property("ADBE Lumetri-0010").setValue(8);   // Tint (green-magenta)
        } catch (e) {
            // Fallback: Color Balance (HLS)
            try {
                var cb = layer("Effects").addProperty("ADBE Color Balance (HLS)");
                cb.property("ADBE Color Balance (HLS)-0002").setValue(12); // Hue shift toward warm
                cb.property("ADBE Color Balance (HLS)-0003").setValue(5);  // Lightness slight lift
            } catch (e2) { /* continue */ }
        }

        // 3. Motion blur
        try {
            enableMotionBlur(layer, comp);
        } catch (e) { /* continue */ }

        // 4. Soft glow
        try {
            addGlow(layer, 70, 40, 0.4);
        } catch (e) { /* continue */ }

        applied.push(layer.name);
    }

    // 5. Cinematic bars — 2.39:1 mask (black top/bottom solids)
    try {
        var barHeight = 0.08; // 8% of comp height each side
        addSolidBar(comp, "Cine Bar TOP",    [0,0,0], barHeight, "top");
        addSolidBar(comp, "Cine Bar BOTTOM", [0,0,0], barHeight, "bottom");
    } catch (e) { /* continue */ }

    app.endUndoGroup();
    return JSON.stringify({
        ok: true,
        msg: "24kjohn style applied to: " + applied.join(", ") + " + cinematic bars added."
    });
}
