# Contributing to Framelet

Thank you for your interest in contributing to Framelet! Please take a moment to review these guidelines to help keep the project consistent and easy to maintain.

## Getting Started

1. **Fork and clone** the repository:

   ```bash
   git clone https://github.com/Amal-kphilip/Framelet.git
   cd Framelet
   ```

2. **Use Node.js 22+** (see `.nvmrc`):

   ```bash
   nvm use
   ```

3. **Install dependencies**:

   ```bash
   npm install
   ```

4. **Start the development server**:

   ```bash
   npm run dev
   ```

## Branch Naming

Create a new branch from `main` using a descriptive prefix:

- `feat/<short-description>` — new features
- `fix/<short-description>` — bug fixes
- `docs/<short-description>` — documentation updates
- `chore/<short-description>` — tooling, config, or maintenance
- `refactor/<short-description>` — code refactoring without behavior changes
- `test/<short-description>` — adding or updating tests

## Commit Convention

This project follows [Conventional Commits](https://www.conventionalcommits.org/) enforced by `commitlint` via Husky:

```text
<type>(optional scope): <short summary>
```

Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore`, `revert`.

## Code Quality & Checks

Before pushing or opening a pull request, run the full verification suite:

```bash
npm run check
```

Individual commands:

- `npm run lint` — run ESLint across the repository
- `npm run format` — format files with Prettier
- `npm run format:check` — verify Prettier formatting
- `npm run typecheck` — run TypeScript type checking (`tsc --noEmit`)
- `npm test` — run unit tests with Vitest
- `npm run build` — build the production Next.js bundle

Pre-commit hooks (`lint-staged`) automatically format and lint staged files on commit.

## Pull Request Process

1. Ensure your branch is up to date with `main`.
2. Keep pull requests focused on a single concern.
3. Add or update unit tests for any logic changes.
4. Confirm `npm run check` passes locally with zero errors.
5. Fill out the Pull Request template completely and request a review.

## Code of Conduct

All contributors are expected to uphold our [Code of Conduct](CODE_OF_CONDUCT.md).
