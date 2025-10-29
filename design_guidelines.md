# AlgoPilot Design Guidelines

## Design Approach

**Reference-Based Fintech Design** drawing inspiration from Coinbase (crypto authenticity), Stripe (refined minimalism), and Robinhood (accessible data presentation). This approach balances professional credibility with approachable usability for both novice and experienced crypto traders.

**Core Principles**:
- Data clarity over decoration
- Trust through consistency and transparency
- Progressive disclosure of complexity
- Performance-first visual hierarchy

---

## Typography System

**Font Stack**: 
- Primary: Inter (via Google Fonts) - body text, UI elements, data tables
- Accent: Space Grotesk (via Google Fonts) - headlines, hero sections, CTAs

**Hierarchy**:
- Hero Headlines: text-5xl md:text-6xl lg:text-7xl, font-bold, tracking-tight
- Section Headers: text-3xl md:text-4xl, font-semibold
- Dashboard Titles: text-2xl md:text-3xl, font-semibold
- Card Headers: text-xl, font-semibold
- Metrics/Stats: text-4xl md:text-5xl, font-bold, tabular-nums (for numerical consistency)
- Body Text: text-base, font-normal, leading-relaxed
- Small Data/Labels: text-sm, font-medium, uppercase tracking-wide
- Micro Text (timestamps, footnotes): text-xs

---

## Layout System

**Spacing Primitives**: Tailwind units of **2, 4, 6, 8, 12, 16** (p-2, m-4, gap-6, py-8, px-12, space-y-16)

**Container Strategy**:
- Marketing pages: max-w-7xl mx-auto px-6 lg:px-8
- Dashboard content: max-w-screen-2xl mx-auto px-4 lg:px-6
- Cards/Components: p-6 lg:p-8
- Modals: max-w-2xl for forms, max-w-4xl for complex content

**Grid Patterns**:
- Bot marketplace: grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6
- Dashboard metrics: grid-cols-2 lg:grid-cols-4 gap-4
- Admin tables: Full-width with horizontal scroll on mobile

---

## Page-Specific Layouts

### Landing Page (Marketing)

**Hero Section** (h-screen min-h-[600px]):
- Split layout: 50% compelling headline/CTA, 50% animated dashboard preview or trading chart visualization
- Headline hierarchy: Super-sized metric (e.g., "847% Average ROI") followed by main value prop
- Dual CTA: Primary "Start Trading" + Secondary "View Top Bots"
- Social proof strip below fold: "Trusted by 12,000+ traders · $2.4M in managed trades"

**Trust Indicators** (py-16):
- Logo cloud of supported exchanges (Binance, Coinbase, KuCoin)
- Live ticker showing recent bot performances

**Features Grid** (py-20):
- 3-column grid (stacks on mobile)
- Each feature: Icon (Heroicons), bold title, 2-line description, performance screenshot/chart preview
- Features: Real-time Analytics, Multi-Exchange, Automated Trading, Risk Management, Bot Marketplace, Revenue Sharing

**Live Leaderboard Preview** (py-20):
- Table showing top 5 bots with real-time metrics
- Columns: Bot Name, 24h PnL, Total Trades, Win Rate, Sharpe Ratio
- "View Full Leaderboard" CTA

**Pricing Tiers** (py-20):
- 3-column comparison (Free, Pro, Enterprise)
- Sticky header on scroll
- Feature checkmarks with tooltips

**Creator Spotlight** (py-16):
- 2-column: Creator profile card + testimonial quote
- Stats: Bots created, total subscribers, earnings

**Footer** (py-12):
- 4-column: Product links, Resources, Legal, Newsletter signup
- Bottom bar: Social links, copyright

### Dashboard (Authenticated)

**Top Navigation Bar** (h-16):
- Logo left, search/filter center, notifications + profile right
- Sticky positioning

**Sidebar** (w-64, collapsible to w-16):
- Navigation sections: Overview, My Bots, Marketplace, Subscriptions, Settings, Admin (role-based)
- Active state highlighting

**Main Content Area**:
- **Portfolio Overview Card** (full-width, mb-8): 
  - Grid: Total Value, 24h PnL, Active Bots, Win Rate
  - Equity curve chart (h-64)
  
- **Active Bots Grid** (grid-cols-1 lg:grid-cols-2 gap-6):
  - Each card: Bot name, status badge, mini performance chart, key metrics, "View Details" link

### Bot Detail Page

**Header Section** (py-8):
- Bot name, creator info, performance badge
- Primary CTA: "Subscribe" or "Manage Subscription"
- Secondary actions: Share, Compare, Favorite

**Performance Dashboard** (grid layout):
- **Top Metrics** (grid-cols-2 lg:grid-cols-4 gap-4): ROI, Sharpe Ratio, Max Drawdown, Total Trades
- **Main Chart** (col-span-full, h-96): Tabbed interface (Equity Curve, PnL, Drawdown)
- **Recent Trades Table** (col-span-full): Scrollable, 10 latest trades
- **Stats Grid** (grid-cols-2 gap-6): Win/Loss Ratio, Average Trade Duration, Best/Worst Trade

### Marketplace

**Filter Sidebar** (w-64):
- Search input
- Dropdown filters: Performance (ROI, Sharpe), Exchange, Strategy Type, Price Range
- Sort options

**Bot Grid** (flex-1):
- Cards with: Bot thumbnail/chart preview, name, creator, key metrics (ROI badge, subscribers count), monthly price, "Learn More" CTA

### Admin Panel

**Stats Overview** (grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6):
- Total Users, Active Subscriptions, Platform Revenue, Pending Approvals

**Management Sections**:
- Tabbed interface: Users, Bots, Transactions, Payouts
- Data tables with inline actions, pagination

---

## Component Library

### Cards
- Standard: rounded-xl shadow-sm border p-6
- Metric cards: Centered number + label + trend indicator (↑ ↓)
- Bot cards: Image/chart preview, title, stats grid, action button

### Buttons
- Primary: px-6 py-3, rounded-lg, font-semibold, shadow-sm
- Secondary: px-6 py-3, rounded-lg, font-semibold, border
- Ghost: px-4 py-2, hover state only
- Icon-only: p-2, rounded-full

### Forms
- Input fields: p-3, rounded-lg, border, focus:ring-2
- Labels: text-sm font-medium mb-2
- Helper text: text-xs below input
- Error states: border-red-500, text-red-600 helper text

### Tables
- Header: sticky top-0, border-b-2, font-semibold, text-sm uppercase
- Rows: hover:bg-gray-50, border-b
- Cells: p-4, align-top
- Responsive: overflow-x-auto on mobile

### Charts (Chart.js)
- Line charts for equity curves, PnL trends
- Bar charts for trade distribution
- Donut charts for portfolio allocation
- Consistent axis styling, grid lines, tooltips

### Badges
- Status: rounded-full px-3 py-1 text-xs font-semibold
- Performance: Large metric badges with icons

### Modals
- Overlay: backdrop-blur-sm
- Content: rounded-2xl shadow-2xl max-w-2xl
- Header: p-6 border-b
- Body: p-6
- Footer: p-6 border-t, flex justify-end gap-4

### Navigation
- Tabs: border-b-2 active state, px-4 py-2
- Breadcrumbs: text-sm with separators
- Pagination: Numbered with prev/next

---

## Images & Visual Assets

**Landing Page**:
- Hero: Large animated trading dashboard mockup or live chart visualization (right side of split hero)
- Feature sections: Screenshot previews of actual bot dashboards embedded in feature cards
- Social proof: Creator profile photos in testimonial section

**Dashboard**:
- Bot thumbnails: Generated chart previews or strategy visualizations (auto-generated from performance data)
- Placeholder avatars for creators/users

**Marketplace**:
- Bot card images: Performance chart thumbnails (primary) with optional bot logo/icon overlay

**Icons**: Heroicons (outline for navigation, solid for emphasis)

---

## Accessibility & Interaction

- All interactive elements: Minimum 44x44px touch target
- Form inputs: Consistent height (h-12)
- Focus states: ring-2 ring-offset-2
- Keyboard navigation: Full support with visible focus indicators
- ARIA labels for icon-only buttons
- Semantic HTML throughout (nav, main, section, article)

---

## Animation (Minimal)

- Page transitions: Fade-in on load
- Hover states: Subtle scale (scale-105) on cards
- Chart animations: Smooth line drawing on initial render
- Loading states: Skeleton screens for data-heavy components
- NO scroll-triggered animations or parallax effects