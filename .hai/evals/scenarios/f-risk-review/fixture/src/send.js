// Posts a crash report built by buildCrashReport. `transport` defaults to fetch.
export async function send(request, transport = globalThis.fetch) {
  return transport(request.url, {
    method: request.method,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(request.body)
  });
}
