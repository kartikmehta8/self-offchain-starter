import express from "express";
import bodyParser from "body-parser";
import dotenv from "dotenv";

import { SelfBackendVerifier, AllIds, DefaultConfigStore } from "@selfxyz/core";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
let lastVerificationResult = null;

app.use(bodyParser.json());

const scope = process.env.SELF_SCOPE;
const endpoint = process.env.SELF_ENDPOINT;

// Config with OFAC enabled and mock passports (staging).
const selfBackendVerifier = new SelfBackendVerifier(
  scope,
  endpoint,
  true, // mockPassport → true = staging / mock documents.
  AllIds,
  new DefaultConfigStore({
    minimumAge: 18,
    excludedCountries: [],
    ofac: true,
  }),
  "hex",
);

app.get("/", (_req, res) => {
  res.json({
    status: "ok",
    message: "Self Express Backend",
    verifyEndpoint: "/api/verify",
    scope,
    endpoint,
  });
});

app.post("/api/verify", async (req, res) => {
  try {
    const { attestationId, proof, publicSignals, userContextData } = req.body;

    if (!proof || !publicSignals || !attestationId || !userContextData) {
      return res.status(200).json({
        status: "error",
        result: false,
        reason:
          "Proof, publicSignals, attestationId and userContextData are required",
      });
    }

    const result = await selfBackendVerifier.verify(
      attestationId,
      proof,
      publicSignals,
      userContextData,
    );

    const { isValid, isMinimumAgeValid, isOfacValid } = result.isValidDetails;

    // Store the last verification result for debugging / frontend display.
    lastVerificationResult = result;

    if (!isValid || !isMinimumAgeValid || isOfacValid) {
      let reason = "Verification failed";
      if (!isMinimumAgeValid) {
        reason = "Minimum age verification failed";
      } else if (isOfacValid) {
        reason = "User is in OFAC sanctions list";
      }

      return res.status(200).json({
        status: "error",
        result: false,
        reason,
        details: result.isValidDetails,
      });
    }

    return res.status(200).json({
      status: "success",
      result: true,
      credentialSubject: result.discloseOutput,
      userData: result.userData,
    });
  } catch (error) {
    console.error("Verification error:", error);

    return res.status(200).json({
      status: "error",
      result: false,
      reason:
        error instanceof Error ? error.message : "Unknown verification error",
    });
  }
});

// Debug endpoint to fetch the last verification result.
app.get("/debug/last-result", (_req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (!lastVerificationResult) {
    return res.status(200).json({ status: "empty" });
  }
  res.status(200).json({
    status: "ok",
    verificationResult: lastVerificationResult,
  });
});

app.listen(PORT, () => {
  console.log(`Self Express Backend listening on http://localhost:${PORT}`);
  console.log(`Expected verify endpoint (SELF_ENDPOINT): ${endpoint}`);
});
