# ArtHaus Café - Multi-Tenant Restaurant Ordering System

A complete restaurant ordering system with multi-tenant architecture, supporting multiple cafes with role-based access control.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Frontend Setup](#frontend-setup)
- [Backend Setup](#backend-setup)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Multi-Tenant Architecture](#multi-tenant-architecture)
- [Authentication & Authorization](#authentication--authorization)
- [Environment Variables](#environment-variables)
- [Scripts](#scripts)
- [Deployment](#deployment)

## 🎯 Overview

ArtHaus Café is a modern restaurant ordering system built with:
- **Frontend**: React, Vite, Redux Toolkit, GSAP animations
- **Backend**: Node.js, Express, better-sqlite3
- **Database**: SQLite with multi-tenant support
- **Authentication**: JWT, Google OAuth
- **State Management**: Redux with persistence

## ✨ Features

### Customer Features
- QR code-based table ordering
- Real-time menu browsing
- Cart management
- Order tracking
- Google Sign-In
- Profile management

### Admin Features
- Multi-tenant support (multiple cafes)
- Role-based access control (Super Admin, Cafe Admin, Staff)
- User management
- Order management
- Menu management
- Analytics dashboard

### Technical Features
- Multi-tenant architecture with subdomain routing
- Redux state persistence
- Optimistic UI updates
- Responsive design
- GSAP animations
- RESTful API

## 🏗️ Architecture

```
order/
├── client/                 # Frontend (React + Vite)
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── store/         # Redux store & slices
│   │   ├── services/      # API services
│   │   ├── utils/         # Utility functions
│   │   └── hooks/         # Custom hooks
│   └── public/            # Static assets
├── server/                # Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── database/      # Database connection & schema
│   │   ├── utils/         # Utility functions
│   │   └── config/        # Configuration
│   ├── data/              # SQLite database files
│   └── scripts/           # Utility scripts
└── README.md
```

## 🚀 Frontend Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
cd client
npm install
```

### Environment Variables

Create `.env` file in `client/`:

```env
# API Configuration
VITE_API_URL=http://localhost:4001/api/v1

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# App Config
VITE_APP_NAME=ArtHaus Café
VITE_APP_VERSION=1.0.0
```

### Running Development Server

```bash
npm run dev
```

Frontend runs on `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## 🔧 Backend Setup

### Prerequisites
- Node.js 18+
- better-sqlite3

### Installation

```bash
cd server
npm install
```

### Environment Variables

Create `.env` file in `server/`:

```env
# Server Configuration
NODE_ENV=development
PORT=4001
API_VERSION=v1

# Database
DB_PATH=./data/arthaus.db
DB_BUSY_TIMEOUT=5000

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=http://localhost:5173,http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### Running Development Server

```bash
npm run dev
```

Backend runs on `http://localhost:4001`

## 🗄️ Database Schema

### Restaurants (Multi-Tenant)
```sql
CREATE TABLE restaurants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE NOT NULL,
  domain TEXT,
  logo_url TEXT,
  theme_config TEXT,
  settings TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Users
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  restaurant_id INTEGER,
  email TEXT,
  phone TEXT,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT DEFAULT 'customer' CHECK(role IN ('customer', 'staff', 'admin', 'super_admin')),
  avatar_url TEXT,
  avatar_base64 TEXT,
  google_id TEXT,
  facebook_id TEXT UNIQUE,
  is_active INTEGER DEFAULT 1,
  last_login_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE
);
```

### Tables (Restaurant Tables)
```sql
CREATE TABLE restaurant_tables (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  table_number INTEGER UNIQUE NOT NULL,
  qr_code TEXT UNIQUE NOT NULL,
  capacity INTEGER DEFAULT 4,
  location TEXT,
  status TEXT DEFAULT 'available',
  current_session_id TEXT,
  last_occupied_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Categories & Subcategories
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE subcategories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);
```

### Products
```sql
CREATE TABLE products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  subcategory_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price REAL NOT NULL CHECK(price > 0),
  image_url TEXT,
  emoji_icon TEXT,
  is_vegetarian INTEGER DEFAULT 0,
  is_spicy INTEGER DEFAULT 0,
  is_available INTEGER DEFAULT 1,
  preparation_time INTEGER,
  calories INTEGER,
  allergens TEXT,
  customization_options TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE CASCADE
);
```

### Orders & Order Items
```sql
CREATE TABLE orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  uuid TEXT UNIQUE NOT NULL,
  user_id INTEGER,
  table_id INTEGER,
  table_number INTEGER,
  session_id TEXT,
  status TEXT DEFAULT 'pending',
  order_type TEXT DEFAULT 'dine_in',
  payment_status TEXT DEFAULT 'pending',
  payment_method TEXT,
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  special_instructions TEXT,
  estimated_ready_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (table_id) REFERENCES restaurant_tables(id)
);

CREATE TABLE order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  product_name TEXT NOT NULL,
  product_price REAL NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  customizations TEXT,
  subtotal REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### Cart Items
```sql
CREATE TABLE cart_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  session_id TEXT NOT NULL,
  user_id INTEGER,
  table_id INTEGER,
  product_id INTEGER NOT NULL,
  quantity INTEGER NOT NULL CHECK(quantity > 0),
  customizations TEXT,
  added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

## 🌐 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/google` - Google OAuth
- `POST /api/v1/auth/facebook` - Facebook OAuth
- `GET /api/v1/auth/profile` - Get user profile
- `PATCH /api/v1/auth/profile` - Update user profile
- `POST /api/v1/auth/change-password` - Change password
- `POST /api/v1/auth/forgot-password` - Forgot password
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/refresh-token` - Refresh JWT token

### Menu
- `GET /api/v1/menu` - Get full menu
- `GET /api/v1/menu/categories` - Get categories
- `GET /api/v1/menu/categories/:id/subcategories` - Get subcategories
- `GET /api/v1/menu/products/:subcategoryId` - Get products by subcategory
- `GET /api/v1/menu/product/:id` - Get product details
- `GET /api/v1/menu/search` - Search products

### Cart
- `GET /api/v1/cart` - Get cart
- `POST /api/v1/cart` - Add item to cart
- `PATCH /api/v1/cart/:id` - Update cart item
- `DELETE /api/v1/cart/:id` - Remove cart item
- `DELETE /api/v1/cart` - Clear cart

### Orders
- `POST /api/v1/orders` - Create order
- `GET /api/v1/orders` - Get user orders
- `GET /api/v1/orders/:id` - Get order details
- `PATCH /api/v1/orders/:id/status` - Update order status
- `DELETE /api/v1/orders/:id` - Cancel order

### Admin (Protected)
- `GET /api/v1/admin/users` - Get all users
- `GET /api/v1/admin/orders` - Get all orders
- `GET /api/v1/admin/menu` - Get menu management
- `POST /api/v1/admin/menu` - Add menu item
- `PATCH /api/v1/admin/menu/:id` - Update menu item
- `DELETE /api/v1/admin/menu/:id` - Delete menu item

## 🏢 Multi-Tenant Architecture

### Subdomain-Based Routing
- **Cafe URL**: `http://subdomain.localhost:4001`
- **Super Admin URL**: `http://localhost:4001`

### Tenant Identification
The system identifies the restaurant from the subdomain:
1. Extract subdomain from request host
2. Look up restaurant in database
3. Add `restaurant_id` to request context
4. Filter all data by `restaurant_id`

### Roles & Permissions

| Role | restaurant_id | Access Level |
|------|---------------|--------------|
| **Super Admin** | null | All cafes, full access |
| **Cafe Admin** | specific ID | Their cafe only, full access |
| **Staff** | specific ID | Their cafe only, limited access |
| **Customer** | specific ID | Their cafe only, customer access |

## 🔐 Authentication & Authorization

### JWT Token Flow
1. User logs in (email/password or Google OAuth)
2. Backend validates credentials
3. Backend generates JWT access token + refresh token
4. Frontend stores tokens in Redux (persisted to localStorage)
5. Frontend sends access token in Authorization header
6. Backend validates token on protected routes
7. Refresh token used to get new access token

### Google OAuth Flow
1. User clicks "Continue with Google"
2. Google popup opens
3. User authenticates with Google
4. Google returns ID token
5. Frontend sends ID token to backend
6. Backend verifies token with Google
7. Backend creates/updates user
8. Backend generates JWT tokens
9. User logged in

### Protected Routes
Backend uses middleware to protect routes:
- `authenticate` - Requires valid JWT token
- `authorize` - Requires specific role
- `filterByTenant` - Filters data by restaurant_id

## ⚙️ Environment Variables

### Frontend (.env)
```env
VITE_API_URL=http://localhost:4001/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
VITE_APP_NAME=ArtHaus Café
VITE_APP_VERSION=1.0.0
```

### Backend (.env)
```env
NODE_ENV=development
PORT=4001
API_VERSION=v1
DB_PATH=./data/arthaus.db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
BCRYPT_ROUNDS=12
CORS_ORIGIN=http://localhost:5173
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
LOG_LEVEL=info
```

## 📜 Scripts

### Backend Scripts

#### Create Restaurant
```bash
cd server
node scripts/createRestaurant.js "Cafe Name" subdomain
```

#### Create Admin User
```bash
# Cafe Admin
node scripts/createAdmin.js admin@cafe.com password "Admin Name" admin <restaurant_id>

# Super Admin
node scripts/createAdmin.js superadmin@domain.com password "Super Admin" super_admin
```

### Frontend Scripts
```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Backend Scripts
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
```

## 🚀 Deployment

### Frontend Deployment (Vercel/Netlify)
1. Build the project: `npm run build`
2. Deploy `dist/` folder
3. Set environment variables in deployment platform
4. Update `VITE_API_URL` to production backend URL

### Backend Deployment (Railway/Heroku/AWS)
1. Set environment variables
2. Deploy Node.js application
3. Ensure SQLite database is persisted (use volume)
4. Configure CORS for production domain
5. Set up SSL/HTTPS

### Production Checklist
- [ ] Change JWT_SECRET to strong random string
- [ ] Enable HTTPS
- [ ] Configure CORS for production domain
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Add error tracking (Sentry)
- [ ] Configure Google OAuth for production domain

## 📝 Development Notes

### Redux State Management
- **auth**: User authentication state (persisted)
- **cart**: Shopping cart state (persisted)
- **menu**: Menu data (not persisted)
- **order**: Order data (not persisted)
- **ui**: UI state (not persisted)

### Key Components
- **Header**: Navigation with user profile
- **BottomNav**: Mobile navigation
- **CartSidebar**: Shopping cart
- **ProductModal**: Product details
- **AdminDashboard**: Admin panel
- **ProfileScreen**: User profile

### API Client
Centralized Axios client with:
- Request/response interceptors
- Token refresh logic
- Error handling
- Session ID management

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support, contact the development team.
