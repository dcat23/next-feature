# Application Generator

The Application generator creates a complete, production-ready Next.js application with full server-side rendering, API routes, TypeScript setup, and optional authentication and HTTP client configuration.

## Overview

The Application generator creates a full Next.js application (not a library) that's ready for development and deployment. It provides:

- **Next.js App Router** - Modern file-based routing with React Server Components
- **TypeScript Setup** - Full TypeScript support with strict mode
- **Development Tools** - ESLint, Jest, Tailwind CSS pre-configured
- **TypeScript Path Aliases** - Automatic `@app/[name]` import paths
- **Development Dependencies** - Sonner (toasts), Zod (validation), TanStack Query
- **Optional Setup** - Auth and Axios can be added during creation
- **Environment Configuration** - .env.local setup with auth secrets

This is ideal for creating the main web application, admin panel, dashboard, or other production-grade applications.

## Quick Start

### Basic Usage

```bash
# Create a Next.js application
npx nx g next-feature:application --name=web
```

### With Options

```bash
# Create with authentication
npx nx g next-feature:application --name=web --useAuth=true

# Create with HTTP client
npx nx g next-feature:application --name=web --env=true

# Both authentication and HTTP client
npx nx g next-feature:application --name=web --useAuth=true --env=true

# Custom directory
npx nx g next-feature:application --name=admin --directory=apps
```

### With Organization Scoping

```bash
# Create with scoped imports
npx nx g next-feature:application --name=web --orgName=mycompany
# Creates @mycompany/web import path
```

## Generator Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--name` | string | required | Name of the application (e.g., web, admin, dashboard) |
| `--directory` | string | "apps" | Directory where application is created |
| `--env` | boolean | false | Add the axios dependency and register a `<NAME>_API_URL` variable in this app's `.env`/`.env.example` |
| `--useAuth` | boolean | false | Setup NextAuth.js authentication |
| `--orgName` | string | - | Organization name for scoped imports (@myorg/[name]) |
| `--skipFormat` | boolean | false | Skip prettier code formatting |

### Option Details

#### `name` (required)

Name of the Next.js application. This will:
- Create directory `apps/[name]/`
- Set up TypeScript path alias `@app/[name]`
- Configure as a standalone Next.js application
- Create project.json for Nx integration

Examples: `web`, `admin`, `dashboard`, `api`, `mobile-web`

#### `directory`

Override where the application is created. Default is `apps/`.

```bash
# Create in apps/ (default)
npx nx g next-feature:application --name=web

# Create in custom location
npx nx g next-feature:application --name=web --directory=projects
```

#### `env`

Add the axios dependency and register a `<NAME>_API_URL` variable in this app's `.env`/`.env.example`.

```bash
npx nx g next-feature:application --name=web --env=true
```

This:
- Adds the `axios` dependency
- Writes a `<NAME>_API_URL` entry (grouped under an `axios` section) to `.env` and `.env.example`
- Ready to use in server actions

#### `useAuth`

Include NextAuth.js authentication setup.

```bash
npx nx g next-feature:application --name=web --useAuth=true
```

This creates `src/lib/auth/` with:
- NextAuth route handlers (`/api/auth/[...nextauth]`)
- Session provider setup
- Auth configuration and callbacks
- .env configuration for:
  - NEXTAUTH_URL
  - NEXTAUTH_SECRET
  - NEXT_PUBLIC_ROOT_DOMAIN

#### `orgName`

Create scoped package with organization name.

```bash
# Creates @mycompany/web import path
npx nx g next-feature:application --name=web --orgName=mycompany

# tsconfig.base.json will include:
# "@mycompany/web/*": ["apps/web/src/*"]
```

## What Gets Created

### Directory Structure

```
apps/[name]/
├── src/
│   ├── app/
│   │   ├── layout.tsx             # Root layout
│   │   ├── page.tsx               # Home page
│   │   ├── api/
│   │   │   └── auth/              # NextAuth routes (if --useAuth)
│   │   │       └── [...nextauth]/route.ts
│   │   ├── middleware.ts          # Edge middleware
│   │   └── [slug]/
│   │       └── page.tsx           # Dynamic routes
│   ├── lib/
│   │   ├── actions/               # Server actions
│   │   ├── components/            # React components
│   │   ├── stores/                # Zustand stores
│   │   ├── types/                 # TypeScript types
│   │   ├── constants/             # Constants and enums
│   │   ├── utils/                 # Utility functions
│   │   └── auth/                  # Auth setup (if --useAuth)
│   │       ├── authOptions.ts
│   │       └── routes.ts
│   ├── public/                    # Static assets
│   └── styles/                    # CSS modules
├── .env.local                     # Environment variables
├── .env.example                   # Environment template
├── .eslintrc.json
├── jest.config.ts
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
├── package.json
└── project.json                   # Nx project configuration
```

### TypeScript Path Aliases

After creating an application, your `tsconfig.base.json` includes:

```json
{
  "compilerOptions": {
    "paths": {
      "@app/[name]/*": ["apps/[name]/src/*"]
    }
  }
}
```

This enables clean imports throughout the application:

```typescript
import { getUser } from '@app/[name]/lib/actions'
import { useAuthStore } from '@app/[name]/lib/stores'
```

### Default Dependencies

All applications include:

```json
{
  "dependencies": {
    "@tanstack/react-query": "^5.x.x",
    "sonner": "^0.x.x",
    "zod": "^3.x.x"
  }
}
```

- **@tanstack/react-query** - Data fetching and caching
- **sonner** - Toast notifications
- **zod** - TypeScript-first schema validation

### Optional Dependencies

#### With `--env`

```json
{
  "dependencies": {
    "axios": "^1.x.x"
  }
}
```

#### With `--useAuth`

```json
{
  "dependencies": {
    "next-auth": "^5.x.x"
  }
}
```

### Environment Configuration

A `.env.local` file is created with initial configuration:

```env
NEXTAUTH_URL=http://localhost:4200
NEXT_PUBLIC_ROOT_DOMAIN=localhost:4200
AUTH_SECRET=[generated-secret]
```

And `.env.example` for documentation:

```env
# Application URL
NEXTAUTH_URL=http://localhost:4200
NEXT_PUBLIC_ROOT_DOMAIN=localhost:4200

# NextAuth configuration
AUTH_SECRET=your-secret-here

# API configuration (if using Axios)
NEXT_PUBLIC_API_URL=http://localhost:3000
```

`lib/config/env.ts` is generated alongside these files with a typed `NEXT_PUBLIC_ROOT_DOMAIN` accessor (and a `<NAME>_API_URL` one when `--env` is set), kept in sync by the [dotenv generator](../../misc/dotenv/README.md)'s marker-based sync. Add further vars later with `npx nx g next-feature:dotenv --projectName=[name] --set=KEY=VALUE`.

## Common Workflows

### Workflow 1: Simple Web Application

```bash
# 1. Create web app
npx nx g next-feature:application --name=web

# 2. Create components
npx nx g next-feature:component --name=Hero --componentType=component --projectName=web
npx nx g next-feature:component --name=Navigation --componentType=component --projectName=web

# 3. Create pages
npx nx g next-feature:component --name=About --componentType=page --projectName=web

# 4. Create utilities
npx nx g next-feature:utility --name=helpers --projectName=web
```

### Workflow 2: Full-Stack App with Auth and API

```bash
# 1. Create app with authentication
npx nx g next-feature:application --name=web --useAuth=true --env=true

# 2. Create feature for users
npx nx g next-feature:feature --name=users --projectName=web

# 3. Create API action
npx nx g next-feature:action --name=getUser --actionType=api --projectName=web

# 4. Create types
npx nx g next-feature:data-type --name=User --projectName=web

# 5. Create components
npx nx g next-feature:component --name=UserProfile --projectName=web

# 6. Create store
npx nx g next-feature:store --name=userStore --projectName=web
```

### Workflow 3: Admin Dashboard

```bash
# 1. Create admin app
npx nx g next-feature:application --name=admin --useAuth=true --env=true

# 2. Create dashboard feature
npx nx g next-feature:feature --name=dashboard --projectName=admin

# 3. Create data fetching
npx nx g next-feature:action --name=getDashboardData --actionType=api --projectName=admin

# 4. Create dashboard components
npx nx g next-feature:component --name=DashboardLayout --componentType=layout --projectName=admin
npx nx g next-feature:component --name=MetricsCard --componentType=card --projectName=admin

# 5. Create analytics store
npx nx g next-feature:store --name=analyticsStore --projectName=admin
```

## Development Commands

### Run Development Server

```bash
# Watch mode with live reload
npx nx serve [name]

# Or use Next.js directly
cd apps/[name]
npm run dev
```

### Build Application

```bash
npx nx build [name]
```

### Run Tests

```bash
npx nx test [name]
```

### Lint Code

```bash
npx nx lint [name]
```

### Export Static Site

```bash
cd apps/[name]
npm run build
npm run export
```

## Generating Code in Applications

### Server Actions

```bash
npx nx g next-feature:action \
  --name=getUser \
  --actionType=api \
  --projectName=[name] \
  --useTypes \
  --useConstant
```

### React Components

```bash
npx nx g next-feature:component \
  --name=UserProfile \
  --componentType=component \
  --projectName=[name]
```

### API Routes

```bash
# Create Next.js API route
cd apps/[name]/src/app/api
mkdir users
touch users/route.ts
```

### Middleware

```typescript
// apps/[name]/src/middleware.ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Add your middleware logic
  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
```

## Database Integration

### Setup Prisma

```bash
# Install Prisma
npm install @prisma/client
npm install -D prisma

# Initialize Prisma
npx prisma init

# Create migrations
npx prisma migrate dev --name init
```

### Use with Server Actions

```typescript
// apps/[name]/src/lib/actions/get-users.ts
'use server'

import { prisma } from '@/lib/prisma'

export async function getUsers() {
  try {
    const users = await prisma.user.findMany()
    return { success: true, data: users }
  } catch (error) {
    return { success: false, error: error.message }
  }
}
```

## Deployment

### Vercel

```bash
# Connect to Vercel
vercel link

# Deploy
vercel deploy

# Deploy to production
vercel deploy --prod
```

### Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

## Best Practices

### 1. Organize by Feature

Create feature directories within your application:

```
apps/[name]/src/lib/
├── actions/
│   ├── users/
│   ├── products/
│   └── billing/
└── components/
    ├── users/
    ├── products/
    └── billing/
```

### 2. Use Server Components by Default

Leverage React Server Components for better performance:

```typescript
// app/page.tsx - Server component by default
export default async function Home() {
  const data = await fetchData()
  return <div>{/* content */}</div>
}

// app/components/interactive.tsx - Client component when needed
'use client'

export function InteractiveButton() {
  return <button>Click me</button>
}
```

### 3. Environment Variables

Use `.env.local` for secrets:

```env
DATABASE_URL=postgresql://...
API_SECRET=secret-key
```

Use `NEXT_PUBLIC_` prefix for client-side variables:

```env
NEXT_PUBLIC_API_URL=https://api.example.com
```

### 4. Error Handling

Create centralized error handling:

```typescript
// lib/actions/get-user.ts
'use server'

import { ApiError } from '@next-feature/client'

export async function getUser(id: string) {
  try {
    // ... fetch logic
  } catch (error) {
    const apiError = ApiError.of(error)
    return { success: false, error: apiError.problemDetail }
  }
}
```

## Troubleshooting

### Issue: Port already in use

**Solution:** Use different port:

```bash
npx nx serve [name] -- --port 3001
```

### Issue: Build fails with TypeScript errors

**Solution:** Check types:

```bash
npx nx build [name]
# Fix errors shown in output
```

### Issue: Styles not applying

**Solution:** Ensure Tailwind is configured:

```bash
cat tailwind.config.js | grep content
```

### Issue: Environment variables not loaded

**Solution:** Check .env.local file:

```bash
cat apps/[name]/.env.local
```

## Comparison: Application vs Feature

| Aspect | Application | Feature |
|--------|-------------|---------|
| Directory | `apps/[name]/` | `libs/[name]/` or `apps/[name]/` |
| Use Case | Standalone app | Reusable code |
| Next.js | Full setup | Library structure |
| Entry Point | `app/` router | `src/index.ts` |
| Deployment | Deployed directly | Imported by apps |
| Imports | `@app/[name]` | `@feature/[name]` |

## See Also

- [Feature Generator](../feature/README.md) - Create feature libraries
- [Preset Generator](../preset/README.md) - Quick initial setup
- [Action Generator](../../code/action/README.md) - Server actions
- [Dotenv Generator](../../misc/dotenv/README.md) - Manage .env* vars and env.ts
- [next-feature Plugin](../../README.md) - All generators
- [NextFeature](../../../README.md) - Main documentation
