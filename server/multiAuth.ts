import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as TwitterStrategy } from "passport-twitter";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import type { Express, RequestHandler } from "express";
import crypto from "crypto";
import { storage } from "./storage";
import { sanitizeUser } from "./routes";
import { forgotPasswordSchema, resetPasswordSchema } from "@shared/schema";
import { sendPasswordResetEmail } from "./email";

// OAuth configuration interfaces
interface OAuthProfile {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
}

// Configure Google OAuth Strategy
function configureGoogleAuth() {
  const clientID = (process.env.GOOGLE_CLIENT_ID || '').trim();
  const clientSecret = (process.env.GOOGLE_CLIENT_SECRET || '').trim();

  if (!clientID || !clientSecret) {
    console.warn("Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return;
  }

  // Defensive check for placeholders
  const isPlaceholder = clientID === 'your_google_client_id' ||
    clientSecret === 'your_google_client_secret';

  if (isPlaceholder) {
    console.error("CRITICAL: Google OAuth is using placeholder values from .env template. Please set REAL values in production environment variables.");
  }

  // Safely log start of credentials to help user verify they are using the right keys
  console.log(`[GoogleAuth] INIT: ID=${clientID.substring(0, 10)}... SECRET=${clientSecret.substring(0, 4)}...`);

  // We now use dynamic callback URLs in the route handler to be more robust
  // but we still need a default for the strategy initialization
  const defaultCallbackURL = "/api/auth/google/callback";

  passport.use(new GoogleStrategy({
    clientID: clientID,
    clientSecret: clientSecret,
    callbackURL: defaultCallbackURL,
    proxy: true
  },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if this Google account is already linked
        const existingProvider = await storage.getAuthProvider('google', profile.id);

        if (existingProvider) {
          // Update tokens
          await storage.updateAuthProvider(existingProvider.id, {
            accessToken,
            refreshToken,
            tokenExpiresAt: new Date(Date.now() + 3600000) // 1 hour
          });

          const user = await storage.getUser(existingProvider.userId);
          return done(null, user || false);
        }

        // Check if user exists by email
        const email = profile.emails?.[0]?.value;
        let user = email ? await storage.getUserByEmail(email) : null;

        if (!user && email) {
          // Create new user
          user = await storage.createUser({
            email,
            firstName: profile.name?.givenName,
            lastName: profile.name?.familyName,
            profileImageUrl: profile.photos?.[0]?.value
          });
        }

        if (user) {
          // Link OAuth provider to user
          await storage.createAuthProvider({
            userId: user.id,
            provider: 'google',
            providerId: profile.id,
            providerEmail: email,
            accessToken,
            refreshToken,
            tokenExpiresAt: new Date(Date.now() + 3600000)
          });
        }

        return done(null, user || false);
      } catch (error) {
        return done(error);
      }
    }));
}

// Configure Twitter OAuth Strategy
function configureTwitterAuth() {
  if (!process.env.TWITTER_CONSUMER_KEY || !process.env.TWITTER_CONSUMER_SECRET) {
    console.warn("Twitter OAuth not configured - missing TWITTER_CONSUMER_KEY or TWITTER_CONSUMER_SECRET");
    return;
  }

  passport.use(new TwitterStrategy({
    consumerKey: process.env.TWITTER_CONSUMER_KEY!,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET!,
    callbackURL: "/api/auth/twitter/callback",
    includeEmail: true
  }, async (token, tokenSecret, profile, done) => {
    try {
      // Check if this Twitter account is already linked
      const existingProvider = await storage.getAuthProvider('twitter', profile.id);

      if (existingProvider) {
        // Update tokens
        await storage.updateAuthProvider(existingProvider.id, {
          accessToken: token,
          refreshToken: tokenSecret
        });

        const user = await storage.getUser(existingProvider.userId);
        return done(null, user || false);
      }

      // Check if user exists by email
      const email = profile.emails?.[0]?.value;
      let user = email ? await storage.getUserByEmail(email) : null;

      if (!user && email) {
        // Create new user
        user = await storage.createUser({
          email,
          firstName: profile.displayName?.split(' ')[0],
          lastName: profile.displayName?.split(' ').slice(1).join(' '),
          profileImageUrl: profile.photos?.[0]?.value
        });
      }

      if (user) {
        // Link OAuth provider to user
        await storage.createAuthProvider({
          userId: user.id,
          provider: 'twitter',
          providerId: profile.id,
          providerEmail: email,
          accessToken: token,
          refreshToken: tokenSecret
        });
      }

      return done(null, user || false);
    } catch (error) {
      return done(error);
    }
  }));
}

// Configure Local (Email/Password) Strategy
function configureLocalAuth() {
  passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password'
  }, async (email, password, done) => {
    try {
      const user = await storage.getUserByEmail(email);
      if (!user || !user.passwordHash) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return done(null, false, { message: 'Invalid email or password' });
      }

      return done(null, user);
    } catch (error) {
      console.error("[LocalStrategy] Exception during authentication:", error);
      return done(error);
    }
  }));
}

// Setup multi-authentication
export function setupMultiAuth(app: Express) {
  // Configure strategies
  configureGoogleAuth();
  configureTwitterAuth();
  configureLocalAuth();

  passport.serializeUser((user: any, done) => {
    const userId = user.id;
    if (!userId) {
      return done(new Error('User ID not found in session'));
    }
    done(null, userId);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const user = await storage.getUser(id);
      if (!user) {
        return done(null, false);
      }
      done(null, user);
    } catch (error) {
      console.error('Error deserializing user:', error);
      done(null, false);
    }
  });

  // Initialize passport
  app.use(passport.initialize());
  app.use(passport.session());
}

// Auth route handlers
export function registerMultiAuthRoutes(app: Express) {
  // Google OAuth routes
  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    app.get('/api/auth/google', (req, res, next) => {
      // ULTIMATE ROBUST CALLBACK DETECTION
      // 1. Prioritize x-forwarded-host (proxy), handle potential list and strip ports
      const hostHeader = req.get('x-forwarded-host') || req.get('host') || '';
      const host = hostHeader.split(',')[0].trim().split(':')[0];

      // 2. Force 'https' in production regardless of headers
      const protocol = (process.env.NODE_ENV === 'production') ? 'https' : (req.get('x-forwarded-proto') || req.protocol);

      // 3. Build the absolute callback URL
      const callbackURL = `${protocol}://${host}/api/auth/google/callback`;

      console.log(`[GoogleAuth] REQUEST_START: ${protocol}://${host}${req.url}`);
      console.log(`[GoogleAuth] CALLBACK_URI_GENERATED: ${callbackURL}`);
      console.log(`[GoogleAuth] HEADERS: host=${req.get('host')}, x-forwarded-host=${req.get('x-forwarded-host')}, x-forwarded-proto=${req.get('x-forwarded-proto')}`);

      passport.authenticate('google', {
        scope: ['profile', 'email'],
        callbackURL: callbackURL // This OVERRIDES the strategy default
      } as any)(req, res, next);
    });

    app.get('/api/auth/google/callback', (req, res, next) => {
      // Must use the EXACT same dynamic callbackURL logic as the start route
      const hostHeader = req.get('x-forwarded-host') || req.get('host') || '';
      const host = hostHeader.split(',')[0].trim().split(':')[0];
      const protocol = (process.env.NODE_ENV === 'production') ? 'https' : (req.get('x-forwarded-proto') || req.protocol);
      const callbackURL = `${protocol}://${host}/api/auth/google/callback`;

      console.log(`[GoogleAuth] CALLBACK_REACHED: ${protocol}://${host}${req.url}`);
      console.log(`[GoogleAuth] CALLBACK_URI_MATCHING: ${callbackURL}`);

      passport.authenticate('google', {
        failureRedirect: '/login',
        callbackURL: callbackURL
      } as any, (err: any, user: any, info: any) => {
        if (err) {
          console.error("[GoogleAuth] CALLBACK_ERROR:", err);
          if (err.name === 'TokenError') {
            console.error("[GoogleAuth] TOKEN_ERROR_DETAIL:", {
              message: err.message,
              code: err.code,
              uri: err.uri,
              status: err.status,
              raw: err.rawResponse // OAuth2 error often has raw response
            });
          }
          return next(err);
        }
        if (!user) {
          console.warn("[GoogleAuth] NO_USER_RETURNED", info);
          return res.redirect('/login?error=no_user');
        }
        req.login(user, (loginErr) => {
          if (loginErr) return next(loginErr);
          res.redirect('/dashboard');
        });
      })(req, res, next);
    }, (req, res) => {
      // Support mobile deep linking if requested via state or session
      const isMobile = (req.session as any)?.isMobile || req.query.state === 'mobile';
      if (isMobile) {
        return res.redirect('com.puresoul.app://dashboard');
      }
      res.redirect('/dashboard');
    });

    // Debug Route for Auth Config
    app.get('/api/auth/debug', async (req, res) => {
      let dbInfo = {};
      try {
        const { sql } = await import('drizzle-orm');
        const { db } = await import('./db');
        const columns = await db.execute(sql`
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'users'
        `);
        dbInfo = {
          usersTableColumns: columns.rows.map((r: any) => r.column_name),
          genderColumnExists: columns.rows.some((r: any) => r.column_name === 'gender')
        };
      } catch (e: any) {
        dbInfo = { error: e.message };
      }

      res.json({
        nodeEnv: process.env.NODE_ENV,
        appUrl: process.env.APP_URL,
        railwayDomain: process.env.RAILWAY_PUBLIC_DOMAIN,
        detectedHost: req.get('x-forwarded-host') || req.get('host'),
        hostSimplified: (req.get('x-forwarded-host') || req.get('host') || '').split(',')[0].trim().split(':')[0],
        detectedProto: req.get('x-forwarded-proto') || req.protocol,
        trustProxy: app.get('trust proxy'),
        dbInfo,
        headers: req.headers,
        sessionID: req.sessionID,
        hasSession: !!req.session
      });
    });

    // New Session Test Route
    app.get('/api/auth/session-test', (req: any, res) => {
      if (!req.session.views) {
        req.session.views = 0;
      }
      req.session.views++;
      res.json({
        views: req.session.views,
        expires: req.session.cookie.maxAge / 1000 / 60 + " minutes",
        id: req.sessionID
      });
    });
  } else {
    app.get('/api/auth/google', (req, res) => {
      res.status(501).json({ message: "Google Authentication is not configured (missing environment variables)." });
    });
  }

  // Twitter OAuth routes
  if (process.env.TWITTER_CONSUMER_KEY && process.env.TWITTER_CONSUMER_SECRET) {
    app.get('/api/auth/twitter',
      passport.authenticate('twitter')
    );

    app.get('/api/auth/twitter/callback',
      passport.authenticate('twitter', { failureRedirect: '/login' }),
      (req, res) => {
        const isMobile = (req.session as any)?.isMobile || req.query.state === 'mobile';
        if (isMobile) {
          return res.redirect('com.puresoul.app://dashboard');
        }
        res.redirect('/dashboard');
      }
    );
  } else {
    app.get('/api/auth/twitter', (req, res) => {
      res.status(501).json({ message: "Twitter Authentication is not configured (missing environment variables)." });
    });
  }

  // Email/Password routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 12);

      // Create user
      const user = await storage.createUser({
        email,
        passwordHash,
        firstName,
        lastName
      });

      // Fire off a welcome email asynchronously
      import('./email').then(({ sendWelcomeEmail }) => {
        sendWelcomeEmail(email, user.firstName || 'User').catch(console.error);
      });

      // Create auth provider record
      await storage.createAuthProvider({
        userId: user.id,
        provider: 'email',
        providerId: user.id,
        providerEmail: email
      });

      // Log user in
      req.login(user, (err) => {
        if (err) {
          return res.status(500).json({ message: 'Login failed after registration' });
        }
        // SECURITY: Sanitize user data
        res.json({ user: sanitizeUser(user) });
      });
    } catch (error) {
      // SECURITY: Log the error on the server but don't send details to the client
      console.error("[Auth] Registration Error:", error);
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  app.post('/api/auth/login', (req, res, next) => {
    console.log("=== LOGIN ATTEMPT ===", req.body.email);
    passport.authenticate('local', (err: any, user: any, info: any) => {
      console.log("Auth result:", { err, user: user ? user.id : null, info });
      if (err) {
        console.error("LOGIN PASSPORT ERROR:", err);
        return res.status(500).json({ message: 'Authentication error', details: String(err) });
      }
      if (!user) {
        console.log("LOGIN FAILED NO USER:", info);
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          console.error("LOGIN SESSION ERROR:", loginErr);
          return res.status(500).json({ message: 'Login session failed', details: String(loginErr) });
        }
        // SECURITY: Sanitize user data
        res.json({ user: sanitizeUser(user) });
      });
    })(req, res, next);
  });

  // Logout route
  app.post('/api/auth/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        return res.status(500).json({ message: 'Logout failed' });
      }
      res.json({ message: 'Logged out successfully' });
    });
  });

  // Get current user
  app.get('/api/auth/me', (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      // SECURITY: Sanitize user data - never expose passwordHash or Stripe IDs
      res.json({
        user: sanitizeUser(user)
      });
    } else {
      res.status(401).json({ message: 'Not authenticated' });
    }
  });

  // Forgot Password route
  app.post('/api/auth/forgot-password', async (req, res) => {
    try {
      const { email } = forgotPasswordSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);

      // SECURITY: Don't reveal if user exists - always return success to prevent user enumeration
      if (!user) {
        return res.json({ message: "If an account exists with that email, a reset link has been sent." });
      }

      // Generate secure 32-byte token
      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

      await storage.updateUser(user.id, {
        passwordResetToken: token,
        passwordResetExpiresAt: expiresAt
      });

      await sendPasswordResetEmail(email, token);

      res.json({ message: "If an account exists with that email, a reset link has been sent." });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid email address" });
      }
      console.error("[Auth] Forgot Password Error:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });

  // Reset Password route
  app.post('/api/auth/reset-password', async (req, res) => {
    try {
      const { token, password } = resetPasswordSchema.parse(req.body);
      const user = await storage.getUserByResetToken(token);

      if (!user || !user.passwordResetExpiresAt || new Date() > user.passwordResetExpiresAt) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(password, 12);

      // Update user and CLEAR reset fields
      await storage.updateUser(user.id, {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiresAt: null
      });

      res.json({ message: "Password reset successful. You can now log in with your new password." });
    } catch (error: any) {
      if (error.name === 'ZodError') {
        return res.status(400).json({ message: "Invalid input data", errors: error.errors });
      }
      console.error("[Auth] Reset Password Error:", error);
      res.status(500).json({ message: "An unexpected error occurred" });
    }
  });
}

// Auth middleware for protecting routes
export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};
