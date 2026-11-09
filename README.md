# Saada Students' Union Election 2026 🗳️

A modern, high-concurrency Digital Voting Machine (EVM) and Real-Time Election Management System built for the Central Student Union Election 2026. Powered by **Next.js 16 (Turbopack)**, **Supabase PostgreSQL**, **Supabase Realtime**, and **Supabase Storage**.

---

## 🌟 Key Features

### 🗳️ 1. Student Voting Booth (`/vote`)
- **Default Entry Point**: Root route (`/`) automatically guides students straight to the ballot.
- **Strict Student Separation**: Admin buttons and result links are completely hidden from the student booth.
- **Two-Factor Student Verification**: Authenticates voters using their official Admission Number (`Ad No`) and enrolled Class against the live voter database.
- **Dynamic Sequential Ballot Flow**: Automatically adapts to any number of registered executive roles (e.g., President, General Secretary, Treasurer, Vice President, etc.).
- **Ballot Review & Certification**: Students review all their candidate choices and confirm their voluntary declaration before final encrypted submission.
- **Single-Vote Security Guarantee**: Enforced at the PostgreSQL engine level via unique constraints (`unique_voter_ballot_idx`). Re-voting is strictly prevented.
- **Digital Voting Receipt**: Generates a tamper-evident digital receipt code and cryptographic confirmation timestamp upon completion.

### 📊 2. Presiding Officer Admin Desk (`/admin`)
- **Secure Server-Side Middleware**: Route-protected administrative session with encrypted session cookies (`/admin/login`).
- **Live Realtime Leaderboard & Podium**: Gold, Silver, and Bronze podium visualizing winners, margins, and vote counts dynamically across all contested positions or overall top votes.
- **Live Dashboard & Turnout Analytics**: Real-time voter turnout %, total ballots cast, class-wise participation breakdown, and voting velocity.
- **Dynamic Candidate Management**:
  - Register candidates for any existing post or enter custom executive roles.
  - Direct file upload for candidate profile avatars and official election symbols to Supabase Storage (`election-assets`).
  - Activate, deactivate, or delete candidates in real time.
- **Voter Registry**: Live directory of all registered voters, search by name/admission number, filter by class, and live vote status (`Eligible` / `Voted`).
- **Real-Time Synchronisation**: Push updates powered by Supabase Realtime channels + 3-second background polling fallback. Standings update live on multi-screen displays without manual browser refreshes.

---

## 🏗️ Architecture & Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [Next.js 16 (App Router)](https://nextjs.org/) |
| **Runtime & Bundler** | React 19, Turbopack |
| **Language** | TypeScript |
| **Styling** | [Tailwind CSS v4](https://tailwindcss.com/) |
| **Database** | [Supabase](https://supabase.com/) (Managed PostgreSQL 15+) |
| **Realtime** | Supabase Realtime (PostgreSQL CDC WebSockets) |
| **File Storage** | Supabase Storage (`election-assets` bucket) |
| **Icons & UI** | [Lucide React](https://lucide.dev/), Canvas-Confetti |

---

## 📁 Project Structure

```text
saada-election/
├── public/                     # Static assets & CSV voter data
├── src/
│   ├── app/
│   │   ├── admin/              # Admin Portal (Dashboard, Candidates, Standings, Voters)
│   │   │   ├── login/          # Secure Presiding Officer login
│   │   │   └── page.tsx        # Admin Desk Controller
│   │   ├── api/
│   │   │   └── admin/          # Admin Auth Session API (login/logout cookies)
│   │   ├── vote/               # Student EVM Voting Booth
│   │   ├── globals.css         # Tailwind v4 styles & theme variables
│   │   ├── layout.tsx          # Root HTML layout & fonts
│   │   └── page.tsx            # Default redirect to /vote
│   ├── components/
│   │   ├── admin/              # Admin layout, podium, candidates, and reports
│   │   │   ├── AddCandidateModal.tsx
│   │   │   ├── AdminLayout.tsx
│   │   │   ├── CandidatesView.tsx
│   │   │   ├── DashboardView.tsx
│   │   │   ├── LeaderboardPodium.tsx
│   │   │   ├── ResultsView.tsx
│   │   │   └── VotersView.tsx
│   │   └── voting/
│   │       └── VotingBooth.tsx # Student voting wizard & receipt component
│   ├── data/
│   │   └── electionData.ts     # Schema definitions & initial config
│   ├── lib/
│   │   ├── supabaseClient.ts   # Database client, realtime helpers & CRUD
│   │   └── utils.ts            # Utility functions
│   └── middleware.ts           # Route protection for /admin routes
├── .env.local                  # Environment credentials
├── next.config.ts              # Next.js configuration
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js** v20.x or higher
- **npm**, **pnpm**, or **yarn**
- A **Supabase** project

### 2. Environment Variables
Create a `.env.local` file in the project root:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Admin Authentication
ADMIN_EMAIL=admin@domain.com
ADMIN_PASSWORD=your-secure-password
ADMIN_SECRET_KEY=your-random-session-secret-key
```

### 3. Database & Storage Setup
Ensure the following tables and storage buckets are configured in your Supabase project:

#### Tables:
- `voters` (`id`, `name`, `ad_no`, `class_name`, `has_voted`, `voted_at`, `created_at`)
- `candidates` (`id`, `name`, `post`, `class_name`, `ad_no`, `tagline`, `symbol_url`, `avatar_url`, `votes`, `is_active`)
- `ballots` (`id`, `voter_id`, `created_at`, `post_votes`)

#### Postgres Constraints & Realtime:
```sql
-- Enforce single vote per student
CREATE UNIQUE INDEX IF NOT EXISTS unique_voter_ballot_idx ON ballots (voter_id);

-- Enable full replica identity for realtime CDC
ALTER TABLE candidates REPLICA IDENTITY FULL;
ALTER TABLE voters REPLICA IDENTITY FULL;
ALTER TABLE ballots REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE candidates, voters, ballots;
```

#### Supabase Storage:
- Create a public bucket named **`election-assets`** for candidate avatars and symbols.

### 4. Install Dependencies & Run
```bash
# Install npm dependencies
npm install

# Start development server
npm run dev
```

Visit:
- **Student Voting Booth**: [http://localhost:3000](http://localhost:3000) (or `/vote`)
- **Admin Portal**: [http://localhost:3000/admin](http://localhost:3000/admin)

### 5. Production Build
```bash
# Compile and build optimized production bundle
npm run build

# Start production server
npm run start
```

---

## 🔒 Security & Integrity Safeguards

1. **Anonymous Ballot Submissions**: Ballots track candidate selections separately from voter identity to preserve secret voting rights.
2. **Duplicate Prevention**: A database-level unique constraint prevents race conditions or multi-tab voting attempts.
3. **Session Hardening**: Admin endpoints use HTTP-only, secure, SameSite cookies with server-side validation.
4. **Resilient Syncing**: Instant WebSocket push updates paired with background polling ensure that display podiums and tally monitors never go out of sync during network fluctuations.

---

## 📜 License
This project is developed for institutional academic election administration under the Central Election Committee.
