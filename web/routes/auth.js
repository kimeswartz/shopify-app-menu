import express from "express";
import { shopifyApi, LATEST_API_VERSION } from "@shopify/shopify-api";
import dotenv from "dotenv";
import "@shopify/shopify-api/adapters/node"; 

dotenv.config();


// Logga miljövariabeln för att säkerställa att den har laddats korrekt
console.log("SHOPIFY_APP_URL:", process.env.SHOPIFY_APP_URL);
console.log("Alla miljövariabler:", process.env);

const router = express.Router();

// Säkerställ att SHOPIFY_SCOPES är definierad
const scopes = process.env.SHOPIFY_SCOPES ? process.env.SHOPIFY_SCOPES.split(",") : [];

const shopify = shopifyApi({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET,
  scopes: scopes,
  hostName: process.env.SHOPIFY_APP_URL?.replace(/^https?:\/\//, "") || "localhost:3000",

  apiVersion: LATEST_API_VERSION,
});


// 1️⃣ Starta OAuth-flödet
router.get("/auth", async (req, res) => {
  const shop = req.query.shop;

  if (!shop) return res.status(400).send("Ingen butik angiven");


  const authRoute = await shopify.auth.begin({
    shop,
    callbackPath: "/auth/callback",
    isOnline: false,
    redirectUri: `${process.env.SHOPIFY_APP_URL}/auth/callback`,
  });
  


  res.redirect(authRoute);
});

// 2️⃣ Hantera callback från Shopify
router.get("/auth/callback", async (req, res) => {
  try {
    const session = await shopify.auth.callback({ rawRequest: req, rawResponse: res });

    const { shop, accessToken } = session;

    console.log(`OAuth klar! Butik: ${shop}, Token: ${accessToken}`);

    // Spara accessToken i din databas (MongoDB)
    await saveShopToken(shop, accessToken);

    res.redirect(`/app?shop=${shop}`);
  } catch (error) {
    console.error("OAuth error:", error);
    res.status(500).send("Autentisering misslyckades");
  }
});

// Dummy-funktion för att spara accessToken (ersätt med MongoDB)
async function saveShopToken(shop, token) {
  console.log(`Sparar token för ${shop}: ${token}`);
}

export default router;