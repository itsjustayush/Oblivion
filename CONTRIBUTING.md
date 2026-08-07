# Contributing to Oblivion

Thank you for your interest in contributing to **Oblivion**! We welcome bug reports, feature requests, documentation improvements, and code contributions.

---

## Code of Conduct
Please foster an inclusive, respectful, and friendly community. Treat all contributors with courtesy regardless of experience level or background.

---

## Development Setup

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/itsjustayush/oblivion.git
   cd oblivion
   ```

2. **Install Dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

4. **Start Development Server**:
   ```bash
   npm run dev
   ```

5. **Type Checking & Linting**:
   ```bash
   npm run lint
   ```

---

## Pull Request Guidelines

1. **Branch Naming**: Use descriptive branch names like `feature/water-break-timer` or `fix/pomo-streak-bug`.
2. **Code Style**:
   - Write clean, functional TypeScript with modern React hooks.
   - Use Tailwind CSS utility classes for styling and Lucide icons for UI symbols.
   - Maintain mobile and tablet responsiveness.
3. **Commit Messages**: Write concise, imperative commit messages (e.g. `feat: add bento grid navigation modal for mobile`).
4. **Verification**: Ensure `npm run lint` and `npm run build` pass with zero errors before submitting your PR.
