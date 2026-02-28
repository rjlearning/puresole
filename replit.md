# Overview

PureSoul is an AI-powered self-awareness and personal growth platform designed for adults 18+. The application provides interactive self-reflection exercises, personality insights, and AI-driven growth journeys. Built as a full-stack web application focused on self-discovery and personal development.

**Platform Model**: Entertainment and educational tool for self-awareness and personal growth. This is NOT medical advice, therapy, or mental health treatment. Users engage in AI-powered conversations, complete self-reflection exercises, and receive personalized insights for their personal growth journey.

**Important Legal Positioning**: This platform does NOT provide medical advice, diagnosis, psychiatric treatment, therapy, or counseling. It is not a substitute for professional mental health services. All content is for educational and entertainment purposes only.

# User Preferences

Preferred communication style: Simple, everyday language.

# Design Principles

**Simple & Vibrant Design for Personal Growth**: The application prioritizes:
- Clean, vibrant gradient design (purple/teal color scheme)
- Honest, straightforward communication
- Supportive language focused on self-discovery and personal growth
- Clear disclaimers that this is NOT medical advice
- 18+ age verification to ensure legal compliance

**Recent Updates** (November 2024):
- Maintained "PureSoul" branding (user has registered domain for this name)
- Shifted positioning from mental health treatment to AI self-awareness & personal growth
- Updated color scheme to vibrant purple/teal gradients (from medical blue)
- Removed all medical terminology: "assessments" → "self-reflection", "treatment" → "growth journeys"
- Added strong "NOT medical advice" disclaimers throughout the site
- Implemented 18+ age gate with localStorage persistence
- Updated navigation labels: "Assessment" → "Self-Reflection", "Dashboard" → "My Journey"
- Created new gradient logo design replacing old PureSoul branding
- Enhanced hero slider with self-awareness and personal growth messaging
- Completely rewrote landing page copy to focus on self-discovery, not therapy

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite for build tooling
- **Routing**: Wouter for client-side routing with protected route patterns
- **State Management**: TanStack Query for server state and caching
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with CSS custom properties for theming
- **Form Handling**: React Hook Form with Zod validation schemas

## Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ESM module system
- **API Design**: RESTful endpoints with structured error handling
- **Authentication**: Replit Auth integration with session-based authentication
- **Middleware**: Request logging, JSON parsing, and authentication guards

## Database Design
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Database**: Neon serverless PostgreSQL with connection pooling
- **Schema**: Relational design with tables for users, assessments, conversational assessments, treatment plans, modules, progress tracking, crisis alerts, subscriptions, and audit logs
- **Session Storage**: PostgreSQL-backed session store for authentication persistence
- **Migrations**: Schema versioning through Drizzle Kit migration system (`npm run db:push --force` to sync schema changes)

## AI Integration
- **Provider**: OpenAI GPT-5 integration for self-reflection analysis and growth journey generation
- **Capabilities**: 
  - Self-reflection exercise interpretation and insights
  - Personalized growth journey creation with structured modules
  - Progress analysis and recommendation adjustments
  - Personality insights and pattern recognition

## Authentication & Authorization
- **Methods**: Multiple auth providers supported:
  - Replit Auth (primary): OpenID Connect integration
  - Email/Password: Passport Local Strategy with bcrypt hashing
  - Google OAuth: Optional Google authentication
  - Twitter OAuth: Optional Twitter authentication
- **Session Management**: Server-side sessions with PostgreSQL storage
- **Unified Auth Middleware**: Handles both Replit Auth and Passport-based authentication
- **Role-Based Access**: Admin privileges for crisis management and user oversight
- **Security**: HTTPS enforcement, secure cookie configuration, session TTL management

## Security & Privacy Architecture

**Critical Security Requirements**: User mandated "Don't leak any information lock it down" - maximum security and privacy protection.

**Comprehensive Security Implementation** (November 2024):

1. **Data Sanitization System**:
   - `sanitizeUser()`: Removes passwordHash, stripeCustomerId, stripeSubscriptionId
   - `sanitizeSubscription()`: Removes all Stripe IDs (customer, subscription, price, product)
   - `sanitizePlan()`: Removes Stripe price and product IDs
   - `sanitizePayment()`: Removes Stripe payment intent and invoice IDs
   - `sanitizeData()`: Recursive sanitization for nested objects and arrays
   - Applied to ALL API responses across authentication, admin, subscription, and billing endpoints

2. **Stripe Data Protection** (PCI Compliance):
   - Zero Stripe identifiers exposed to clients
   - Protected fields: stripeCustomerId, stripeSubscriptionId, stripePriceId, stripeProductId, stripePaymentIntentId, stripeInvoiceId
   - All billing and subscription data sanitized before transmission

3. **Security Headers & Middleware**:
   - Helmet.js with Content Security Policy (CSP)
   - CORS restricted to same-origin only
   - Session cookies with sameSite: 'lax' for CSRF protection
   - Secure cookie flags in production
   - HTTP security headers (X-Content-Type-Options, X-Frame-Options, etc.)

4. **Logging & Error Handling**:
   - Response logging metadata-only (no JSON bodies)
   - All console.error() calls removed to prevent sensitive data leakage
   - Structured error messages without exposing internal details
   - Audit logging for admin actions and critical operations

5. **Input Validation**:
   - Zod schema validation on all endpoints
   - Required field validation for support tickets and forms
   - Type safety enforced throughout TypeScript codebase

6. **Protected Endpoints**:
   - Authentication required for all sensitive operations
   - Admin-only routes with role-based access control
   - Subscription validation before premium feature access

## Note on Backend Schema
- **Legacy Naming**: The backend database schema still uses medical terminology (assessments, treatmentPlans, crisisAlerts) but these now represent self-reflection exercises, growth journeys, and support resources respectively
- **Frontend Terminology**: All user-facing labels have been updated to reflect the new positioning as a personal growth platform

# External Dependencies

## Core Infrastructure
- **Database**: Neon PostgreSQL serverless database
- **Authentication**: Replit Auth service with OAuth 2.0/OpenID Connect
- **AI Services**: OpenAI API for GPT-5 model access
- **Session Storage**: PostgreSQL-backed session management

## Development Tools
- **Build System**: Vite with React plugin and TypeScript support
- **Code Quality**: ESLint, TypeScript compiler, and Prettier formatting
- **Development Environment**: Replit-specific development plugins and error overlays

## UI Component Libraries
- **Base Components**: Radix UI primitives for accessibility-compliant components
- **Icons**: Lucide React icon library
- **Styling**: Tailwind CSS with PostCSS processing
- **Typography**: Google Fonts (Inter, Geist Mono, Architects Daughter, DM Sans, Fira Code)

## Runtime Dependencies
- **HTTP Client**: Native fetch API with credential support
- **Form Validation**: Zod schema validation with React Hook Form integration
- **Date Handling**: date-fns for date manipulation and formatting
- **Utilities**: Class variance authority for component styling, clsx for conditional classes