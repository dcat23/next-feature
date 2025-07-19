# Next-Feature Plugin

This library was generated with [Nx](https://nx.dev).

## Generators

### API

Generate server action function for calls to external APIs

**Usage**:

```bash
nx generate next-feature:api [name] [options,...]
```

**Options**:

| Option            | Description                                   |   Type    |  Default  |
|:------------------|-----------------------------------------------|:---------:|:---------:|
| --name (required) | The name for the method                       |  string   |           |
| --directory       | The directory of the features plugin          |  string   |           |
| --package         | The package within the feature plugin         |  string   |   "lib"   | 
| --projectName     | The package where the generated files will go |  string   |  "base"   |
| --useTypes        | Generate type files                           |  boolean  |   true    | 

---

---
## Building

Run `nx build next-feature` to build the library.

## Running unit tests

Run `nx test next-feature` to execute the unit tests via [Jest](https://jestjs.io).
