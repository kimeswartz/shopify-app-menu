import dotenv from 'dotenv'; dotenv.config();
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";

// Load the .env file
dotenv.config();

// Log all environment variables to the console to see what's loaded
console.log("All environment variables:", process.env);

console.log("Loaded SHOPIFY_APP_URL:", process.env.SHOPIFY_APP_URL);
console.log("Loaded SHOPIFY_API_KEY:", process.env.SHOPIFY_API_KEY);

// Your remaining code...
import authRouter from "./routes/auth.js";
import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";

const PORT = 3000;  // Hardcoding the port to 3000

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Shopify auth routes and webhooks
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

app.use("/api/*", shopify.validateAuthenticatedSession());
app.use(express.json());

// OAuth router
app.use("/api", authRouter);

app.get("/api/products/count", async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});

app.post("/api/products", async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    console.log(`Failed to process products/create: ${e.message}`);
    status = 500;
    error = e.message;
  }
  res.status(status).send({ success: status === 200, error });
});

if (process.env.NODE_ENV !== "production") {
  app.use("/frontend", (req, res) => {
    res.redirect(`http://localhost:5173${req.path.replace("/frontend", "")}`);
  });
}

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  res.status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});

app.listen(PORT);