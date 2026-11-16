export const DONKI_BASE = "https://ccmc.gsfc.nasa.gov/DONKI-API/get/";
const fields = {
  FLR: ["flrID", "beginTime"],
  CME: ["activityID", "startTime"],
  SEP: ["sepID", "eventTime"],
};
const sourceLink = (url) =>
  typeof url === "string" &&
  /^https:\/\/ccmc\.gsfc\.nasa\.gov\/DONKI\/view\//.test(url)
    ? url
    : null;

export function parseDonki(type, body) {
  if (!fields[type] || !Array.isArray(body))
    throw new Error("Malformed DONKI response");
  return body.map((item) => {
    const [idKey, timeKey] = fields[type];
    const id = item?.[idKey],
      time = item?.[timeKey];
    if (
      typeof id !== "string" ||
      typeof time !== "string" ||
      !Number.isFinite(Date.parse(time))
    )
      throw new Error("Malformed DONKI event");
    return {
      id,
      type,
      time: new Date(time).toISOString(),
      catalog: typeof item.catalog === "string" ? item.catalog : "Not supplied",
      source:
        type === "FLR"
          ? item.instruments
              ?.map((i) => i.displayName)
              .filter(Boolean)
              .join(", ") || "Not supplied"
          : type === "CME"
            ? item.instruments
                ?.map((i) => i.displayName)
                .filter(Boolean)
                .join(", ") || "Not supplied"
            : item.instruments
                ?.map((i) => i.displayName)
                .filter(Boolean)
                .join(", ") || "Not supplied",
      link: sourceLink(item.link),
    };
  });
}

export function weatherState(results, retrievedAt, now = new Date()) {
  const events = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .sort((a, b) => b.time.localeCompare(a.time));
  const failures = results.filter((r) => r.status === "rejected").length;
  const age = now.getTime() - new Date(retrievedAt).getTime();
  if (!Number.isFinite(age) || age < 0 || age > 15 * 60 * 1000)
    return {
      status: "stale",
      events: [],
      message: "Retrieval is stale or has an invalid timestamp.",
    };
  if (failures === results.length)
    return {
      status: "unavailable",
      events: [],
      message: "DONKI is unavailable. No events are being substituted.",
    };
  return {
    status: failures ? "partial" : events.length ? "ready" : "empty",
    events,
    message: failures
      ? "Some event types could not be retrieved."
      : events.length
        ? "Observed solar events from DONKI."
        : "No FLR, CME or SEP records in this query window.",
  };
}

export function formatDonkiStatus(result, language = "en") {
  if (language === "tr") {
    const message = {
      stale: "Sorgu eski veya zaman damgası geçersiz.",
      unavailable: "DONKI kullanılamıyor. Yerine olay üretilmiyor.",
      partial: "Bazı olay türleri getirilemedi.",
      ready: "DONKI kaynaklı gözlenmiş Güneş olayları.",
      empty: "Bu sorgu aralığında FLR, CME veya SEP kaydı yok.",
    }[result.status];
    const label =
      result.status === "unavailable" || result.status === "stale"
        ? "Denendi"
        : result.status === "partial"
          ? "Kısmen getirildi"
          : "Getirildi";
    return `${message} Sorgu ${result.startDate}–${result.endDate} UTC · ${label} ${result.retrievedAt} · ${result.types.map((t) => `${t.type}: ${t.ok ? t.count : "kullanılamıyor"}`).join(", ")}.`;
  }
  const label =
    result.status === "unavailable" || result.status === "stale"
      ? "Attempted"
      : result.status === "partial"
        ? "Partially retrieved"
        : "Retrieved";
  return `${result.message} Query ${result.startDate}–${result.endDate} UTC · ${label} ${result.retrievedAt} · ${result.types.map((t) => `${t.type}: ${t.ok ? t.count : "unavailable"}`).join(", ")}.`;
}

export async function fetchDonki({ fetchImpl = fetch, now = new Date() } = {}) {
  const end = now.toISOString().slice(0, 10),
    start = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
  const types = ["FLR", "CME", "SEP"];
  const results = await Promise.allSettled(
    types.map(async (type) => {
      const url = `${DONKI_BASE}${type}?startDate=${start}&endDate=${end}`;
      const response = await fetchImpl(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw new Error(`${type}: HTTP ${response.status}`);
      if (
        !response.headers
          .get("content-type")
          ?.toLowerCase()
          .includes("application/json")
      )
        throw new Error(`${type}: non-JSON response`);
      return parseDonki(type, await response.json());
    }),
  );
  const retrievedAt = new Date().toISOString();
  return {
    ...weatherState(results, retrievedAt, new Date()),
    retrievedAt,
    startDate: start,
    endDate: end,
    types: types.map((type, i) => ({
      type,
      ok: results[i].status === "fulfilled",
      count: results[i].status === "fulfilled" ? results[i].value.length : 0,
    })),
  };
}
