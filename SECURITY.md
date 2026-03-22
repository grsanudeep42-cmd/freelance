# Security at SkillBridge

## Security Overview

At SkillBridge, we prioritize the security and privacy of our users. As a hybrid freelance marketplace handling sensitive communications, financial transactions, and personal data, we have implemented a robust defense-in-depth strategy. This document outlines our current security measures, transparently lists known vulnerabilities we are actively working to resolve, and provides guidelines for reporting new security issues.

## Implemented Security Measures

Building a secure platform requires multiple layers of protection. SkillBridge currently implements the following security controls:

- **Authentication:** JWT-based access tokens with refresh token rotation.
- **Password Storage:** Bcrypt password hashing with a work factor of 10 salt rounds.
- **Rate Limiting:** Active on all API routes using `express-rate-limit` backed by Redis to mitigate DoS and brute-force attacks.
- **CORS Policy:** Strict Cross-Origin Resource Sharing locked exclusively to our production domain.
- **Input Validation:** Comprehensive schema validation using Zod on all API endpoints to ensure data integrity.
- **Database Security:** Prisma ORM utilizing parameterized queries to eliminate SQL injection vulnerabilities.
- **Communication Safety:** AI-powered phishing and scam detection on all platform messages using the Groq API.
- **Authorization:** Strict Role-Based Access Control (RBAC) separating `CLIENT`, `FREELANCER`, and `ADMIN` privileges.
- **Financial Security:** Escrow payment holds via Razorpay, ensuring no direct or unauthorized money transfers occur.
- **Secrets Management:** No hardcoded secrets; all sensitive keys are managed via secure environment variables.
- **Transport Security:** HTTPS enforced across all services via Vercel (Frontend) and Render (Backend).

## Known Vulnerabilities (To Fix)

In the interest of transparency and continuous improvement, we maintain a public list of known vulnerabilities that our engineering team is actively addressing.

### HIGH PRIORITY

**[HIGH-1] Refresh token not invalidated on logout**
- **Risk:** A stolen refresh token grants permanent unauthorized access even after the legitimate user has logged out.
- **Fix:** Store active refresh tokens in Redis and explicitly delete them upon user logout.
- **Status:** Open

**[HIGH-2] No account lockout after failed logins**
- **Risk:** Slow brute-force attacks (e.g., 1 attempt every 10 seconds) can successfully bypass the current rate limiting controls.
- **Fix:** Implement an automatic account lockout after 10 consecutive failed attempts, requiring email verification to unlock.
- **Status:** Open

**[HIGH-3] Escrow has no auto-release timeout**
- **Risk:** A client can indefinitely hold a freelancer's completed work in escrow without releasing the payment.
- **Fix:** Implement an automated escrow release after 14 days if the client does not raise a formal dispute.
- **Status:** Open

### MEDIUM PRIORITY

**[MED-1] No email verification on registration**
- **Risk:** Allows the creation of spam accounts and fake identities, degrading platform trust.
- **Fix:** Require email verification upon registration to activate the account and gate job posting/bidding capabilities.
- **Status:** Open

**[MED-2] Potential IDOR on messages endpoint**
- **Risk:** Insecure Direct Object Reference (IDOR); sequential or guessed User IDs could potentially expose private conversations.
- **Fix:** Enforce server-side verification that the authenticated user is an active participant in the requested conversation.
- **Status:** Needs audit

**[MED-3] Credits race condition**
- **Risk:** Concurrent bid requests could cause a race condition, leading to a negative credits balance for a freelancer.
- **Fix:** Implement atomic transactions within Prisma using `SELECT FOR UPDATE` locks when deducting credits.
- **Status:** Open

### LOW PRIORITY

**[LOW-1] Missing favicon**
- **Status:** Open

**[LOW-2] Notifications 401 bug**
- **Status:** Open

**[LOW-3] DEV TOOLS role switcher production gate**
- **Status:** Needs verification

## Pen Test Results (March 22, 2026)

We regularly conduct internal penetration testing to validate our security posture. Below are the results of our most recent testing session.

| Test | Method | Result |
|------|--------|--------|
| **SQL Injection** | Malicious payloads in name field during registration | ✅ BLOCKED (Prisma) |
| **XSS Attack** | Injecting `<script>` tags into job title inputs | ✅ ESCAPED |
| **Unauthorized Admin Access** | Direct navigation to admin endpoints as a FREELANCER | ✅ BLOCKED (403) |
| **Brute Force Login** | Rapid, repeated login attempts | ✅ BLOCKED (429) |
| **AI Phishing** | Attempting to share off-platform contact details | ✅ BLOCKED (AI Guard) |
| **Rate Limit Bypass** | Rapid, automated clicks on payment release | ✅ BLOCKED (429) |
| **CORS Bypass** | Submitting API requests from an unauthorized origin | ✅ BLOCKED |
| **Role Escalation** | CLIENT attempting to accept a freelancer job | ✅ BLOCKED (403) |

## Reporting a Vulnerability

If you find a security issue, please report it privately:
**Email:** grsanudeep42@gmail.com

*Do not open a public GitHub issue for security vulnerabilities.*

## Security Roadmap

- [ ] Refresh token Redis invalidation
- [ ] Account lockout system
- [ ] Email verification
- [ ] Escrow auto-release (14 days)
- [ ] Full IDOR audit
- [ ] Atomic credit transactions
- [ ] Bug bounty program (post-launch)
