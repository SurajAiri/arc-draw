# Arc Draw

Arc Draw is a modern, local-first diagramming and whiteboarding application built for speed and reliability. Powered by Excalidraw's infinite canvas and a robust offline-capable sync engine, it allows you to capture ideas instantly—whether you're online or offline.

## Features

- **Infinite Canvas:** Built on top of [Excalidraw](https://excalidraw.com/), providing a smooth, hand-drawn aesthetic and powerful vector drawing capabilities.
- **Local-First Architecture:** Edits are instantly saved to your browser's IndexedDB. You can start drawing immediately, with zero network blocking.
- **Background Syncing:** Changes are seamlessly synced to the cloud in the background. If you go offline, your edits are safely stored locally and pushed to the server automatically when connectivity is restored.
- **Conflict Resolution:** Built-in safeguards ensure that offline edits don't silently overwrite newer server changes.
- **Custom Icon Support:** Deep integration with Lucide and Iconify, allowing you to search, stamp, and dynamically recolor thousands of icons directly on the canvas.
- **Sleek Monochrome UI:** A beautiful, distraction-free dark-mode-first design system built with Tailwind CSS v4 and Shadcn UI.
- **Secure Authentication:** JWT-based authentication with Argon2 password hashing.

## Screenshots

<div align="center">
  <img src="./screenshots/img-1.jpg" alt="Editor Canvas" width="800"/>
  <br/><br/>
  <img src="./screenshots/img-2.jpg" alt="Editor Canvas" width="800"/>
  <br/><br/>
  <img src="./screenshots/img-3.jpg" alt="Monochrome UI Interface" width="800"/>
</div>

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, v16)
- **Monorepo:** [Turborepo](https://turbo.build/repo)
- **Database:** PostgreSQL (managed with [Drizzle ORM](https://orm.drizzle.team/))
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Storage:** AWS S3 (for assets and exports)
- **State & Caching:** IndexedDB (via custom `idb.ts` wrapper), Zustand

## Getting Started

### Prerequisites

- Node.js (v20+)
- [pnpm](https://pnpm.io/) package manager
- A running PostgreSQL database instance

### Installation

1. Clone the repository:

   ```sh
   git clone https://github.com/SurajAiri/arc-draw.git
   cd arc-draw
   ```

2. Install dependencies:

   ```sh
   pnpm install
   ```

3. Set up environment variables:
   Copy `.env.example` to `.env` in the `apps/web` directory and fill in your database credentials and JWT secrets.

4. Run database migrations:
   ```sh
   cd apps/web
   pnpm drizzle-kit push
   ```

### Development

To start the development server for all apps in the monorepo:

```sh
pnpm run dev
```

The Arc Draw web application will be available at `http://localhost:3000`.

## Architecture Overview

- **`apps/web`:** The primary Next.js application containing the dashboard, authentication flow, and the diagram editor.
- **`components/canvas/ExcalidrawCanvas.tsx`:** The core wrapper around the Excalidraw library. Handles the local-first save debounce, SVG icon rendering, and background server syncing.
- **`lib/idb/index.ts`:** A lightweight IndexedDB wrapper that manages the local cache of diagrams and their sync states.

## License

This project is proprietary and confidential.
