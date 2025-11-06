export function normalisePostcode(raw) {
  const s = String(raw || "").toUpperCase().replace(/\s+/g, "");
  if (!s) return "";
  // Insert standard single space before last 3 chars if length > 3
  return s.length > 3 ? s.slice(0, -3) + " " + s.slice(-3) : s;
}

export async function verifyPostcode(rawPostcode) {
  const pc = normalisePostcode(rawPostcode);
  try {
    const res = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(pc)}`);
    const json = await res.json();
    if (json.status === 200 && json.result) {
      const r = json.result;
      return {
        ok: true,
        postcode: r.postcode,
        lat: r.latitude,
        lng: r.longitude,
        outcode: r.outcode,
        country: r.country,
        nhs_ha: r.nhs_ha,
        admin_district: r.admin_district,
        admin_ward: r.admin_ward,
        nuts: r.nuts,
      };
    }
    return { ok: false, error: json?.error || "Invalid postcode" };
  } catch (e) {
    return { ok: false, error: "Network error" };
  }
}
