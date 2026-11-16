// Matches the four display colors and 2nd–98th percentile stretch in import_mars_rasters.py.
export const ELEVATION_COLORS = ["#172633", "#3d6f7e", "#9f916d", "#e5b375"];
export const DEFAULT_MEASURED_LAYERS = Object.freeze({
  optical: true,
  elevation: true,
  opacity: 45,
  blend: "color",
});

export function updateMeasuredLayers(current, change) {
  const next = { ...current, ...change };
  if (!next.optical && !next.elevation)
    throw new RangeError("Keep at least one map background visible.");
  if (!Number.isFinite(next.opacity) || next.opacity < 0 || next.opacity > 100)
    throw new RangeError("Elevation opacity must be 0–100%.");
  if (!["alpha", "color"].includes(next.blend))
    throw new RangeError("Unknown elevation blend mode.");
  return next;
}

export function layerPresentation(layers) {
  return {
    opticalVisible: layers.optical,
    elevationVisible: layers.elevation,
    elevationOpacity: layers.optical ? layers.opacity / 100 : 1,
    blendMode:
      layers.optical && layers.elevation && layers.blend === "color"
        ? "color"
        : "normal",
  };
}

export function elevationScale(heights) {
  const values = heights.filter(Number.isFinite).sort((a, b) => a - b);
  if (!values.length) throw new RangeError("No valid DEM heights.");
  const percentile = (p) => {
    const index = (values.length - 1) * p,
      low = Math.floor(index),
      high = Math.ceil(index);
    return values[low] + (values[high] - values[low]) * (index - low);
  };
  return {
    min: values[0],
    low: percentile(0.02),
    high: percentile(0.98),
    max: values.at(-1),
  };
}

export function elevationGradient() {
  return `linear-gradient(to right, ${ELEVATION_COLORS.map((color, index) => `${color} ${(index / 3) * 100}%`).join(", ")})`;
}
