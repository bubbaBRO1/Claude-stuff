/**
 * edit.jsx  —  ExtendScript helpers for full-edit creation
 *
 * Provides functions for reading project/comp state and performing
 * structural edit operations (trimming, reordering, transitions).
 * Included by hostscript.jsx via #include.
 */

/**
 * Return a JSON string describing the active composition and all its layers.
 * Used by the "Make Edit" feature to give Claude context about available footage.
 */
function getProjectInfo() {
    var comp = getActiveComp();
    if (!comp) {
        return JSON.stringify({ ok: false, msg: "No active composition open." });
    }

    var layers = [];
    for (var i = 1; i <= comp.numLayers; i++) {
        var l = comp.layers[i];
        var type = "Other";
        if (l instanceof TextLayer)  type = "Text";
        else if (l instanceof ShapeLayer) type = "Shape";
        else if (l instanceof AVLayer)    type = (l.source instanceof FootageItem) ? "Footage" : "Comp";

        layers.push({
            index:    i,
            name:     l.name,
            type:     type,
            inPoint:  Math.round(l.inPoint  * 100) / 100,
            outPoint: Math.round(l.outPoint * 100) / 100,
            duration: Math.round((l.outPoint - l.inPoint) * 100) / 100,
            selected: l.selected
        });
    }

    return JSON.stringify({
        ok:        true,
        compName:  comp.name,
        width:     comp.width,
        height:    comp.height,
        duration:  Math.round(comp.duration * 100) / 100,
        frameRate: comp.frameRate,
        numLayers: comp.numLayers,
        layers:    layers
    });
}

/**
 * Trim a layer to new in/out points (in seconds).
 *
 * @param {number} layerIndex  - 1-based layer index
 * @param {number} inPt        - new inPoint in seconds
 * @param {number} outPt       - new outPoint in seconds
 */
function trimLayer(layerIndex, inPt, outPt) {
    var comp = getActiveComp();
    if (!comp) return;
    var layer = comp.layers[layerIndex];
    if (!layer) return;
    layer.inPoint  = inPt;
    layer.outPoint = outPt;
}

/**
 * Reorder layers by providing an array of current layer indices
 * in the desired new order (top-to-bottom in the timeline).
 *
 * Example: reorderLayers([3, 1, 2]) moves current layer 3 to position 1, etc.
 *
 * @param {number[]} newOrder  - array of 1-based layer indices in desired order
 */
function reorderLayers(newOrder) {
    var comp = getActiveComp();
    if (!comp) return;

    // Build a snapshot of layers in the new order
    var snapshot = [];
    for (var i = 0; i < newOrder.length; i++) {
        snapshot.push(comp.layers[newOrder[i]]);
    }

    // Move each layer to its target position
    for (var j = 0; j < snapshot.length; j++) {
        snapshot[j].moveToBeginning();
        for (var k = 0; k < j; k++) {
            snapshot[j].moveAfter(snapshot[k]);
        }
    }
}

/**
 * Add a cross-dissolve (opacity fade) between two adjacent layers.
 * Fades out layer1 over `duration` seconds at its outPoint,
 * and fades in layer2 over the same duration from its inPoint.
 *
 * @param {Layer}  layer1    - outgoing layer
 * @param {Layer}  layer2    - incoming layer
 * @param {number} duration  - dissolve duration in seconds (default 0.3)
 */
function addCrossDissolve(layer1, layer2, duration) {
    duration = duration || 0.3;

    // Fade out layer1
    var op1 = layer1.property("Transform").property("Opacity");
    var fadeOutStart = layer1.outPoint - duration;
    if (fadeOutStart < layer1.inPoint) fadeOutStart = layer1.inPoint;
    op1.setValueAtTime(fadeOutStart,      100);
    op1.setValueAtTime(layer1.outPoint,   0);

    // Fade in layer2
    var op2 = layer2.property("Transform").property("Opacity");
    var fadeInEnd = layer2.inPoint + duration;
    if (fadeInEnd > layer2.outPoint) fadeInEnd = layer2.outPoint;
    op2.setValueAtTime(layer2.inPoint, 0);
    op2.setValueAtTime(fadeInEnd,      100);
}

/**
 * Set the active composition's duration.
 *
 * @param {number} seconds
 */
function setCompDuration(seconds) {
    var comp = getActiveComp();
    if (!comp) return;
    comp.duration = seconds;
}

/**
 * Sequence all layers end-to-end starting at time 0,
 * optionally adding a cross-dissolve overlap between each pair.
 *
 * @param {number} [overlap]  - dissolve overlap in seconds (0 = hard cuts)
 */
function sequenceLayersEndToEnd(overlap) {
    overlap = overlap || 0;
    var comp = getActiveComp();
    if (!comp) return;

    var cursor = 0;
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layers[i];
        // Skip guide/adjustment/text layers — sequence footage only
        if (!(layer instanceof AVLayer)) continue;
        var dur = layer.outPoint - layer.inPoint;
        layer.startTime = cursor - overlap;
        cursor += dur - overlap;
    }
}
