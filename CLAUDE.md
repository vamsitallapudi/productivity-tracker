# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FocusFlow is a productivity tracking application built with Next.js 15, TypeScript, and Supabase. It features a Pomodoro timer with session tracking, real-time analytics, dark mode support, and a "Zen Mode" for distraction-free focus sessions.

## Common Commands

**Development:**
```bash
cd apps/web
npm run dev          # Start development server on localhost:3000
npm run build        # Build production version
npm run start        # Start production server
npm run lint         # Run ESLint
```

**Database Setup:**
- Execute the SQL schema in `apps/web/supabase-schema.sql` in your Supabase project
- Set environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Architecture

### Project Structure
- **apps/web/** - Next.js application with App Router
- **components/** - Reusable UI components built with Radix UI
- **lib/** - Database types, Supabase client, and utility functions
- **app/** - Next.js app directory with pages and layouts

### Key Technologies
- **Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI Components:** Radix UI primitives with custom styling
- **Database:** Supabase (PostgreSQL) with real-time capabilities
- **Charts:** Recharts for data visualization
- **State Management:** React hooks with localStorage persistence
- **Styling:** Tailwind CSS with CSS custom properties for theming

### Core Features Architecture

**Timer System (`apps/web/app/page.tsx:565-653`):**
- Wall-clock synchronized countdown with drift correction
- Background-friendly with visibility change handling
- Persistent state across page refreshes using localStorage
- Target end time tracking for precision

**Session Management:**
- Active session persistence with `activeSessionV1` localStorage key
- Session state: pending → running → paused → completed
- Automatic efficiency modal on completion
- Session data stored in Supabase `sessions` table

**Theme System:**
- Dark/light mode with system preference detection
- Theme persistence via `themeV1` localStorage key
- CSS custom properties in `globals.css` for theme variables
- Automatic theme initialization script in layout

### Database Schema

**Tables:**
- `users` - User accounts (currently uses alex@example.com)
- `tasks` - Predefined and custom tasks with categories
- `sessions` - Completed focus sessions with duration and efficiency

**Key Relationships:**
- Sessions belong to users via `user_id` foreign key
- Tasks are referenced by name (not foreign key) in sessions

### Component Architecture

**Layout Components:**
- `dashboard-layout.tsx` - Main application shell
- Sidebar navigation with focus timer integration
- Header with search, theme toggle, and user menu

**Modal Components:**
- `session-setup-modal.tsx` - Task and duration selection
- `efficiency-modal.tsx` - Post-session efficiency rating
- `database-setup-modal.tsx` - Database initialization instructions

**Chart Components (`components/charts/PieCharts.tsx`):**
- Focus hours breakdown by task
- Efficiency visualization with color coding
- Real-time data from completed sessions

### State Management Patterns

**Timer State:**
- Complex state with multiple synchronized values
- Persistent across page refreshes and tab visibility changes
- Integration with session start/pause/complete workflows

**Data Flow:**
1. Session setup → Timer start → Background persistence
2. Timer completion → Efficiency modal → Database save
3. Data refresh → Chart updates → Metrics recalculation

**Theme State:**
- Synchronized between React state and localStorage
- Applied via CSS classes on document element
- SSR-compatible with client-side hydration

### Performance Considerations

**Dynamic Imports:**
- Recharts components loaded dynamically to reduce bundle size
- SSR disabled for chart components to prevent hydration issues

**Background Processing:**
- Timer continues running when tab is not visible
- Resynchronization on tab focus to maintain accuracy
- Efficient localStorage operations for state persistence

### Development Notes

**Build Configuration:**
- ESLint and TypeScript errors ignored during builds (next.config.mjs)
- Image optimization disabled for compatibility
- Dark mode configured via class strategy in Tailwind

**Environment Setup:**
- Requires Supabase project with provided schema
- Environment variables for Supabase connection
- Sample data included in schema for immediate functionality

**Debugging Features:**
- Console functions: `clearAllData()` and `showLocalStorage()`
- Keyboard shortcuts: Z (Zen Mode), Esc (Exit Zen), Ctrl+Shift+R (Reset)
- Extensive logging for timer and session state changes

### Key Gotchas

- Timer state is complex - always check localStorage persistence when modifying
- Database operations use alex@example.com user - update for multi-user support
- Theme system requires both React state and CSS class management
- Chart components need dynamic imports to prevent SSR issues
- Session completion triggers multiple state changes - handle them atomically