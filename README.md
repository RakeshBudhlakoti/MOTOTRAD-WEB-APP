# 🏍️ Mototrad 2.0 — Premium Auction Web Application

<p align="center">
  <img src="https://mototrad.com/assets/dist/img/mototrad-logo-cropped.jpg" alt="Mototrad Logo" width="300" style="border-radius: 8px;" />
</p>

<p align="center">
  <strong>A premium, real-time vehicle and motorcycle auction ecosystem featuring high-frequency bidding, secure deposit settlements, robust commission engines, and unified administration dashboards.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" alt="NextJS" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" alt="Prisma" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
</p>

---

## 📂 Project Architecture

Mototrad 2.0 is structured as a robust monorepo consisting of three specialized applications:

```text
mototrad2.0/
├── 📡 backend-api/      # High-performance NestJS REST & WebSocket server
├── 🌐 frontend-web/      # Next.js customer-facing bidding portal
└── 🛡️ frontend-admin/    # Next.js backoffice administrative control panel
```

### 📡 1. `backend-api`
The heartbeat of the system. A NestJS application handling core business logic, real-time communication, database access, and payment workflows.
*   **Real-time Engine**: Powered by WebSockets (Socket.io) for high-frequency bid updates, countdown extensions, and immediate auction finalization.
*   **Idempotent Scheduler**: Refactored cron system incorporating row-level locks (`FOR UPDATE`) in PostgreSQL to eliminate double-processing and race conditions.
*   **Dynamic Setting Engine**: Centralized settings architecture allowing real-time, non-cached updates to critical business limits like upfront deposits, commission bands, and system administrator notifications.

### 🌐 2. `frontend-web`
The modern customer portal designed to deliver an engaging bidding experience.
*   **Real-time Interactions**: Smooth bid updates, dynamic countdown overlays, and instantaneous "Buy Now" checkout.
*   **Responsive Interfaces**: Built with rich, sleek, HSL tailored color schemes, glassmorphic elements, and micro-interactions optimized for mobile and desktop screens.
*   **Security Integration**: Secure customer onboarding, document-based KYC upload forms, and Stripe/PayPal transaction panels.

### 🛡️ 3. `frontend-admin`
The administration nerve center. Built exclusively for operators, moderators, and super-admins to run the platform.
*   **System Controls**: Unified panels to manage commission rules, global website settings, and system-wide admin notifications.
*   **Fulfillment & KYC Verification**: Live approval panels for seller registrations, identity documents (KYC), and cash payment settlements.
*   **Operations Oversight**: Live monitoring of bids, active/pending/expired auctions, and overall catalog health.

---

## 🛠️ Technology Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend Core** | `NestJS (v10)` | Enterprise NodeJS framework with modular architecture. |
| **API Formats** | `REST API` & `WebSockets` | Dynamic endpoints & high-frequency socket.io channels. |
| **Database ORM** | `Prisma` & `PostgreSQL` | Type-safe queries, migration control, and transactional constraints. |
| **Background Work** | `BullMQ` & `Redis` | Resilient task queues for async processing and session caching. |
| **Client Portals** | `Next.js (v15)` & `React (v19)` | Optimized layouts, SSR capabilities, and Turbo rendering. |
| **Styling Systems** | `Tailwind CSS` & `Vanilla CSS` | Curated premium palettes, glassmorphism, and responsive grids. |
| **Email Transport** | `Handlebars (hbs)` & `Nodemailer` | Premium structured HTML transaction invoices and email alerts. |

---

## 🚀 Quick Start Guide

### Prerequisites
Make sure you have the following installed locally:
*   [Node.js (v18+)](https://nodejs.org/)
*   [PostgreSQL](https://www.postgresql.org/)
*   [Redis Server](https://redis.io/)

---

### 📡 Running the Backend (`backend-api`)

1.  Navigate into the backend directory:
    ```bash
    cd backend-api
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment:
    *   Duplicate `.env.example` to `.env`
    *   Configure your `DATABASE_URL` (PostgreSQL connection string), `REDIS_URL`, and SMTP credentials.
4.  Generate Prisma Client & run migrations:
    ```bash
    npx prisma migrate dev
    ```
5.  Seed test databases:
    ```bash
    npm run seed
    ```
6.  Start development server:
    ```bash
    npm run dev
    ```

---

### 🌐 Running the Customer Portal (`frontend-web`)

1.  Navigate into the web directory:
    ```bash
    cd ../frontend-web
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment:
    *   Create `.env.local` pointing to the backend API socket and REST endpoints:
        ```env
        NEXT_PUBLIC_API_URL=http://localhost:5000
        ```
4.  Start development server:
    ```bash
    npm run dev
    ```

---

### 🛡️ Running the Admin Portal (`frontend-admin`)

1.  Navigate into the admin directory:
    ```bash
    cd ../frontend-admin
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment:
    *   Create `.env.local` pointing to the backend API:
        ```env
        NEXT_PUBLIC_API_URL=http://localhost:5000
        ```
4.  Start development server:
    ```bash
    npm run dev
    ```

---

## 🌟 Core Bidding & Commerce Features

Mototrad 2.0 provides a premium, highly secure, and seamless auction experience. The core bidding and transaction flow is designed for high reliability, trust, and real-time responsiveness:

### 🔨 1. Dynamic Bidding Engine
High-fidelity bidding functionality built on top of real-time event distribution.
*   **Real-time WebSocket Synchronization**: Every bid is dispatched instantly to all active browsers using low-latency Socket.io channels, displaying live updates without requiring manual refresh.
*   **Smart Bid Increments**: Dynamic enforcement of minimum bidding steps based on the vehicle's current price bracket.
*   **Sniper Protection (Auto-Extension)**: If a bid is placed in the final minutes (configurable via the Admin Panel), the system automatically extends the auction duration by a predefined increment (e.g., 2 minutes) to ensure fair competition.
*   **Immediate Notifications**: Outbid alerts are immediately dispatched to previous high bidders via email and push channels, prompting active re-engagement.

### ⚡ 2. Instant "Buy Now" Checkout
Direct purchasing capability to secure high-value vehicles instantly.
*   **Bypass the Cycle**: Buyers can completely bypass the bidding cycle by purchasing a vehicle outright at its designated "Buy Now" price.
*   **Instant Catalog Lockout**: Once "Buy Now" is triggered, the system instantly suspends active bidding, flags the vehicle as sold, and marks other concurrent bids as archived.
*   **Fulfillment Generation**: Instantly generates an order sheet and draft invoices for both the buyer and administrative operators.

### 💳 3. Secure Deposit & Payment Gateways
Enforces bidder commitment and handles secure transaction processing.
*   **Bidding Deposit Pre-authorization**: To maintain platform integrity and filter out non-serious bidders, users are required to authorize a pre-set security deposit (e.g., via Stripe or PayPal) before placing their first bid.
*   **Flexible Gateway Support**: Seamless support for credit cards, digital wallets, and bank/wire transfers.
*   **Installments & Invoicing**: Structured payment timelines for vehicle balance settlement, including automatic fee calculation and dynamic tax calculation.

### 🏆 4. Auction Winner & Checkout Flow
A dedicated post-auction workflow for securing the asset transition.
*   **Automated Winner Resolution**: The instant an auction closes, the system locks the database record, resolves the highest bid, updates the vehicle status to `CLOSED`, and assigns the winning bidder.
*   **Winner Workspace Portal**: Winners gain access to a secure checkout portal, enabling them to complete document submissions, coordinate delivery logistics, and pay the remaining balance.
*   **Operator Dashboard Oversight**: Backoffice admins can track receipt uploads, verify bank payments, approve shipping statuses, and issue final release documentation.
