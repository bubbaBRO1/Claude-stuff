/**
 * effects.jsx  —  General After Effects scripting helpers
 *
 * Provides reusable functions for adding common effects, keyframes,
 * and layer adjustments. Called by style scripts and Claude-generated code.
 */

/**
 * Add an effect to a layer by its internal match name.
 * Returns the effect object, or null if it already exists.
 *
 * @param {Layer}  layer      - AE Layer object
 * @param {string} matchName  - Effect internal match name (e.g. "ADBE Glo2")
 * @param {string} displayName - Human-readable name for logging
 */
function addEffect(layer, matchName, displayName) {
    try {
        // Check if effect already exists
        var existing = layer.effect.byName(displayName || matchName);
        if (existing) return existing;
    } catch (e) { /* not found — proceed to add */ }
    return layer("Effects").addProperty(matchName);
}

/**
 * Add a Curves (ADBE CurvesCustom) adjustment to a layer.
 * Accepts channel index: 1=Master, 2=Red, 3=Green, 4=Blue.
 *
 * @param {Layer}  layer
 * @param {number} channel   - 1–4
 * @param {Array}  points    - [[x,y], ...] in 0–255 space
 */
function applyCurve(layer, channel, points) {
    var curves;
    try {
        curves = layer.effect("Curves");
    } catch (e) {
        curves = layer("Effects").addProperty("ADBE CurvesCustom");
    }
    var prop = curves.property(channel);
    var numPts = points.length;
    if (prop.numKeys > 0) prop.removeKey(1);
    // CurvesCustom uses normalised 0–1 values internally
    for (var i = 0; i < numPts; i++) {
        prop.setValueAtTime(0, prop.value); // ensure property is enabled
    }
    // Build point array for setValueAtTime — uses PropertyValueType.CUSTOM_VALUE
    try {
        var cv = new CubicBezierKey();
    } catch (e) { /* not available in all AE versions */ }
    // Simple: modify via UI approach — use .setValue on each point
    prop.setValue(points);
}

/**
 * Add a solid layer to the comp (used for cinematic bars, light leaks, etc.)
 *
 * @param {CompItem} comp
 * @param {string}   name        - Layer name
 * @param {number[]} color       - [r, g, b] in 0–1 range
 * @param {number}   heightRatio - Height as fraction of comp height (e.g. 0.08)
 * @param {string}   position    - "top" or "bottom"
 * @param {number}   [blendMode] - BlendingMode enum value (default: NORMAL)
 * @returns {AVLayer}
 */
function addSolidBar(comp, name, color, heightRatio, position, blendMode) {
    var h = Math.round(comp.height * heightRatio);
    var solid = comp.layers.addSolid(color, name, comp.width, h, comp.pixelAspect);
    solid.blendingMode = blendMode || BlendingMode.NORMAL;

    // Position: top or bottom
    var y = (position === "top")
        ? h / 2
        : comp.height - (h / 2);
    solid.property("Transform").property("Position").setValue([comp.width / 2, y]);
    solid.moveToBeginning();
    return solid;
}

/**
 * Enable motion blur on a layer and on the comp.
 *
 * @param {Layer}    layer
 * @param {CompItem} comp
 */
function enableMotionBlur(layer, comp) {
    layer.motionBlur = true;
    comp.motionBlurAdaptiveSampleLimit = 16;
    comp.motionBlurSamplesPerFrame = 8;
    // Enable comp-level motion blur button
    app.executeCommand(2391); // "Enable Frame Blending"
}

/**
 * Add a Vignette using a solid layer with a Radial Wipe–style mask.
 * Uses ADBE Fast Blur and ADBE Set Matte on a black solid.
 *
 * @param {CompItem} comp
 * @param {number}   opacity   - 0–100
 * @returns {AVLayer} vignette solid
 */
function addVignette(comp, opacity) {
    var vig = comp.layers.addSolid([0, 0, 0], "Vignette", comp.width, comp.height, comp.pixelAspect);
    vig.blendingMode = BlendingMode.MULTIPLY;
    vig.opacity.setValue(opacity || 70);

    // Add an elliptical mask that subtracts from the solid
    var mask = vig.mask.addProperty("ADBE Mask Atom");
    mask.maskMode = MaskMode.SUBTRACT;
    mask.maskFeather.setValue([comp.width * 0.3, comp.height * 0.3]);

    var hw = comp.width / 2;
    var hh = comp.height / 2;
    var shape = new Shape();
    shape.closed = true;
    shape.vertices = [
        [hw - hw * 0.8, hh], [hw, hh - hh * 0.9],
        [hw + hw * 0.8, hh], [hw, hh + hh * 0.9]
    ];
    shape.inTangents  = [[-hw * 0.4, 0], [0, -hh * 0.4], [hw * 0.4, 0], [0, hh * 0.4]];
    shape.outTangents = [[hw * 0.4, 0],  [0, hh * 0.4],  [-hw * 0.4, 0], [0, -hh * 0.4]];
    mask.maskPath.setValue(shape);

    vig.moveToBeginning();
    return vig;
}

/**
 * Add a Glow effect (ADBE Glo2) to a layer with given intensity.
 *
 * @param {Layer}  layer
 * @param {number} threshold  - 0–100 (default 50)
 * @param {number} radius     - pixels (default 30)
 * @param {number} intensity  - 0–2 (default 0.8)
 */
function addGlow(layer, threshold, radius, intensity) {
    var glow = layer("Effects").addProperty("ADBE Glo2");
    glow.property("ADBE Glo2-0001").setValue(threshold !== undefined ? threshold : 50);
    glow.property("ADBE Glo2-0002").setValue(radius    !== undefined ? radius    : 30);
    glow.property("ADBE Glo2-0003").setValue(intensity !== undefined ? intensity : 0.8);
}

/**
 * Add a Chromatic Aberration (Channel Shift) approximation using
 * a Displacement Map approach via CC Channel Mixer + Shift Channels.
 * Simpler: adds CC Radial Fast Blur for a quick fringe.
 *
 * @param {Layer} layer
 * @param {number} amount  - shift in pixels (default 3)
 */
function addChromaticAberration(layer, amount) {
    // Use Channel Blur (ADBE ChnlBlr) on R and B channels
    var blur = layer("Effects").addProperty("ADBE ChnlBlr");
    blur.property("ADBE ChnlBlr-0001").setValue(amount || 3);   // Red channel blur
    blur.property("ADBE ChnlBlr-0004").setValue(amount || 3);   // Blue channel blur
}
