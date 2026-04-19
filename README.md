# Boring Bounty

A Talent Marketplace for Proof-of-Skill Hiring. Organizations post real-world tasks (bounties), builders prove their skills by completing them, winners get paid + build reputation.

## Tech Stack

- **Frontend**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **Icons**: lucide-react
- **Backend**: Supabase (Postgres + Realtime)
- **Authentication**: Privy (Wallet-based login)
- **Validation**: Zod
- **Styling**: shadcn/ui aesthetic (Tailwind classes)

## Phase 1 Features (MVP)

### Authentication & User System
- Wallet login via Privy
- Auto-create user accounts
- User Roles: Builder (Talent), Organization (Founder/Company), Hiring Manager
- Profile creation flow with role selection

### Profile System
- **Builder Profile**: Username, Telegram, Bio, Skills, GitHub, Portfolio, CV, LinkedIn, X
- **Organization/Hiring Manager Profile**: Name, Telegram, Description, Website

### Core Pages
- `/` - Landing Page with vision
- `/organizations` - Browse organizations hiring
- `/bounties` - Browse all bounties
- `/bounty/[id]` - View bounty details
- `/create-bounty` - Org creates bounty
- `/profile/[id]` - Public profile
- `/complete-profile` - Profile creation flow

### Bounty System
- Create bounties with title, description, reward, deadline, required skills, industry
- Submit work via GitHub link, demo link, description
- View submissions per bounty

### Security
- RLS policies implemented (builders only see their submissions, orgs only see their bounties)
- Zod validation on all forms
- Server Actions for data mutations

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run the SQL migration from `supabase/migrations/001_initial_schema.sql`
3. Get your project URL and anon key from Supabase settings

### 3. Set Up Privy

1. Create a Privy app at [privy.io](https://privy.io)
2. Get your App ID and App Secret from Privy dashboard
3. Configure allowed origins in Privy (include `http://localhost:3000` for development)

### 4. Environment Variables

Copy `.env.local.example` to `.env.local` and fill in the values:

```bash
cp .env.local.example .env.local
```

Required environment variables:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
PRIVY_APP_SECRET=your_privy_app_secret
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Database Schema

### Tables
- **users** - User profiles with role-specific fields
- **bounties** - Bounty listings with rewards, deadlines, skills
- **submissions** - Builder submissions with scoring and status

### Views
- **bounties_with_org** - Bounties with organization details
- **submissions_with_builder** - Submissions with builder context
- **builder_leaderboard** - Top builders ranked by rating

## Key Decisions

1. **Privy for Auth**: Chosen for seamless wallet-based authentication without requiring users to manage private keys directly
2. **Supabase RLS**: Row-level security ensures data privacy at the database level
3. **Server Actions**: Used for all mutations to leverage Next.js 16's server-side capabilities
4. **Zod Validation**: Client and server-side validation for data integrity
5. **TypeScript Strict Mode**: Ensures type safety throughout the application

## Phase 1 Complete

All Phase 1 features have been implemented:
- ✅ Authentication & User System
- ✅ Profile System (Builder + Organization)
- ✅ Core Pages (Landing, Organizations, Bounties, Bounty Detail, Create Bounty, Profile)
- ✅ Bounty Creation
- ✅ Submission System
- ✅ RLS Policies
- ✅ Zod Validation
- ✅ Server Actions

## Next Steps (Phase 2)

Phase 2 will include:
- Bounty Discovery (Search, Filters, Sort)
- Dashboards (Builder + Organization)
- Review System (View submissions, Select winner, Provide feedback)

## Deployment

Deploy on Vercel:
```bash
vercel deploy
```

Make sure to add environment variables in Vercel project settings.
"# boring-bounty" 
