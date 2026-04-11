# HomeCook QA Test Plan

**App Version:** Pre-release (App Store Submission)
**Date:** 2026-03-04
**Platform:** iOS / Android / Web (Expo SDK 52, React Native)
**Backend:** Supabase (Auth, Database, RPC)

---

## Table of Contents

1. [Authentication - Login Screen](#1-authentication---login-screen)
2. [Authentication - Email Sign In](#2-authentication---email-sign-in)
3. [Authentication - Email Sign Up](#3-authentication---email-sign-up)
4. [Authentication - Email Confirmation](#4-authentication---email-confirmation)
5. [Authentication - Session and Routing](#5-authentication---session-and-routing)
6. [Home Screen - Calendar and Meal Plans](#6-home-screen---calendar-and-meal-plans)
7. [Home Screen - Month Calendar Grid](#7-home-screen---month-calendar-grid)
8. [Home Screen - Week Calendar Strip](#8-home-screen---week-calendar-strip)
9. [Home Screen - Meal Plan List](#9-home-screen---meal-plan-list)
10. [Add Meal Modal - Step 1 (Recipe Selection)](#10-add-meal-modal---step-1-recipe-selection)
11. [Add Meal Modal - Step 2 (Serving Adjustment)](#11-add-meal-modal---step-2-serving-adjustment)
12. [Cookbook Screen - Public Tab](#12-cookbook-screen---public-tab)
13. [Cookbook Screen - Personal Tab](#13-cookbook-screen---personal-tab)
14. [Cookbook Screen - Search](#14-cookbook-screen---search)
15. [Cookbook Screen - Bookmarking](#15-cookbook-screen---bookmarking)
16. [Recipe Detail Screen](#16-recipe-detail-screen)
17. [Recipe Detail - Serving Stepper and Portion Scaling](#17-recipe-detail---serving-stepper-and-portion-scaling)
18. [Recipe Detail - Ingredients and Instructions Tabs](#18-recipe-detail---ingredients-and-instructions-tabs)
19. [Create Recipe Screen](#19-create-recipe-screen)
20. [Edit Recipe Screen](#20-edit-recipe-screen)
21. [Shopping List Screen](#21-shopping-list-screen)
22. [Shopping List - Item Interactions](#22-shopping-list---item-interactions)
23. [Household Screen - Home Info](#23-household-screen---home-info)
24. [Household Screen - Invite Code System](#24-household-screen---invite-code-system)
25. [Household Screen - Join Household Modal](#25-household-screen---join-household-modal)
26. [Household Screen - Member Management](#26-household-screen---member-management)
27. [Household Screen - Leave Household](#27-household-screen---leave-household)
28. [Household Screen - Preferences and Theme](#28-household-screen---preferences-and-theme)
29. [Household Screen - Account Management](#29-household-screen---account-management)
30. [Navigation - Tab Bar](#30-navigation---tab-bar)
31. [Error Handling and Edge Cases](#31-error-handling-and-edge-cases)
32. [Performance and Loading States](#32-performance-and-loading-states)
33. [Accessibility](#33-accessibility)
34. [Cross-Platform Consistency](#34-cross-platform-consistency)

---

## 1. Authentication - Login Screen

**Screen:** `app/(auth)/login.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-001 | Login screen renders correctly | 1. Launch app without an active session | Login screen displays with "the Homecook" title, animated logo, and three social login buttons (Google, Facebook, Email) | - [ ] |
| TC-002 | Logo wobble animation plays | 1. Open login screen 2. Observe the logo | Logo gently wobbles with rotation (-4deg to +4deg) and slight scale (0.97 to 1.0) after a 600ms delay | - [ ] |
| TC-003 | Google login button initiates OAuth | 1. Tap "Continue with Google" button | OAuth browser session opens with Google sign-in page | - [ ] |
| TC-004 | Google login success redirects to app | 1. Tap "Continue with Google" 2. Complete Google sign-in | Browser closes, user is redirected to Home tab (app) | - [ ] |
| TC-005 | Google login cancellation handled | 1. Tap "Continue with Google" 2. Cancel/close the OAuth browser | User returns to login screen, no crash, no error alert | - [ ] |
| TC-006 | Google login error shows alert | 1. Tap "Continue with Google" 2. Trigger an error (e.g., network off) | Alert displays with "Login Error" title and error message | - [ ] |
| TC-007 | Facebook login button initiates OAuth | 1. Tap "Continue with Facebook" button | OAuth browser session opens with Facebook sign-in page | - [ ] |
| TC-008 | Facebook login success redirects to app | 1. Tap "Continue with Facebook" 2. Complete Facebook sign-in | Browser closes, user is redirected to Home tab | - [ ] |
| TC-009 | Facebook login cancellation handled | 1. Tap "Continue with Facebook" 2. Cancel/close the browser | User returns to login screen, no crash | - [ ] |
| TC-010 | Facebook login error shows alert | 1. Tap "Continue with Facebook" 2. Trigger an error | Alert displays with "Login Error" title and error message | - [ ] |
| TC-011 | Email login button navigates to email sign-in | 1. Tap "Continue with Email" button | Navigates to Email Sign In screen at `/(auth)/email-sign-in` | - [ ] |

---

## 2. Authentication - Email Sign In

**Screen:** `app/(auth)/email-sign-in.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-012 | Email sign-in screen renders | 1. Navigate to email sign-in screen | Screen shows "Sign In" heading, subtitle, email input, password input, Sign In button, and sign-up link | - [ ] |
| TC-013 | Back button navigates to login | 1. Tap the back chevron button | User returns to the main login screen | - [ ] |
| TC-014 | Email field accepts input | 1. Tap email field 2. Type a valid email | Email text appears, keyboard opens with email-address type | - [ ] |
| TC-015 | Email field validates on blur - empty | 1. Tap email field 2. Tap away without entering text | "Email is required" error message appears below the field | - [ ] |
| TC-016 | Email field validates on blur - invalid format | 1. Type "notanemail" in email field 2. Tap away | "Please enter a valid email address" error message appears | - [ ] |
| TC-017 | Email field clears error on input | 1. Trigger email error 2. Start typing in email field | Error message disappears | - [ ] |
| TC-018 | Password field accepts input with secure entry | 1. Tap password field 2. Type a password | Password text is masked (dots/asterisks) | - [ ] |
| TC-019 | Password field validates on blur - empty | 1. Tap password field 2. Tap away without entering text | "Password is required" error message appears | - [ ] |
| TC-020 | Sign In button disabled when form incomplete | 1. Leave email or password empty | Sign In button appears visually disabled and does not trigger submission | - [ ] |
| TC-021 | Successful email sign-in | 1. Enter valid email 2. Enter correct password 3. Tap Sign In | Loading spinner appears on button, then user is redirected to Home tab | - [ ] |
| TC-022 | Invalid credentials error | 1. Enter valid email 2. Enter wrong password 3. Tap Sign In | Error banner displays "Invalid email or password", password field is cleared | - [ ] |
| TC-023 | Unconfirmed email error | 1. Enter email that needs confirmation 2. Enter password 3. Tap Sign In | Error banner displays "Please confirm your email before signing in" | - [ ] |
| TC-024 | Network error handling | 1. Turn off network 2. Try to sign in | Error banner displays "Network error. Please check your connection" | - [ ] |
| TC-025 | Rate limiting error | 1. Attempt many rapid sign-ins | Error banner displays "Too many attempts. Please try again later" | - [ ] |
| TC-026 | "Don't have an account?" link navigates to sign up | 1. Tap "Sign Up" text link | Navigates to email-sign-up screen (replaces current screen) | - [ ] |
| TC-027 | Keyboard avoiding view works on iOS | 1. Tap an input field at bottom of screen on iOS | Screen content shifts up to keep input visible above keyboard | - [ ] |
| TC-028 | Scroll view handles keyboard taps | 1. Open keyboard 2. Tap on a button behind the keyboard area | Tap registers correctly (keyboardShouldPersistTaps="handled") | - [ ] |

---

## 3. Authentication - Email Sign Up

**Screen:** `app/(auth)/email-sign-up.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-029 | Sign up screen renders | 1. Navigate to email sign-up | Screen shows "Create Account" heading, full name input, email input, password input, confirm password input, Create Account button, sign-in link | - [ ] |
| TC-030 | Back button navigates correctly | 1. Tap the back button | Returns to previous screen | - [ ] |
| TC-031 | Full Name is optional | 1. Leave Full Name empty 2. Fill other fields correctly 3. Tap Create Account | Form submits without error for the name field | - [ ] |
| TC-032 | Full Name validates minimum length | 1. Type "A" (1 character) in full name 2. Tap away | "Name must be at least 2 characters" error appears | - [ ] |
| TC-033 | Email validates on blur | 1. Type invalid email 2. Tap away | "Please enter a valid email address" error appears | - [ ] |
| TC-034 | Password validates minimum length | 1. Type "short" (5 chars) in password 2. Tap away | "Password must be at least 8 characters" error appears | - [ ] |
| TC-035 | Confirm password validates match | 1. Type "password1" in password 2. Type "password2" in confirm 3. Tap away | "Passwords do not match" error appears on confirm field | - [ ] |
| TC-036 | Confirm password re-validates when password changes | 1. Type matching passwords 2. Change the password field | Confirm password error updates if they no longer match | - [ ] |
| TC-037 | Create Account button disabled when form invalid | 1. Leave fields empty or mismatched passwords | Button appears disabled | - [ ] |
| TC-038 | Successful sign-up with email confirmation | 1. Fill all fields correctly 2. Tap Create Account | Navigates to email-confirmation screen with the entered email | - [ ] |
| TC-039 | Successful sign-up without confirmation needed | 1. Fill all fields 2. Tap Create Account (when Supabase auto-confirms) | User is redirected to Home tab automatically | - [ ] |
| TC-040 | Duplicate email error | 1. Enter an already-registered email 2. Complete form 3. Tap Create Account | Error banner shows "An account with this email already exists" | - [ ] |
| TC-041 | "Already have an account?" link navigates | 1. Tap "Sign In" text link | Navigates to email-sign-in screen (replaces current) | - [ ] |

---

## 4. Authentication - Email Confirmation

**Screen:** `app/(auth)/email-confirmation.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-042 | Confirmation screen renders with email | 1. Complete sign-up that requires confirmation | Screen shows email icon, "Check Your Inbox" heading, the user's email address, and instructions | - [ ] |
| TC-043 | Resend button works | 1. Tap "Resend Confirmation Email" | Loading state appears, then success banner "Confirmation email sent!" | - [ ] |
| TC-044 | Resend cooldown timer | 1. Tap resend 2. Observe button text | Button becomes disabled and shows "Resend in 60s" with countdown timer | - [ ] |
| TC-045 | Resend cannot be tapped during cooldown | 1. During cooldown, tap the resend button | Nothing happens, button remains disabled | - [ ] |
| TC-046 | Resend error handling | 1. Turn off network 2. Tap resend | Error banner shows "Failed to resend email" | - [ ] |
| TC-047 | Back to Login link works | 1. Tap "Login" text link | Navigates to main login screen (replaces current) | - [ ] |

---

## 5. Authentication - Session and Routing

**Screen:** `app/_layout.tsx`, `app/index.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-048 | No session redirects to login | 1. Launch app with no stored session | User sees the login screen at `/(auth)/login` | - [ ] |
| TC-049 | Active session redirects to app | 1. Launch app with a stored valid session | User sees the Home tab at `/(app)` | - [ ] |
| TC-050 | Session expiry redirects to login | 1. Be logged in 2. Let session expire/invalidate | User is redirected to login screen | - [ ] |
| TC-051 | AuthProvider loading state | 1. Launch app cold | A loading state (no flash of wrong screen) displays while session is being checked | - [ ] |
| TC-052 | ErrorBoundary catches crashes | 1. Trigger a React crash (dev only) | ErrorBoundary shows "Something went wrong" with "Try Again" button instead of blank screen | - [ ] |
| TC-053 | ErrorBoundary try again button works | 1. On error screen, tap "Try Again" | Error state clears and app attempts to re-render normally | - [ ] |

---

## 6. Home Screen - Calendar and Meal Plans

**Screen:** `app/(app)/index.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-054 | Home screen renders with greeting | 1. Navigate to Home tab | Screen shows "Welcome back," and "Chef" header text | - [ ] |
| TC-055 | Calendar defaults to current month | 1. Open Home tab | Month calendar displays with current month and year, today's date highlighted | - [ ] |
| TC-056 | Today's date is pre-selected | 1. Open Home tab fresh | Today's date has filled hexagon highlight (purple) | - [ ] |
| TC-057 | Calendar mode toggle renders | 1. Open Home tab | "Month" and "Week" toggle buttons appear below calendar | - [ ] |
| TC-058 | Toggle to Week view | 1. Tap "Week" toggle | Calendar switches from month grid to week strip view | - [ ] |
| TC-059 | Toggle back to Month view | 1. While in Week view, tap "Month" toggle | Calendar switches back to month grid | - [ ] |
| TC-060 | Month toggle active state styling | 1. While in Month mode, observe toggle | "Month" button has active styling (highlighted bg, primary text color) | - [ ] |
| TC-061 | Week toggle active state styling | 1. While in Week mode, observe toggle | "Week" button has active styling | - [ ] |
| TC-062 | "Today" button resets to current date | 1. Navigate to a different date/month 2. Tap "Today" link | Calendar resets to today's date and current month | - [ ] |
| TC-063 | "Add meal" button opens modal | 1. Tap "+Add meal" link in date section | AddMealModal opens | - [ ] |
| TC-064 | Empty state meal plan card | 1. Select a date with no planned meals | Card shows "No meals planned for this day" and "Tap to add one" | - [ ] |
| TC-065 | Empty state card opens modal | 1. Tap the "No meals planned" card | AddMealModal opens for the selected date | - [ ] |
| TC-066 | Date label updates when date changes | 1. Select different dates on calendar | The date label (e.g., "Monday, March 4") updates to match selected date | - [ ] |

---

## 7. Home Screen - Month Calendar Grid

**Component:** `components/MonthCalendarGrid.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-067 | Month navigation - previous | 1. Tap left chevron on calendar | Calendar displays the previous month | - [ ] |
| TC-068 | Month navigation - next | 1. Tap right chevron on calendar | Calendar displays the next month | - [ ] |
| TC-069 | Month label displays correctly | 1. View the calendar header | Shows month name and year (e.g., "March 2026") | - [ ] |
| TC-070 | Day-of-week headers display | 1. View calendar grid | Shows "Mo Tu We Th Fr Sa Su" header row | - [ ] |
| TC-071 | Selected date hexagon highlight | 1. Tap a date in the grid | Selected date shows a filled purple hexagon shape with white text | - [ ] |
| TC-072 | Today has hexagon border when not selected | 1. Navigate to current month 2. Select a different date | Today shows a hexagon outline (semi-transparent purple border) | - [ ] |
| TC-073 | Today has filled hexagon when selected | 1. Select today's date | Today shows filled purple hexagon with white text (on-primary) | - [ ] |
| TC-074 | Dates outside current month are empty | 1. View a month where the 1st is not Monday | Empty placeholder cells appear before the 1st | - [ ] |
| TC-075 | Selecting a date loads meal plans | 1. Tap a date on the calendar | Meal plans section updates to show plans for the newly selected date (not the previous date) | - [ ] |
| TC-076 | Calendar grid aligns to Monday start | 1. View any month | Week rows start on Monday, end on Sunday | - [ ] |

---

## 8. Home Screen - Week Calendar Strip

**Component:** `components/WeekCalendarStrip.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-077 | Week strip displays 7 days | 1. Switch to Week view | Shows Mon through Sun with day labels and date numbers | - [ ] |
| TC-078 | Week range label displays | 1. View week strip | Shows date range (e.g., "Mar 2 - Mar 8") in header | - [ ] |
| TC-079 | Previous week navigation | 1. Tap left chevron in week strip | Dates shift to previous week | - [ ] |
| TC-080 | Next week navigation | 1. Tap right chevron in week strip | Dates shift to next week | - [ ] |
| TC-081 | Selected date hexagon in week view | 1. Tap a date in week strip | Selected date shows larger hexagon (size 40) with purple fill | - [ ] |
| TC-082 | Today styling in week view (not selected) | 1. Navigate to current week 2. Select different day | Today shows hexagon outline, day label shows in secondary color | - [ ] |
| TC-083 | Selecting a date in week view updates meal plans | 1. Tap different dates in week strip | Meal plan section below updates with plans for the selected date | - [ ] |

---

## 9. Home Screen - Meal Plan List

**Screen:** `app/(app)/index.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-084 | Meal plans display for selected date | 1. Select a date with planned meals | Meal plan cards appear showing meal type label (Breakfast/Lunch/Dinner/Snack), recipe title, and chevron | - [ ] |
| TC-085 | Meal type color coding | 1. View meal plans with different meal types | Breakfast shows orange, Lunch shows teal, Dinner shows purple, Snack shows green text labels | - [ ] |
| TC-086 | Tapping meal plan navigates to recipe detail | 1. Tap on a meal plan item | Navigates to recipe detail screen for that recipe | - [ ] |
| TC-087 | Loading state while fetching meal plans | 1. Select a new date | Activity indicator appears while meal plans load | - [ ] |
| TC-088 | Multiple meals on same date display in list | 1. Add multiple meals to one date | All meals appear in a grouped card with divider lines between them | - [ ] |

---

## 10. Add Meal Modal - Step 1 (Recipe Selection)

**Component:** `components/AddMealModal.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-089 | Modal opens with correct date | 1. Tap "Add meal" for a specific date | Modal opens showing "Add Meal" title and the selected date label | - [ ] |
| TC-090 | Meal type tab bar displays | 1. Open Add Meal modal | Shows Breakfast, Lunch, Dinner, Snack tabs with "dinner" pre-selected | - [ ] |
| TC-091 | Meal type tab switching | 1. Tap on different meal type tabs | Tab underline indicator and text color change to match selected type (orange for breakfast, teal for lunch, etc.) | - [ ] |
| TC-092 | Recipe list loads from personal collection | 1. Open modal | Shows personal recipes (self-created + bookmarked) with loading indicator while fetching | - [ ] |
| TC-093 | Recipe card displays info | 1. View recipe list in modal | Each card shows recipe image, title, calorie count, serving count, and chevron | - [ ] |
| TC-094 | Empty recipe list state | 1. Open modal with no personal recipes | Shows book icon, "No recipes yet" text, and hint about creating or bookmarking recipes | - [ ] |
| TC-095 | Tapping a recipe advances to step 2 | 1. Tap on a recipe in the list | Modal transitions to "Adjust Servings" step showing recipe details | - [ ] |
| TC-096 | Close button closes modal | 1. Tap X button in modal header | Modal closes, no data is saved | - [ ] |
| TC-097 | Modal resets state on reopen | 1. Open modal, pick a recipe, close 2. Reopen modal | Modal shows step 1 (recipe list) again, not step 2 | - [ ] |

---

## 11. Add Meal Modal - Step 2 (Serving Adjustment)

**Component:** `components/AddMealModal.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-098 | Step 2 displays recipe summary | 1. Select a recipe in step 1 | Shows recipe image, title, and description in a summary card | - [ ] |
| TC-099 | Serving stepper defaults to recipe's servings | 1. Select a recipe with 4 servings | Stepper shows value "4" | - [ ] |
| TC-100 | Increment servings | 1. Tap the "+" button on the stepper | Serving count increases by 1 | - [ ] |
| TC-101 | Decrement servings | 1. Tap the "-" button on the stepper | Serving count decreases by 1 | - [ ] |
| TC-102 | Minimum servings limit (1) | 1. Decrement servings to 1 2. Try to decrement again | "-" button becomes disabled, value stays at 1 | - [ ] |
| TC-103 | Maximum servings limit (50) | 1. Increment servings to 50 2. Try to increment again | "+" button becomes disabled, value stays at 50 | - [ ] |
| TC-104 | Calorie display updates with servings | 1. Change serving count | Total kcal badge updates proportionally (e.g., 4 servings at 800 cal -> 2 servings shows 400 cal) | - [ ] |
| TC-105 | Per-serving calorie displays | 1. View step 2 for recipe with calories | Shows per-serving calorie badge (e.g., "200/srv") | - [ ] |
| TC-106 | Scaled indicator when servings differ | 1. Change servings from recipe default | "Adjusted from X servings" info text appears | - [ ] |
| TC-107 | Ingredient preview shows up to 5 items | 1. Select recipe with 8 ingredients | Shows first 5 ingredients with "+3 more" text | - [ ] |
| TC-108 | Back button returns to step 1 | 1. On step 2, tap back arrow | Returns to recipe list (step 1) | - [ ] |
| TC-109 | Meal type tab bar hidden on step 2 | 1. Advance to step 2 | Meal type tabs are no longer visible | - [ ] |
| TC-110 | Confirm adds meal plan | 1. Adjust servings 2. Tap "Add to dinner" button | Loading spinner appears, meal is added, modal closes, meal plan list refreshes | - [ ] |
| TC-111 | Confirm button shows correct meal type | 1. Select "Breakfast" in step 1, pick a recipe | Button text reads "Add to breakfast" | - [ ] |

---

## 12. Cookbook Screen - Public Tab

**Screen:** `app/(app)/recipes/index.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-112 | Cookbook screen renders with header | 1. Navigate to Cookbook tab | Shows "Cookbook" title in header and "+" create button | - [ ] |
| TC-113 | Public tab is default or selectable | 1. Navigate to Cookbook tab | "Public" and "Personal" sub-tabs appear; Public is initially active | - [ ] |
| TC-114 | Public tab active styling | 1. View Public tab | Public tab has primary background color fill, white text | - [ ] |
| TC-115 | Public recipe list loads | 1. View Public tab | Recipes load with loading indicator, then display as diary-style cards | - [ ] |
| TC-116 | Recipe card shows image, title, calories, servings | 1. View a recipe card | Card displays circular thumbnail, title, calorie count, serving count, and chevron | - [ ] |
| TC-117 | Recipe card tap navigates to detail | 1. Tap a recipe card | Navigates to recipe detail screen for that recipe | - [ ] |
| TC-118 | Recipe count header displays | 1. View Public tab with recipes loaded | "All Recipes (N)" header appears with total count | - [ ] |
| TC-119 | Infinite scroll pagination | 1. Scroll to bottom of Public recipe list | Loading indicator appears, more recipes load (20 per page) | - [ ] |
| TC-120 | Pull to refresh on Public tab | 1. Pull down on recipe list | List refreshes from first page | - [ ] |
| TC-121 | Create recipe button navigates | 1. Tap "+" button in Cookbook header | Navigates to create recipe form | - [ ] |
| TC-122 | Empty Public tab state | 1. View Public tab with no recipes in database | Shows book icon, "No recipes yet", and "Tap + to create your first recipe" | - [ ] |
| TC-123 | Load error state | 1. View Public tab with network error | Shows alert icon, "Failed to load recipes", error message, and "Pull down to retry" | - [ ] |

---

## 13. Cookbook Screen - Personal Tab

**Screen:** `app/(app)/recipes/index.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-124 | Switch to Personal tab | 1. Tap "Personal" sub-tab | Tab switches with active styling, loads personal recipes | - [ ] |
| TC-125 | Personal tab shows own + bookmarked recipes | 1. View Personal tab | Shows both self-created (source: user) and bookmarked recipes | - [ ] |
| TC-126 | Personal recipe count header | 1. View Personal tab | "My Recipes (N)" header shows count of personal + bookmarked recipes | - [ ] |
| TC-127 | Own recipes do not show bookmark icon | 1. View Personal tab with self-created recipes | Self-created recipes have no bookmark button, just a spacer | - [ ] |
| TC-128 | Bookmarked recipes show filled bookmark | 1. View Personal tab with bookmarked recipes | Bookmarked recipes show filled bookmark icon | - [ ] |
| TC-129 | Empty Personal tab state | 1. View Personal tab with no recipes | Shows bookmark icon, "No saved recipes yet", and hint about browsing Public tab | - [ ] |
| TC-130 | Pull to refresh on Personal tab | 1. Pull down on Personal recipe list | List refreshes with latest data | - [ ] |
| TC-131 | Tab switch clears search | 1. Type in search bar 2. Switch tabs | Search query is cleared when switching between Public and Personal | - [ ] |

---

## 14. Cookbook Screen - Search

**Screen:** `app/(app)/recipes/index.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-132 | Search bar renders | 1. View Cookbook screen | Search bar appears below sub-tabs with search icon and placeholder text | - [ ] |
| TC-133 | Public tab search placeholder | 1. View Public tab search bar | Placeholder reads 'Search recipes (try "mexican", "chicken")...' | - [ ] |
| TC-134 | Personal tab search placeholder | 1. View Personal tab search bar | Placeholder reads "Search your saved recipes..." | - [ ] |
| TC-135 | Search by recipe title | 1. Type a recipe title (or part of it) | Matching recipes appear, non-matching are hidden | - [ ] |
| TC-136 | Search by ingredient name | 1. Type an ingredient name (e.g., "chicken") | Recipes containing that ingredient appear | - [ ] |
| TC-137 | Cuisine keyword expansion search | 1. On Public tab, type "mexican" | Recipes containing Mexican-related keywords (taco, burrito, enchilada, etc.) appear | - [ ] |
| TC-138 | Multi-word search requires all terms | 1. Type "chicken pasta" | Only recipes containing both "chicken" AND "pasta" appear | - [ ] |
| TC-139 | Search results count header | 1. Type a search query with matches | Header changes to "Results (N)" showing match count | - [ ] |
| TC-140 | No results state | 1. Type a query with no matches | Shows search icon, "No matching recipes", and hint about trying different keywords | - [ ] |
| TC-141 | Clear search button | 1. Type text in search 2. Tap X circle icon | Search query clears, full list reappears | - [ ] |
| TC-142 | Public search fetches all recipes for client-side filtering | 1. Type a search query on Public tab | All recipes are fetched (getAllRecipes) to enable comprehensive client-side search | - [ ] |
| TC-143 | Infinite scroll disabled during search | 1. Search for something on Public tab 2. Scroll to bottom | No additional page loading occurs during search | - [ ] |

---

## 15. Cookbook Screen - Bookmarking

**Screen:** `app/(app)/recipes/index.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-144 | Bookmark icon appears on Public tab recipes | 1. View Public tab | All recipes show bookmark icon (outline if not saved, filled if saved) | - [ ] |
| TC-145 | Tap bookmark saves recipe | 1. Tap outline bookmark icon on an unsaved recipe | Icon changes to filled (optimistic update), recipe is saved to personal collection | - [ ] |
| TC-146 | Tap bookmark unsaves recipe | 1. Tap filled bookmark icon on a saved recipe | Icon changes to outline (optimistic update), recipe is removed from personal collection | - [ ] |
| TC-147 | Bookmark optimistic update reverts on error | 1. Turn off network 2. Tap bookmark icon | Icon briefly changes, then reverts back when save fails | - [ ] |
| TC-148 | Unsaving on Personal tab removes recipe | 1. On Personal tab, tap filled bookmark on a bookmarked recipe | Recipe disappears from Personal list after unsaving | - [ ] |
| TC-149 | Bookmark accessibility labels | 1. Inspect bookmark button accessibility | Label reads "Save recipe" (unsaved) or "Unsave recipe" (saved) | - [ ] |

---

## 16. Recipe Detail Screen

**Screen:** `app/(app)/recipes/[id].tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-150 | Recipe detail loads and displays | 1. Navigate to a recipe detail | Shows header with title, hero image, description, serving stepper, nutrition badges, and ingredient/instruction tabs | - [ ] |
| TC-151 | Loading state on detail screen | 1. Navigate to recipe detail | Activity indicator shows while recipe data loads | - [ ] |
| TC-152 | Recipe not found state | 1. Navigate to detail with invalid recipe ID | Shows alert icon, "Recipe not found" text, and "Go back" button | - [ ] |
| TC-153 | Back button navigates back | 1. Tap back arrow in header | Returns to previous screen (recipe list or home) | - [ ] |
| TC-154 | Hero image displays | 1. View recipe with image_url | Recipe image displays as hero size in the detail view | - [ ] |
| TC-155 | Recipe title and description display | 1. View recipe detail | Title displays in bold large text, description in medium text below | - [ ] |
| TC-156 | Bookmark toggle on detail screen | 1. Tap bookmark icon in header | Toggles between filled (saved) and outline (unsaved), persists to database | - [ ] |
| TC-157 | Edit button navigates to edit screen | 1. Tap pencil edit icon in header | Navigates to edit recipe form with recipe data pre-filled | - [ ] |
| TC-158 | Delete button shows confirmation | 1. Tap trash delete icon in header | Alert dialog shows "Delete Recipe" with "Cancel" and "Delete" options | - [ ] |
| TC-159 | Delete confirm removes recipe | 1. Tap Delete in confirmation dialog | Recipe is deleted, user navigates back to recipe list | - [ ] |
| TC-160 | Delete cancel keeps recipe | 1. Tap Cancel in confirmation dialog | Dialog closes, recipe remains | - [ ] |
| TC-161 | Delete error handling | 1. Turn off network 2. Try to delete | Error alert shows "Failed to delete recipe", delete button re-enables | - [ ] |

---

## 17. Recipe Detail - Serving Stepper and Portion Scaling

**Screen:** `app/(app)/recipes/[id].tsx`, `components/ServingStepper.tsx`, `lib/portion-scaling.ts`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-162 | Serving stepper defaults to recipe servings | 1. Open recipe detail for recipe with 4 servings | Stepper shows "4" with "servings" label | - [ ] |
| TC-163 | Increment servings on detail page | 1. Tap "+" on stepper | Value increases by 1, total kcal badge updates proportionally | - [ ] |
| TC-164 | Decrement servings on detail page | 1. Tap "-" on stepper | Value decreases by 1, total kcal badge updates proportionally | - [ ] |
| TC-165 | Minimum serving is 1 | 1. Decrement to 1 | "-" button becomes visually disabled (surface-3 background), cannot go below 1 | - [ ] |
| TC-166 | Maximum serving is 50 | 1. Increment to 50 | "+" button becomes visually disabled (surface-3 background), cannot exceed 50 | - [ ] |
| TC-167 | Ingredient quantities scale proportionally | 1. Recipe has 4 servings, ingredient "2 cups flour" 2. Change to 8 servings | Ingredient displays "4 cups flour" | - [ ] |
| TC-168 | Fraction display for scaled quantities | 1. Recipe has 4 servings, ingredient "1 cup" 2. Change to 6 servings | Displays "1 1/2" (using Unicode fraction) instead of "1.5" | - [ ] |
| TC-169 | Calorie total scales with servings | 1. Recipe has 800 cal for 4 servings 2. Change to 2 servings | Total kcal badge shows "400 kcal" | - [ ] |
| TC-170 | Per-serving calories remain constant | 1. View recipe with 800 cal, 4 servings | Per-serving badge shows "200/serving" regardless of stepper changes | - [ ] |
| TC-171 | "Scaled from X servings" indicator | 1. Change servings from recipe default | Text "Scaled from 4 servings" and "Tap to reset" appears | - [ ] |
| TC-172 | Tap to reset servings | 1. Scale servings 2. Tap "Tap to reset" text | Servings return to recipe's default value | - [ ] |
| TC-173 | Non-numeric quantities handled gracefully | 1. Recipe has ingredient "to taste" salt | Changing servings does not break or alter "to taste" text | - [ ] |
| TC-174 | Zero quantity ingredients handled | 1. Recipe has ingredient with quantity "0" | Quantity remains empty/unchanged when scaling | - [ ] |
| TC-175 | Recipe with null calories | 1. Open recipe with no calories set | No kcal badge appears, no per-serving badge | - [ ] |

---

## 18. Recipe Detail - Ingredients and Instructions Tabs

**Screen:** `app/(app)/recipes/[id].tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-176 | Ingredients tab is default | 1. Open recipe detail | "Ingredients" tab is active with primary underline | - [ ] |
| TC-177 | Ingredients list renders | 1. View Ingredients tab | Each ingredient shows purple dot, name, quantity, and unit | - [ ] |
| TC-178 | Switch to Instructions/Preparation tab | 1. Tap "Preparation" tab | Tab switches, instructions content displays | - [ ] |
| TC-179 | Instructions parse numbered steps | 1. View recipe with instructions like "1. Do this. 2. Do that." | Instructions display as numbered step badges (1, 2, 3...) with text | - [ ] |
| TC-180 | Instructions parse "STEP N" format | 1. View recipe with "STEP 1\nDo this" format | Steps parse correctly into individual numbered items | - [ ] |
| TC-181 | Instructions handle single block text | 1. View recipe with single-paragraph instructions | Displays as one continuous text block | - [ ] |
| TC-182 | Instructions handle paragraph-separated text | 1. View recipe with double-newline-separated paragraphs | Each paragraph appears as a numbered step | - [ ] |
| TC-183 | Empty ingredients state | 1. View recipe with no ingredients | Shows "No ingredients listed" text | - [ ] |
| TC-184 | Tab indicator follows selection | 1. Switch between Ingredients and Preparation | Purple underline bar animates to active tab | - [ ] |

---

## 19. Create Recipe Screen

**Screen:** `app/(app)/recipes/create.tsx`, `components/RecipeForm.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-185 | Create recipe screen renders | 1. Tap "+" in Cookbook header | Shows "New Recipe" header with back button and RecipeForm | - [ ] |
| TC-186 | Back button cancels creation | 1. Tap back arrow | Returns to cookbook without saving | - [ ] |
| TC-187 | Title field is required | 1. Leave title empty 2. Tap Create Recipe | "Title is required" error appears | - [ ] |
| TC-188 | Description field is required | 1. Leave description empty 2. Tap Create Recipe | "Description is required" error appears | - [ ] |
| TC-189 | Instructions field is required | 1. Leave instructions empty 2. Tap Create Recipe | "Instructions are required" error appears | - [ ] |
| TC-190 | At least one ingredient required | 1. Remove all ingredient rows 2. Tap Create Recipe | "Add at least one ingredient" error appears | - [ ] |
| TC-191 | Empty ingredient names are filtered | 1. Add 3 ingredient rows, leave 1 name blank 2. Submit | Only ingredients with names are saved (blank row filtered out) | - [ ] |
| TC-192 | Servings defaults to 4 | 1. Open create form | Servings field pre-filled with "4" | - [ ] |
| TC-193 | Servings validation - must be at least 1 | 1. Set servings to "0" 2. Submit | "Must be at least 1" error appears | - [ ] |
| TC-194 | Servings validation - non-numeric | 1. Type "abc" in servings field 2. Submit | "Must be at least 1" error appears (NaN parsed) | - [ ] |
| TC-195 | Calories field is optional | 1. Leave calories empty 2. Submit valid form | Recipe creates successfully with null calories | - [ ] |
| TC-196 | Calories validation - negative number | 1. Type "-100" in calories 2. Submit | "Must be a positive number" error appears | - [ ] |
| TC-197 | Add ingredient button works | 1. Tap "Add ingredient" link | New empty ingredient row appears below existing rows | - [ ] |
| TC-198 | Remove ingredient button works | 1. Tap X/remove button on an ingredient row | That ingredient row is removed | - [ ] |
| TC-199 | Ingredient row has name, qty, unit fields | 1. View ingredient row | Shows three fields: Name (flex-3), Qty (flex-1), Unit (flex-1), and remove button | - [ ] |
| TC-200 | Column headers display for ingredients | 1. View ingredient section | "Name", "Qty", "Unit" column headers appear above rows | - [ ] |
| TC-201 | Instructions multiline input | 1. Type in instructions field | Large text area (min 120px height) supports multiline input, top-aligned | - [ ] |
| TC-202 | Successful recipe creation | 1. Fill all required fields 2. Tap "Create Recipe" | Loading button shows spinner, recipe saves, navigates back to cookbook | - [ ] |
| TC-203 | Recipe creation error | 1. Fill form 2. Turn off network 3. Submit | Alert shows "Failed to create recipe. Please try again." | - [ ] |
| TC-204 | Keyboard avoiding behavior | 1. Tap bottom inputs on iOS | Screen scrolls to keep input above keyboard | - [ ] |

---

## 20. Edit Recipe Screen

**Screen:** `app/(app)/recipes/edit.tsx`, `components/RecipeForm.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-205 | Edit screen loads existing data | 1. Tap edit on a recipe detail | Form opens pre-filled with recipe's title, description, ingredients, instructions, servings, calories | - [ ] |
| TC-206 | Loading state while fetching recipe | 1. Navigate to edit screen | Activity indicator shows while recipe data loads | - [ ] |
| TC-207 | Recipe not found on edit | 1. Navigate to edit with invalid ID | Shows alert icon, "Recipe not found", and "Go back" button | - [ ] |
| TC-208 | Edit title | 1. Change the title text 2. Tap "Save Changes" | Recipe updates with new title | - [ ] |
| TC-209 | Edit description | 1. Change description 2. Save | Recipe updates with new description | - [ ] |
| TC-210 | Edit ingredients - add new | 1. Add a new ingredient row 2. Fill in name/qty/unit 3. Save | Recipe updates with additional ingredient | - [ ] |
| TC-211 | Edit ingredients - remove existing | 1. Remove an ingredient row 2. Save | Recipe updates without that ingredient | - [ ] |
| TC-212 | Edit instructions | 1. Change instructions text 2. Save | Recipe updates with new instructions | - [ ] |
| TC-213 | Edit servings and calories | 1. Change servings and calories values 2. Save | Recipe updates with new values | - [ ] |
| TC-214 | Validation still applies on edit | 1. Clear required field 2. Tap Save Changes | Appropriate validation error appears | - [ ] |
| TC-215 | Successful save navigates back | 1. Make valid changes 2. Tap "Save Changes" | Loading spinner, recipe saves, navigates back to detail | - [ ] |
| TC-216 | Save error handling | 1. Make changes 2. Turn off network 3. Save | Alert shows "Failed to update recipe. Please try again." | - [ ] |
| TC-217 | Back button cancels edit | 1. Make changes 2. Tap back arrow | Returns to detail without saving changes | - [ ] |

---

## 21. Shopping List Screen

**Screen:** `app/(app)/shopping.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-218 | Shopping list screen renders | 1. Navigate to Shopping tab | Shows "Shopping List" header and week navigation | - [ ] |
| TC-219 | Week navigation displays current week | 1. View shopping list | Shows date range (Mon-Sun) with "This week" label below | - [ ] |
| TC-220 | Navigate to previous week | 1. Tap left chevron on week nav | Dates shift to previous week, "This week" label disappears if not current week | - [ ] |
| TC-221 | Navigate to next week | 1. Tap right chevron on week nav | Dates shift to next week | - [ ] |
| TC-222 | Ingredients auto-generated from meal plans | 1. Plan meals for the current week 2. Go to Shopping tab | Ingredients from all planned recipes appear aggregated in the list | - [ ] |
| TC-223 | Ingredients grouped by category | 1. View shopping list with items | Items organized under category headers (Produce, Dairy, Meat, etc.) with colored icons | - [ ] |
| TC-224 | Category headers display icon, name, and count | 1. View a category section | Header shows colored icon, category name, and "(N)" item count | - [ ] |
| TC-225 | Ingredient shows name, quantity, unit, and source recipes | 1. View an ingredient item | Shows ingredient name, combined quantity with unit, and source recipe names below | - [ ] |
| TC-226 | Duplicate ingredients aggregated | 1. Plan two recipes both needing "2 cups flour" | Shopping list shows "flour" once with "4 cups" (aggregated) and both recipe names | - [ ] |
| TC-227 | Ingredient quantities scaled by meal servings | 1. Plan recipe (4 servings default) for 8 servings | Shopping list quantities double proportionally | - [ ] |
| TC-228 | Ingredients count header | 1. View list with items | "Ingredients (N)" header and "X meals planned" count display | - [ ] |
| TC-229 | Empty shopping list state | 1. View week with no meal plans | Shows cart icon, "No items this week", and hint about planning meals | - [ ] |
| TC-230 | "Go to this week" button on empty non-current week | 1. Navigate to empty past/future week | "Go to this week" button appears, tapping resets to current week | - [ ] |
| TC-231 | Loading state | 1. Navigate to shopping tab or change weeks | Activity indicator appears while data loads | - [ ] |

---

## 22. Shopping List - Item Interactions

**Screen:** `app/(app)/shopping.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-232 | Tap item to check off | 1. Tap an ingredient item | Checkbox fills with primary color checkmark, text gets strikethrough and reduced opacity | - [ ] |
| TC-233 | Tap checked item to uncheck | 1. Tap a checked ingredient | Checkbox returns to empty, strikethrough and opacity removed | - [ ] |
| TC-234 | Checked count updates | 1. Check off items | "X of Y items checked" text updates in real-time | - [ ] |
| TC-235 | Reset button appears when items checked | 1. Check at least one item | "Reset" link appears next to progress text | - [ ] |
| TC-236 | Reset button clears all checks | 1. Check multiple items 2. Tap "Reset" | All items become unchecked, count resets to "0 of N" | - [ ] |
| TC-237 | Checked items persist within session | 1. Check items 2. Scroll away 3. Scroll back | Checked state is preserved | - [ ] |
| TC-238 | Checked items reset on week change | 1. Check items 2. Navigate to different week 3. Return | Checked items are cleared (fresh checklist per focus) | - [ ] |
| TC-239 | Progress text hidden when no items | 1. View empty shopping list | No "0 of 0 items checked" text appears | - [ ] |

---

## 23. Household Screen - Home Info

**Screen:** `app/(app)/household.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-240 | Household screen renders | 1. Navigate to Household tab | Shows "Household" header with Sign Out button | - [ ] |
| TC-241 | Home name card displays | 1. View household screen | Card shows home icon, home name, and member count (e.g., "2 members") | - [ ] |
| TC-242 | Edit name button visible for owner | 1. View as household owner | Pencil edit icon appears on the home name card | - [ ] |
| TC-243 | Edit name button hidden for member | 1. View as non-owner member | No pencil icon on home name card | - [ ] |
| TC-244 | Tap edit name enters edit mode | 1. Tap pencil icon | Name text changes to editable TextInput with "Save" button | - [ ] |
| TC-245 | Save name updates home name | 1. Change name text 2. Tap "Save" | Loading spinner on Save, name updates, exits edit mode | - [ ] |
| TC-246 | Save name via keyboard submit | 1. Change name text 2. Press Enter/Return on keyboard | Name saves same as tapping Save button | - [ ] |
| TC-247 | Empty name cannot be saved | 1. Clear the name field 2. Tap Save | Save does nothing (function returns early if name is empty) | - [ ] |

---

## 24. Household Screen - Invite Code System

**Screen:** `app/(app)/household.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-248 | Invite code card displays | 1. View household screen | Card shows key icon, "Invite Code" label, large monospace code (e.g., "XXXX-XXXX"), and action buttons | - [ ] |
| TC-249 | Copy code button works | 1. Tap "Copy" button | Code copies to clipboard, button text changes to "Copied!" with checkmark for 2 seconds | - [ ] |
| TC-250 | Copy button reverts after 2 seconds | 1. Copy code 2. Wait 2 seconds | Button text returns to "Copy" with copy icon | - [ ] |
| TC-251 | Share code button opens share sheet | 1. Tap "Share" button | System share sheet opens with message including home name and invite code | - [ ] |
| TC-252 | Regenerate code button visible for owner | 1. View as owner | "Regenerate code" text link appears below action buttons | - [ ] |
| TC-253 | Regenerate code button hidden for member | 1. View as non-owner member | "Regenerate code" link does not appear | - [ ] |
| TC-254 | Regenerate code shows confirmation | 1. Tap "Regenerate code" | Alert shows warning about invalidating old code with "Cancel" and "Regenerate" options | - [ ] |
| TC-255 | Regenerate code updates the code | 1. Tap "Regenerate" in confirmation | Loading spinner on code display, new code generates and displays | - [ ] |
| TC-256 | Regenerate code cancel does nothing | 1. Tap "Cancel" in regenerate confirmation | Code remains unchanged | - [ ] |
| TC-257 | Regenerate error handling | 1. Turn off network 2. Try to regenerate | Alert shows "Failed to regenerate invite code" | - [ ] |

---

## 25. Household Screen - Join Household Modal

**Screen:** `app/(app)/household.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-258 | "Join a Different Household" button displays | 1. View household screen | Button with enter icon and text appears | - [ ] |
| TC-259 | Join button opens modal | 1. Tap "Join a Different Household" | Modal slides up with "Join a Household" title, people icon, code input | - [ ] |
| TC-260 | Code input auto-formats | 1. Type "abcd1234" | Input displays "ABCD-1234" (uppercase, dash after 4 chars) | - [ ] |
| TC-261 | Code input strips non-alphanumeric | 1. Type "AB!@CD-12$34" | Only alphanumeric chars kept, formatted as "ABCD-1234" | - [ ] |
| TC-262 | Code input max length 9 (XXXX-XXXX) | 1. Try typing more than 8 alphanumeric chars | Input caps at 9 characters (including dash) | - [ ] |
| TC-263 | Join button disabled when code incomplete | 1. Type partial code (less than 8 chars) | "Join Household" button appears disabled (gray bg, muted text) | - [ ] |
| TC-264 | Join button enabled when code complete | 1. Type full 8-char code | Button activates with primary background color | - [ ] |
| TC-265 | Join with valid code succeeds | 1. Enter valid invite code 2. Tap "Join Household" | Loading spinner, home refreshes, modal closes, member list reloads | - [ ] |
| TC-266 | Join with invalid code shows error | 1. Enter non-existent code 2. Tap Join | "Invalid invite code. Please check and try again." error message appears | - [ ] |
| TC-267 | Join error with incomplete code | 1. Enter partial code 2. Tap Join | "Please enter a complete invite code" error message appears | - [ ] |
| TC-268 | Warning text about leaving current household | 1. View join modal | Info message explains "Joining a new household will move you from your current one" | - [ ] |
| TC-269 | Close modal button works | 1. Tap X close button | Modal closes, code and error state reset | - [ ] |
| TC-270 | Modal auto-focuses code input | 1. Open join modal | Code input field is auto-focused with keyboard shown | - [ ] |

---

## 26. Household Screen - Member Management

**Screen:** `app/(app)/household.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-271 | Members list displays | 1. View household screen | Members section shows heading "Members (N)" and member cards | - [ ] |
| TC-272 | Current user card shows name and "(you)" | 1. View own member card | Shows display name, "(you)" suffix, email, and avatar with purple background | - [ ] |
| TC-273 | Other member cards show generic info | 1. View other member card | Shows "Member", truncated user_id, and avatar with teal background | - [ ] |
| TC-274 | Role badges display correctly | 1. View member cards | Owner badge has primary/purple styling, Member badge has surface-3 styling | - [ ] |
| TC-275 | Owner can toggle member roles | 1. As owner, tap role badge of another member | Member's role toggles between "owner" and "member" | - [ ] |
| TC-276 | Non-owner cannot toggle roles | 1. As non-owner, tap role badge | Nothing happens (button is disabled) | - [ ] |
| TC-277 | Owner cannot toggle own role | 1. As owner, tap own role badge | Nothing happens (self-toggle prevented) | - [ ] |
| TC-278 | Remove member button visible for owner (not self) | 1. As owner, view other member cards | Red X circle icon appears next to other members, not next to self | - [ ] |
| TC-279 | Remove member shows confirmation | 1. As owner, tap remove icon on member | Alert shows "Remove Member" with warning, "Cancel" and "Remove" buttons | - [ ] |
| TC-280 | Remove member confirm removes member | 1. Tap "Remove" in confirmation | Member disappears from list, member count updates | - [ ] |
| TC-281 | Remove member cancel keeps member | 1. Tap "Cancel" in confirmation | Member remains in list | - [ ] |
| TC-282 | Loading state while fetching members | 1. View household screen on initial load | Activity indicator shows in member list area while loading | - [ ] |

---

## 27. Household Screen - Leave Household

**Screen:** `app/(app)/household.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-283 | Leave button visible for non-owner with multiple members | 1. View household as non-owner member with 2+ members | "Leave Household" button appears in red with exit icon | - [ ] |
| TC-284 | Leave button hidden for owner | 1. View household as owner | "Leave Household" button does not appear | - [ ] |
| TC-285 | Leave button hidden for solo member | 1. View household as only member | "Leave Household" button does not appear (memberCount must be > 1) | - [ ] |
| TC-286 | Leave shows confirmation dialog | 1. Tap "Leave Household" | Alert explains a new personal home will be created, bookmarks preserved, with "Cancel" and "Leave" | - [ ] |
| TC-287 | Leave confirm creates new home | 1. Tap "Leave" in confirmation | User is removed, new personal home created, screen refreshes | - [ ] |
| TC-288 | Leave cancel does nothing | 1. Tap "Cancel" in confirmation | Nothing changes | - [ ] |
| TC-289 | Leave error handling | 1. Turn off network 2. Confirm leave | Alert shows "Failed to leave household" | - [ ] |

---

## 28. Household Screen - Preferences and Theme

**Screen:** `app/(app)/household.tsx`, `contexts/ThemeContext.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-290 | Preferences section displays | 1. Scroll to Preferences section | "Preferences" heading appears with Dark Mode toggle card | - [ ] |
| TC-291 | Dark mode toggle shows current state | 1. View Dark Mode card | Shows moon/sun icon, "Dark Mode" label, active theme description, and Switch component | - [ ] |
| TC-292 | Toggle dark mode to light mode | 1. Flip the Switch to off | Entire app changes to light theme colors (white backgrounds, dark text) | - [ ] |
| TC-293 | Toggle light mode back to dark mode | 1. Flip the Switch back to on | Entire app returns to dark theme colors | - [ ] |
| TC-294 | Theme icon changes with mode | 1. Toggle theme | Icon switches between moon (dark) and sunny (light) | - [ ] |
| TC-295 | Theme description text updates | 1. Toggle theme | Subtitle changes between "Dark theme active" and "Light theme active" | - [ ] |
| TC-296 | Theme persists across all screens | 1. Switch to light mode 2. Navigate to other tabs | All screens (Home, Cookbook, Shopping, Household) reflect light theme | - [ ] |
| TC-297 | Status bar style changes with theme | 1. Toggle theme | Status bar changes between light content (dark mode) and dark content (light mode) | - [ ] |

---

## 29. Household Screen - Account Management

**Screen:** `app/(app)/household.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-298 | Sign Out button displays in header | 1. View household screen | "Sign Out" button with log-out icon in top-right of header | - [ ] |
| TC-299 | Sign Out redirects to login | 1. Tap "Sign Out" | Session is cleared, user is redirected to login screen | - [ ] |
| TC-300 | Account section with Delete Account displays | 1. Scroll to Account section | "Account" heading and "Delete Account" card with trash icon appear in red styling | - [ ] |
| TC-301 | Delete Account first confirmation | 1. Tap "Delete Account" card | Alert shows warning about permanent deletion of all data with "Cancel" and "Delete" | - [ ] |
| TC-302 | Delete Account second confirmation | 1. Tap "Delete" on first alert | Second alert shows "Are you sure?" with "Cancel" and "Delete My Account" | - [ ] |
| TC-303 | Delete Account executes | 1. Tap "Delete My Account" on second alert | Account and all data deleted, user signed out and redirected to login | - [ ] |
| TC-304 | Delete Account cancel (first dialog) | 1. Tap "Cancel" on first alert | Nothing happens | - [ ] |
| TC-305 | Delete Account cancel (second dialog) | 1. Tap "Delete" on first, then "Cancel" on second | Nothing happens | - [ ] |
| TC-306 | Delete Account error handling | 1. Turn off network 2. Confirm both dialogs | Alert shows "Failed to delete account. Please try again." | - [ ] |

---

## 30. Navigation - Tab Bar

**Component:** `components/CustomTabBar.tsx`, `app/(app)/_layout.tsx`

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-307 | Tab bar renders with 4 tabs | 1. View any app screen | Bottom tab bar shows Home, Cookbook, Shopping, Household tabs | - [ ] |
| TC-308 | Tab icons change on selection | 1. Tap each tab | Active tab shows filled icon in primary color, inactive tabs show outline icons in disabled color | - [ ] |
| TC-309 | Tab labels display below icons | 1. View tab bar | Each tab shows its label ("Home", "Cookbook", "Shopping", "Household") | - [ ] |
| TC-310 | Home tab navigates to home screen | 1. Tap Home tab | Home screen with calendar displays | - [ ] |
| TC-311 | Cookbook tab navigates to recipes | 1. Tap Cookbook tab | Cookbook screen with recipe list displays | - [ ] |
| TC-312 | Shopping tab navigates to shopping list | 1. Tap Shopping tab | Shopping list screen displays | - [ ] |
| TC-313 | Household tab navigates to household | 1. Tap Household tab | Household management screen displays | - [ ] |
| TC-314 | Tab bar stays fixed at bottom | 1. Scroll content on any screen | Tab bar remains visible at the bottom of the screen | - [ ] |
| TC-315 | Tab bar has bottom padding (safe area) | 1. View on iPhone with home indicator | Tab bar has adequate bottom padding (pb-6) for home indicator | - [ ] |
| TC-316 | Tab accessibility roles | 1. Inspect tab buttons with accessibility tools | Each tab has role="tab" and correct selected state | - [ ] |
| TC-317 | HomeProvider loading state | 1. Launch app after login (first load) | "Setting up your kitchen..." loading screen with spinner shows before tabs | - [ ] |
| TC-318 | HomeProvider error state | 1. Trigger home data loading error | Error message "Failed to load household data" with retry hint displays | - [ ] |

---

## 31. Error Handling and Edge Cases

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-319 | Network offline - Home screen | 1. Turn off network 2. Navigate to Home | Meal plans fail silently, no crash; previously loaded data or empty state shows | - [ ] |
| TC-320 | Network offline - Cookbook | 1. Turn off network 2. Navigate to Cookbook | Error state or empty list appears, no crash | - [ ] |
| TC-321 | Network offline - Shopping List | 1. Turn off network 2. Navigate to Shopping | Loads fail silently, empty state or cached data shows | - [ ] |
| TC-322 | Network offline - Household | 1. Turn off network 2. Navigate to Household | Members fail to load silently, loading indicator may persist | - [ ] |
| TC-323 | Long recipe title truncation | 1. View recipe with very long title in list | Title truncates with ellipsis (numberOfLines={1}) | - [ ] |
| TC-324 | Long recipe title on detail page | 1. View recipe detail with long title | Title truncates in header (numberOfLines={1}), full title shows in body | - [ ] |
| TC-325 | Special characters in recipe data | 1. Create recipe with emojis, unicode chars, HTML entities | Data saves and displays correctly without rendering issues | - [ ] |
| TC-326 | Rapid date selection | 1. Quickly tap multiple dates on calendar | Only the final date's meal plans load (no stale data from intermediate selections) | - [ ] |
| TC-327 | Rapid tab switching | 1. Quickly switch between Public and Personal tabs | Data loads correctly for the final selected tab, no duplicate requests | - [ ] |
| TC-328 | Back navigation from recipe detail to correct tab | 1. From Home, tap meal plan -> recipe detail 2. Go back | Returns to Home tab, not Cookbook | - [ ] |
| TC-329 | Deep link to recipe with invalid ID | 1. Navigate directly to /recipes/invalid-id | "Recipe not found" error state displays with Go Back button | - [ ] |
| TC-330 | Multiple meal plans on same date, same meal type | 1. Add two Dinner meals on the same date | Both appear in the meal plan list for that date | - [ ] |
| TC-331 | Recipe deletion removes from meal plans display | 1. Delete a recipe used in a meal plan 2. View that date | Meal plan shows "Unknown recipe" for the deleted recipe | - [ ] |
| TC-332 | Very large ingredient quantity scaling | 1. Set 1 serving recipe to 50 servings | Quantities scale correctly without overflow or display issues | - [ ] |
| TC-333 | Recipe with zero servings edge case | 1. If a recipe somehow has 0 servings | Scale factor defaults to 1, no division by zero crash | - [ ] |

---

## 32. Performance and Loading States

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-334 | App cold start time | 1. Force quit app 2. Relaunch | App loads to usable state within 3 seconds | - [ ] |
| TC-335 | Screen transitions are smooth | 1. Navigate between all screens | No visible lag or jank during transitions | - [ ] |
| TC-336 | Cookbook infinite scroll performance | 1. Scroll through 100+ recipes | Scroll remains smooth, no frame drops | - [ ] |
| TC-337 | Calendar month navigation is responsive | 1. Rapidly tap next/previous month | Calendar updates without lag | - [ ] |
| TC-338 | AddMealModal opening animation | 1. Open Add Meal modal | Modal slides up smoothly | - [ ] |
| TC-339 | Join Household modal animation | 1. Open Join modal | Modal slides up smoothly | - [ ] |
| TC-340 | Loading indicators appear promptly | 1. Trigger any data load | Loading spinners appear within 100ms, not after data already loaded | - [ ] |
| TC-341 | FlatList renders efficiently | 1. View long recipe lists | Only visible items rendered (FlatList virtualization working) | - [ ] |
| TC-342 | SectionList renders efficiently in Shopping | 1. View shopping list with many items | Section headers and items render efficiently | - [ ] |

---

## 33. Accessibility

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-343 | Calendar date accessibility labels | 1. Enable screen reader 2. Navigate calendar | Each date announces full date (e.g., "Wednesday, March 4") | - [ ] |
| TC-344 | Previous/Next month buttons have labels | 1. Inspect month navigation | "Previous month" and "Next month" labels present | - [ ] |
| TC-345 | Previous/Next week buttons have labels | 1. Inspect week navigation | "Previous week" and "Next week" labels present | - [ ] |
| TC-346 | Shopping list week nav labels | 1. Inspect shopping week navigation | "Previous week" and "Next week" labels present | - [ ] |
| TC-347 | ServingStepper buttons have labels | 1. Inspect serving stepper | "Decrease servings" and "Increase servings" labels present | - [ ] |
| TC-348 | Create recipe button label | 1. Inspect "+" button in Cookbook header | "Create recipe" accessibility label present | - [ ] |
| TC-349 | Back buttons have labels | 1. Inspect back arrows on recipe screens | "Go back" accessibility labels present | - [ ] |
| TC-350 | Edit and Delete recipe button labels | 1. Inspect header buttons on recipe detail | "Edit recipe" and "Delete recipe" labels present | - [ ] |
| TC-351 | Bookmark button labels | 1. Inspect bookmark buttons | "Save recipe" / "Unsave recipe" labels present, update on toggle | - [ ] |
| TC-352 | Tab bar accessibility | 1. Inspect bottom tab buttons | Each tab has role="tab" and correct selected/unselected state | - [ ] |
| TC-353 | Minimum touch targets | 1. Measure interactive elements | All buttons and touchable areas are at least 44pt in touch target size | - [ ] |
| TC-354 | Text contrast ratios | 1. Check text colors against backgrounds | text-high (87% white on dark) and text-medium (60% white) meet WCAG AA contrast | - [ ] |
| TC-355 | Form inputs have labels | 1. Inspect form inputs with screen reader | All inputs have associated label text | - [ ] |

---

## 34. Cross-Platform Consistency

| ID | Description | Steps | Expected Result | Pass/Fail |
|----|-------------|-------|-----------------|-----------|
| TC-356 | iOS rendering | 1. Run app on iOS device/simulator | All screens render correctly, no layout issues | - [ ] |
| TC-357 | Android rendering | 1. Run app on Android device/emulator | All screens render correctly, no layout issues | - [ ] |
| TC-358 | Web rendering | 1. Run app in web browser (npx expo start --web) | All screens render correctly, interactions work | - [ ] |
| TC-359 | iOS keyboard avoiding behavior | 1. Test forms on iOS | KeyboardAvoidingView with padding behavior works correctly | - [ ] |
| TC-360 | Android keyboard avoiding behavior | 1. Test forms on Android | KeyboardAvoidingView with height behavior works correctly | - [ ] |
| TC-361 | iOS safe area handling | 1. Test on iPhone with notch/Dynamic Island | Content does not overlap with status bar or home indicator | - [ ] |
| TC-362 | Android status bar handling | 1. Test on Android with various status bar sizes | Content does not overlap with status bar | - [ ] |
| TC-363 | Modal presentation on iOS | 1. Open any modal (Add Meal, Join Household) | Modal uses pageSheet presentation style correctly | - [ ] |
| TC-364 | Modal presentation on Android | 1. Open any modal | Modal renders correctly, back button/gesture dismisses | - [ ] |
| TC-365 | OAuth redirect on iOS | 1. Complete Google/Facebook OAuth on iOS | Browser opens and redirects back to app correctly | - [ ] |
| TC-366 | OAuth redirect on Android | 1. Complete Google/Facebook OAuth on Android | Browser opens and redirects back to app correctly | - [ ] |
| TC-367 | Clipboard copy on all platforms | 1. Copy invite code on each platform | Clipboard copy works using expo-clipboard on iOS, Android, and web | - [ ] |
| TC-368 | Share sheet on all platforms | 1. Share invite code on each platform | Native share dialog opens correctly | - [ ] |

---

## Test Execution Summary

| Area | Total Tests | Passed | Failed | Blocked |
|------|-------------|--------|--------|---------|
| Authentication - Login Screen | 11 | | | |
| Authentication - Email Sign In | 17 | | | |
| Authentication - Email Sign Up | 13 | | | |
| Authentication - Email Confirmation | 6 | | | |
| Authentication - Session and Routing | 6 | | | |
| Home Screen - Calendar and Meal Plans | 13 | | | |
| Home Screen - Month Calendar Grid | 10 | | | |
| Home Screen - Week Calendar Strip | 7 | | | |
| Home Screen - Meal Plan List | 5 | | | |
| Add Meal Modal - Step 1 | 9 | | | |
| Add Meal Modal - Step 2 | 14 | | | |
| Cookbook Screen - Public Tab | 12 | | | |
| Cookbook Screen - Personal Tab | 8 | | | |
| Cookbook Screen - Search | 12 | | | |
| Cookbook Screen - Bookmarking | 6 | | | |
| Recipe Detail Screen | 12 | | | |
| Recipe Detail - Serving Stepper and Portion Scaling | 14 | | | |
| Recipe Detail - Ingredients and Instructions Tabs | 9 | | | |
| Create Recipe Screen | 20 | | | |
| Edit Recipe Screen | 13 | | | |
| Shopping List Screen | 14 | | | |
| Shopping List - Item Interactions | 8 | | | |
| Household Screen - Home Info | 8 | | | |
| Household Screen - Invite Code System | 10 | | | |
| Household Screen - Join Household Modal | 13 | | | |
| Household Screen - Member Management | 12 | | | |
| Household Screen - Leave Household | 7 | | | |
| Household Screen - Preferences and Theme | 8 | | | |
| Household Screen - Account Management | 9 | | | |
| Navigation - Tab Bar | 12 | | | |
| Error Handling and Edge Cases | 15 | | | |
| Performance and Loading States | 9 | | | |
| Accessibility | 13 | | | |
| Cross-Platform Consistency | 13 | | | |
| **TOTAL** | **368** | | | |

---

## Prerequisites

Before running tests, ensure:

1. **Test accounts prepared:**
   - Valid Google OAuth account
   - Valid Facebook OAuth account
   - Email account for sign-up/sign-in testing
   - Second account for multi-member household testing

2. **Test data:**
   - At least 25+ recipes in the public database (for pagination testing)
   - Recipes with varied data: with/without calories, with/without images, different serving counts
   - At least one household with multiple members

3. **Devices/environments:**
   - iOS device or simulator (iPhone with notch/Dynamic Island)
   - Android device or emulator
   - Web browser (Chrome recommended)

4. **Network conditions:**
   - Stable network for normal testing
   - Ability to simulate offline/slow network for error handling tests

5. **Supabase backend:**
   - All RPC functions operational (get_or_create_home, join_home_by_code, regenerate_invite_code, leave_home, delete_user_account)
   - Tables: homes, home_members, recipes, meal_plans, saved_recipes
