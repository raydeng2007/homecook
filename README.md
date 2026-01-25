# HomeCook - Recipe Planning App

A minimalist mobile app for collaborative meal planning, recipe management, and shopping list generation.

---

## 🚀 Quick Start (Team Onboarding)

### Prerequisites

1. **Install nvm (Node Version Manager)**
   ```bash
   # macOS/Linux
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
   
   # Then restart your terminal
   ```

2. **Install Expo Go on your phone**
   - iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
   - Android: [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent)

### Setup (5 minutes)

```bash
# 1. Clone the repo
git clone <your-repo-url>
cd homecook

# 2. Use correct Node version (auto-reads .nvmrc)
nvm install
nvm use

# 3. Install dependencies
npm install

# 4. Start development server
npm start
```

**That's it!** Scan the QR code with your phone to see the app.

---

## 📱 Running the App

### Development Mode

```bash
npm start
```

Then choose your platform:
- **Physical device**: Scan QR code with Expo Go (recommended for development)
- **iOS Simulator**: Press `i` (macOS only, requires Xcode)
- **Android Emulator**: Press `a` (requires Android Studio)
- **Web**: Press `w`

### Platform-Specific Commands

```bash
npm run ios       # Open iOS simulator directly
npm run android   # Open Android emulator directly
npm run web       # Open in browser
```

---

## 🛠️ Tech Stack

### Core
- **React Native** - Mobile framework
- **Expo** - Build toolchain and development platform
- **TypeScript** - Type safety

### UI
- **NativeWind** - Tailwind CSS for React Native
- **Expo Router** - File-based navigation

### Backend (to be added)
- **Supabase** - PostgreSQL database + Auth + Real-time

---

## 📂 Project Structure

```
homecook/
├── app/                    # Routes (Expo Router)
│   ├── _layout.tsx        # Root layout
│   └── index.tsx          # Landing page
├── assets/                # Images, fonts, etc.
├── .nvmrc                 # Node version (22.12.0)
├── .editorconfig          # Editor consistency
├── package.json           # Dependencies
├── tailwind.config.js     # Tailwind configuration
└── tsconfig.json          # TypeScript config
```

---

## 👥 Team Development Guidelines

### Node Version Management

**Always use the correct Node version:**
```bash
# Check current version
node -v  # Should show: v22.12.0

# If wrong version:
nvm use
```

**Pro tip:** Add this to your shell profile (`~/.zshrc` or `~/.bashrc`):
```bash
# Auto-switch Node version when entering directory
autoload -U add-zsh-hook
load-nvmrc() {
  if [[ -f .nvmrc ]]; then
    nvm use
  fi
}
add-zsh-hook chpwd load-nvmrc
load-nvmrc
```

### Version Control

- ✅ `.nvmrc` ensures everyone uses Node 22.12.0
- ✅ `.node-version` for compatibility with other version managers
- ✅ `package.json` has `engines` field to enforce Node version
- ✅ `.editorconfig` ensures consistent code formatting
- ✅ `.gitignore` prevents committing unnecessary files

### Package Management

```bash
# Install new package
npm install <package-name>

# Install dev dependency
npm install -D <package-name>

# Update all packages
npm update

# Check for outdated packages
npm outdated
```

**Important:** Always commit `package-lock.json` - it ensures everyone has identical dependencies.

---

## 🎨 Styling with Tailwind (NativeWind)

NativeWind allows you to use Tailwind classes in React Native:

```tsx
// Traditional StyleSheet
<View style={styles.container}>
  <Text style={styles.title}>Hello</Text>
</View>

// With NativeWind (Tailwind)
<View className="flex-1 bg-zinc-950 items-center justify-center">
  <Text className="text-white text-2xl font-bold">Hello</Text>
</View>
```

**Full Tailwind documentation:** https://tailwindcss.com/docs

**NativeWind-specific docs:** https://www.nativewind.dev/

---

## 🐛 Troubleshooting

### "Node version mismatch"
```bash
nvm use
```

### "Metro bundler won't start"
```bash
# Clear cache and restart
npm start -- --clear
```

### "Changes not reflecting"
```bash
# Reload the app
# In Expo Go: Shake device → Tap "Reload"
# In terminal: Press 'r'
```

### "Package installation fails"
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### "iOS simulator won't open"
```bash
# Make sure Xcode is installed
xcode-select --install

# Open simulator manually first
open -a Simulator

# Then press 'i' in the terminal
```

---

## 📚 Learning Resources

- [React Native Docs](https://reactnative.dev/docs/getting-started)
- [Expo Docs](https://docs.expo.dev/)
- [Expo Router](https://docs.expo.dev/router/introduction/)
- [NativeWind Docs](https://www.nativewind.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## 🚧 Roadmap

- [x] Landing page with Tailwind
- [ ] Authentication screens
- [ ] Supabase integration
- [ ] Calendar view
- [ ] Recipe management
- [ ] Shopping list generation
- [ ] Multi-user homes

---

## 📝 Contributing

1. Make sure you're on the correct Node version: `nvm use`
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Test on both iOS and Android
5. Commit and push
6. Open a pull request

---

## ⚙️ Environment Variables

Create `.env` file in root (ignored by git):

```bash
# Will be used later for Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_key
```

**Note:** Expo only exposes variables with `EXPO_PUBLIC_` prefix to the client.

---

## 📄 License

Private - Not for distribution

---

## 🆘 Need Help?

- Check existing issues in the repo
- Ask in team chat
- Read the [Expo documentation](https://docs.expo.dev/)
