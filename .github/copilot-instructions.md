# Pawfect Project - AI Coding Instructions

This is a **Next.js 16 + TypeScript + Supabase** pet naming web application with authentication and protective routing.

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16 (App Router) with React 19
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS 4 + PostCSS
- **State**: React hooks + Client Components
- **Type Safety**: TypeScript 5 (strict mode)

### Project Structure
- `app/` - Next.js App Router (pages, API routes, layouts)
  - `api/auth/` - Authentication endpoints (login, register, logout, session)
  - `auth/login/` - Login page
  - Protected routes: `/profile`, `/favorites` (require valid auth token)
- `components/` - Reusable React components (section1-5, navbar, ProtectedClient)
- `lib/` - Utilities (Supabase client/server factories, helpers)

## Authentication & Authorization Flow

### Critical Pattern: Token-Based Protection
1. **Middleware** (`middleware.ts`): Checks for `*-auth-token` cookie on protected routes (`/profile`, `/favorites`, `/ranking`)
2. **API Layer** (`app/api/auth/*`):
   - `POST /api/auth/login` - Authenticates with Supabase, returns user
   - `POST /api/auth/register` - Creates new user
   - `GET /api/auth/session` - Validates token via cookie
   - `POST /api/auth/logout` - Clears auth state
3. **Client Protection** (`ProtectedClient.tsx`):
   - Wraps protected page content
   - Calls `/api/auth/session` with `credentials: "include"` (critical!)
   - Redirects unauthenticated users to `/auth/login`

### Supabase Setup (Important!)
- **Server-side**: `lib/supabase-server.ts` creates server client with async cookie handling
  - Use `await cookies()` for Next.js 16+ compatibility
  - Catches errors gracefully (Server Components can't set cookies)
- **Client-side**: `lib/supabase-client.ts` exports factory function for browser client
- **Environment**: Requires `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Component Patterns

### Page Composition
Main landing page (`app/page.tsx`) composes multiple section components in sequence:
```tsx
<PawfectHero /> → <Sections/> → <Section2/> → <Section3/> → <Section4/> → <Section5/>
```

### Styling Conventions
- Use **Tailwind utility classes** exclusively (no CSS modules)
- Common padding: `py-16 px-4` for sections
- Common spacing: `mb-16`, `gap-20`, `space-y-2`
- Colors: Use hex color names like `text-[#425B80]` for custom brand colors
- Responsive: `md:` breakpoint for tablet/desktop designs
- Shadows: `shadow-xl/68 shadow-amber-700` for layered effects

### Component Examples
- **Section4** (`components/section4.tsx`): 3-column grid card layout with decorative animals (rabbit, hamster images)
- **Navbar** (`components/navbar.tsx`): Global navigation
- **ProtectedClient**: Session validation wrapper for protected pages

## Development Workflow

### Build & Run
```bash
npm run dev      # Start dev server (http://localhost:3000)
npm run build    # Production build
npm run start    # Run production server
npm run lint     # Run ESLint (Next.js + TypeScript preset)
```

### Important Notes
- **Hot reload**: Works on file save (Next.js auto-update)
- **Linting**: ESLint config extends `eslint-config-next` and TypeScript preset
- **Path aliases**: `@/*` maps to root directory (use `@/components`, `@/lib`, etc.)

## Key Patterns & Conventions

### API Route Pattern
All auth API routes follow this pattern:
```typescript
export async function POST(req: Request) {
  const { data } = await req.json();
  const supabase = await supabaseServer();
  // Process request...
  return NextResponse.json({ ok: boolean, ... });
}
```

### Cookie Handling (Critical!)
- Auth tokens are stored in cookies with pattern `*-auth-token`
- **Always include** `credentials: "include"` in client-side fetch calls to auth endpoints
- Server-side: Use `await cookies()` for async compatibility with Next.js 16+

### TypeScript Configuration
- **Target**: ES2017
- **Strict mode**: Enabled (required)
- **Module resolution**: "bundler" (Next.js standard)
- **Always type**: Component props, API responses, and state

### Testing & Validation
- No explicit test files currently; validation happens via ESLint
- Components are functional (React 19 with hooks)
- Protected routes: Always wrap with `ProtectedClient` for session validation

## Thai Content Handling
Project contains Thai language UI text. When updating components:
- Preserve Thai text in headers, labels, and descriptions
- Maintain character encoding (UTF-8 is default)
- Keep Thai spacing and punctuation conventions

## Common Tasks

### Adding a Protected Page
1. Create page in `app/[route]/page.tsx`
2. Add route to `protectedRoutes` array in `middleware.ts`
3. Wrap page content with `<ProtectedClient>`

### Adding an API Endpoint
1. Create `app/api/[route]/route.ts`
2. Export `GET`, `POST`, `PUT`, or `DELETE` function
3. Use `await supabaseServer()` for database access
4. Return `NextResponse.json({})`

### Styling a Component
1. Use Tailwind classes (no external CSS files except `globals.css`)
2. Reference brand colors via hex notation: `text-[#425B80]`
3. Use responsive prefixes: `md:text-xl`, `lg:grid-cols-3`

## External Dependencies to Know
- **@supabase/ssr**: Server/client Supabase adapters
- **framer-motion**: Animation library (installed but usage check needed)
- **react-icons, heroicons, lucide-react**: Icon libraries
- **Firebase**: Installed but current auth uses Supabase

---
**Last Updated**: November 2025 | **Version**: Next.js 16.0.3 | **Node Target**: ES2017
