# 🛒 Retail Portal - Full Stack E-Commerce Platform

A robust, scalable e-commerce Single Page Application (SPA) designed for efficient product catalog management and intuitive shopping experience, featuring a McDonald's-style fast-loading UI pattern.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Features](#features)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Authentication & Authorization](#authentication--authorization)
- [Deployment](#deployment)
- [Contributing](#contributing)

---

## 🎯 Overview

### Background
This project aims to develop a robust, scalable e-commerce platform that handles:
- **User Management**: Sign-up, login, and role-based access control
- **Product Management**: Creation, listing, search, and stock updates
- **Category Management**: Organize products into intuitive categories
- **Shopping Experience**: Fast-loading, intuitive UI with modern UX patterns

### Objectives
- Deliver a functional SPA for efficient product catalog management
- Provide an intuitive, high-performance shopping experience
- Implement McDonald's-style "Crispy" (fast-loading) UI pattern
- Incorporate best practices in API security, data management, and cloud deployment

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT LAYER                               │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                    Single Page Application (SPA)            │    │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐     │    │
│  │  │  User    │  │  Admin   │  │ Product  │  │ Shopping │     │    │
│  │  │  Auth    │  │  Panel   │  │ Catalog  │  │   Cart   │     │    │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘     │    │
│  └─────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS/REST API
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           API LAYER                                 │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      Middlewares                            │    │
│  │  ┌──────────────┐  ┌──────────────┐                         │    │
│  │  │ JWT Auth     │  │ Rate Limiting│                         │    │
│  │  └──────────────┘  └──────────────┘                         │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  Auth    │  │ Product  │  │ Category │  │  Order   │             │
│  │ Service  │  │ Service  │  │ Service  │  │ Service  │             │ 
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘             │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ Database Queries
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                  │
│                   ┌─────────────────────┐                           │
│                   │   NoSQL Database    │                           │
│                   │      MongoDB        │                           │
│                   │  • User             |                           |
│                   │  • Orders           |                           |
│                   │  • Product Catalog  │                           │
│                   │  • Categories       │                           │
│                   │                     │                           │
│                   └─────────────────────┘                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Workflow

```
┌─────────────┐      ┌─────────────┐       ┌─────────────┐        ┌─────────────┐
│   User      │────▶│   Frontend  │────▶ │   Backend    │────▶  │   Database   │
│   Action    │      │    (SPA)    │       │    (API)    │        │             │
└─────────────┘      └─────────────┘       └─────────────┘        └─────────────┘
      │                    │                   │                   │
      │  1. User Request   │                   │                   │
      │──────────────────▶│                   │                   │
      │                    │  2. API Call      │                   │
      │                    │  (JWT/API Key)    │                   │
      │                    │──────────────────▶│                   │
      │                    │                   │  3. Query/Update  │
      │                    │                   │──────────────────▶│
      │                    │                   │  4. Data Response │
      │                    │                   │◀──────────────────│
      │                    │  5. JSON Response │                   │
      │                    │◀──────────────────│                   │
      │  6. UI Update      │                   │                   │
      │◀───────────────────│                   │                   │
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| React.js   | SPA Framework |
| Axios      | HTTP Client |

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js + Express  | API Server 
| JWT                | Authentication Tokens 
| bcrypt             | Password Hashing 
| Winston / Morgan   | Logging 

### Database
| Technology | Purpose |
|------------|---------|
| MongoDB    | Users, Orders, Product Catalog, Categories 

### DevOps & Tools
| Technology | Purpose |
|------------|---------|
| Docker         | Containerization 
| GitHub Actions | CI/CD Pipeline 
| Postman        | API Testing 
| Render         | Backend Deployement
| Vercel         | Frontend Deployement 
| Aws S3         | For image uploading


## ✨ Features

### 👤 User Management
- [x] User registration with email verification
- [x] Secure login with JWT authentication
- [x] Role-based access control (Admin, Customer)
- [x] Password reset functionality
- [x] Profile management

### 📦 Product Management (Admin)
- [x] Create/Edit/Delete products
- [x] Image upload with optimization
- [x] Set product details (title, description, cost, tax %)
- [x] Stock management and inventory tracking
- [x] Product combo/bundle creation
- [x] "Add-on" options configuration

### 🏷️ Category Management (Admin)
- [x] Create/Edit/Delete categories
- [x] Category logo upload
- [x] Category descriptions
- [x] Hierarchical category structure

### 🏠 Product Listing (Customer)
- [x] McDonald's-style home page layout
- [x] Products organized by categories
- [x] Lazy loading ("Load More" functionality)
- [x] Pagination for extensive lists
- [x] Fuzzy search by product/category name
- [x] Breadcrumb navigation

### 🛒 Shopping Features
- [x] Add to cart functionality
- [x] Product combo combinations
- [x] "Choice to add on" options
- [x] Order history tracking
- [x] Quick re-ordering from past purchases

### 🔐 Security
- [x] JWT token authentication
- [x] API Key authentication
- [x] Role-based authorization
- [x] Input validation and sanitization
- [x] Rate limiting
- [x] CORS configuration

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MongoDB / PostgreSQL
- Redis (optional, for caching)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone "https://github.com/pramodswastik/HCl-Hackathon"
   cd HCl-Hackathon
   ```

2. **Install dependencies**
   ```bash
   cd backend
   npm install

   cd frontend
   npm install
   ```

3. **Environment Setup**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   # Start MongoDB (if using Docker)
   docker-compose up -d mongodb
   or use mongodb atlas 
   ```

5. **Start Development Servers**
   ```bash
   # Start backend server
   cd backend
   npm run dev

   # Start frontend (in new terminal)
   cd frontend
   npm run dev
   ```

6. **Access the application**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`
   - API Docs: `http://localhost:5000/api-docs`

---

## 📖 API Documentation

### Base URL
```
Development: http://localhost:5000/api/v1
Production: https://api.retail-portal.com/v1
```

### Authentication Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | User registration |
| POST | `/auth/login` | User login |
| POST | `/auth/refresh` | Refresh JWT token |
| POST | `/auth/logout` | User logout |
| POST | `/auth/forgot-password` | Request password reset |

### Product Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | List products (paginated) |
| GET | `/products/:id` | Get product details |
| POST | `/products` | Create product (Admin) |
| PUT | `/products/:id` | Update product (Admin) |
| DELETE | `/products/:id` | Delete product (Admin) |
| GET | `/products/search` | Fuzzy search products |
| PUT | `/products/:id/stock` | Update stock (Admin) |

### Category Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/categories` | List all categories |
| GET | `/categories/:id` | Get category with products |
| POST | `/categories` | Create category (Admin) |
| PUT | `/categories/:id` | Update category (Admin) |
| DELETE | `/categories/:id` | Delete category (Admin) |

### Order Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/orders` | Get user orders |
| GET | `/orders/:id` | Get order details |
| POST | `/orders` | Create new order |
| PUT | `/orders/:id/status` | Update order status (Admin) |

### HTTP Status Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 422 | Validation Error |
| 500 | Internal Server Error |

---

## 🗄️ Database Schema

### Users Collection (MongoDB)
```javascript
{
    _id: ObjectId,
    email: String,              // unique, required
    password_hash: String,      // required
    first_name: String,
    last_name: String,
    role: String,               // enum: ['admin', 'customer'], default: 'customer'
    created_at: Date,           // default: Date.now
    updated_at: Date            // default: Date.now
}


```

### Products Collection (MongoDB)
```javascript
{
    _id: ObjectId,
    title: String,
    description: String,
    image_url: String,
    cost: Number,
    tax_percentage: Number,
    category_id: ObjectId,
    stock_quantity: Number,
    is_combo: Boolean,
    add_ons: [{
        name: String,
        price: Number
    }],
    created_at: Date,
    updated_at: Date
}
```

### Categories Collection (MongoDB)
```javascript
{
    _id: ObjectId,
    name: String,
    logo_url: String,
    description: String,
    parent_id: ObjectId,
    created_at: Date,
    updated_at: Date
}
```

---

## 🔐 Authentication & Authorization

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all resources, product/category management, stock updates, order management |
| **Customer** | Browse products, manage cart, place orders, view order history |

### JWT Token Structure
```javascript
{
    "header": {
        "alg": "HS256",
        "typ": "JWT"
    },
    "payload": {
        "userId": "uuid",
        "email": "user@example.com",
        "role": "customer",
        "iat": 1234567890,
        "exp": 1234571490
    }
}
```

---

## ☁️ Deployment

### Docker Deployment
```bash
# Build and run all services
docker-compose up --build -d

# View logs
docker-compose logs -f
```

### CI/CD Pipeline
The project uses GitHub Actions for continuous integration and deployment:

1. **On Pull Request**: Lint, test, build
2. **On Merge to Main**: Deploy to staging
3. **On Release Tag**: Deploy to production

---

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm run test

# Run frontend tests
cd frontend
npm run test

```

### Postman Collection
Import the Postman collection from `docs/postman/retail-portal.postman_collection.json` for API testing.
