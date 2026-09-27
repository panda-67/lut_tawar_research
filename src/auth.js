import fs from "node:fs/promises";
import ee from "@google/earthengine";
import { authenticate } from "@google-cloud/local-auth";
import { OAuth2Client } from "google-auth-library";

import { CONFIG } from "../config/config.js";

const SCOPES = ["https://www.googleapis.com/auth/earthengine"];

const TOKEN_PATH = new URL("../credentials/oauth-token.json", import.meta.url);

async function loadOAuthClientConfig() {
  const raw = await fs.readFile(CONFIG.credentials.oauthClient, "utf8");

  const config = JSON.parse(raw);

  if (!config.installed) {
    throw new Error("OAuth client harus menggunakan format installed application.");
  }

  return config.installed;
}

async function loadStoredCredentials() {
  try {
    const raw = await fs.readFile(TOKEN_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function saveCredentials(credentials) {
  await fs.writeFile(TOKEN_PATH, JSON.stringify(credentials, null, 2), "utf8");
}

async function getOAuthCredentials() {
  const oauthConfig = await loadOAuthClientConfig();
  const storedCredentials = await loadStoredCredentials();

  if (storedCredentials?.refresh_token) {
    const client = new OAuth2Client({
      clientId: oauthConfig.client_id,
      clientSecret: oauthConfig.client_secret,
      redirectUri: oauthConfig.redirect_uris?.[0],
    });

    client.setCredentials(storedCredentials);

    try {
      const { credentials } = await client.refreshAccessToken();

      const updatedCredentials = {
        ...storedCredentials,
        ...credentials,
      };

      await saveCredentials(updatedCredentials);

      return {
        oauthConfig,
        credentials: updatedCredentials,
      };
    } catch (error) {
      console.log("Stored OAuth credential tidak dapat digunakan.");
      console.log("Memulai OAuth authorization ulang...");
    }
  }

  const auth = await authenticate({
    keyfilePath: CONFIG.credentials.oauthClient,
    scopes: SCOPES,
  });

  const credentials = auth.credentials;

  if (!credentials.access_token) {
    throw new Error("OAuth tidak menghasilkan access token.");
  }

  await saveCredentials(credentials);

  return {
    oauthConfig,
    credentials,
  };
}

export async function initializeEarthEngine() {
  const { oauthConfig, credentials } = await getOAuthCredentials();

  const expiresIn = credentials.expiry_date
    ? Math.max(1, Math.floor((credentials.expiry_date - Date.now()) / 1000))
    : 3600;

  ee.data.setAuthToken(
    oauthConfig.client_id,
    credentials.token_type ?? "Bearer",
    credentials.access_token,
    expiresIn,
    SCOPES,
    () => { },
    false,
  );

  await new Promise((resolve, reject) => {
    ee.initialize(null, null, resolve, reject, null, CONFIG.eeProject);
  });

  return ee;
}

export { ee };
