import { overlapCount, routeSegments } from "./route-segments.js";

export function comparisonFacts(shortest, terrain, data, legs = []) {
  if (!shortest || !terrain) return null;
  const a = routeSegments(shortest, data, legs),
    b = routeSegments(terrain, data, legs);
  const shared = overlapCount(a, b);
  const identical =
    shortest.cells.length === terrain.cells.length &&
    shortest.cells.every(
      (p, i) => p.x === terrain.cells[i].x && p.y === terrain.cells[i].y,
    );
  const distanceDelta = terrain.meters - shortest.meters;
  const slopeReduction = shortest.maxSlope - terrain.maxSlope;
  const ascentReduction = shortest.ascending - terrain.ascending;
  const meaningful = slopeReduction >= 2 || ascentReduction >= 10;
  const equalLength = Math.abs(distanceDelta) < 0.5;
  const advantages = [],
    disadvantages = [],
    unresolved = [];
  if (distanceDelta < -0.5) advantages.push("distance");
  else if (distanceDelta > 0.5) disadvantages.push("distance");
  if (slopeReduction > 0.05) advantages.push("maximum sampled step slope");
  else if (slopeReduction < -0.05)
    disadvantages.push("maximum sampled step slope");
  if (ascentReduction > 0.05) advantages.push("total ascent");
  else if (ascentReduction < -0.05) disadvantages.push("total ascent");
  if (!identical && advantages.length && disadvantages.length)
    unresolved.push("metrics favor different routes");
  if (!identical && !advantages.length && !disadvantages.length)
    unresolved.push("sampled metrics do not distinguish routes");
  unresolved.push(
    "small-scale obstacles and operational hazards are unmodeled",
  );
  return {
    identical,
    equalLength,
    equalLengthDifferentGeometry: equalLength && !identical,
    shared,
    sharedPercent: Math.round((shared / Math.max(a.length, b.length, 1)) * 100),
    distanceDelta,
    distancePercent: shortest.meters
      ? (distanceDelta / shortest.meters) * 100
      : 0,
    slopeReduction,
    ascentReduction,
    meaningful,
    advantages,
    disadvantages,
    unresolved,
  };
}

export function decisionExplanation(facts, language = "en") {
  const tr = language === "tr";
  if (!facts)
    return tr
      ? "Karşılaştırma için iki geçerli rota gerekli."
      : "Two valid routes are needed for comparison.";
  if (facts.identical)
    return tr
      ? "İki optimizasyon amacı da bu senaryo için aynı rotayı seçti."
      : "Both optimization objectives selected the same route for this scenario.";
  const number = (value, digits = 0) =>
    new Intl.NumberFormat(tr ? "tr-TR" : "en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  const equalDistance = Math.abs(facts.distanceDelta) < 0.5;
  const distance = `${number(Math.abs(facts.distanceDelta))} m (${number(Math.abs(facts.distancePercent), 1)}%)`;
  if (equalDistance && !facts.meaningful)
    return tr
      ? "Rotalar farklı grid hücrelerini izliyor, ancak ölçülen mesafeleri en yakın metreye yuvarlandığında aynı ve eğim ile yükseliş farkları küçük."
      : "The routes follow different grid cells but have the same measured distance to the nearest metre; sampled slope and ascent differences are small.";
  if (facts.distanceDelta > 0 && !facts.meaningful)
    return tr
      ? `Arazi öncelikli rota ${distance} daha uzun; örneklenmiş eğim veya yükselişte anlamlı bir kazanım göstermiyor.`
      : `The terrain-preferred route is ${distance} longer without a meaningful sampled slope or ascent advantage.`;
  if (!facts.meaningful)
    return tr
      ? `Rotaların geometrileri farklı; mesafe farkı ${distance}, ancak ölçülen kazanımlar küçük.`
      : `The route geometries differ by ${distance} in distance, but measured gains are small.`;
  const slope = `${number(Math.abs(facts.slopeReduction), 1)}°`;
  const ascent = `${number(Math.abs(facts.ascentReduction), 1)} m`;
  if (equalDistance) {
    const slopeEn =
      Math.abs(facts.slopeReduction) < 0.05
        ? "has the same maximum sampled step slope"
        : `${facts.slopeReduction >= 0 ? "reduces" : "increases"} maximum sampled step slope by ${slope}`;
    const ascentEn =
      Math.abs(facts.ascentReduction) < 0.05
        ? "has the same total ascent"
        : `${facts.ascentReduction >= 0 ? "reduces" : "increases"} total ascent by ${ascent}`;
    const slopeTr =
      Math.abs(facts.slopeReduction) < 0.05
        ? "maksimum örneklenmiş adım eğimini değiştirmiyor"
        : `maksimum örneklenmiş adım eğimini ${slope} ${facts.slopeReduction >= 0 ? "azaltıyor" : "artırıyor"}`;
    const ascentTr =
      Math.abs(facts.ascentReduction) < 0.05
        ? "toplam yükselişi değiştirmiyor"
        : `toplam yükselişi ${ascent} ${facts.ascentReduction >= 0 ? "azaltıyor" : "artırıyor"}`;
    return tr
      ? `Rotaların ölçülen mesafesi aynı (en yakın metreye yuvarlandığında); arazi öncelikli rota ${slopeTr} ve ${ascentTr}.`
      : `The routes have the same measured distance to the nearest metre; the terrain-preferred route ${slopeEn} and ${ascentEn}.`;
  }
  if (tr)
    return `En kısa rotaya göre arazi öncelikli rota ${distance} ${facts.distanceDelta >= 0 ? "daha uzun" : "daha kısa"}; maksimum örneklenmiş adım eğimi ${slope} ${facts.slopeReduction >= 0 ? "azalıyor" : "artıyor"}, toplam yükseliş ${ascent} ${facts.ascentReduction >= 0 ? "azalıyor" : "artıyor"}.`;
  return `Compared with the shortest route, the terrain-preferred route travels ${distance} ${facts.distanceDelta >= 0 ? "farther" : "less distance"}, ${facts.slopeReduction >= 0 ? "reduces" : "increases"} maximum sampled step slope by ${slope}, and ${facts.ascentReduction >= 0 ? "reduces" : "increases"} total ascent by ${ascent}.`;
}

export function tradeoffExplanation(facts, language = "en") {
  const tr = language === "tr";
  if (!facts)
    return tr
      ? "Geçerli rota verisi yok; karar verilemez."
      : "No valid route data; no decision can be made.";
  if (facts.identical)
    return tr
      ? "Geometri ve örneklenmiş ölçüler aynı. Küçük ölçekli tehlikeler modellenmiyor."
      : "Geometry and sampled metrics are identical. Small-scale hazards remain unmodeled.";
  const names = {
    distance: tr ? "mesafe" : "distance",
    "maximum sampled step slope": tr
      ? "maksimum örnek adım eğimi"
      : "maximum sampled step slope",
    "total ascent": tr ? "toplam yükseliş" : "total ascent",
  };
  const join = (items) => items.map((x) => names[x]).join(", ");
  const good = facts.advantages.length
    ? tr
      ? `Arazi öncelikli rota şu ölçülerde avantajlı: ${join(facts.advantages)}.`
      : `Terrain preference improves ${join(facts.advantages)}.`
    : tr
      ? "Örneklenmiş ölçülerde belirgin avantaj yok."
      : "No sampled metric advantage is established.";
  const bad = facts.disadvantages.length
    ? tr
      ? `Şu ölçülerde dezavantajlı: ${join(facts.disadvantages)}.`
      : `It worsens ${join(facts.disadvantages)}.`
    : "";
  const unresolved =
    facts.advantages.length && facts.disadvantages.length
      ? tr
        ? "Bu ödünleşimin tek bir nesnel çözümü yok."
        : "These opposing metrics do not establish a single best route."
      : facts.equalLengthDifferentGeometry
        ? tr
          ? "Eşit uzunluk farklı geometriyi eşdeğer yapmaz."
          : "Equal length does not make the different geometries equivalent."
        : "";
  return [
    good,
    bad,
    unresolved,
    tr
      ? "Küçük ölçekli ve operasyonel tehlikeler bilinmiyor."
      : "Small-scale and operational hazards remain unknown.",
  ]
    .filter(Boolean)
    .join(" ");
}
