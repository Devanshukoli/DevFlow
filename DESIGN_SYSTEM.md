# DevFlow Design System Specification

## 1. Design Philosophy
DevFlow is a developer-focused repository intelligence platform designed with a dark-first aesthetic inspired by modern engineering, observability, and infrastructure tools ("GitHub + Linear + modern developer tooling").

Key tenets:
- **Dark-First Surface Elevation**: Layered dark background surfaces (`#0b0f17` -> `#111722` -> `#17202e`) with subtle 1px low-contrast borders (`#222f43`) instead of heavy glowing shadows.
- **Restrained Color Accents**: A restrained developer green (`#10b981` / `--primary`) used strictly to communicate active states, health, success, and primary actions.
- **Technical & Monospace Typography**: Monospace font (`JetBrains Mono`) for repository metadata, metrics, logs, file paths, code, and system status indicators.
- **Low-Density Sharpness**: Crisp borders and subtle rounded corners (`rounded-md`, `rounded-lg`) rather than large consumer SaaS pill containers.

---

## 2. Color System (CSS Tokens)

| Token | CSS Variable | Hex / Value | Purpose |
| :--- | :--- | :--- | :--- |
| **Background** | `--background` | `#0b0f17` | Main canvas background |
| **Surface** | `--surface` | `#111722` | Cards, panels, input fields |
| **Elevated Surface** | `--surface-elevated` | `#17202e` | Hover states, active containers |
| **Muted Surface** | `--surface-muted` | `#1e293b` | Secondary backgrounds |
| **Border** | `--border` | `#222f43` | Primary 1px structural borders |
| **Subtle Border** | `--border-subtle` | `#182333` | Internal item dividers |
| **Primary** | `--primary` | `#10b981` | Restrained developer green |
| **Foreground** | `--foreground` | `#f8fafc` | Primary text color |
| **Muted Foreground** | `--muted-foreground` | `#94a3b8` | Secondary/caption text |
| **Success** | `--success` | `#10b981` | Success state |
| **Warning** | `--warning` | `#f59e0b` | Warning state |
| **Danger** | `--danger` | `#ef4444` | Critical error state |
| **Info** | `--info` | `#3b82f6` | Informational state |

---

## 3. Typography
- **Primary Sans-Serif**: `Plus Jakarta Sans` for general UI text, headers, and descriptions.
- **Monospace Font**: `JetBrains Mono` for code snippets, repository names, branch names, file paths, metrics, and technical labels.

### Classes
- `.text-display`: 36px / 800 weight / tracking tight
- `.text-h1`: 30px / 700 weight
- `.text-h2`: 24px / 600 weight
- `.text-h3`: 20px / 600 weight
- `.text-body`: 14px / leading 24px / slate-300
- `.text-body-sm`: 12px / leading 20px / slate-400
- `.text-caption`: 11px / slate-500
- `.text-tech-label`: Monospace / 11px / uppercase / tracking-wider / bold

---

## 4. Spacing Principles
- Standardized Tailwind scale (`gap-2`, `p-4`, `space-y-4`).
- Avoid arbitrary inline spacing values.
- Consistent outer container padding (`p-4 sm:p-8 lg:p-12`).

---

## 5. Component Conventions
- **`Button`**: Supports `primary`, `secondary`, `ghost`, and `destructive` variants across `sm`, `md`, and `lg` sizes. Built-in `isLoading` state.
- **`Input`**: Supports label, description, prefix/suffix elements, error messages, and monospace styling (`isMonospace`).
- **`Card`**: Modular primitives (`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`) with `default`, `muted`, and `interactive` variants.
- **`Badge`**: Compact semantic pills (`neutral`, `success`, `warning`, `danger`, `info`).
- **`StatusIndicator`**: Dot indicator with optional ping/pulse animation for live statuses (`ready`, `running`, `completed`, `failed`, `warning`, `info`, `idle`).
- **`Progress`**: Determinate (0-100%) and indeterminate visual loading progress bars.
- **`CodeBlock`**: Monospace code view with filename header, copy button, and line numbers.
- **`Metric`**: Technical metric layout with label, value, trend indicator, and description.
- **`EmptyState`**: Zero-data placeholder with icon, title, description, and action button.
- **`Skeleton`**: Subtle animated loading shimmer (`text`, `rectangular`, `circular`).
- **`Tooltip`**: Lightweight hover info tooltip.
- **DevFlow Primitives**: `TechnicalLabel`, `TerminalLine`, `HealthIndicator`, `SectionHeader`.

---

## 6. Animation Principles
- Fast, functional transitions (150ms–250ms `ease-in-out`).
- Avoid excessive scale transforms, bouncing, or flashy gradients.
- Pulsing reserved strictly for active running processes or skeleton shimmers.

---

## 7. Accessibility Principles
- Semantic HTML tags (`<button>`, `<label>`, `<input>`, `<h1>`-`<h3>`, `<section>`, `<footer>`).
- Visible keyboard focus rings (`focus-visible:ring-2 focus-visible:ring-emerald-500/50`).
- High-contrast text on dark backgrounds adhering to WCAG AA guidelines.
