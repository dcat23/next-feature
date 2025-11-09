# Init Generator

The Init generator registers the next-feature plugin with your Nx workspace and sets up necessary dependencies for NextFeature development.

## Overview

The Init generator is an **automatic setup generator** that runs when you first use any next-feature generator. It handles:

- **Plugin Registration** - Registers next-feature in `nx.json` generators section
- **Configuration Setup** - Initializes Nx workspace configuration for generators
- **Dependency Installation** - Adds `lucide-react` icons and dev dependency for next-feature plugin

This generator ensures your workspace is properly configured before running other generators.

## Quick Start

### Manual Invocation

```bash
# Explicitly run the init generator
npx nx g next-feature:init
```

### Automatic Invocation

The init generator runs automatically when you first run any next-feature generator:

```bash
# Running any generator triggers init if not already run
npx nx g next-feature:feature --name=users
```

## What Gets Configured

### 1. Plugin Registration

The `nx.json` file is updated with next-feature plugin entry:

```json
{
  "plugins": [
    "next-feature/src/index"
  ],
  "generators": {
    "next-feature:feature": {
      // Generator defaults
    }
  }
}
```

### 2. Dependencies Added

After running init, your `package.json` will include:

```json
{
  "dependencies": {
    "lucide-react": "^0.x.x"
  },
  "devDependencies": {
    "next-feature": "^0.1.0"
  }
}
```

#### What's Installed

- **lucide-react** - Icon library used throughout generated components
- **next-feature** - The generator plugin itself (dev dependency)

### 3. Workspace Configuration

The init generator ensures `nx.json` includes proper generator configuration:

```json
{
  "generators": {
    "@nx/react": {
      "application": {
        "style": "css"
      }
    }
  }
}
```

## Generator Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `--skipFormat` | boolean | false | Skip prettier code formatting |

The Init generator has minimal options - it's primarily configuration-focused.

## Typical Workflow

### Complete Onboarding Sequence

```bash
# 1. Create Nx workspace (or use existing)
npx create-nx-workspace@latest

# 2. Install next-feature (if not already installed)
npm install --save-dev next-feature

# 3. Run first generator (triggers init automatically)
npx nx g next-feature:preset --name=web

# The init generator runs if needed, then preset runs
```

### Or Explicitly:

```bash
# 1. Manually initialize workspace
npx nx g next-feature:init

# 2. Then run other generators
npx nx g next-feature:preset --name=web
npx nx g next-feature:feature --name=users --projectName=web
```

## How Init Detects if Already Run

The Init generator checks `nx.json` for the next-feature plugin:

```typescript
const hasPlugin = nxJson.plugins?.some((p) =>
  typeof p === 'string' ? p === 'next-feature' : p.plugin === 'next-feature'
);

if (!hasPlugin) {
  // Register plugin and setup configuration
}
```

If the plugin is already registered, init skips re-registration.

## File Changes

### Creates/Updates

✅ **Updates `nx.json`** - Registers next-feature plugin
✅ **Updates `package.json`** - Adds dependencies
✅ **Runs npm/pnpm/yarn install** - Installs new dependencies

### No Breaking Changes

- ✓ Preserves existing nx.json configuration
- ✓ Safely adds plugin entry if it doesn't exist
- ✓ Compatible with existing Nx workspaces

## Troubleshooting

### Issue: Plugin not registered after running generator

**Solution:** Manually run init:

```bash
npx nx g next-feature:init
```

**Verify** plugin is registered:

```bash
cat nx.json | grep -A 2 '"plugins"'
```

### Issue: Dependencies not installed

**Solution:** Check package.json and install manually if needed:

```bash
npm install --save-dev next-feature
npm install lucide-react
```

### Issue: Generator still not available

**Solution:** Clear Nx cache and rebuild:

```bash
npx nx reset
npx nx list next-feature
```

## IDE Integration

After running init, your IDE should:

- ✓ Recognize next-feature generators in autocomplete
- ✓ Provide TypeScript intellisense for generated code
- ✓ Highlight generator commands in suggestions

If not working, restart your IDE and run:

```bash
npx nx reset
```

## Safe to Run Multiple Times

The Init generator is idempotent - it's safe to run multiple times:

```bash
# Safe to run repeatedly
npx nx g next-feature:init
npx nx g next-feature:init
npx nx g next-feature:init
```

It will:
- ✓ Skip re-registration if plugin already registered
- ✓ Not duplicate dependencies
- ✓ Preserve all existing configuration

## Next Steps

After init runs (automatically or manually), you can:

1. **Setup your first app** - Run the Preset generator:
   ```bash
   npx nx g next-feature:preset --name=web
   ```

2. **Create features** - Generate feature libraries:
   ```bash
   npx nx g next-feature:feature --name=users --projectName=web
   ```

3. **Generate code** - Create components, actions, stores:
   ```bash
   npx nx g next-feature:component --name=Button --projectName=web
   npx nx g next-feature:action --name=getUser --projectName=web
   ```

## Integration with create-next-feature CLI

If using the `create-next-feature` CLI tool, init runs automatically during workspace creation:

```bash
npx create-next-feature my-app
# Automatically runs init and preset generators
```

## See Also

- [Preset Generator](../preset/README.md) - Initialize first application
- [next-feature Plugin](../../README.md) - Complete generator overview
- [NextFeature](../../../README.md) - Main ecosystem documentation
