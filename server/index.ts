import 'dotenv/config';
import analysisRoutes from './routes/analysis';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import activitiesRoutes from './routes/activities';
import { registerVoiceRoutes } from "./voice-routes";
import { setupVite, serveStatic, log } from "./vite";
import { runVoiceCleanupJob } from "./services/voiceCleanup";
import helmet from "helmet";
import cors from "cors";
import plansRouter from './routes/plans';
import goalsRouter from './routes/goals';
import debugRouter from './routes/debug-phase5';
import crisisRouter from './routes/crisis';
import reportsRouter from './routes/reports';
import setupReportsRouter from './routes/setup-reports';
import setupReportsSimpleRouter from './routes/setup-reports-simple';
import debugReportsRouter from './routes/debug-reports';
import analyticsRouter from './routes/analytics';
import setupAnalyticsRouter from './routes/setup-analytics';
import debugAnalyticsRouter from './routes/debug-analytics';
import debugAnalytics2Router from './routes/debug-analytics2';
import debugAnalytics3Router from './routes/debug-analytics3';
import analyticsExportRouter from './routes/analyticsExport';
import patternsRouter from './routes/patterns';
import aiCompanionRouter from './routes/aiCompanion';
import setupPhase8Router from './routes/setup-phase8';
import setupPhase8Feature2Router from './routes/setup-phase8-feature2';
// import therapistPortalRouter from './routes/therapistPortal'; // Removed
import setupPhase8Feature3Router from './routes/setup-phase8-feature3';
import medicationTrackerRouter from './routes/medicationTracker';
import setupPhase8Feature4Router from './routes/setup-phase8-feature4';
import integrationHubRouter from './routes/integrationHub';
import setupPhase8Feature5Router from './routes/setup-phase8-feature5';
import setupPhase8Feature6Router from './routes/setup-phase8-feature6';
import setupGoalsEnhancedRouter from './routes/setup-goals-enhanced';
import womenRouter from './routes/women';
import setupPhase9VoiceRouter from './routes/setup-phase9-voice';
import voiceAnalysisRouter from './routes/voiceAnalysis';
import voiceSettingsRouter from './routes/voiceSettings';
import entriesRouter from './routes/entries';
import viewsRouter from './routes/views';
import feedbackRouter from './routes/feedback';
import prescriptionsRouter from './routes/prescriptions';
import menRouter from './routes/men';

const app = express();

// Trust proxy in production for correctly identifying hostname/protocol behind load balancers
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', true); // Trust all proxies
}

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      mediaSrc: ["'self'", "https://cdn.pixabay.com"],
      objectSrc: ["'none'"],
      frameSrc: ["https://js.stripe.com"],
    },
  },
}));

// CORS configuration - allow same origin + native app schemes
const devOrigins = [
  'http://localhost:5000', 'http://127.0.0.1:5000',
  'http://localhost:3000', 'http://127.0.0.1:3000',
  'http://localhost:4000', 'http://127.0.0.1:4000',
];
const mobileOrigins = ['capacitor://localhost', 'ionic://localhost'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow: no origin (static assets, native apps, curl), localhost in dev, mobile schemes
    if (!origin) return callback(null, true);
    const prodOrigins = (process.env.APP_DOMAINS || '')
      .split(',').filter(Boolean).map(d => `https://${d.trim()}`);
    const allowed = process.env.NODE_ENV === 'production'
      ? [...prodOrigins, ...mobileOrigins]
      : [...devOrigins, ...mobileOrigins];
    if (allowed.includes(origin)) return callback(null, true);
    // In development be permissive; in production block unknown origins
    if (process.env.NODE_ENV !== 'production') return callback(null, true);
    callback(null, false); // silently block — don't throw errors
  },
  credentials: true,
  optionsSuccessStatus: 200,
}));

// Health check endpoint — used by Railway, load balancers, and Capacitor app stores
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString(), version: '1.0.0' });
});


// Body parsers must come before routes
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Request logging - REDACTED for security (no response bodies logged)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Only log request metadata, never response bodies (could contain sensitive data)
      log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

(async () => {
  // Start background jobs
  runVoiceCleanupJob().catch(console.error);
  setInterval(() => runVoiceCleanupJob().catch(console.error), 24 * 60 * 60 * 1000);

  // IMPORTANT: registerRoutes sets up session & passport middleware FIRST
  const server = await registerRoutes(app);

  // Register additional routes AFTER session/passport middleware is initialized
  app.use('/api', analysisRoutes);
  app.use('/api', activitiesRoutes);
  app.use('/api', plansRouter);
  app.use('/api', goalsRouter);
  app.use('/api', crisisRouter);
  app.use('/api', reportsRouter);
  app.use('/api', setupReportsRouter);
  app.use('/api', setupReportsSimpleRouter);
  app.use('/api', debugReportsRouter);
  app.use('/api', analyticsRouter);
  app.use('/api', setupAnalyticsRouter);
  app.use('/api', analyticsExportRouter);
  app.use('/api', patternsRouter);
  app.use('/api', aiCompanionRouter);
  app.use('/api', setupPhase8Router);
  app.use('/api', setupPhase8Feature2Router);
  // app.use('/api', therapistPortalRouter); // Removed
  app.use('/api', setupPhase8Feature3Router);
  app.use('/api', medicationTrackerRouter);
  app.use('/api', setupPhase8Feature4Router);
  app.use('/api', integrationHubRouter);
  app.use('/api', setupPhase8Feature5Router);
  app.use('/api', setupPhase8Feature5Router);
  app.use('/api', setupPhase8Feature6Router);
  app.use('/api', setupGoalsEnhancedRouter);
  app.use('/api', setupPhase9VoiceRouter);
  app.use('/api', voiceAnalysisRouter);
  app.use('/api', voiceSettingsRouter);
  app.use('/api', debugAnalyticsRouter);
  app.use('/api', debugAnalytics2Router);
  app.use('/api', debugAnalytics3Router);
  app.use('/api', entriesRouter);
  app.use('/api', viewsRouter);
  app.use('/api', feedbackRouter);
  app.use('/api/prescriptions', prescriptionsRouter);
  app.use('/api/women', womenRouter);
  app.use('/api/men', menRouter);
  registerVoiceRoutes(app);


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
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
