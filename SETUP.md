# Quick Setup Guide

## One-Time Setup (5 minutes)

### 1. Install nvm
```bash
# macOS/Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

# Restart terminal after installation
```

### 2. Install Expo Go on your phone
- **iOS**: Search "Expo Go" in App Store
- **Android**: Search "Expo Go" in Play Store

---

## Every Time (30 seconds)

```bash
# Navigate to project
cd homecook

# Use correct Node version
nvm use

# Install dependencies (first time only)
npm install

# Start development server
npm start
```

**Scan QR code** with your phone camera (iOS) or Expo Go app (Android)

---

## Verify Everything Works

After running `npm start`, you should see:
1. Metro bundler starts
2. QR code appears in terminal
3. Scan QR code on phone
4. App opens showing landing page with:
   - 🍳 Logo
   - "HomeCook" title
   - 3 feature cards
   - Blue "Get Started" button

---

## Common Issues

**"nvm: command not found"**
- Restart your terminal after installing nvm
- Or run: `source ~/.nvm/nvm.sh`

**"Module not found"**
```bash
rm -rf node_modules package-lock.json
npm install
```

**"Wrong Node version"**
```bash
nvm install 22.12.0
nvm use
```

**Metro bundler issues**
```bash
npm start -- --clear
```

---

## What's Included

✅ React Native + Expo (latest stable)
✅ TypeScript (strict mode)
✅ NativeWind (Tailwind CSS)
✅ Expo Router (file-based routing)
✅ Version control (.nvmrc, .editorconfig)
✅ Dark-themed landing page
✅ Team-ready setup

---

## Next Steps

Once the landing page works:
1. Add Supabase for backend
2. Build authentication screens
3. Create calendar view
4. Add recipe management
5. Implement shopping lists

See README.md for detailed documentation.
