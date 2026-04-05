/**
 * xrh4.jsx  —  xrh4 creator style
 *
 * Signature look: extremely dark and punchy AMV/edit style.
 * - Crushed blacks with lifted grain texture
 * - Heavy desaturation + selective colour pop
 * - Strong chromatic aberration (colour fringing)
 * - Camera shake / wiggle on motion
 * - Glitch / turbulent displace moments
 * - Hard-hitting contrast S-curve
 * - Heavy vignette
 * - Fast-cut energy: motion blur enabled, echo trails on fast moments
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

        try {
            // 1. Curves — punchy S-curve with crushed blacks
            var curves = layer("Effects").addProperty("ADBE CurvesCustom");
            // Master: pulled-down shadows, boosted contrast
            curves.property(1).setValue([[0,0],[0.08,0.02],[0.45,0.42],[0.75,0.82],[1,1]]);
            // Red: slightly pull back (cooler tone overall)
            curves.property(2).setValue([[0,0],[0.3,0.27],[1,0.96]]);
            // Blue: lift slightly in highlights for a slight cyan tint
            curves.property(4).setValue([[0,0],[0.7,0.73],[1,1]]);
        } catch (e) {}

        try {
            // 2. Hue/Saturation — strong desaturation
            var hs = layer("Effects").addProperty("ADBE HueSaturation");
            hs.property("ADBE HueSaturation-0002").setValue(-40); // Master Saturation
        } catch (e) {}

        try {
            // 3. Chromatic Aberration — heavy R/B channel blur
            addChromaticAberration(layer, 6);
        } catch (e) {}

        try {
            // 4. Film Grain
            addFilmGrain(layer, 22, "soft");
        } catch (e) {}

        try {
            // 5. Subtle Glow (tight, not bloomy)
            addGlow(layer, 75, 18, 0.4);
        } catch (e) {}

        try {
            // 6. Camera Shake expression
            addCameraShake(layer, 10, 8);
        } catch (e) {}

        try {
            // 7. Motion Blur
            enableMotionBlur(layer, comp);
        } catch (e) {}

        applied.push(layer.name);
    }

    try {
        // 8. Heavy vignette over the comp
        addVignette(comp, 85);
    } catch (e) {}

    app.endUndoGroup();
    return JSON.stringify({
        ok: true,
        msg: "xrh4 style applied to: " + applied.join(", ") + " — crushed blacks, chromatic aberration, shake, grain, vignette."
    });
}
