# Carrier Integration Service

A Node.js service that fetches shipping rates from carriers via a single API. It currently integrates with UPS; the design allows adding more carriers without changing callers.

## What it does

You call `CarrierService.getRates(carrier, request)` with a carrier id (e.g. `"ups"`), origin/destination addresses, and package dimensions. The service returns normalized rate quotes (carrier, service, amount, currency, optional delivery days). Unsupported carriers and invalid input are rejected with structured errors.

## Architecture

Carriers are plugged in through the **Carrier** interface: `getRates(request: RateRequest): Promise<RateQuote[]>`. The service keeps a registry of carrier ids to implementations and delegates `getRates` to the right one. Adding a new carrier means implementing this interface and registering it in `CarrierService`; no changes to the public API.

Core types (addresses, packages, rate request/quote) and validation live in `src/core`. Each carrier has its own folder under `src/carriers` (e.g. `ups/`) with auth, request mapping, and the carrier implementation. Configuration is centralized in `src/config/env.ts` and loaded from the environment (see below).

## UPS OAuth token handling

UPS uses OAuth2 client credentials. The service requests a token from `${UPS_BASE_URL}/security/v1/oauth/token` with `grant_type=client_credentials` and Basic auth using `UPS_CLIENT_ID` and `UPS_CLIENT_SECRET`. Tokens are cached in memory with an expiry buffer (30 seconds before expiry) and reused until they expire. On a 401 from the rate API, the cache is cleared and the request is retried once with a fresh token.

## Request and response mapping

Incoming requests use the shared domain types: `Address`, `Package`, `RateRequest`. The UPS mapper (`ups.mapper.ts`) turns these into the UPS API shape (ShipFrom/ShipTo, dimensions in CM, weight in KGS). The rate API response is parsed and normalized into the shared `RateQuote` type (carrier, service code, amount, currency, optional delivery days). Invalid or malformed responses from the carrier result in structured errors rather than raw parsing failures.

## Tests

Integration tests live in `tests/` and use the same `CarrierService` API with real logic and stubbed HTTP. They assert that the correct token and rate endpoints are called, that responses are normalized correctly, and that token refresh and 401 retry behave as expected.

HTTP calls are stubbed with nock to validate request building, response normalization, and OAuth token lifecycle without real UPS credentials.

## Running the project

```bash
npm install
npm run build
npm start
```

`start` runs the app with `ts-node` (entry point: `src/index.ts`). Use `npm test` to run the test suite.

## Environment variables

Copy `.env.example` to `.env` and set values for your environment. Required for UPS:

| Variable | Description |
|----------|-------------|
| `UPS_BASE_URL` | UPS API base URL (e.g. `https://onlinetools.ups.com`) |
| `UPS_CLIENT_ID` | OAuth2 client id |
| `UPS_CLIENT_SECRET` | OAuth2 client secret |

These are read by `src/config/env.ts` after `dotenv.config()`.

## What’s next

Add FedEx carrier and additional UPS operations (labels, tracking) using the same Carrier interface and operation pattern.
