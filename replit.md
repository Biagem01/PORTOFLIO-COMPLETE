# Portfolio Website

## Overview

This is a modern, animated portfolio website built with React, TypeScript, and Vite. The application showcases a developer/designer's work through an interactive, visually appealing single-page application with smooth parallax scrolling effects, framer-motion animations, and a comprehensive UI component library based on shadcn/ui.

The portfolio features:
- Hero section with parallax background effects
- About section with scrolling animations
- Projects showcase with detailed cards
- Contact form with toast notifications
- Dark/light theme support
- Responsive design for all screen sizes

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework Stack**
- **React 18+** with TypeScript for type-safe component development
- **Vite** as the build tool and development server for fast HMR and optimized production builds
- **Wouter** for client-side routing (lightweight alternative to React Router)
- **Framer Motion** for advanced animations and scroll-based parallax effects

**Design System**
- **shadcn/ui** component library built on Radix UI primitives
- **Tailwind CSS** for utility-first styling with CSS custom properties for theming
- **class-variance-authority** for component variant management
- Custom theme system supporting light/dark modes via next-themes
- Design tokens defined in CSS variables (HSL color format) in `index.css`

**State Management**
- **React Query (TanStack Query)** for server state management and API caching
- **React Hook Form** with Zod resolvers for form validation
- Local component state using React hooks

**UI Components**
The application uses a comprehensive set of pre-built UI components from Radix UI, including:
- Dialog, Popover, Dropdown Menu for overlays
- Toast, Sonner for notifications
- Accordion, Tabs, Collapsible for content organization
- Form components (Input, Textarea, Select, Checkbox, etc.)
- Navigation Menu, Breadcrumb for navigation
- All components are accessible and keyboard-navigable

### Backend Architecture

**Server Setup**
- **Express.js** server for handling HTTP requests
- Development mode uses Vite's middleware mode for HMR integration
- Production mode serves static files from the `dist/public` directory
- Custom logging middleware for API request tracking

**API Structure**
- Routes registered through `server/routes.ts`
- Currently minimal API implementation (placeholder for future endpoints)
- Error handling middleware with standardized JSON error responses

**Development vs Production**
- Development: Vite dev server with HMR runs alongside Express
- Production: Express serves pre-built static assets
- Environment-aware configuration via NODE_ENV

### Data Storage Solutions

**Current State**
- No active database implementation
- Drizzle ORM is included in dependencies but not configured
- Schema definitions prepared in `shared/schema.ts` (currently empty)

**Prepared for Future Integration**
- Drizzle ORM ready for PostgreSQL integration
- Type-safe schema definitions with drizzle-zod for validation
- Shared types between frontend and backend via `shared/` directory

### Component Architecture

**Page Structure**
- `Index.tsx`: Main landing page composing all sections
- `AllProjects.tsx`: Dedicated projects gallery page
- `NotFound.tsx`: 404 error page

**Section Components**
- `Hero.tsx`: Animated hero section with parallax scrolling
- `About.tsx`: About section with scroll-triggered animations
- `Projects.tsx`: Featured projects showcase
- `Contact.tsx`: Contact form with toast notifications
- `Navbar.tsx`: Sticky navigation with scroll-based styling

**Shared Components**
- `ThemeProvider.tsx`: Dark/light theme context wrapper
- `NavLink.tsx`: Active-state-aware navigation links
- Extensive UI component library in `components/ui/`

### Styling Architecture

**Tailwind Configuration**
- Custom color system using HSL values for easy theme switching
- Extended font families (Inter for body, Space Grotesk for headings)
- Custom gradients and shadow variables
- Responsive breakpoints with container queries

**CSS Custom Properties**
- Theme colors defined as HSL values for programmatic manipulation
- Separate light/dark mode color schemes
- Design tokens for shadows, transitions, and effects

### Build and Deployment

**Development Workflow**
- `npm run dev`: Starts Express server with Vite middleware
- Hot module replacement for instant updates
- TypeScript compilation with `tsx watch`

**Production Build**
- `npm run build`: Vite builds optimized client bundle to `dist/public`
- `npm start`: Express serves production build
- Separate TypeScript configs for client and server code

**Path Aliases**
- `@/*`: Client source files
- `@shared/*`: Shared types and schemas
- `@assets/*`: Public assets

## External Dependencies

### UI and Styling
- **Radix UI**: Headless UI components (@radix-ui/* packages)
- **Tailwind CSS**: Utility-first CSS framework
- **Framer Motion**: Animation library for React
- **next-themes**: Theme management (despite not using Next.js)
- **Embla Carousel**: Carousel/slider component
- **Lucide React**: Icon library

### Forms and Validation
- **React Hook Form**: Form state management
- **Zod**: TypeScript-first schema validation
- **@hookform/resolvers**: Integration between React Hook Form and Zod

### Data Fetching
- **TanStack React Query**: Async state management and caching

### Backend Framework
- **Express.js**: Web server framework

### Build Tools
- **Vite**: Frontend build tool and dev server
- **TypeScript**: Type-safe JavaScript
- **ESLint**: Code linting with TypeScript support
- **PostCSS**: CSS processing with Autoprefixer

### ORM (Prepared)
- **Drizzle ORM**: Type-safe database ORM
- **drizzle-zod**: Zod schema generation from Drizzle schemas

### Routing
- **Wouter**: Minimalist client-side router

### Utilities
- **clsx** & **tailwind-merge**: Conditional class name utilities
- **class-variance-authority**: Component variant management
- **date-fns**: Date manipulation library
- **cmdk**: Command menu component

### Development Tools
- **lovable-tagger**: Development-only component tagging
- **tsx**: TypeScript execution for Node.js