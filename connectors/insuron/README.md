# Insuron connector

This Deno 2 connector submits a contactless insurance request through the open
`POST https://insuron.io/api/open/requests` endpoint. It has no authentication
credentials or authentication headers, and usage is `FREE`.

## File map

- `provider.ts` — provider metadata and API base URL.
- `endpoints/create-request/endpoint.ts` — the only endpoint; validates the
  request and projects the response to its public fields.
- `endpoints/create-request/fixtures/synthetic-*.json` — synthetic replay-only
  matched and unmatched responses.
- `provider.test.ts` — replay and schema validation tests. No live API test is
  included.

## Open-access contactless submission

The endpoint accepts only a product (`auto`, `home`, `renters`, `life`,
`health`, or `commercial`), a valid US state/DC postal code, and optional
bounded structured `details`: `age` (0–120), `driverAge` (16–120),
`currentlyInsured`, `vehicles` (1–20), `tobacco`, `propertyType`
(`single_family`, `condo`, `townhouse`, `mobile_home`, `apartment`, or `other`),
`householdSize` (1–20), and `employeeCount` (0–100000). Detail fields must be
relevant to the selected product. Unknown fields and free text are rejected.
Personal names, phone numbers, email addresses, consent references, and consent
attestations are not accepted.

Open access does not mean approval or consent attestation: the API requires no
application approval, and submission does not attest that consent was obtained.
The Monid caller is responsible for its own data-sharing compliance before
sending data. The request carries no consumer contact details, so it does not
enable actual phone contact. `awaiting_agent` indicates an agent offer is
available; the offer is not an accepted connection. `review_required` indicates
no matched offer and further review is required. The response is limited to
`id`, `status`, `product`, `state`, and `createdAt`.

Partner matching is based on a verified license for the requested state and
the requested insurance line. This connector offers no request-status lookup
endpoint and makes no idempotency guarantee.