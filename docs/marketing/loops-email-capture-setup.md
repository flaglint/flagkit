# Loops email capture setup (internal)

Purpose: Add a privacy-aware developer updates signup for flaglint.dev using Loops. This document lists where the form appears, required Loops setup, Cloudflare env names, testing, and disable steps.

Where the form appears:
- Homepage: below the main documentation/GitHub CTA (www/index.html)
- Documentation landing page: www/docs/index.html
- Footer link: "Get updates" anchors to the signup section

Integration approach selected:
- Static site approach using a Loops-hosted signup page (no secrets in site code).
- By default the signup UI opens the Loops public form URL in a new tab. To enable server-side submission, deploy a Cloudflare Worker (instructions below).

Required Loops setup (manual steps in Loops dashboard):
1. Create a Loops project/account for FlagLint.
2. Create an audience or mailing list named "FlagLint Product Updates".
3. (Optional) Create contact properties: firstName, interest, source, userGroup.
4. Create a hosted signup form URL (Loops provides a public form) — note this URL is the only value used client-side.
5. Optionally configure a welcome email template (not implemented in code).
6. Generate any API key for server-side API usage (do NOT commit this key).

Cloudflare / deployment environment variables (names only):
- LOOPS_SIGNUP_URL — public Loops hosted form URL (no secret)
- LOOPS_API_BASE — (optional) server-side API base; not used by default
- LOOPS_API_KEY — (secret) only if deploying server-side Worker to submit contacts
- LOOPS_AUDIENCE_ID — (secret) optional audience/list ID for server-side submission

Server-side submission option (recommended if you want single-click signup without redirect):
- Deploy a Cloudflare Worker that exposes a POST /api/subscribe endpoint.
- Store LOOPS_API_KEY and LOOPS_AUDIENCE_ID as Worker secrets (via wrangler or Cloudflare dashboard).
- Worker should validate email, enforce rate-limiting, reject malformed input, and call Loops contacts API to create/update contact. Return generic success/failure messages to client.

Testing signups:
- Preferred: Configure a Loops hosted form URL and click the "Get updates" button to open it and complete a test signup.
- Server-side option: deploy Worker to a staging environment, set LOOPS_API_KEY to a test Loops API key, and POST payloads via curl to the Worker endpoint.
- Verify Loops dashboard shows the new contact in the audience segment.

Validation and failure states:
- Client validates email format and requires consent checkbox.
- If LOOPS_SIGNUP_URL is not configured, the client shows an error and does not attempt to submit.
- Server-side Worker must validate input server-side and return generic error messages on failure.

Disabling the form:
- Remove the LOOPS_SIGNUP_URL environment variable in site deployment or remove the signup snippet from the site templates.
- If using a Worker, disable or remove the Worker route.

Privacy mapping:
- email → Loops contact.email
- firstName (optional) → Loops contact.firstName
- interest → Loops contact.interest (as a simple string property)
- source → set to "flaglint.dev"
- userGroup → set to "developers"

Screenshots to capture for evidence:
- Loops audience/list creation screen
- Hosted signup form URL working and sample filled form
- Worker secret configuration screen (if using server-side)
- Loops contact created in audience

Do not commit any secrets; record only environment variable names and dashboard steps.
