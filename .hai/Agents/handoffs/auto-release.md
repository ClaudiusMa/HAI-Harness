# Auto release

- Owner: Augustus, assigned 2026-09-24 by Claudia.
- Why: installed projects stay on `0.2.0` and GitHub has no release, so the beacon reports offline. The user will not run a separate release step.
- Do: automate the check-and-publish path for origin `main`.
- Do not: publish, tag, or push during this iteration. Do not auto-apply updates into field projects.
- First version: `0.2.1`. Publishing `v0.2.0` would not notify projects whose receipt is already `0.2.0`.
