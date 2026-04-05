/**
 * effects.jsx  —  General After Effects scripting helpers
 *
 * Provides reusable functions for adding common effects, keyframes,
 * and layer adjustments. Called by style scripts and Claude-generated code.
 */

/**
 * Add an effect to a layer by its internal match name.
 * Returns the effect object, or null if it already exists.
 */
function addEffect(layer, matchName, displayName) {
    try {
        var existing = layer.effect.byName(displayName || matchName);
        if (existing) return existing;
    } catch (e) { /* not found — proceed to add */ }
    return layer("Effects").addProperty(matchName);
}

/**
 * Apply a Curves adjustment to a layer.
 * channel: 1=Master 2=Red 3=Green 4=Blue
 * points: [[x,y], ...] normalised 0–1
 */
function applyCurve(layer, channel, points) {
    var curves;
    try { curves = layer.effect("Curves"); }
    catch (e) { curves = layer("Effects").addProperty("ADBE CurvesCustom"); }
    var prop = curves.property(channel);
    prop.setValue(points);
}

/**
 * Add a solid layer to the comp (cinematic bars, light leaks, etc.)
 */
function addSolidBar(comp, name, color, heightRatio, position, blendMode) {
    var h = Math.round(comp.height * heightRatio);
    var solid = comp.layers.addSolid(color, name, comp.width, h, comp.pixelAspect);
    solid.blendingMode = blendMode || BlendingMode.NORMAL;
    var y = (position === "top") ? h / 2 : comp.height - (h / 2);
    solid.property("Transform").property("Position").setValue([comp.width / 2, y]);
    solid.moveToBeginning();
    return solid;
}

/**
 * Enable motion blur on a layer and on the comp.
 */
function enableMotionBlur(layer, comp) {
    layer.motionBlur = true;
    comp.motionBlurAdaptiveSampleLimit = 16;
    comp.motionBlurSamplesPerFrame = 8;
}

/**
 * Add a Vignette using a black solid with an elliptical subtract mask.
 */
function addVignette(comp, opacity) {
    var vig = comp.layers.addSolid([0, 0, 0], "Vignette", comp.width, comp.height, comp.pixelAspect);
    vig.blendingMode = BlendingMode.MULTIPLY;
    vig.property("Transform").property("Opacity").setValue(opacity || 70);
    var mask = vig.mask.addProperty("ADBE Mask Atom");
    mask.maskMode = MaskMode.SUBTRACT;
    mask.maskFeather.setValue([comp.width * 0.3, comp.height * 0.3]);
    var hw = comp.width / 2, hh = comp.height / 2;
    var shape = new Shape();
    shape.closed = true;
    shape.vertices   = [[hw - hw*0.8, hh],[hw, hh - hh*0.9],[hw + hw*0.8, hh],[hw, hh + hh*0.9]];
    shape.inTangents  = [[-hw*0.4,0],[0,-hh*0.4],[hw*0.4,0],[0,hh*0.4]];
    shape.outTangents = [[hw*0.4,0],[0,hh*0.4],[-hw*0.4,0],[0,-hh*0.4]];
    mask.maskPath.setValue(shape);
    vig.moveToBeginning();
    return vig;
}

/**
 * Add a Glow effect (ADBE Glo2) to a layer.
 */
function addGlow(layer, threshold, radius, intensity) {
    var glow = layer("Effects").addProperty("ADBE Glo2");
    glow.property("ADBE Glo2-0001").setValue(threshold !== undefined ? threshold : 50);
    glow.property("ADBE Glo2-0002").setValue(radius    !== undefined ? radius    : 30);
    glow.property("ADBE Glo2-0003").setValue(intensity !== undefined ? intensity : 0.8);
}

/**
 * Add Chromatic Aberration via Channel Blur on R + B channels.
 */
function addChromaticAberration(layer, amount) {
    var blur = layer("Effects").addProperty("ADBE ChnlBlr");
    blur.property("ADBE ChnlBlr-0001").setValue(amount || 3);  // Red
    blur.property("ADBE ChnlBlr-0004").setValue(amount || 3);  // Blue
}

// ── Modern effect helpers ─────────────────────────────────────────────────────

/**
 * Add camera shake via a wiggle expression on the layer's Position.
 *
 * @param {Layer}  layer
 * @param {number} frequency  - shakes per second (default 8)
 * @param {number} amplitude  - pixel range (default 12)
 */
function addCameraShake(layer, frequency, amplitude) {
    var freq = frequency || 8;
    var amp  = amplitude || 12;
    layer.property("Transform").property("Position").expression =
        "wiggle(" + freq + ", " + amp + ")";
    layer.motionBlur = true;
}

/**
 * Add a zoom pulse — quick punch-in and back on a layer's Scale.
 *
 * @param {Layer}  layer
 * @param {number} peakScale   - peak scale % (default 115)
 * @param {number} duration    - total duration in seconds (default 0.3)
 */
function addZoomPulse(layer, peakScale, duration) {
    var comp = app.project.activeItem;
    var peak = peakScale || 115;
    var dur  = duration  || 0.3;
    var scale = layer.property("Transform").property("Scale");
    var t = layer.inPoint;
    scale.setValueAtTime(t,           [100, 100]);
    scale.setValueAtTime(t + dur/2,   [peak, peak]);
    scale.setValueAtTime(t + dur,     [100, 100]);
    scale.keyframe(2).temporalEase =
        [new KeyframeEase(0.5, 75), new KeyframeEase(0.5, 75)];
}

/**
 * Speed ramp: slow down in the middle, fast at start and end.
 * Requires the layer to be a footage/AV layer.
 *
 * @param {Layer}  layer
 * @param {number} slowFactor  - how slow the middle is (e.g. 0.25 = 25% speed)
 */
function addSpeedRamp(layer, slowFactor) {
    if (!(layer instanceof AVLayer)) return;
    var slow = slowFactor || 0.25;
    layer.timeRemapEnabled = true;
    var tr = layer.property("Time Remap");
    var startT = layer.inPoint;
    var endT   = layer.outPoint;
    var midT   = (startT + endT) / 2;
    // Build remap: fast → slow → fast
    tr.setValueAtTime(startT,           startT);
    tr.setValueAtTime(startT + 0.5,     startT + 0.5 * slow);
    tr.setValueAtTime(midT,             midT * slow);
    tr.setValueAtTime(endT - 0.5,       endT - 0.5 * slow);
    tr.setValueAtTime(endT,             endT);
}

/**
 * Add a film grain / noise texture to a layer.
 *
 * @param {Layer}  layer
 * @param {number} amount  - grain amount 0–100 (default 18)
 * @param {string} type    - "soft" | "hard" (default "soft")
 */
function addFilmGrain(layer, amount, type) {
    // Use Noise (ADBE Noise) for quick grain
    var noise = layer("Effects").addProperty("ADBE Noise");
    noise.property("ADBE Noise-0001").setValue(amount !== undefined ? amount / 100 : 0.18);
    noise.property("ADBE Noise-0002").setValue(type === "hard" ? false : true); // Use Color Noise
}

/**
 * Glitch effect: Turbulent Displace + Posterize Time.
 *
 * @param {Layer}  layer
 * @param {number} intensity  - displacement amount px (default 20)
 * @param {number} fps        - glitch frame rate via posterize (default 6)
 */
function addGlitchEffect(layer, intensity, fps) {
    // Turbulent Displace
    var disp = layer("Effects").addProperty("ADBE Turbulent Displace");
    disp.property("ADBE Turbulent Displace-0002").setValue(intensity || 20); // Amount
    disp.property("ADBE Turbulent Displace-0003").setValue(80);              // Size
    // Posterize Time for stuttery look
    var post = layer("Effects").addProperty("ADBE Posterize Time");
    post.property("ADBE Posterize Time-0001").setValue(fps || 6);
    // Subtle chromatic fringe
    addChromaticAberration(layer, 5);
}

/**
 * VHS look: noise + hue shift + scan line stripe.
 *
 * @param {Layer}  layer
 */
function addVHSLook(layer) {
    // Noise
    var noise = layer("Effects").addProperty("ADBE Noise");
    noise.property("ADBE Noise-0001").setValue(0.12);
    // Hue/Sat: slightly desaturate + hue shift
    var hs = layer("Effects").addProperty("ADBE HueSaturation");
    hs.property("ADBE HueSaturation-0002").setValue(-15);  // Master Saturation
    hs.property("ADBE HueSaturation-0001").setValue(8);    // Master Hue shift
    // Horizontal scan line stretch via Fast Box Blur
    var blur = layer("Effects").addProperty("ADBE Fast Blur2");
    blur.property("ADBE Fast Blur2-0001").setValue(1);     // horizontal blur 1px
    blur.property("ADBE Fast Blur2-0002").setValue(0);     // blur dimensions: horizontal only
    // Chromatic fringe
    addChromaticAberration(layer, 6);
}

/**
 * Add echo / motion trail effect.
 *
 * @param {Layer}  layer
 * @param {number} numEchoes  - number of echoes (default 4)
 * @param {number} decay      - echo fade (default 0.5)
 */
function addEchoTrail(layer, numEchoes, decay) {
    var echo = layer("Effects").addProperty("ADBE Echo");
    echo.property("ADBE Echo-0001").setValue(-0.04);              // Echo Time (seconds)
    echo.property("ADBE Echo-0002").setValue(numEchoes || 4);     // Number of Echoes
    echo.property("ADBE Echo-0003").setValue(1.0);                // Starting Intensity
    echo.property("ADBE Echo-0004").setValue(decay || 0.5);       // Decay
    echo.property("ADBE Echo-0005").setValue(2);                  // Echo Operator: Add
}

/**
 * Add a Lens Flare at a given position.
 *
 * @param {Layer}  layer
 * @param {number[]} position  - [x, y] in comp pixels (default comp centre)
 */
function addLensFlare(layer, position) {
    var comp = app.project.activeItem;
    var pos  = position || [comp.width / 2, comp.height * 0.3];
    var flare = layer("Effects").addProperty("ADBE Lens Flare");
    flare.property("ADBE Lens Flare-0001").setValue(pos);  // Flare Center
    flare.property("ADBE Lens Flare-0002").setValue(120);  // Flare Brightness
    flare.property("ADBE Lens Flare-0003").setValue(1);    // Lens Type: 50-300mm
}

/**
 * Add a smooth zoom expression — continuous push-in over the layer's duration.
 *
 * @param {Layer}  layer
 * @param {number} startScale  - start scale % (default 100)
 * @param {number} endScale    - end scale % (default 110)
 */
function addSlowZoom(layer, startScale, endScale) {
    var s0 = startScale || 100;
    var s1 = endScale   || 110;
    var scale = layer.property("Transform").property("Scale");
    scale.setValueAtTime(layer.inPoint,  [s0, s0]);
    scale.setValueAtTime(layer.outPoint, [s1, s1]);
    scale.keyframe(1).temporalEase = [new KeyframeEase(0, 33)];
    scale.keyframe(2).temporalEase = [new KeyframeEase(0, 33)];
}

/**
 * Add motion tile — repeat the layer content across the comp.
 *
 * @param {Layer}  layer
 * @param {number} outputWidth   - tile output width % (default 200)
 * @param {number} outputHeight  - tile output height % (default 200)
 */
function addMotionTile(layer, outputWidth, outputHeight) {
    var tile = layer("Effects").addProperty("ADBE Motion Tile");
    tile.property("ADBE Motion Tile-0001").setValue(outputWidth  || 200);
    tile.property("ADBE Motion Tile-0002").setValue(outputHeight || 200);
    tile.property("ADBE Motion Tile-0006").setValue(true); // Mirror Edges
}

/**
 * Add Hue / Saturation effect.
 *
 * @param {Layer}  layer
 * @param {number} saturation  - master sat delta −100…+100
 * @param {number} hue         - hue rotation degrees
 */
function addHueSat(layer, saturation, hue) {
    var hs = layer("Effects").addProperty("ADBE HueSaturation");
    if (saturation !== undefined)
        hs.property("ADBE HueSaturation-0002").setValue(saturation);
    if (hue !== undefined)
        hs.property("ADBE HueSaturation-0001").setValue(hue * (100 / 360));
}

/**
 * Apply a Lumetri Color grade to a layer.
 * Accepts common params: temperature, tint, saturation, contrast, highlights, shadows.
 *
 * @param {Layer}  layer
 * @param {Object} params
 */
function applyLumetri(layer, params) {
    var lum;
    try { lum = layer.effect("Lumetri Color"); }
    catch (e) { lum = layer("Effects").addProperty("ADBE LMT Clip"); }
    var p = params || {};
    if (p.temperature  !== undefined) lum.property("ADBE LMT Clip-0001").property("ADBE LMT Clip-0003").setValue(p.temperature);
    if (p.tint         !== undefined) lum.property("ADBE LMT Clip-0001").property("ADBE LMT Clip-0004").setValue(p.tint);
    if (p.saturation   !== undefined) lum.property("ADBE LMT Clip-0001").property("ADBE LMT Clip-0002").setValue(p.saturation);
    if (p.contrast     !== undefined) lum.property("ADBE LMT Clip-0001").property("ADBE LMT Clip-0005").setValue(p.contrast);
    if (p.highlights   !== undefined) lum.property("ADBE LMT Clip-0001").property("ADBE LMT Clip-0006").setValue(p.highlights);
    if (p.shadows      !== undefined) lum.property("ADBE LMT Clip-0001").property("ADBE LMT Clip-0007").setValue(p.shadows);
}
