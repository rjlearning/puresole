import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as TwitterStrategy } from "passport-twitter";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";
import type { Express, RequestHandler } from "express";
import { storage } from "./storage";
import { sanitizeUser } from "./routes";

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
  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    console.warn("Google OAuth not configured - missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET");
    return;
  }

  const callbackURL = "/api/auth/google/callback";

  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    callbackURL: callbackURL,
    proxy: true // Trust reverse proxy for correctly building the absolute URL (HTTPS)
  }, async (accessToken, refreshToken, profile, done) => {
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
    app.get('/api/auth/google',
      passport.authenticate('google', { scope: ['profile', 'email'] })
    );

    app.get('/api/auth/google/callback',
      passport.authenticate('google', { failureRedirect: '/login' }),
      (req, res) => {
        // Support mobile deep linking if requested via state or session
        const isMobile = (req.session as any)?.isMobile || req.query.state === 'mobile';
        if (isMobile) {
          return res.redirect('com.puresoul.app://dashboard');
        }
        res.redirect('/dashboard');
      }
    );
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
    console.log("=== LOGIN ATTEMPT ===", req.body);
    passport.authenticate('local', (err: any, user: any, info: any) => {
      console.log("Auth result:", { err, user, info });
      if (err) {
        console.error("LOGIN ERROR:", err);
        return res.status(500).json({ message: 'Authentication error' });
      }
      if (!user) {
        return res.status(401).json({ message: info?.message || 'Invalid credentials' });
      }

      req.login(user, (loginErr) => {
        if (loginErr) {
          return res.status(500).json({ message: 'Login failed' });
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
}

// Auth middleware for protecting routes
export const requireAuth: RequestHandler = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Authentication required' });
};
