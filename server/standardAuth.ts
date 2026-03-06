import { Express } from "express";
import session from "express-session";
import passport from "passport";
import connectPgSimple from "connect-pg-simple";
import { pool } from "./db";

export function setupSession(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    throw new Error("SESSION_SECRET environment variable must be set");
  }

  // Session configuration
  // Set secure to false for local development (HTTP), true only for production HTTPS
  const isProduction = process.env.NODE_ENV === "production";
  const isLocalDevelopment = !isProduction || process.env.DOCKER === "true";

  const PgSession = connectPgSimple(session);

  app.use(
    session({
      store: new PgSession({
        pool,
        tableName: 'sessions',
        createTableIfMissing: false
      }),
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      proxy: isProduction, // Trust the reverse proxy for HTTPS detection
      cookie: {
        secure: isProduction, // True in production (HTTPS required), false in dev (HTTP allowed)
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        sameSite: "lax",
      },
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());
}

export function isAuthenticated(req: any, res: any, next: any) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}
