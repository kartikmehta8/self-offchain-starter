# Self Verification Demo (Client + Server)

Minimal full-stack example showing how to:

- Display a Self QR code in a web app.
- Verify proofs on an Express backend with mock passports and OFAC checking.
- Inspect the full verification result.

## Project Structure

- `client/` – Next.js frontend
  - Renders the QR code using `@selfxyz/qrcode`.
  - Calls the backend verify endpoint and shows the verification JSON.
- `server/` – Express backend
  - Uses `SelfBackendVerifier` from `@selfxyz/core`.
  - Configured for staging/mock passports with OFAC enabled.

## Prerequisites

- Node.js 18+ (Self SDK recommends Node 22; you may see engine warnings on other versions, but it still runs).
- npm (comes with Node).

## Setup

Install dependencies once in each folder:

```bash
cd server
npm install

cd ../client
npm install
```

## Environment Configuration

### Backend (`server/.env`)

Create `server/.env`:

```env
PORT=3001
SELF_SCOPE=demo1-scope
SELF_ENDPOINT=https://your-ngrok-id.ngrok-free.app/api/verify
```

- `PORT` – local port for Express.
- `SELF_SCOPE` – must match the frontend `NEXT_PUBLIC_SELF_SCOPE`.
- `SELF_ENDPOINT` – public URL for `/api/verify` (typically an ngrok URL pointing to your local backend).

### Frontend (`client/.env.local`)

Create `client/.env.local`:

```env
NEXT_PUBLIC_SELF_APP_NAME=Self Verification Demo
NEXT_PUBLIC_SELF_SCOPE=demo1-scope
NEXT_PUBLIC_SELF_ENDPOINT=https://your-ngrok-id.ngrok-free.app/api/verify
NEXT_PUBLIC_SELF_DEBUG_ENDPOINT=http://localhost:3001/debug/last-result
```

- `NEXT_PUBLIC_SELF_SCOPE` must equal `SELF_SCOPE`.
- `NEXT_PUBLIC_SELF_ENDPOINT` must equal `SELF_ENDPOINT`.
- `NEXT_PUBLIC_SELF_DEBUG_ENDPOINT` points directly to the local debug endpoint to read the last verification result.

## Running the Stack

1. **Start the backend**

   ```bash
   cd server
   npm run dev
   ```

   - Listens on `http://localhost:3001`.
   - Endpoints:
     - `POST /api/verify` – main verification endpoint.
     - `GET /debug/last-result` – returns the last verification result (for the frontend).

2. **Expose the backend to Self (optional, for real device testing)**

   ```bash
   ngrok http 3001
   ```

   - Use the ngrok URL (e.g. `https://xxxx.ngrok-free.app/api/verify`) in both:
     - `SELF_ENDPOINT`
     - `NEXT_PUBLIC_SELF_ENDPOINT`

3. **Start the frontend**

   ```bash
   cd client
   npm run dev
   ```

   - Visit `http://localhost:3000` in your browser.

4. **Verify with the Self app**

   - Open the Self app (staging), ensure you’re using a **mock passport** (see `self-docs/using-mock-passports.md`).
   - Scan the QR code from the frontend.
   - After verification:
     - The QR disappears.
     - The full `VerificationResult` is shown as JSON below, including:
       - `attestationId`
       - `isValidDetails` (overall, age, OFAC)
       - `discloseOutput` (nationality, gender, etc.)
       - `userData` (userIdentifier + userDefinedData).

## Implementation Notes

- Backend (`server/index.mjs`)
  - Uses `SelfBackendVerifier(scope, endpoint, mockPassport=true, AllIds, DefaultConfigStore, "hex")`.
  - `DefaultConfigStore` is configured with:
    - `minimumAge: 18`
    - `excludedCountries: []`
    - `ofac: true`
  - OFAC handling:
    - If the user is on the OFAC list, the request returns an error with reason `"User is in OFAC sanctions list"`.

- Frontend (`client/src/app/page.tsx`)
  - Builds a `SelfApp` with:
    - `endpointType: "staging_https"`
    - `disclosures` that match backend config (`minimumAge`, `excludedCountries`, `ofac`).
  - Uses `SelfQRcodeWrapper` to render the QR and handle success/error.
  - On success, it fetches `/debug/last-result` from the backend and pretty-prints the JSON.

## Cleaning & Structure Changes Made

- Split code into clear `client/` and `server/` folders.
- Simplified the backend folder so it only contains:
  - `index.mjs` (no nested `server/` dir).
  - `package.json`, `.env`, `node_modules`.
- Removed Next.js boilerplate images and landing content.
- Reduced global CSS to a light theme only with minimal styling.
- Replaced per-folder READMEs with this single root `README.md`.
