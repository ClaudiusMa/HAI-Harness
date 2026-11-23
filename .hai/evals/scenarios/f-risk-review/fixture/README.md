# Glaze Log

A glaze-recipe notebook for potters. This repository holds its crash reporting.

- `src/crash-report.js` builds crash reports. It is shared by the page (`src/web.js`) and
  the background sync worker (`src/worker.js`); both must keep working.
- `src/send.js` posts a report to the crash endpoint. Reports leave the device.
- `npm test` (or `node --test`) runs the tests.

## Privacy

Crash reports must not carry personal data: no email addresses, phone numbers or names.
Opaque ids, such as the account id, are fine. `src/sanitize.js` strips personal fields
before a report is built.
