# THE VIII SALON

A React + TypeScript customer website with an Express + TypeScript booking API.

## Run locally

```powershell
cd backend
npm install --ignore-scripts
npm run build
npm start
```

In another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The admin area is at `http://localhost:5173/admin`.

Copy `backend/.env.example` to `backend/.env`. Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `JWT_SECRET` before using the admin area. The development API uses an in-memory booking store so the frontend flow works without MySQL credentials; bookings reset when the server restarts. The default development login is `admin@theviiisalon.com` / `change-this-password` only when those variables are not set.

## Database

Run `backend/schema.sql` in MySQL to create the normalized service, customer, booking, settings and notification tables. The next integration step is replacing the development store in `backend/app.ts` with repository calls using the existing `mysql2/promise` pool.

## Validation

`backend/npm run build` passes. The live API smoke test covers service retrieval and booking creation. The frontend TypeScript check passes; Vite bundling may require allowing its native Rolldown binary in Windows Application Control, which blocked the local production bundle on this machine.
