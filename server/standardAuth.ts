import { Express } from "express";
import session from "express-session";
import passport from "passport";

export function setupSession(app: Express) {
  const sessionSecret = process.env.SESSION_SECRET;

  if (!sessionSecret) {
    throw new Error("SESSION_SECRET environment variable must be set");
  }

  // Session configuration
  // Set secure to false for local development (HTTP), true only for production HTTPS
  const isProduction = process.env.NODE_ENV === "production";
  const isLocalDevelopment = !isProduction || process.env.DOCKER === "true";

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false, // Always false for localhost development with HTTP
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
    // Normalize user structure so req.user.claims.sub always works,
    // regardless of whether the user logged in via OAuth or email/password.
    if (!req.user.claims && req.user.id) {
      req.user.claims = {
        sub: req.user.id,
        email: req.user.email
      };
    }
    return next();
  }
  res.status(401).json({ message: "Unauthorized" });
}
