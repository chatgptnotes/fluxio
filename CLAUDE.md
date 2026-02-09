# AUTONOMOUS AGENT CONFIGURATION
## FlowNexus - IIoT Flow Monitoring Platform

---

## MASTER AUTONOMY SETTINGS

### Core Principles
- No confirmation requests. Make sensible assumptions and proceed.
- Work in tight, verifiable increments. After each increment, run/tests/build locally.
- If a path is blocked, pick the best alternative and continue. Document deviations briefly.
- Prefer simplicity, security, and maintainability. Production-grade by default.
- Do not use emojis in project. Always use Google Material Icons pack instead.
- Do not use M-dashes in any responses. Use commas or periods instead.

### Version Control Footer
Always add footer with:
- Version number (starts at 1.0, increments by 0.1 with each git push: 1.1, 1.2, 1.3, etc.)
- Date of change
- Repository name
- Format: Fine print, grayed out

### Post-Task Protocol
After completing each to-do task, automatically suggest:
- Which portal/local port to use for testing
- Share link of local port where project can be tested
- Do this even if user doesn't ask

---

## PROJECT MISSION

### [PROJECT GOAL]
Build and ship FlowNexus, a complete IIoT platform for real-time monitoring of Nivus flow transmitters via Teltonika gateways, with cloud-based dashboard, alert system, and data analytics.

### [TECH STACK & TARGETS]
- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes + Supabase
- **Database:** PostgreSQL (via Supabase)
- **Real-time:** Supabase Realtime
- **Deployment:** Vercel (frontend), Supabase (backend)
- **Package Manager:** pnpm
- **OS:** macOS development environment

### [REPO/ENV]
- Repository: https://github.com/chatgptnotes/flownexus.git
- Package Manager: pnpm
- Environment: macOS with Node.js 18+

### [DEADLINES/BOUNDS]
- If external keys missing, use mocks and isolate behind interfaces
- Supabase credentials can be added later
- Gateway hardware not required for initial development
- Use sample data for testing and demonstration

---

## OPERATING RULES

1. **Autonomous Operation**
   - Do not ask for confirmation. Make sensible assumptions and proceed.
   - Work in tight, verifiable increments
   - After each increment, run/test/build locally
   - If blocked, choose best alternative and document deviation

2. **Code Quality Standards**
   - Zero TypeScript/ESLint errors
   - No failing tests
   - No unhandled promise rejections
   - Production-grade by default
   - Prefer simplicity, security, maintainability

3. **Security First**
   - No secrets in code. Use env vars.
   - Validate all inputs
   - Rate-limit risky endpoints
   - Implement Row Level Security (RLS) policies
   - Secure API endpoints with authentication

4. **Documentation Requirements**
   - Instrument with basic logs/metrics
   - Add minimal docs so another dev can run it
   - Docs must match actual working commands

---

## DELIVERABLES (all must be produced)

1. **Working Code**
   - Committed with meaningful messages
   - Follows conventional commits format

2. **Scripts & Commands**
   - `pnpm dev` (starts development server)
   - `pnpm build` (builds for production)
   - `pnpm test` (runs all tests)
   - `pnpm lint:fix` (auto-fixes linting issues)

3. **Testing Coverage**
   - Minimal tests covering core logic
   - API endpoint tests
   - Data ingestion flow tests
   - Alert system tests

4. **Environment Setup**
   - `.env.example` with placeholders and comments
   - Clear instructions for each variable

5. **Documentation**
   - README.md: quickstart, env vars, commands, deploy steps, FAQ
   - ARCHITECTURE.md: system design, data flow, security model
   - CHANGELOG.md: what was built and what's next

6. **Error Handling**
   - Graceful failures
   - User-visible error messages
   - No silent failures

7. **Code Quality Tools**
   - Lint/format config
   - One command to fix: `pnpm lint:fix`
   - Pre-commit hooks (optional)

8. **Version Footer**
   - Implemented in all screens
   - Auto-increments with git push
   - Shows version, date, repo name

---

## QUALITY BARS

- Zero TypeScript/ESLint errors
- No failing tests
- No unhandled promise rejections
- No secrets in code
- Use env vars everywhere
- Validate all inputs
- Rate-limit risky endpoints
- Docs match actual working commands
- All screens have Google Material Icons (no emojis)
- Footer with version on every screen

---

## ACTION LOOP (repeat until mission complete)

1. **PLAN:** Write concise step plan (max 10 bullets). Don't ask anything.
2. **EXECUTE:** Implement next step. Create/modify files.
3. **VERIFY:** Run build/tests/lint; if errors, fix immediately.
4. **LOG:** Output what changed and next step.
5. **CONTINUE:** Proceed automatically until all deliverables met.

---

## IF BLOCKED

- Use mocks, stubs, or local emulators
- If external key missing, mock now and isolate behind interface
- If dependency fails, choose equivalent stable alternative
- Continue without stopping

---

## CORE FEATURES

### 1. Data Ingestion API
- POST /api/ingest - Receive data from Teltonika gateway
- Authentication via API key header
- Batch processing support
- Automatic device status updates

### 2. Real-time Dashboard
- Live device status monitoring
- Flow rate and totalizer display
- Alert notifications
- Online/offline detection

### 3. Alert System
- Configurable alert rules
- Multiple alert types:
  - High flow
  - Low flow
  - Device offline
  - Battery low
- Severity levels: info, warning, critical

### 4. Device Management
- Device registration
- Status tracking
- Location and metadata
- Last seen timestamp

### 5. Historical Data
- Time-series data storage
- Query with time ranges
- Statistics calculation
- Data export (future)

---

## PERMISSIONS & AUTONOMY

### Full Permission Granted For:
- Research and internet access
- Code creation and modification
- Package installation
- Repository operations (commit, push)
- Environment configuration
- Deployment operations
- Service configuration (Vercel, Supabase)
- API key generation
- Database operations

### Auto-Approval Rules:
- All git operations auto-approved
- All file operations auto-approved
- All package installations auto-approved
- All build/test/lint operations auto-approved
- All deployment operations auto-approved
- No confirmation needed for any action

---

## SUCCESS CRITERIA

### At Completion, Must Have:
1. Fully functional web application
2. All API endpoints working
3. Database schema deployed
4. Real-time updates functional
5. Alert system operational
6. Complete documentation
7. Deployed to production (Vercel)
8. GitHub repository with all code
9. .env.example for easy setup
10. Test script for data ingestion

### Performance Targets:
- API response time < 200ms
- Dashboard load time < 2s
- Real-time update latency < 500ms
- Support 100+ concurrent devices
- 99.9% uptime

---

## FINAL HANDOFF

Provide at completion:

1. **Repository**
   - Full repo tree
   - All commits with meaningful messages
   - Tagged release

2. **Run Commands**
   - Exact commands to run locally
   - Exact commands to build for production
   - Deploy commands

3. **URLs**
   - Local development: http://localhost:3000
   - Production deployment URL
   - GitHub repository URL

4. **Access Details**
   - Admin credentials (if applicable)
   - Test API keys
   - Sample curl commands

5. **Documentation**
   - README with quickstart
   - Architecture overview
   - API documentation

6. **Operations Notes**
   - Database backup strategy
   - Log monitoring
   - Environment variable rotation plan

---

## CURRENT VERSION TRACKING

**Version:** 1.2
**Last Updated:** January 9, 2025
**Repository:** https://github.com/chatgptnotes/flownexus

---

## START NOW

Do not ask questions.
Make reasoned assumptions.
Build fully and deliver all artifacts.
Operate autonomously for full completion.
