# Stockpile

A personal stock portfolio tracker that gives you full ownership of your investment data — with a clean dashboard, real-time calculations, interactive charts, and full mobile support.

**Live demo:** [stockpile-tushar.vercel.app](https://stockpile-tushar.vercel.app/)

---

## Why I built this

I started tracking my Robinhood portfolio in an Excel spreadsheet and quickly outgrew it — every new stock meant fixing formulas, calculations drifted from rounding errors, and I couldn't check it from my phone. I built Stockpile as a full-stack replacement: a personal finance dashboard that's mine, works everywhere, and never breaks.

It's also my playground for modern web development — Next.js 16 App Router, Supabase, TypeScript, and Tailwind — deployed to production.

---

## Features

### Core
- 🔐 **Authenticated** — email + password via Supabase Auth, Row-Level Security enforced per-user at the database level
- 💰 **Complete transaction log** — deposits, buys, sells (with fees), and income (dividends + bonuses)
- ✏️ **Full CRUD** — add, edit, and delete every transaction type with inline row actions
- 📊 **Real-time dashboard** — 5 KPI cards, per-ticker holdings summary, and 3 charts that update instantly
- 🎯 **Weighted average cost basis** — auto-calculated across multiple buys of the same stock
- 💵 **Realized P&L tracking** — live-calculated on every sell, factoring in fees

### Visualizations
- 🥧 **Portfolio allocation pie** — where your money sits by ticker
- 📊 **Realized P&L bar chart** — profit or loss on closed positions, color-coded
- 📈 **Net worth over time line** — cumulative deposits + income + realized P&L, colored by overall gain/loss

### Navigation & Data
- 🔍 **Position detail pages** — click any ticker for a full drilldown: KPIs, all buys, all sells, all income, and a unified timeline
- 📜 **Activity feed** — unified searchable timeline across every transaction type with filter chips
- 💾 **CSV import** — bulk-load your entire Excel history in one shot, with per-row validation and preview
- 📤 **Data export** — download individual tables as CSV or full JSON backup

### Polish
- 🌗 **Dark mode** — light, dark, or system preference
- 📱 **Responsive** — desktop sidebar, mobile top bar + bottom tab navigation
- ⚡ **Loading states** — skeleton loaders on every page for a snappy feel
- ✨ **Zero manual updates** — every ticker you add appears on the dashboard automatically

---

## Tech stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Database & Auth:** [Supabase](https://supabase.com) (Postgres, RLS, Auth)
- **Charts:** [Recharts](https://recharts.org)
- **CSV parsing:** [PapaParse](https://www.papaparse.com/)
- **Theming:** [next-themes](https://github.com/pacocoursey/next-themes)
- **Icons:** [Lucide](https://lucide.dev)
- **Hosting:** [Vercel](https://vercel.com)

---

## Architecture highlights

- **Row-Level Security in the database, not the app.** Postgres policies enforce that a user can only ever read/write their own rows — this means even a bug in the frontend can't leak data.
- **No stored derived values.** Holdings, realized P&L, and buying power are all computed from raw transactions at query time. Never gets out of sync.
- **Type-safe end to end.** TypeScript throughout, from Supabase queries to React components.
- **Dynamic ticker detection.** Add a stock and it appears across the dashboard automatically — no manual dashboard config.
- **CSV import with validation preview.** Rows are parsed, validated (dates, numbers, required fields), and shown in a table before any DB write. Bad rows are highlighted; only valid rows commit.

---

## Running locally

### Prerequisites
- Node.js 18.17+
- A free [Supabase](https://supabase.com) project

### Setup

1. **Clone and install:**
   ```bash
   git clone https://github.com/tushar-patel28/stockpile.git
   cd stockpile
   npm install
   ```

2. **Set up your Supabase project:**
   - Create a new project at [supabase.com](https://supabase.com)
   - Copy the SQL from `docs/schema.sql` into the SQL Editor and run it
   - Grab your Project URL and API keys from Settings → API

3. **Configure environment variables:**
   Create `.env.local` in the project root:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-publishable-key
   SUPABASE_SERVICE_ROLE_KEY=your-secret-key
   ```

4. **Run it:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Sign up with any email, and you're in.

---

## Project structure

```
src/
├── app/
│   ├── activity/            # Unified transaction feed
│   ├── buys/                # Purchase logging (add/edit/delete)
│   ├── deposits/            # Cash movements (add/edit/delete)
│   ├── income/              # Dividends & bonuses (add/edit/delete)
│   ├── login/               # Auth page
│   ├── positions/[ticker]/  # Per-ticker detail drilldown
│   ├── sells/               # Sale logging with P&L (add/edit/delete)
│   ├── settings/            # Tickers, Account, Data export, CSV import
│   ├── loading.tsx          # Skeleton loader for the dashboard
│   └── page.tsx             # Main dashboard
├── components/
│   ├── app-sidebar.tsx      # Desktop sidebar + mobile top bar + bottom tab bar
│   ├── dashboard-charts.tsx
│   ├── table-skeleton.tsx   # Reusable skeleton loaders
│   ├── theme-provider.tsx
│   ├── theme-toggle.tsx
│   └── ui/                  # shadcn/ui components
└── lib/
    ├── portfolio.ts         # Cost basis + P&L calculations
    └── supabase/            # Server + client factory
```

---

## Roadmap

Nothing planned right now — this is the MVP I use daily. Possible future ideas:

- [ ] Tax report generator (Schedule D-friendly CSV)
- [ ] Optional live price integration (opt-in)
- [ ] Historical portfolio value snapshots
- [ ] Notes/tags on transactions
- [ ] Keyboard shortcuts (`n` for new, `/` for search)

---

## License

MIT © Tushar Vimalbhai Patel