# FocusFlow Timers

A sleek, multi-tasking timer application built with React, TypeScript, and Tailwind CSS. Features a Picture-in-Picture mode for focused productivity and detailed history tracking.

## Features

- **Multi-Timer Management**: Create, pause, and resume multiple named timers.
- **Picture-in-Picture Mode**: Minimize timers to a floating window while you work.
- **Detailed History**: Track your productivity with daily, weekly, and monthly visualizations.
- **Drill-down Analytics**: Click on charts to drill down from yearly views to specific days.
- **Focus Mode**: Clean, distraction-free interface.
- **Data Persistence**: Timers and history are saved locally.

## Development

This project uses [Vite](https://vitejs.dev/) for a fast development experience.

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Deployment

This repository is configured for automated deployment to **GitHub Pages** using GitHub Actions.

### Setting up Deployment

1. Go to your repository **Settings**.
2. Navigate to **Pages** (under the "Code and automation" section).
3. Under **Build and deployment** > **Source**, select **GitHub Actions**.
4. Push your changes to the `main` branch.

The included workflow `.github/workflows/deploy.yml` will automatically build the application and deploy it to your GitHub Pages site.
