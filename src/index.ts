import { Hono } from "hono";
import { cors } from "hono/cors";
import { createAuth } from "./auth";
import type { CloudflareBindings } from "./env";

type Variables = {
    auth: ReturnType<typeof createAuth>;
};

const app = new Hono<{ Bindings: CloudflareBindings; Variables: Variables }>();

// CORS configuration for auth routes
app.use(
    "/api/auth/**",
    cors({
        origin: "https://poc-liveness-passkey.pages.dev", // In production, replace with your actual domain
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'OPTIONS'],
        allowHeaders: [
            'Content-Type',
            'Authorization',
            'Accept',
            'X-Requested-With'
        ]
    })
);

// Middleware to initialize auth instance for each request
app.use("*", async (c, next) => {
    const auth = createAuth(c.env, (c.req.raw as any).cf || {});
    c.set("auth", auth);
    await next();
});

// Handle all auth routes
app.all("/api/auth/*", async c => {
    const auth = c.get("auth");
    return auth.handler(c.req.raw);
});

app.get("/health", c => {
    return c.json({ status: "ok", timestamp: new Date().toISOString() });
});

export default app;
