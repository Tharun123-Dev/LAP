# AffiliateSaaS Dashboard — Frontend

A **professional, enterprise-grade Affiliate SaaS Dashboard** built with React.js, Tailwind CSS, Framer Motion, Recharts, and Axios. Designed for CRM and affiliate management workflows.

---

## 🚀 Tech Stack

| Technology | Purpose |
|---|---|
| **React.js** | UI component framework |
| **Tailwind CSS** | Utility-first styling |
| **React Router DOM** | Client-side routing |
| **Framer Motion** | Micro-animations & transitions |
| **Recharts** | Charting & data visualizations |
| **Axios** | HTTP API client |
| **Lucide React** | Modern icon library |

---

## 📁 Folder Structure Explained

```
frontend/src/
│
├── assets/             # Static assets: images, icons, logos, animations
├── components/         # Reusable UI components (atomic design)
│   ├── buttons/        # Button variants
│   ├── cards/          # StatsCard, InfoCard etc.
│   ├── charts/         # Recharts wrappers
│   ├── forms/          # FormInput, FormSelect etc.
│   ├── loaders/        # SkeletonLoader, Spinner
│   ├── modals/         # Animated dialog overlays
│   ├── navbar/         # Top navigation bar
│   ├── tables/         # DataTable wrappers
│   └── widgets/        # Misc reusable widgets
│
├── context/            # Global React Context providers
│   ├── AuthContext     # Session tokens & user state
│   ├── ThemeContext    # Dark/Light mode persistence
│   └── NotificationContext # Toast notification system
│
├── data/               # Static mock datasets
│   ├── dummyData.js    # Mock users, referrals, transactions
│   └── chartData.js    # Recharts-formatted data arrays
│
├── hooks/              # Custom React hooks
│   ├── useAuth.js      # Consumes AuthContext
│   ├── useTheme.js     # Consumes ThemeContext
│   ├── useFetch.js     # Generic async data fetcher
│   └── useNotifications.js # Toast dispatch hook
│
├── layouts/            # Page layout wrappers
│   ├── AuthLayout.jsx  # Split panel — branding + form
│   ├── DashboardLayout.jsx # Sidebar + Header + outlet
│   └── MainLayout.jsx  # Minimal public wrapper
│
├── pages/              # Feature-organised page components
│   ├── auth/           # Login, ForgotPassword, ResetPassword
│   ├── dashboard/      # DashboardHome, Analytics, ActivityTimeline
│   ├── referrals/      # ReferralsList, ReferralDetails, ReferralAnalytics
│   ├── earnings/       # EarningsOverview, CommissionHistory, RevenueAnalytics
│   ├── payments/       # PaymentHistory, InvoicePage, TransactionDetails
│   ├── profile/        # ProfilePage, SecuritySettings, BankDetails
│   ├── referral-links/ # ReferralLinkPage, SocialSharing
│   ├── notifications/  # NotificationsPage
│   └── settings/       # AppearanceSettings, Preferences
│
├── routes/             # Route configuration
│   ├── AppRoutes.jsx   # Central routing map
│   ├── ProtectedRoutes.jsx # Guards authenticated pages
│   └── PublicRoutes.jsx    # Blocks logged-in users from auth pages
│
├── services/           # Axios API service modules
│   ├── api.js          # Configured Axios instance + interceptors
│   ├── authService.js  # Login, register, getCurrentUser
│   ├── referralService.js  # Referral CRUD
│   ├── paymentService.js   # Payment history & payout requests
│   ├── earningsService.js  # Earnings summary & commissions
│   └── analyticsService.js # Chart data feeds
│
├── styles/             # CSS supplementary files
│   ├── globals.css     # Glassmorphism, scrollbars, resets
│   ├── theme.css       # CSS custom variables, active glows
│   └── animations.css  # Shimmer, float, rotate effects
│
└── utils/              # Pure utility functions
    ├── constants.js    # App-wide constants
    ├── helpers.js      # cn(), copyToClipboard(), getInitials()
    ├── formatCurrency.js # Intl.NumberFormat wrapper
    ├── formatDate.js   # Date formatting
    └── validation.js   # Email, password validators
```

---

## ⚙️ Getting Started

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment Variables

Copy `.env` and update with your backend API URL:

```env
VITE_API_URL=http://localhost:8000/api
```

### 3. Run Development Server

```bash
npm run dev
```

The app will start at **http://localhost:5173**

### 4. Demo Login

The login page is pre-filled with demo credentials. Just click **Sign In** to explore all dashboard features.

---

## 🎨 Design System

| Token | Value | Usage |
|---|---|---|
| **Primary** | `#8b5cf6` (Violet) | CTAs, active states, highlights |
| **Brand** | `#22c55e` (Emerald) | Earnings, success indicators |
| **Surface Dark** | `#0f172a` | Dark mode backgrounds |
| **Surface Light** | `#f8fafc` | Light mode backgrounds |
| **Font** | `Inter + Outfit` | All text elements |

---

## 🏗️ Recommended Component Strategy

- **Atomic Design**: Atoms (Button, FormInput) → Molecules (StatsCard) → Organisms (DashboardLayout)
- **Named + Default exports** on all components for flexibility
- **Props over state** for pure presentational components
- **useFetch hook** abstracts all async data flows

---

## 📋 Naming Conventions

| Pattern | Example |
|---|---|
| Pages | `DashboardHome.jsx`, `ReferralsList.jsx` |
| Components | `StatsCard.jsx`, `SkeletonLoader.jsx` |
| Hooks | `useAuth.js`, `useFetch.js` |
| Services | `authService.js`, `paymentService.js` |
| Utils | `formatCurrency.js`, `helpers.js` |

---

## 🔐 Authentication Flow

```
User visits URL
  ↓
ProtectedRoutes checks isAuthenticated
  ├── Authenticated  → Render dashboard page
  └── Unauthenticated → Redirect to /auth/login

User visits /auth/login
  ↓
PublicRoutes checks isAuthenticated
  ├── Not logged in → Show login form
  └── Already logged in → Redirect to /dashboard
```

---

## 📦 Build for Production

```bash
npm run build
```

Built output will be in `frontend/dist/`.
