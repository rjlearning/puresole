# Crisis Support Page - UI Specification

## Page Route: `/crisis-support`

## Layout Structure

```
┌─────────────────────────────────────────────────────────────┐
│  Header: ⚠️ Crisis Support & Resources                      │
│  Subheader: You're not alone. Help is available 24/7.      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🚨 IMMEDIATE DANGER                                         │
│  If you're in immediate danger, call emergency services:    │
│  📞 911 (US) | 999 (UK) | 000 (AU) | 112 (EU)              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🆘 CRISIS HOTLINES                                          │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  988 Suicide & Crisis Lifeline                       │  │
│  │  Free and confidential support 24/7                  │  │
│  │  📞 Call: 988    💬 Text: 988                        │  │
│  │  🌐 Visit Website    ✓ Available in English/Spanish │  │
│  │  [📞 Call Now] [💬 Text Now] [🌐 Visit Website]     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Crisis Text Line                                    │  │
│  │  Free crisis support via text                        │  │
│  │  💬 Text: HELLO to 741741                            │  │
│  │  ✓ Available 24/7                                    │  │
│  │  [💬 Text Now] [Learn More]                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  [Show More Resources ▼]                                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🛡️ MY SAFETY PLAN                                          │
│                                                              │
│  [ ] I don't have a safety plan yet                         │
│  [+ Create My Safety Plan]                                  │
│                                                              │
│  OR (if exists):                                            │
│                                                              │
│  ✅ Safety Plan Created: Jan 15, 2026                       │
│  [📋 View My Plan] [✏️ Edit Plan]                           │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🧘 COPING TECHNIQUES                                        │
│                                                              │
│  Quick techniques to help right now:                        │
│                                                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────┐  │
│  │ 🫁              │ │ 🌳              │ │ 💧          │  │
│  │ Box Breathing   │ │ 5-4-3-2-1      │ │ Cold Water  │  │
│  │ Calm your mind  │ │ Grounding      │ │ Reset panic │  │
│  │ [Start →]       │ │ [Start →]      │ │ [Start →]   │  │
│  └─────────────────┘ └─────────────────┘ └─────────────┘  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  🏥 FIND PROFESSIONAL HELP                                   │
│                                                              │
│  • [Find a Therapist Near You]                              │
│  • [Online Therapy Options]                                 │
│  • [Support Groups in Your Area]                            │
│  • [Mental Health Resources]                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Emergency Banner (Red/Warning)
- **Color**: Red gradient background (#DC2626 to #991B1B)
- **Icon**: 🚨
- **Text**: Large, bold, impossible to miss
- **Action**: Shows emergency numbers based on detected country

### 2. Crisis Hotline Cards
- **Layout**: Stacked cards with clear hierarchy
- **Elements per card**:
  - Name (large, bold)
  - Description (1-2 lines)
  - Contact methods (phone, text, web)
  - Language availability
  - Action buttons (Call/Text/Visit)
- **Interaction**:
  - Click phone number → `tel:` link (mobile friendly)
  - Click text number → `sms:` link
  - Click website → Open in new tab
- **Expandable**: "Show More Resources" reveals additional hotlines

### 3. Safety Plan Section
- **If no plan exists**:
  - Empty state with checkbox icon
  - Clear CTA: "Create My Safety Plan"
  - Brief explanation of what a safety plan is
- **If plan exists**:
  - Show creation date
  - Quick preview of 2-3 items
  - Actions: View full plan, Edit, or Share with therapist

### 4. Quick Coping Techniques
- **Layout**: 3-column grid (responsive to 1 column on mobile)
- **Each technique**:
  - Icon/emoji
  - Name
  - 1-line description
  - "Start →" button
- **Interaction**: Opens modal/page with guided instructions

### 5. Professional Help Links
- **Layout**: Simple list with clear icons
- **Links**:
  - Internal: /find-therapist (Phase 6 Week 4)
  - External: Psychology Today, BetterHelp, etc.

---

## State Management

### API Calls
1. **On page load**:
   ```javascript
   fetch('/api/crisis/resources?country=' + detectedCountry)
   ```

2. **Get user's safety plan** (if authenticated):
   ```javascript
   fetch('/api/crisis/safety-plan')
   ```

3. **Get country from IP** (optional):
   - Use a geolocation API or browser navigator
   - Default to US if unavailable

### Local State
```typescript
interface CrisisPageState {
  country: string; // 'US', 'CA', etc.
  resources: CrisisResource[];
  safetyPlan: SafetyPlan | null;
  isLoading: boolean;
  showAllResources: boolean;
}
```

---

## Accessibility (CRITICAL)

### ARIA Labels
- All clickable elements must have descriptive labels
- Crisis numbers must be announced properly by screen readers
- Focus management for keyboard navigation

### Keyboard Navigation
- Tab through all interactive elements
- Enter/Space to activate buttons
- Escape to close modals

### Color Contrast
- WCAG AAA compliance for all text
- Don't rely on color alone (use icons too)

### Screen Reader Support
- Announce emergency status immediately
- Read hotline information clearly
- Provide alternative text for all icons

---

## Mobile Considerations

### Phone Links
- Use `tel:` protocol for phone numbers
- Use `sms:` protocol for SMS numbers
- Pre-populate text message if possible:
  ```html
  <a href="sms:741741&body=HELLO">Text Now</a>
  ```

### Touch Targets
- Minimum 44x44px touch targets
- Extra padding around buttons
- Large, easy-to-tap action buttons

### Responsive Layout
- Stack cards vertically on mobile
- Large text for readability
- Fixed emergency banner at top

---

## Privacy & Security

### No Tracking
- Do NOT track which resources users click
- Do NOT log crisis page visits
- Respect user privacy in vulnerable moment

### Incognito Mode
- Must work without authentication
- No session requirements
- No "you must log in" barriers

### Data Sensitivity
- Safety plans are private (authentication required)
- Crisis resources are public
- Never share user's crisis page activity

---

## Performance

### Critical CSS
- Inline critical styles for instant render
- No delay loading emergency information
- Optimize for slow connections

### Offline Support (Future)
- Service worker to cache crisis resources
- Available even without internet
- Local storage for safety plan backup

---

## Testing Checklist

- [ ] Emergency banner displays correctly
- [ ] Crisis hotlines load for all countries
- [ ] Phone numbers are clickable (tel: links work)
- [ ] Text numbers are clickable (sms: links work)
- [ ] Website links open in new tab
- [ ] Safety plan creation works
- [ ] Safety plan displays after creation
- [ ] Coping techniques are accessible
- [ ] Page is keyboard navigable
- [ ] Screen reader announces content properly
- [ ] Mobile layout is responsive
- [ ] Touch targets are large enough
- [ ] Works without authentication
- [ ] No console errors

---

## Visual Design Notes

### Color Palette
- **Emergency**: Red (#DC2626)
- **Crisis Hotlines**: Blue (#2563EB) - calm, trustworthy
- **Safety Plan**: Green (#059669) - growth, safety
- **Coping Techniques**: Purple (#7C3AED) - calming
- **Professional Help**: Teal (#0891B2) - healing

### Typography
- **Headlines**: Large, bold (24-32px)
- **Body**: Readable, clear (16-18px)
- **Action Text**: Bold, high contrast

### Spacing
- Generous whitespace
- Clear visual separation between sections
- No clutter - every element has purpose

---

## Implementation Priority

1. **Week 1** ✅: Backend API (complete)
2. **Week 1** ⏳: Crisis resources display (next)
3. **Week 1** ⏳: Safety plan creation form
4. **Week 2**: Coping technique modals
5. **Week 3**: Professional help links
6. **Week 4**: Therapist finder integration

---

This page could save lives. Build it with care. 💙
