// Candidate research records. URL presence and submitted status are not source authentication.
const nasaUrl = (value) =>
  typeof value === "string" &&
  /^https:\/\/(?:[a-z0-9-]+\.)*(?:nasa\.gov|jpl\.nasa\.gov)(?:\/|$)/i.test(
    value,
  );
const finite = Number.isFinite;
export const coordinateEvidence = {
  "jezero-008": {
    status: "Cross-checked NASA rover position, not outcrop centroid",
    url: "https://assets.science.nasa.gov/content/dam/science/cds/researchers/nac/pac/2025/2%20-%20PSD%20Update%20July%202024_TAGGED.pdf",
    note: "NASA slide labels the rover location on 21 June 2024 at longitude 77.48205542°, latitude 18.49070°.",
  },
};

export function validateScienceCatalog(catalog, scope) {
  if (
    !catalog ||
    catalog.schema_version !== "1.0" ||
    catalog.planet !== "Mars" ||
    !/longitude_east.*0–360° east-positive/.test(
      catalog.coordinate_convention ?? "",
    ) ||
    !Array.isArray(catalog.points) ||
    catalog.points.length === 0 ||
    catalog.points.length > 100
  )
    throw new Error("Invalid Mars science catalog");
  const ids = new Set();
  for (const p of catalog.points) {
    if (
      !p ||
      typeof p.id !== "string" ||
      ids.has(p.id) ||
      !p.name?.en ||
      !p.name?.tr ||
      !p.scientific_description?.en ||
      !p.scientific_description?.tr ||
      !p.geological_category ||
      !p.scientific_target ||
      !nasaUrl(p.nasa_source_url) ||
      !nasaUrl(p.image?.url) ||
      !p.image?.credit
    )
      throw new Error("Invalid science point");
    ids.add(p.id);
    const c = p.coordinates;
    if (scope === "jezero" && !c)
      throw new Error("Jezero point requires a coordinate record");
    if (c) {
      const absent = c.latitude == null && c.longitude_east == null;
      const present =
        finite(c.latitude) &&
        finite(c.longitude_east) &&
        c.latitude >= -90 &&
        c.latitude <= 90 &&
        c.longitude_east >= 0 &&
        c.longitude_east <= 360;
      if (!absent && !present) throw new Error("Invalid Mars coordinate");
      if (scope === "jezero" && (!c.represents || !c.status))
        throw new Error("Missing coordinate meaning");
    }
  }
  return catalog;
}

export function marsProject(lonEast, lat, crsWkt) {
  if (
    !finite(lonEast) ||
    !finite(lat) ||
    lonEast < 0 ||
    lonEast > 360 ||
    lat < -90 ||
    lat > 90
  )
    throw new Error("Invalid Mars geographic coordinate");
  if (
    typeof crsWkt !== "string" ||
    !/PROJECTION\["Equirectangular"\]/i.test(crsWkt) ||
    !/SPHEROID\["Mars_2000_Sphere_IAU",3396190,0\]/.test(crsWkt) ||
    !/PARAMETER\["central_meridian",0\]/i.test(crsWkt) ||
    !/PARAMETER\["standard_parallel_1",0\]/i.test(crsWkt)
  )
    throw new Error("Unsupported Mars CRS");
  const r = 3396190,
    radians = Math.PI / 180;
  return { east: r * lonEast * radians, north: r * lat * radians };
}

export function scienceCoverage(point, pack, sourceVerified = false) {
  const c = point?.coordinates;
  if (!c || c.latitude == null || c.longitude_east == null)
    return {
      status: "no-point",
      label: "Location not available as a verified single point.",
      eligible: false,
    };
  const projected = marsProject(c.longitude_east, c.latitude, pack.crsWkt);
  const b = pack.boundsMeters;
  if (
    projected.east < b.west ||
    projected.east >= b.east ||
    projected.north < b.south ||
    projected.north >= b.north
  )
    return {
      status: "outside",
      label: "Outside current map coverage.",
      eligible: false,
      projected,
    };
  const x = Math.floor(
    ((projected.east - b.west) / (b.east - b.west)) * pack.gridWidth,
  );
  const y = Math.floor(
    ((b.north - projected.north) / (b.north - b.south)) * pack.gridHeight,
  );
  const cell = { x, y };
  if (!finite(pack.heights[y * pack.gridWidth + x]))
    return {
      status: "nodata",
      label: "No usable DEM elevation at this location.",
      eligible: false,
      projected,
      cell,
    };
  if (!sourceVerified)
    return {
      status: "unverified",
      label: "Inside map, but coordinate source verification is pending.",
      eligible: false,
      projected,
      cell,
    };
  return {
    status: "eligible",
    label: "Inside measured map on a valid DEM cell.",
    eligible: true,
    projected,
    cell,
  };
}
