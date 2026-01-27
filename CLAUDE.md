# Homecook

A meal planning app for households built with Expo and React Native.

## Tech Stack

- **Framework**: Expo SDK 52 with Expo Router v4
- **Language**: TypeScript
- **Styling**: NativeWind v4 (Tailwind CSS for React Native)
- **Backend**: Supabase (TODO: integrate)
- **State Management**: TBD

## Project Structure

```
homecook/
├── app/                    # Expo Router file-based routing
│   ├── _layout.tsx         # Root layout
│   └── index.tsx           # Landing/login screen
├── components/             # Reusable UI components
│   └── SocialLoginButton.tsx
├── global.css              # Tailwind directives and custom classes
├── tailwind.config.js      # Tailwind/NativeWind configuration
└── CLAUDE.md               # This file
```

## Commands

```bash
# Development
npx expo start              # Start dev server
npx expo start --clear      # Start with cache cleared

# Run on specific platform
npx expo start --ios
npx expo start --android
```

## Code Style

- Use NativeWind className for styling (not StyleSheet)
- Keep components small and focused
- Use the `@/` path alias for imports from project root

## Design System

Uses Material Design dark theme colors defined in `tailwind.config.js`:

- **Primary**: `#BB86FC` (purple)
- **Secondary**: `#03DAC6` (teal)
- **Background**: `#121212`
- **Surface levels**: `surface-1` through `surface-5` (progressively lighter)
- **Text**: `text-high` (87%), `text-medium` (60%), `text-disabled` (38%)

## Current Tasks

- [ ] Integrate Supabase for authentication
- [ ] Implement Google OAuth
- [ ] Implement Facebook OAuth
- [ ] Implement email/password auth
- [ ] Create home screen after login

## Supabase Setup (TODO)

1. Install: `npx expo install @supabase/supabase-js`
2. Create `lib/supabase.ts` with client initialization
3. Add environment variables to `.env`
4. Set up auth providers in Supabase dashboard
