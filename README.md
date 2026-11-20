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

Copy `backend/.env.example` to `backend/.env` and set the database, admin, and SMTP values. The backend requires MySQL; bookings are stored in the database. Start the frontend and backend in separate terminals. The frontend calls `http://localhost:4000/api` by default in development.

## Database

Run `backend/schema.sql` against your MySQL server before starting the backend. For an existing database, run `backend/migrations/001_permanent_service_deletion.sql` once to allow permanent service deletion while preserving booking history.

## Deployment

Deploy the frontend and backend as separate services unless your host is configured to proxy `/api` to the backend:

1. Deploy `backend/` as a Node.js service. Build with `npm run build` and start with `npm start`. Configure the backend environment variables from `backend/.env.example`, including a reachable MySQL database and valid SMTP credentials.
2. Deploy `frontend/` as a Vite static site. Build with `npm run build` and publish `dist/`. Set the build-time variable `VITE_API_URL` to the public backend origin (for example, `https://your-api-domain.example`). It may include `/api`; the frontend normalizes either form.
3. Set the backend `REACT_URL` to the frontend's exact public origin. For multiple allowed origins, separate them with commas.
4. Configure the database with `backend/schema.sql` and set `SMTP_USER`, `SMTP_PASS`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, and `ADMIN_NOTIFY_EMAIL`. The SMTP provider must allow the deployed backend to send mail. Gmail requires an app password. Without working SMTP credentials, bookings can still be saved, but the API reports email delivery as failed.

The hero image and logo are served from `frontend/public`; use root-relative URLs such as `/salon-interior.jpg` and `/logo.jpeg`.

## Validation

Run `npm run build` from both `backend/` and `frontend/` to type-check and build each service.
