# Content Security Policy (CSP) Fix for Sleep Audio

## Issue
Sleep soundscapes were blocked by Content Security Policy with this error:
```
Loading media from 'https://cdn.pixabay.com/audio/2022/05/13/audio_257112c5ac.mp3'
violates the following Content Security Policy directive: "default-src 'self'".
Note that 'media-src' was not explicitly set, so 'default-src' is used as a fallback.
```

## Root Cause
The server's CSP configuration in `server/index.ts` didn't have a `mediaSrc` directive, so it fell back to `defaultSrc: ["'self']`, which only allows same-origin media files.

## Fix Applied
Added `mediaSrc` directive to allow audio from Pixabay CDN:

```typescript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com"],
      mediaSrc: ["'self'", "https://cdn.pixabay.com"],  // ← ADDED THIS LINE
      objectSrc: ["'none'"],
      frameSrc: ["https://js.stripe.com"],
    },
  },
}));
```

## Required Action
**You MUST restart the development server** for the CSP changes to take effect:

1. Stop the current server (Ctrl+C in the terminal)
2. Run `npm run dev` again
3. Refresh the browser
4. Navigate to `/sleep` and click a soundscape
5. Audio should now play! 🎵

## What This Allows
- ✅ Audio files from `https://cdn.pixabay.com/*`
- ✅ Audio files from same origin (self)
- ❌ Audio from other domains (still blocked for security)

## Security Note
This change only allows audio from Pixabay CDN, which is safe and expected for the sleep soundscapes feature. All other external media sources remain blocked.
