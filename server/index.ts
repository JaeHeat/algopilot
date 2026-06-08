import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import cookieParser from "cookie-parser";

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.stripe.com", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com", "https://*.stripe.com", "ws:", "wss:"],
      frameSrc: ["'self'", "https://js.stripe.com", "https://hooks.stripe.com"],
      fontSrc: ["'self'", "data:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: "Too many webhook requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: "Too many API requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith('/api/auth'),
});

app.use('/api/webhooks', webhookLimiter);
app.use('/api', apiLimiter);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(cookieParser());
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let performanceFlag = "";
      if (duration > 500) {
        performanceFlag = " ⚠️  SLOW";
      } else if (duration > 200) {
        performanceFlag = " ⚡";
      }
      
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms${performanceFlag}`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
      
      if (duration > 500) {
        log(`Performance warning: ${req.method} ${path} took ${duration}ms`);
      }
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  const listenOptions: { port: number; host: string; reusePort?: boolean } = {
    port,
    host: "0.0.0.0",
  };
  // reusePort (SO_REUSEPORT) is unsupported on Windows and throws ENOTSUP.
  if (process.platform !== "win32") {
    listenOptions.reusePort = true;
  }
  server.listen(listenOptions, () => {
    log(`serving on port ${port}`);
  });

  // Platform-side signal adjudication — advance pending/open signals against the independent
  // price feed every minute. This is what makes "Verified Live" outcomes creator-independent.
  const runAdj = async () => {
    try {
      const { runAdjudication } = await import("./services/signal-adjudication");
      const { changed, processed } = await runAdjudication();
      if (changed > 0) log(`[Adjudication] ${changed}/${processed} signals advanced`);
    } catch (e) {
      console.error("[Adjudication] cycle error:", e);
    }
  };
  setInterval(runAdj, 60_000);
  setTimeout(runAdj, 5_000); // first pass shortly after boot
})();
