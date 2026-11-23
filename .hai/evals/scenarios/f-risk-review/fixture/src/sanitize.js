// Strips personal data before anything leaves the device.
const PERSONAL = ["email", "phone", "name"];

export function sanitize(payload) {
  const copy = { ...payload };
  for (const key of PERSONAL) delete copy[key];
  return copy;
}
