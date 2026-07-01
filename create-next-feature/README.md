# create-next-feature v0.1.0

Interactive CLI tool for scaffolding new NextFeature workspaces with all necessary project structure and configuration.

## Overview

**create-next-feature** provides a quick and easy way to create a new NextFeature workspace with:

- ✅ Nx monorepo setup
- ✅ next-feature generator plugin pre-configured
- ✅ @next-feature/client library installed
- ✅ TypeScript configuration
- ✅ TailwindCSS setup
- ✅ NextAuth.js integration
- ✅ Zustand state management
- ✅ TanStack Query
- ✅ Complete project structure

## Quick Start

### Create a New Project

```bash
npx create-next-feature my-nextfeature-project
cd my-nextfeature-project
```

The tool will:
1. Create a new Nx workspace
2. Install next-feature plugin
3. Setup all dependencies
4. Configure TypeScript and tooling
5. Initialize git repository

### Start Building

```bash
# Create your first feature
npx nx g next-feature:feature --name=users

# Create an API action
npx nx g next-feature:action --name=getUser --actionType=api --projectName=users

# Create a React component
npx nx g next-feature:component --name=UserCard --projectName=users
```

## Installation Methods

### Using npx (Recommended)

```bash
npx create-next-feature my-project
cd my-project
npm start
```

### Using npm

```bash
npm create next-feature@latest my-project
cd my-project
npm start
```

### Using pnpm

```bash
pnpm create next-feature my-project
cd my-project
pnpm start
```

## Project Structure

After creation, your project will have:

```
my-project/
├── apps/                      # Next.js applications
├── libs/                      # Shared feature libraries
├── clients/                   # API client packages
│   └── client/               # Default @next-feature/client
├── tools/                     # Build and development tools
├── nx.json                    # Nx configuration
├── package.json               # Project dependencies
├── tsconfig.base.json        # TypeScript configuration
└── README.md                  # Project README
```

## What's Included

### Nx Configuration

- ✅ Nx 20.8.1
- ✅ next-feature plugin
- ✅ @nx/next integration
- ✅ @nx/eslint configuration
- ✅ Caching and task distribution

### Dependencies

- ✅ **next** (~15.2.4) - React framework
- ✅ **react** (^19.0.0) - UI library
- ✅ **typescript** (^5) - Type safety
- ✅ **tailwindcss** - Utility-first CSS
- ✅ **zustand** (^5.0.6) - State management
- ✅ **axios** (1.9.0) - HTTP client
- ✅ **zod** - Schema validation
- ✅ **@tanstack/react-query** (5.75.7) - Data fetching
- ✅ **next-auth** (5.0.0-beta.27) - Authentication

### Dev Dependencies

- ✅ Jest & Vitest - Testing frameworks
- ✅ ESLint & Prettier - Code quality
- ✅ TypeScript - Type checking

## CLI Options

```bash
create-next-feature [options] [directory]
```

### Options

| Option | Type | Description |
|--------|------|-------------|
| `--help` | flag | Show help message |
| `--version` | flag | Show version number |
| `--package-manager` | enum | npm, pnpm, or yarn |
| `--no-git` | flag | Skip git initialization |
| `--interactive` | flag | Interactive mode (default) |

### Examples

```bash
# Create with specific package manager
npx create-next-feature my-app --package-manager=pnpm

# Create without git initialization
npx create-next-feature my-app --no-git

# Create in current directory
npx create-next-feature --no-interactive .
```

## First Steps After Creation

### 1. Verify Installation

```bash
cd my-project
npm run nx -- list
```

This shows all available generators.

### 2. Create Your First Feature

```bash
npm run nx -- g next-feature:feature --name=dashboard
```

### 3. Generate Code

```bash
# Create an API action
npm run nx -- g next-feature:action --name=getDashboardData \
  --actionType=api --projectName=dashboard

# Create a component
npm run nx -- g next-feature:component --name=DashboardCard \
  --projectName=dashboard

# Create state management
npm run nx -- g next-feature:store --name=dashboardStore \
  --projectName=dashboard
```

### 4. Start Development

```bash
npm start
```

## Available Commands

```bash
# List all generators
npm run nx -- list

# View dependency graph
npm run nx -- graph

# Build projects
npm run nx -- build [project]

# Run tests
npm run nx -- test [project]

# Lint code
npm run nx -- lint [project]

# Format code
npm run nx -- format:write

# View Nx documentation
npm run nx -- list @nx/next
```

## Generators Overview

The created workspace includes all next-feature generators:

### Project Generators

```bash
npm run nx -- g next-feature:feature --name=users
npm run nx -- g next-feature:application --name=myapp
npm run nx -- g next-feature:feature --name=apiClient --type=client
```

### Code Generators

```bash
npm run nx -- g next-feature:action --name=getUser --projectName=users
npm run nx -- g next-feature:component --name=Button --projectName=users
npm run nx -- g next-feature:store --name=userStore --projectName=users
npm run nx -- g next-feature:types --name=user --projectName=users
npm run nx -- g next-feature:constant --name=userRoles --projectName=users
npm run nx -- g next-feature:utility --name=userHelpers --projectName=users
```

### Configuration Generators

```bash
npm run nx -- g next-feature:client-config --projectName=users
npm run nx -- g next-feature:axios --projectName=users
```

## Full Documentation

After creation, comprehensive documentation is available:

- **[next-feature Plugin](../next-feature/README.md)** - Generator reference
- **[@next-feature/client](../clients/client/README.md)** - API client library
- **[NextFeature](../README.md)** - Complete ecosystem guide

## Troubleshooting

### Issue: Command not found

**Solution:** Ensure npx is available and try again:
```bash
npx --version  # Check npx availability
npm install -g npx  # If needed
```

### Issue: Permission denied

**Solution:** Check node/npm installation:
```bash
node --version
npm --version
npm config get prefix  # Check npm prefix
```

### Issue: Slow installation

**Solution:** Use a faster package manager:
```bash
npx create-next-feature my-app --package-manager=pnpm
```

### Issue: Git initialization failed

**Solution:** Initialize manually:
```bash
cd my-app
git init
git add .
git commit -m "Initial commit"
```

## Environment Requirements

- **Node.js** >= 16 (18+ recommended)
- **npm** >= 7 (or pnpm, yarn)
- **git** (optional, for version control)

## What Happens During Creation

1. **Directory Setup** - Creates project directory
2. **Nx Initialization** - Sets up Nx workspace
3. **Dependency Installation** - Installs npm packages
4. **next-feature Setup** - Configures generator plugin
5. **Git Initialization** - Initializes git repository (if not --no-git)
6. **Welcome Message** - Displays next steps

## Package Managers

The tool automatically detects your preferred package manager:

- **npm** - Default
- **pnpm** - Faster, disk-efficient
- **yarn** - Alternative option

Override with `--package-manager` flag.

## Common Workflows

### Workflow 1: API-First Development

```bash
# 1. Create feature
npm run nx -- g next-feature:feature --name=api

# 2. Create API actions
npm run nx -- g next-feature:action --name=getUsers --actionType=api --projectName=api
npm run nx -- g next-feature:action --name=createUser --actionType=api --projectName=api

# 3. Create types and constants
npm run nx -- g next-feature:types --name=user --projectName=api
npm run nx -- g next-feature:constant --name=userEndpoints --projectName=api
```

### Workflow 2: Full-Stack with Auth

```bash
# 1. Create the auth feature library (type is inferred from the name)
npm run nx -- g next-feature:feature --name=auth

# 2. Create login action
npm run nx -- g next-feature:action --name=login --actionType=form --projectName=auth

# 3. Create user store
npm run nx -- g next-feature:store --name=authStore --projectName=auth

# 5. Create protected pages
npm run nx -- g next-feature:component --name=ProtectedPage --projectName=auth
```

## Sharing Your Work

The created project is ready for:

- **Version Control** - Git integration
- **CI/CD** - Nx Cloud support
- **Collaboration** - Monorepo structure
- **Publishing** - NPM package release

## Getting Help

Inside your project:

```bash
# View help for any generator
npm run nx -- g next-feature:action --help

# View Nx documentation
npm run nx -- list

# Check status
npm run nx -- status
```

## See Also

- [NextFeature Main Repository](https://github.com/dcat23/next-feature)
- [Nx Documentation](https://nx.dev)
- [Next.js Documentation](https://nextjs.org)

## License

MIT

---

**Happy coding! 🚀**

For more information, see the documentation in your project after creation.
