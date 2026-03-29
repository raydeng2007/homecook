# Homecook

## What This Is

A meal planning app for households built with Expo and React Native, targeting iOS and Android app stores. Users can manage recipes, plan meals on a calendar, auto-generate shopping lists, and collaborate with household members. The app uses a warm, artisanal dark theme with a bordeaux/champagne color palette.

## Core Value

Households can plan meals together and generate accurate shopping lists — the daily-use loop of pick recipes, assign to days, shop from the list must work flawlessly.

## Requirements

### Validated

- ✓ Email/password authentication with sign-in, sign-up, and session persistence — existing
- ✓ Google and Facebook OAuth login — existing
- ✓ Recipe CRUD (create, read, update, delete) with form validation — existing
- ✓ Public cookbook with search/filter and personal recipe collection — existing
- ✓ Meal planning calendar with month and week views — existing
- ✓ Assign recipes to dates by meal type (breakfast, lunch, dinner, snack) — existing
- ✓ Auto-generated shopping list from week's meal plans with ingredient aggregation — existing
- ✓ Household management with invite codes and member roles — existing
- ✓ Dark/light theme toggle with warm artisanal palette — existing
- ✓ Ingredient normalization and categorization — existing
- ✓ Portion scaling for recipes — existing

### Active

- [ ] Unit test suite for data layer and pure functions
- [ ] E2E test coverage for all critical user flows
- [ ] App store readiness: error handling, input validation, crash prevention
- [ ] Security hardening: RLS verification, .env protection, authorization checks
- [ ] Accessibility: screen reader labels, roles, and navigation
- [ ] Performance: memoization, server-side search, query optimization
- [ ] CI/CD pipeline for automated testing and builds
- [ ] App store metadata, icons, splash screens, and submission config

### Out of Scope

- Offline support / optimistic updates — defer to post-launch based on user feedback
- Push notifications — defer to post-launch
- Social features (sharing recipes publicly, comments) — not needed for v1
- Web deployment — focus on native mobile for app store launch
- Payment/subscription features — free app for v1

## Context

- **Current state**: Feature-complete for v1. Zero automated tests. No CI pipeline. Several silent error-swallowing patterns. RLS migration status uncertain.
- **Codebase concerns**: Duplicated `formatDateKey` utility across 5 files. Hardcoded colors in some files (user wants centralized palette). `getAllRecipes()` fetches up to 5000 rows client-side. Silent catch blocks in AddMealModal, recipe edit, and recipes lib.
- **Testing baseline**: Maestro E2E flows exist in `.maestro/` but no unit test framework is installed. TypeScript strict mode is the only automated quality gate.
- **Platform targets**: iOS App Store and Google Play Store. Using EAS Build (`eas.json` exists with dev/preview/production profiles).

## Constraints

- **Tech stack**: Expo SDK 52, React Native 0.76, NativeWind v4, Supabase — established, no changes
- **Styling**: NativeWind `className` only, no `StyleSheet.create` — project convention
- **Colors**: Centralized warm palette (bordeaux/champagne), must be easily swappable — user requirement
- **Node**: v22+ required
- **Testing**: Jest + React Native Testing Library for units, Maestro for E2E — matches Expo ecosystem

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Jest + jest-expo for unit tests | Standard Expo testing setup, co-located test files | — Pending |
| Maestro for E2E (existing) | Already has test flows, mobile-native tool | ✓ Good |
| Fix security/stability before adding tests | Tests on broken foundations waste effort | — Pending |
| No backend changes for v1 launch | Supabase handles auth, DB, RLS — minimize scope | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-29 after initialization*
