"use client";

import { useEffect, useState } from "react";
import {
  SelfQRcodeWrapper,
  SelfAppBuilder,
  type SelfApp,
} from "@selfxyz/qrcode";
import { getUniversalLink } from "@selfxyz/core";
import { ethers } from "ethers";

export default function Home() {
  const [selfApp, setSelfApp] = useState<SelfApp | null>(null);
  const [universalLink, setUniversalLink] = useState("");
  const [status, setStatus] = useState("");
  const [showQr, setShowQr] = useState(true);
  const [verificationDetails, setVerificationDetails] = useState<any | null>(
    null,
  );

  useEffect(() => {
    try {
      const userId = ethers.ZeroAddress;

      const app = new SelfAppBuilder({
        version: 2,
        appName: process.env.NEXT_PUBLIC_SELF_APP_NAME || "Self Demo (Next.js)",
        scope: process.env.NEXT_PUBLIC_SELF_SCOPE || "demo-scope",
        endpoint:
          process.env.NEXT_PUBLIC_SELF_ENDPOINT ||
          "http://localhost:3001/api/verify",
        logoBase64: "https://i.postimg.cc/mrmVf9hm/self.png",
        userId,
        endpointType: "staging_https",
        userIdType: "hex",
        userDefinedData: "demo-user",
        disclosures: {
          minimumAge: 18,
          excludedCountries: [],
          ofac: true,
          nationality: true,
          gender: true,
        },
      }).build();

      setSelfApp(app);
      setUniversalLink(getUniversalLink(app));
    } catch (error) {
      console.error("Failed to initialize Self app:", error);
      setStatus("Failed to initialize Self QR code. Check console.");
    }
  }, []);

  const handleSuccessfulVerification = async () => {
    setStatus("Verification succeeded! Loading details...");
    setShowQr(false);

    try {
      const debugEndpoint =
        process.env.NEXT_PUBLIC_SELF_DEBUG_ENDPOINT ||
        "http://localhost:3001/debug/last-result";

      const res = await fetch(debugEndpoint);
      if (!res.ok) {
        setStatus("Verified, but failed to load details.");
        return;
      }

      const data = await res.json();
      if (data && data.verificationResult) {
        setVerificationDetails(data.verificationResult);
        setStatus("Verification details loaded.");
      } else {
        setStatus("Verified, but no details available.");
      }
    } catch (error) {
      console.error("Failed to fetch verification details:", error);
      setStatus("Verified, but failed to load details.");
    }
  };

  const handleError = (data?: { error_code?: string; reason?: string }) => {
    console.error("Verification failed:", data);
    setStatus(data?.reason || "Verification failed");
  };

  const openSelfApp = () => {
    if (!universalLink) return;
    window.open(universalLink, "_blank");
  };

  const attestationId = verificationDetails?.attestationId as
    | number
    | undefined;
  const docTypeLabel =
    attestationId === 1
      ? "Electronic passport"
      : attestationId === 2
        ? "Biometric ID card"
        : attestationId === 3
          ? "Aadhaar"
          : "Unknown document";

  const disclose = verificationDetails?.discloseOutput as
    | {
        nationality?: string;
        gender?: string;
        minimumAge?: string;
        ofac?: boolean[];
        issuingState?: string;
        expiryDate?: string;
      }
    | undefined;

  const userData = verificationDetails?.userData as
    | {
        userIdentifier?: string;
        userDefinedData?: string;
      }
    | undefined;

  const cumulativeOfac =
    disclose?.ofac && disclose.ofac.length > 0
      ? disclose.ofac.some(Boolean)
      : false;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row md:items-start">
        <section className="md:w-1/2 space-y-5">
          <div className="flex items-center gap-3">
            <img
              src="https://i.postimg.cc/mrmVf9hm/self.png"
              alt="Self logo"
              className="h-9 w-9 rounded-md border bg-white p-1 shadow-sm"
            />
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Self Protocol · Mock passports · Staging
              </p>
              <h1 className="mt-1 text-xl font-semibold text-slate-900">
                Identity verification demo
              </h1>
            </div>
          </div>

          <p className="text-sm leading-relaxed text-slate-700">
            This demo uses <span className="font-medium">Self QR codes</span> to
            request a proof from the Self app and verifies it on a lightweight
            Express backend. Proofs are checked against your configuration,
            including minimum age and OFAC sanctions.
          </p>

          <div className="space-y-2 rounded-lg border bg-white p-4 text-sm text-slate-700 shadow-sm">
            <p className="font-medium text-slate-900">How it works:</p>
            <ol className="list-decimal space-y-1 pl-5">
              <li>Open the Self app (staging) and create a mock passport.</li>
              <li>Scan the QR code shown on the right.</li>
              <li>
                The backend verifies your proof and returns the disclosed
                fields.
              </li>
            </ol>
          </div>

          {verificationDetails && (
            <div className="space-y-3 rounded-lg border bg-white p-4 text-sm text-slate-800 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">
                    Verified
                  </p>
                  <p className="text-sm font-semibold text-slate-900">
                    {docTypeLabel}
                  </p>
                </div>
                <span className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Proof valid
                </span>
              </div>

              <dl className="grid grid-cols-2 gap-3 text-xs md:text-sm">
                <div>
                  <dt className="text-slate-500">Nationality</dt>
                  <dd className="font-medium">
                    {disclose?.nationality || "Not disclosed"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Gender</dt>
                  <dd className="font-medium">
                    {disclose?.gender || "Not disclosed"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">Minimum age satisfied</dt>
                  <dd className="font-medium">
                    {disclose?.minimumAge
                      ? `Older than ${disclose.minimumAge}`
                      : "Not requested"}
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-500">OFAC</dt>
                  <dd className="font-medium">
                    {cumulativeOfac
                      ? "Match found on OFAC lists"
                      : "No OFAC match"}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-slate-500">User identifier</dt>
                  <dd className="font-mono text-xs">
                    {userData?.userIdentifier || "–"}
                  </dd>
                </div>
              </dl>

              <details className="mt-2 text-xs text-slate-700">
                <summary className="cursor-pointer select-none text-slate-500 hover:text-slate-700">
                  Show raw verification JSON
                </summary>
                <pre className="mt-2 max-h-64 overflow-auto rounded bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-900">
                  {JSON.stringify(verificationDetails, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </section>

        <section className="md:w-1/2">
          <div className="rounded-lg border bg-white p-5 text-center shadow-sm">
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
              Step 2 · Scan the QR code
            </h2>
            <p className="mb-4 text-xs text-slate-600">
              Use the Self app on your phone. This demo is configured for{" "}
              <span className="font-medium">mock passports</span> on staging.
            </p>

            {selfApp && showQr ? (
              <>
                <div className="flex justify-center">
                  <SelfQRcodeWrapper
                    selfApp={selfApp}
                    onSuccess={handleSuccessfulVerification}
                    onError={handleError}
                    type="websocket"
                    size={260}
                  />
                </div>
                {status && (
                  <p className="mt-4 text-xs text-slate-700">{status}</p>
                )}
                <button
                  type="button"
                  onClick={openSelfApp}
                  disabled={!universalLink}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Open Self app
                </button>
              </>
            ) : (
              <p className="text-sm text-slate-700">Initializing QR code...</p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
