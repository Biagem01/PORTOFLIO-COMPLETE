export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  video: string;
  year: string;
  role: string;
  services: string[];
  technologies: string[];
  challenge: string;
  solution: string;
  results: string[];
  about: string;
  extraMedia: string[];
  highlight?: string;
  highlightDescription?: string;
  liveUrl?: string;
  repoUrl?: string;
}

export const PROJECTS: Project[] = [
  // ─── 1. MOVIE REVIEW ──────────────────────────────────────────────────────
  {
    id: "movie-review",
    title: "Movie Review",
    category: "Full Stack Development",
    description:
      "A full-stack platform for discovering, reviewing and tracking films and TV series, powered by the TMDb API.",
    video: "/videos/donna-tramonto.webm",
    year: "2024",
    role: "Full Stack Developer",
    services: ["Full Stack Development", "REST API Design", "UI Design"],
    technologies: ["React", "Node.js", "Express.js", "MySQL", "TMDb API", "JWT"],
    challenge:
      "Building a real-time notification system and keeping the UI responsive while managing a large volume of dynamic content fetched from an external API were the main technical hurdles.",
    solution:
      "I designed a RESTful backend with Node.js and Express, handled authentication via JWT, and integrated the TMDb API to serve live film and series data. The notification system was built on a custom event model triggered by user interactions such as likes and comments.",
    results: [
      "Full CRUD review system with likes and real-time notifications",
      "Personal watchlist and favourites per authenticated user",
      "Frontend deployed on Vercel, backend on Render",
    ],
    about:
      "A community-driven platform for film and TV enthusiasts. Users can search any title via TMDb, write and read reviews, manage a personal watchlist, and receive real-time notifications when others interact with their content.",
    extraMedia: [
      "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?auto=format&fit=crop&q=80&w=2070",
    ],
    highlight: "Real-time social notifications",
    highlightDescription:
      "Users receive instant notifications when someone likes or comments on their reviews — built entirely on a custom event model without external libraries.",
    liveUrl: "https://movie-review-alpha-red.vercel.app",
    repoUrl: "https://github.com/Biagem01/MovieReview",
  },

  // ─── 2. NYT CLONE ─────────────────────────────────────────────────────────
  {
    id: "nyt-clone",
    title: "NYT Clone",
    category: "Frontend Development",
    description:
      "A modern, responsive clone of the New York Times homepage built with React and TypeScript, integrating the real NYT API for live article feeds.",
    video: "/videos/Carta-giornali.webm",
    year: "2024",
    role: "Frontend Developer",
    services: ["Frontend Development", "API Integration", "Responsive Design"],
    technologies: [
      "React",
      "TypeScript",
      "Vite",
      "Redux Toolkit",
      "React Query",
      "Firebase Auth",
      "Firestore",
      "Tailwind CSS",
      "Framer Motion",
      "Wouter",
    ],
    challenge:
      "Replicating the editorial layout and multi-section navigation of a major newspaper while keeping article data live and user state persisted across sessions required careful state management and a solid data-fetching strategy.",
    solution:
      "I used Redux Toolkit for global state, React Query for cached article fetching from the NYT API, Firebase Auth for login and registration, and Firestore to persist each user's favourites across sessions. Custom hooks kept business logic clean and reusable.",
    results: [
      "Live article feeds across sections via the official NYT API",
      "Authenticated favourites persisted on Firestore",
      "Article sharing to Twitter, Facebook, WhatsApp and clipboard",
      "Fully responsive across mobile, tablet and desktop",
      "Deployed on Netlify",
    ],
    about:
      "A feature-complete React SPA that mirrors the New York Times reading experience. Users can browse sections, save articles to a personal list synced on Firestore, log in with Firebase, and share stories directly to social platforms.",
    extraMedia: [
      "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1585829365294-bb7c63b3ecda?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1574302088018-84223d6a4005?auto=format&fit=crop&q=80&w=2070",
    ],
    highlight: "Firebase-powered reading list",
    highlightDescription:
      "Saved articles are synced in real time on Firestore — users can log out, come back on any device, and find their list exactly as they left it.",
    liveUrl: "https://newyorkclone.netlify.app",
    repoUrl: "https://github.com/Biagem01/NYT-CLONE",
  },

  // ─── 3. LOOKBOOK ──────────────────────────────────────────────────────────
  {
    id: "lookbook",
    title: "LookBook",
    category: "Backend Development",
    description:
      "A RESTful API backend for a second-hand clothing marketplace, with product management, JWT authentication, multi-image upload and a swap system between users.",
    video: "/videos/donna-balla2.webm",
    year: "2024",
    role: "Backend Developer",
    services: ["REST API Design", "Database Modeling", "Authentication"],
    technologies: ["Node.js", "Express.js", "MySQL", "JWT", "Multer", "bcrypt"],
    challenge:
      "Designing a secure swap system that prevents duplicate or abusive proposals, while also supporting multi-image uploads and keeping all SQL queries protected against injection attacks.",
    solution:
      "I structured the backend with a clear MVC separation (config, controllers, middlewares, models, routes). All queries use prepared statements. Multer handles multipart file uploads to a public /uploads directory. The swap flow enforces state transitions (pending → accepted/rejected) with server-side validation.",
    results: [
      "Full CRUD for products with availability status and multi-image support",
      "JWT-based auth with hashed passwords via bcrypt",
      "Swap system with pending / accepted / rejected states",
      "Filters by date range, availability and swap status",
      "All routes protected against SQL injection via prepared statements",
    ],
    about:
      "A solid Node.js backend that powers a second-hand fashion marketplace. Users can list items with multiple photos, propose swaps, and manage their own inventory — all through a clean, documented REST API.",
    extraMedia: [
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1490481651871-ab68624d5e17?auto=format&fit=crop&q=80&w=2070",
    ],
    highlight: "Peer-to-peer swap system",
    highlightDescription:
      "Users can propose item swaps with each other. The API enforces a full state machine — pending, accepted, rejected — with validation that prevents duplicate or self-targeted proposals.",
    repoUrl: "https://github.com/Biagem01/LookBook",
  },

  // ─── 4. ORIZON TRAVEL AGENCY ──────────────────────────────────────────────
  {
    id: "orizon",
    title: "Orizon",
    category: "Full Stack Development",
    description:
      "A full-stack travel agency web app with a PHP backend and Vanilla JS frontend, providing full CRUD management for countries and associated trips.",
    video: "/videos/uomo-deserto.webm",
    year: "2024",
    role: "Full Stack Developer",
    services: ["Full Stack Development", "REST API Design", "Database Modeling"],
    technologies: ["PHP", "MySQL", "JavaScript", "HTML5", "CSS3", "Composer", "PDO"],
    challenge:
      "Building a dynamic single-page-like experience without a frontend framework — all updates to countries and trips had to happen asynchronously without full page reloads, using only Vanilla JS and the Fetch API.",
    solution:
      "I built a PHP backend with a clean modular structure (App / Core separation) and PDO for secure database access. The frontend uses the Fetch API to communicate with the PHP REST endpoints, updating the DOM in real time. All inputs are validated server-side before any database write.",
    results: [
      "Full CRUD for countries and trips with relational linking",
      "Fully async frontend — no page reloads on any operation",
      "Server-side validation on all inputs",
      "Modular PHP backend with Composer autoloading",
    ],
    about:
      "A travel management platform built from scratch in PHP and Vanilla JS. Agency staff can add destinations and attach trips to them, update details, and remove entries — all from a clean, responsive interface that never reloads the page.",
    extraMedia: [
      "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1530789253388-582c481c54b0?auto=format&fit=crop&q=80&w=2070",
    ],
    highlight: "Zero-reload CRUD interface",
    highlightDescription:
      "Every create, update and delete operation runs through the Fetch API — the page state updates instantly without a single full reload, built entirely in Vanilla JS.",
    repoUrl: "https://github.com/Biagem01/Orizon-travel-agency",
  },

  // ─── 5. TICKETING DATABASE ────────────────────────────────────────────────
  {
    id: "ticketing-db",
    title: "Ticketing DB",
    category: "Database Design",
    description:
      "A complete relational database system designed in SQL for managing event ticket sales, covering events, venues, tickets, customers, artists and promoters.",
    video: "/videos/donna-tramonto.webm",
    year: "2023",
    role: "Database Designer",
    services: ["Database Modeling", "SQL Development", "Schema Design"],
    technologies: ["MySQL", "SQL"],
    challenge:
      "Translating a complex real-world ticketing business — with events, venues, multiple ticket types, artists and promoters all interlinked — into a clean relational schema with solid integrity constraints.",
    solution:
      "I went through all three design phases: conceptual (ER diagram with all entities and relationships), logical (normalised relational schema with foreign keys and constraints), and physical (full SQL DDL with indexes and sample data). The result is a deployable schema that tracks every transaction and manages seat availability automatically.",
    results: [
      "Full ER diagram covering 6 entities and their relationships",
      "Normalised relational schema with referential integrity",
      "SQL DDL with tables, constraints, indexes and sample data",
      "Transaction tracking with automatic quantity management per event",
    ],
    about:
      "A rigorous database design project that models an entire event ticketing business. From the conceptual ER diagram down to the physical SQL schema, every design decision is documented — demonstrating a solid understanding of relational database theory.",
    extraMedia: [
      "https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&q=80&w=2070",
    ],
    highlight: "Three-phase database design",
    highlightDescription:
      "The project covers conceptual, logical and physical design in full — from ER diagram to normalised schema to deployable SQL, with every constraint and relationship clearly documented.",
    repoUrl: "https://github.com/Biagem01/Database-SQL-Project",
  },

  // ─── 6. KNIGHT WARRIOR ────────────────────────────────────────────────────
  {
    id: "knight-warrior",
    title: "Knight Warrior",
    category: "Game Development",
    description:
      "A 2D platformer game built with Unity and C#, featuring multiple difficulty levels, a score leaderboard, power-ups, enemy AI and custom animations.",
    video: "/videos/donna-balla2.webm",
    year: "2023",
    role: "Game Developer",
    services: ["Game Development", "Game Design", "C# Programming"],
    technologies: ["Unity", "C#", "ShaderLab", "HLSL", "PlayerPrefs"],
    challenge:
      "Designing a game architecture that kept all systems — scoring, audio, enemies, checkpoints — decoupled and manageable as complexity grew, while ensuring smooth performance across all three difficulty settings.",
    solution:
      "I used classic OOP patterns throughout: Singleton for GameManager and SoundManager, Coroutines for async events like traps and trampolines, and inheritance with method overriding for specialised enemy and projectile behaviours. PlayerPrefs handles leaderboard persistence across sessions.",
    results: [
      "Three difficulty levels (easy, normal, hard) with in-level checkpoints",
      "Dynamic leaderboard sorted by strawberries collected, persisted via PlayerPrefs",
      "Three power-ups: speed boost, jump height and fireball rate",
      "Timed levels with enemy AI (chase and auto-attack behaviour)",
      "Custom splash screen, game icon and full audio settings",
    ],
    about:
      "A feature-complete Unity platformer where players guide a knight through timed levels, collecting strawberries, dodging enemies and chaining power-ups. Built from scratch, the project demonstrates solid C# OOP, Unity's animation system and thoughtful level design.",
    extraMedia: [
      "https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1614294149010-950b698f72c0?auto=format&fit=crop&q=80&w=2070",
      "https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=2070",
    ],
    highlight: "Singleton + Coroutine architecture",
    highlightDescription:
      "GameManager and SoundManager run as Singletons for clean global access, while Coroutines drive all time-based events — traps, trampolines, power-up timers — keeping the main game loop lean and responsive.",
    repoUrl: "https://github.com/Biagem01/Knight-warrior",
  },
];
