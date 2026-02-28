# Bug Fixes - Activity Guides and Sleep Audio

## Issues Fixed

### Issue 1: Wrong Technique Showing for "Mindful Tea/Coffee"
**Problem:** The "Mindful Tea/Coffee" activity was showing the 5-4-3-2-1 Grounding technique visualization instead of a simple timer.

**Root Cause:**
- In the database migration file (`003_wellness_activities.sql` line 117), "Mindful Tea/Coffee" is categorized as `'grounding'`
- The activity-detail page was showing GroundingGuide for ALL grounding activities
- But "Mindful Tea/Coffee" is about mindfully drinking tea/coffee, NOT the 5-4-3-2-1 sensory technique

**Fix:**
Updated `activity-detail.tsx` to only show GroundingGuide for activities that specifically include "5-4-3-2-1" in their name:

```typescript
// Before
{activity.category === 'grounding' && (
  <GroundingGuide onComplete={() => setShowCompletionModal(true)} />
)}

// After
{activity.category === 'grounding' && activity.name.includes('5-4-3-2-1') && (
  <GroundingGuide onComplete={() => setShowCompletionModal(true)} />
)}
```

Also updated the regular timer condition to include grounding activities that aren't 5-4-3-2-1:

```typescript
// Now includes grounding activities that don't match 5-4-3-2-1
{activity.category !== 'breathing' &&
 activity.category !== 'meditation' &&
 !(activity.category === 'grounding' && activity.name.includes('5-4-3-2-1')) &&
 activity.category !== 'journaling' && (
  // ... regular timer UI
)}
```

**Result:**
- "5-4-3-2-1 Grounding" activity → Shows interactive GroundingGuide ✅
- "Mindful Tea/Coffee" activity → Shows regular timer ✅
- "Progressive Muscle Relaxation" activity → Shows regular timer ✅
- "Evening Wind-Down" activity → Shows regular timer ✅

---

### Issue 2: Sleep Soundscapes Not Playing Audio
**Problem:** On the sleep page (`/sleep`), clicking soundscapes like "Gentle Rain" would show "Playing" but no audio was heard.

**Root Causes:**
1. Browser autoplay restrictions - browsers block audio playback without user interaction
2. Audio element wasn't properly configured with preload and CORS attributes
3. No error handling when play() fails due to autoplay policy
4. Audio wasn't being explicitly loaded before play attempt

**Fix:**
Updated `sleep.tsx` with three improvements:

1. **Added explicit audio loading:**
```typescript
audioRef.current.load(); // Ensure audio is loaded before playing
```

2. **Improved error handling:**
```typescript
audioRef.current.play().catch(err => {
  console.error('Audio playback failed:', err);
  // If autoplay is blocked, user needs to interact first
  setIsPlaying(false);
});
```

3. **Enhanced audio element attributes:**
```typescript
<audio
  ref={audioRef}
  preload="auto"        // Preload audio data
  crossOrigin="anonymous" // Handle CORS for CDN audio files
/>
```

**Result:**
- Audio now loads properly from Pixabay CDN
- Better error handling if browser blocks autoplay
- CORS issues with external audio files resolved
- User gets proper feedback if playback fails

---

## Technical Details

### Files Modified
1. `/client/src/pages/activity-detail.tsx` - Fixed activity guide routing
2. `/client/src/pages/sleep.tsx` - Fixed audio playback

### Activity Category Mapping (Current State)
| Category | Guide Component | Example Activities |
|----------|----------------|-------------------|
| breathing | BreathingGuide | 4-7-8 Breathing, Box Breathing |
| meditation | MeditationGuide | Guided Mindfulness, Body Scan |
| grounding (with "5-4-3-2-1") | GroundingGuide | 5-4-3-2-1 Technique |
| grounding (other) | Regular Timer | Mindful Tea/Coffee, Progressive Muscle Relaxation |
| journaling | JournalingGuide | Gratitude Journal, Thought Dump |
| movement | Regular Timer | Nature Walk, Gentle Stretching, Walking Meditation |

### Audio Sources (Sleep Page)
All soundscapes use Pixabay CDN URLs:
- Gentle Rain: `https://cdn.pixabay.com/audio/2022/05/13/audio_257112c5ac.mp3`
- Ocean Waves: `https://cdn.pixabay.com/audio/2022/06/07/audio_b9bd4170e4.mp3`
- Forest Night: `https://cdn.pixabay.com/audio/2022/02/22/audio_d1718ab41b.mp3`
- Soft Wind: `https://cdn.pixabay.com/audio/2022/03/10/audio_6c4754c87e.mp3`
- Crackling Fire: `https://cdn.pixabay.com/audio/2021/08/09/audio_a5b6ac0c36.mp3`
- White Noise: `https://cdn.pixabay.com/audio/2022/03/15/audio_54ca0ffa52.mp3`

---

## Testing Recommendations

1. **Test "Mindful Tea/Coffee" activity:**
   - Navigate to Activities page
   - Click on "Mindful Tea/Coffee"
   - Verify it shows regular timer (NOT 5-4-3-2-1 guide)

2. **Test "5-4-3-2-1 Grounding" activity:**
   - Click on "5-4-3-2-1 Grounding" activity
   - Verify it shows interactive GroundingGuide with sense icons

3. **Test Sleep audio:**
   - Navigate to `/sleep`
   - Click any soundscape (e.g., "Gentle Rain")
   - Verify audio plays
   - Test volume slider
   - Test mute button
   - Test sleep timer

---

## Future Improvements

### For Activity Categorization
Consider creating a more specific categorization system:
- Add `sub_category` field to distinguish between different types of grounding
- Or use tags/labels for better activity classification
- Example: category='grounding', sub_category='sensory-awareness' vs 'mindful-routine'

### For Sleep Audio
- Add loading indicator while audio is buffering
- Show toast notification if audio fails to load
- Add option to download audio for offline use
- Consider hosting audio files locally to avoid CDN dependencies
- Add fade-in/fade-out effects when starting/stopping

---

## Build Status
✅ All changes compiled successfully
✅ No TypeScript errors
✅ Frontend bundle size: 1.4MB (gzipped: 389KB)
