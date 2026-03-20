# SkillBridge (SkillBridge Marketplace)

SkillBridge is a freelance marketplace platform where clients can hire vetted freelancers for skills and projects.

This repository is organized as a lightweight monorepo:
- `client/` - React + Vite web app
- `server/` - Express + TypeScript API
- `shared/` - shared TypeScript types

## Local setup

1. Copy environment variables:
   - `.env.example` -> `.env`
2. Start services:
   - `docker compose up -d postgres redis`
3. Run server:
   - `cd server && npm install && npm run dev`
4. Run client:
   - `cd client && npm install && npm run dev`

## Health check

- `GET /health` returns service status.

