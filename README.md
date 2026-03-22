# SkillBridge 🌉

**India's smartest freelance marketplace — built on trust.**

[![Live](https://img.shields.io/badge/Status-Live-success.svg)](https://freelance-woad-rho.vercel.app)
[![Built with TypeScript](https://img.shields.io/badge/Built_with-TypeScript-blue.svg)](https://www.typescriptlang.org/)
[![Deployed on Vercel & Render](https://img.shields.io/badge/Deployed_on-Vercel_%26_Render-black.svg)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## What is SkillBridge?

SkillBridge is a hybrid freelance marketplace designed specifically for Indian students and early-career professionals. It bridges the gap between emerging talent and clients by offering a dual approach to freelancing: a traditional bid-based job board and a zero-fee gig marketplace. 

Trust and security are at the core of the platform. SkillBridge introduces a unique AI Phishing Guard powered by Groq to monitor communications and protect users from scams. All financial transactions are secured through an escrow payment system using Razorpay, ensuring that funds are held safely until the work is satisfactorily completed.

To foster a high-quality community, SkillBridge features an Admin mission system where freelancers can earn credits, and a skill verification badge system that highlights verified competencies. Whether you are a student looking for your first gig or a client seeking verified talent, SkillBridge provides the tools and security necessary for successful collaboration.

## Live Demo

- **Frontend:** [https://freelance-woad-rho.vercel.app](https://freelance-woad-rho.vercel.app)
- **Backend API:** [https://skillbridge-server-u6gi.onrender.com](https://skillbridge-server-u6gi.onrender.com)

*Note: The backend API is hosted on a free tier. The first request may take up to 30 seconds to wake up the server.*

## Features

| Feature | Description | Status |
|---|---|---|
| **Jobs Marketplace** | Browse and post freelance job opportunities. | Live |
| **Bid System** | Freelancers can submit competitive bids on active jobs. | Live |
| **Escrow Payments** | Secure payments via Razorpay holding funds until completion. | Live |
| **AI Phishing Guard** | Real-time message scanning to detect and prevent scams. | Live |
| **Messaging** | Real-time chat system for seamless client-freelancer communication. | Live |
| **Reviews & Ratings** | Build reputation with post-project feedback. | Live |
| **Admin Missions** | Complete platform missions to earn rewards. | Live |
| **Credits System** | Internal platform currency for bidding and featuring profiles. | Live |
| **Skill Tests** | Take assessments to earn verified skill badges. | Live |
| **Notifications** | Alerts for messages, bids, and job updates. | Live |
| **Services/Gigs** | Freelancers can list fixed-price services for instant purchase. | Live |
| **Analytics Dashboard** | Track earnings, active jobs, and profile views. | Live |

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 14, TypeScript, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript, Prisma ORM |
| **Database** | PostgreSQL (Neon), Redis (Upstash) |
| **Authentication** | JWT (access + refresh tokens) |
| **Payments** | Razorpay (escrow mock mode) |
| **AI** | Groq API (phishing detection) |
| **Deployment** | Vercel (frontend), Render (backend) |
| **Infrastructure**| Docker Compose (local dev) |

## Architecture

```text
Browser
  │
  ▼
Vercel (Next.js)
  │
  ▼
Render (Express API) ─────────► Groq AI (message scanning)
  │                  ─────────► Razorpay (payments)
  ▼
Neon (PostgreSQL) + Upstash (Redis)
```

## Getting Started (Local Development)

Step-by-step guide to run SkillBridge locally.

### Prerequisites
- Node.js 18+
- Docker Desktop

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone https://github.com/grsanudeep42-cmd/freelance.git
   cd freelance
   ```

2. **Configure Environment Variables**
   ```bash
   cd server
   cp .env.example .env
   ```
   *(Ensure you populate the necessary values in `.env` based on the Environment Variables table below).*

3. **Start Core Infrastructure**
   Start PostgreSQL and Redis using Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. **Setup and Start Backend Server**
   ```bash
   cd server
   npm install
   npx prisma migrate dev
   npm run dev
   ```
   *(The API server will start on port 4000)*

5. **Start Frontend Web Application**
   Open a new terminal window:
   ```bash
   cd web
   npm install
   npm run dev
   ```
   *(The Next.js frontend will start on port 3000)*

6. **Seed Initial Data**
   Seed the database with initial skill tests:
   ```bash
   cd server
   npx ts-node src/scripts/seedSkillTests.ts
   ```

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (Neon or Local). |
| `REDIS_URL` | Redis connection string (Upstash or Local). |
| `JWT_SECRET` | Secret key for signing Access Tokens. |
| `JWT_REFRESH_SECRET` | Secret key for signing Refresh Tokens. |
| `GROQ_API_KEY` | API key for Groq AI Phishing Guard. |
| `RAZORPAY_KEY_ID` | Razorpay public key ID. |
| `RAZORPAY_KEY_SECRET` | Razorpay secret key. |
| `CORS_ORIGIN` / `FRONTEND_URL` | Allowed origin for CORS (e.g., http://localhost:3000). |
| `PORT` | Backend server port (default 4000). |
| `HOST` | Backend server host binding. |
| `NODE_ENV` | Environment mode (`development` or `production`). |

## Security

SkillBridge implements robust security measures to protect users and data:

- JWT access + refresh token rotation
- Bcrypt password hashing
- Rate limiting on all API routes (express-rate-limit + Redis)
- CORS locked to production domain
- Zod input validation on all endpoints
- Prisma parameterized queries (SQL injection proof)
- AI-powered phishing detection on all messages
- Role-based access control (CLIENT / FREELANCER / ADMIN)
- Escrow payment holds (no direct money transfer)
- Environment variables for all secrets (no hardcoding)

## Project Structure

```text
freelance/
├── server/          # Express API
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   ├── middlewares/
│   │   ├── services/
│   │   ├── models/
│   │   └── utils/
│   └── prisma/
├── web/             # Next.js frontend
│   └── app/
├── client/          # React Native (coming soon)
└── shared/          # Shared TypeScript types
```

## Roadmap

- [x] Web platform (complete)
- [x] AI Phishing Guard
- [x] Escrow payments
- [ ] Mobile app (React Native)
- [ ] Razorpay live mode
- [ ] AWS migration
- [ ] Skill verification marketplace
- [ ] Public API

## Contributing

SkillBridge is currently a solo project, but open to community Pull Requests. Please open an issue before submitting major changes.

## License

MIT

## Author

Built by **Anudeep G** — student, solo founder  
GitHub: [grsanudeep42-cmd](https://github.com/grsanudeep42-cmd)  
Live: [https://freelance-woad-rho.vercel.app](https://freelance-woad-rho.vercel.app)
