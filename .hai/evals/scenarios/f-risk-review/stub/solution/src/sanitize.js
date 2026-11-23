// Strips personal data before anything leaves the device, at any depth and in any
// capitalization.
const PERSONAL = new Set(["email", "phone", "name"]);

export function sanitize(payload) {
  if (Array.isArray(payload)) return payload.map(sanitize);
  if (!payload || typeof payload !== "object") return payload;
  const copy = {};
  for (const [key, value] of Object.entries(payload)) {
    if (!PERSONAL.has(key.toLowerCase())) copy[key] = sanitize(value);
  }
  return copy;
}
