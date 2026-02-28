# PureSoul

AI-powered self-awareness and personal growth platform for adults 18+.

## Overview

PureSoul provides interactive self-reflection exercises, personality insights, and AI-driven growth journeys. This is an entertainment and educational tool for self-awareness and personal development.

**Important**: This platform does NOT provide medical advice, diagnosis, psychiatric treatment, therapy, or counseling. It is not a substitute for professional mental health services.

## Features

- 🧠 AI-powered self-reflection exercises
- 📊 Personalized growth journeys
- 📈 Progress tracking and insights
- 🎯 Goal setting and achievement tracking
- 💬 Interactive AI conversations
- 🔒 Secure authentication (email/password, Google, Twitter)

## Tech Stack

- **Frontend**: React, TypeScript, Vite, TailwindCSS, Shadcn UI
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **AI**: OpenAI GPT-4
- **Authentication**: Passport.js (Local, Google, Twitter)
- **Real-time**: Socket.io

## Prerequisites

- Node.js 20+
- PostgreSQL 14+
- OpenAI API key

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/puresoul.git
   cd puresoul
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PostgreSQL**
   ```bash
   createdb puresoul
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

5. **Initialize database**
   ```bash
   npm run db:push
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   ```
   http://localhost:3000
   ```

## Environment Variables

See `.env.example` for all required and optional environment variables.

Required:
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `SESSION_SECRET` - Random secret for sessions

Optional:
- OAuth credentials for Google/Twitter
- Stripe keys for payments

## Development

```bash
# Start dev server with hot reload
npm run dev

# Type check
npm run check

# Build for production
npm run build

# Start production server
npm start

# Database management
npm run db:push        # Push schema changes
npm run db:studio      # Open Drizzle Studio
```

## Project Structure

```
puresoul/
├── client/              # React frontend
│   └── src/
│       ├── components/  # UI components
│       ├── pages/       # Page components
│       ├── hooks/       # Custom hooks
│       └── lib/         # Utilities
├── server/              # Express backend
│   ├── index.ts        # Server entry
│   ├── routes.ts       # API routes
│   ├── db.ts           # Database connection
│   ├── openai.ts       # OpenAI integration
│   └── multiAuth.ts    # Authentication
├── shared/             # Shared types & schema
│   └── schema.ts       # Database schema
└── package.json
```

## Security

- All sensitive data is encrypted
- Passwords hashed with bcrypt
- Session-based authentication
- HTTPS required in production
- CORS configured
- Security headers via Helmet.js

## License

MIT

## Support

For issues or questions, please open an issue on GitHub.
