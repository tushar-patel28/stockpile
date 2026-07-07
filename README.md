# Stockpile 📊

A personal stock portfolio tracker that gives you full ownership of your investment data — with a clean dashboard, real-time calculations, and beautiful charts.

**Live demo:** [stockpile-tushar.vercel.app](https://stockpile-tushar.vercel.app/)

![Dashboard screenshot](./docs/dashboard.png)

---

## Why I built this

I started tracking my Robinhood portfolio in an Excel spreadsheet and quickly outgrew it — every new stock meant fixing formulas, calculations drifted from rounding errors, and I couldn't check it from my phone. I built Stockpile as a full-stack replacement: a personal finance dashboard that's mine, works everywhere, and never breaks.

It's also my playground for modern web development — Next.js 16 App Router, Supabase, TypeScript, and Tailwind — deployed to production.

---

## Features

- 🔐 **Authenticated** — email + password with Supabase Auth, Row-Level Security enforced per-user at the database level
- 💰 **Complete transaction log** — deposits, buys, sells (with fees), and income (dividends + bonuses)
- 📊 **Real-time dashboard** — KPI cards, per-ticker holdings summary, and charts that update the moment you log anything
- 🎯 **Weighted average cost basis** — auto-calculated across multiple buys of the same stock
- 💵 **Realized P&L tracking** — live-calculated on every sell, factoring in fees
- 📈 **3 interactive charts** — portfolio allocation pie, realized P&L bar chart, and cumulative net worth line
- 🔍 **Activity feed** — unified searchable timeline of every transaction
- 💾 **Data export** — download individual tables as CSV or full JSON backup
- 📱 **Responsive** — works on mobile, tablet, and desktop
- ✨ **Zero manual updates** — every ticker you add appears on the dashboard automatically

---

## Tech stack

- **Framework:** [Next.js 16](https://nextjs.org) (App Router) + TypeScript
- **Styling:** [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Database & Auth:** [Supabase](https://supabase.com) (Postgres, RLS, Auth)
- **Charts:** [Recharts](https://recharts.org)
- **Icons:** [Lucide](https://lucide.dev)
- **Hosting:** [Vercel](https://vercel.com)

---

## Architecture highlights

- **Row-Level Security in the database, not the app.** Postgres policies enforce that a user can only ever read/write their own rows — this means even a bug in the frontend can't leak data.
- **No stored derived values.** Holdings, realized P&L, and buying power are all computed from raw transactions at query time. Never gets out of sync.
- **Type-safe end to end.** TypeScript throughout, from Supabase queries to React components.
- **Dynamic ticker detection.** Add a stock in the Holdings table and it appears across the dashboard automatically — no manual dashboard config.

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
   - Copy the SQL from `docs/schema.sql` (see below) into the SQL Editor and run it
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
│   ├── activity/          # Unified transaction feed
│   ├── buys/              # Purchase logging
│   ├── deposits/          # Cash movements
│   ├── income/            # Dividends & bonuses
│   ├── login/             # Auth page
│   ├── sells/             # Sale logging with P&L
│   ├── settings/          # Tickers, Account, Data export
│   └── page.tsx           # Main dashboard
├── components/
│   ├── app-sidebar.tsx    # Global navigation
│   ├── dashboard-charts.tsx
│   └── ui/                # shadcn/ui components
└── lib/
    ├── portfolio.ts       # Cost basis + P&L calculations
    └── supabase/          # Server + client factory
```

---

## Roadmap

- [ ] Position detail page (per-ticker deep dive)
- [ ] Edit/delete existing transactions
- [ ] CSV import for bulk historical data
- [ ] Dark mode toggle
- [ ] Tax report generator (Schedule D-friendly CSV)
- [ ] Optional live price integration (opt-in)

---

## License

MIT © Tushar Patel
