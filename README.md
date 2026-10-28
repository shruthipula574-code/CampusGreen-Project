# Campus Green Ideas Board

A beginner-friendly full-stack college project where students can post sustainability ideas, browse and filter suggestions, vote for ideas, comment, and follow progress from **New** to **Completed**. An administrator can update status and remove inappropriate or duplicate ideas.

## 1. Problem and objectives

Campus sustainability improvements often begin as small student suggestions, but those suggestions can be scattered across chats and conversations. This board provides one shared place to collect ideas and see which suggestions have community support.

### Target users
- **Student:** create an account, publish ideas, vote, and comment.
- **Administrator:** all student actions, plus update an idea's status and delete an idea.

### Implemented features
- Sign up and sign in with email and password.
- Secure password hashing with bcrypt.
- Browse ideas, search by text, and filter by category/status.
- Sort by community support or date.
- Post ideas in six sustainability categories.
- Toggle a vote (one vote per user per idea).
- Read and add comments.
- Admin status changes and idea deletion.
- Supabase PostgreSQL persistent storage.
- Responsive page, input validation, basic login rate limiting, security headers, and protected API routes.

## 2. Technology stack

- HTML5, CSS3, Vanilla JavaScript
- Node.js (20 or newer) and Express
- Supabase PostgreSQL
- Git and GitHub
- npm packages: `@supabase/supabase-js`, `bcryptjs`, `dotenv`, `express`, `express-rate-limit`, `helmet`, `jsonwebtoken`

## 3. Folder structure

```text
campus-green-ideas-board/
├── frontend/
│   ├── index.html
│   ├── styles.css
│   └── app.js
├── backend/
│   ├── routes/
│   │   ├── auth.js
│   │   ├── ideas.js
│   │   └── admin.js
│   ├── middleware/
│   │   └── auth.js
│   ├── server.js
│   ├── supabase.js
│   ├── package.json
│   ├── .env
│   ├── .env.example
│   └── .gitignore
├── database/
│   └── schema.sql
├── .gitignore
└── README.md
```

`backend/.env` is created by you locally from `.env.example`; it is intentionally not included in the project archive.

## 4. Prerequisites

Install:
- Visual Studio Code: https://code.visualstudio.com/
- Node.js LTS (20+): https://nodejs.org/
- Git: https://git-scm.com/
- Create a Supabase account/project: https://supabase.com/

After installation, open a new VS Code terminal and verify:
```bash
node --version
npm --version
git --version
```
Node should be version 20 or newer.

## 5. Set up Supabase

1. Sign in to Supabase and create a new project.
2. Choose a project name and database password. Save the database password privately; this app does not need it directly.
3. In your project, open **SQL Editor** → **New query**.
4. Open `database/schema.sql`, copy the complete SQL, paste it into the editor, and click **Run**.
5. Open **Table Editor** and verify that `users`, `ideas`, `votes`, and `comments` exist.
6. Open **Project Settings → API** (or the API keys page in your dashboard). Copy the project URL and the server-side `service_role` key. Supabase labels may vary as its dashboard evolves.

The service-role key bypasses row-level security. It belongs only in `backend/.env` and must never be placed in frontend files, GitHub, screenshots, or public documents. This project intentionally uses the Express backend for every database request. RLS is enabled with no public policies, so browser users cannot query these tables directly.

## 6. Configure environment variables

From the project root, create the local env file by copying the example:

**Windows Command Prompt**
```bat
copy backend\.env.example backend\.env
```

**PowerShell**
```powershell
Copy-Item backend/.env.example backend/.env
```

Open `backend/.env` and replace the example values:
```env
PORT=3000
NODE_ENV=development
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_REAL_SERVER_SIDE_SERVICE_ROLE_KEY
JWT_SECRET=REPLACE_WITH_A_RANDOM_SECRET_OF_AT_LEAST_32_CHARACTERS
ADMIN_EMAIL=mrec@gmail.com
ADMIN_PASSWORD=CHOOSE_A_STRONG_PASSWORD_OF_AT_LEAST_12_CHARACTERS
```

Generate a JWT secret from the `backend` directory:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```
Copy the output into `JWT_SECRET`. Set a strong admin password privately; the app hashes it before storing it. The requested admin email is preconfigured as `mrec@gmail.com`. For safety, the provided password is not hard-coded in source code or this README; set it as `ADMIN_PASSWORD` in your local `.env`. The admin account is created when the server starts. If that email already exists, the startup routine ensures its role is `admin`.

Do not share your `.env` file or commit it to Git.

## 7. Install and run

1. Open VS Code and choose **File → Open Folder**, then select `campus-green-ideas-board`.
2. Choose **Terminal → New Terminal**.
3. Move into the backend folder:
   ```bash
   cd backend
   ```
4. Install packages:
   ```bash
   npm install
   ```
5. Check JavaScript syntax:
   ```bash
   npm run check
   ```
6. Start the server:
   ```bash
   npm start
   ```
   Expected output includes `Administrator account ready: mrec@gmail.com` (or `Administrator account created: mrec@gmail.com`) and `Campus Green Ideas Board running at http://localhost:3000`.
7. Open http://localhost:3000 in your browser. Do not open `index.html` by double-clicking it: the backend serves the page and provides `/api` routes.

For development with automatic restart, use `npm run dev` from `backend/`.

## 8. Architecture and workflow

Browser HTML/CSS/JavaScript → `fetch()` → Express REST API → Supabase PostgreSQL. Passwords are hashed with bcrypt; the backend issues an 8-hour signed token after sign-in. The browser stores that token in localStorage for this learning MVP and sends it as a Bearer token. The backend verifies the token and reloads the user's role from the database for protected operations.

For a production system, prefer secure HttpOnly cookies or a managed authentication provider, add email verification/password reset, audit logs, and stricter operational monitoring. This educational MVP does not implement email verification or password reset.

## 9. REST API reference

All request/response bodies use JSON. Protected routes require `Authorization: Bearer <token>`.

| Method | Path | Purpose | Access |
|---|---|---|---|
| GET | `/api/health` | Check server is running | Public |
| POST | `/api/auth/signup` | Create student account; body: `{ "name", "email", "password" }` | Public |
| POST | `/api/auth/signin` | Sign in; body: `{ "email", "password" }` | Public |
| GET | `/api/auth/me` | Return current user | Signed-in |
| GET | `/api/ideas` | List recent ideas with vote/comment counts | Public |
| GET | `/api/ideas/:id` | Read one idea and its comments | Public |
| POST | `/api/ideas` | Create idea; body: `{ "title", "description", "category" }` | Signed-in |
| POST | `/api/ideas/:id/vote` | Add/remove your vote | Signed-in |
| POST | `/api/ideas/:id/comments` | Add comment; body: `{ "body" }` | Signed-in |
| PATCH | `/api/admin/ideas/:id/status` | Change status; body: `{ "status": "In progress" }` | Admin |
| DELETE | `/api/admin/ideas/:id` | Delete idea and its related votes/comments | Admin |

Common errors: `400` invalid input, `401` missing/invalid session, `403` non-admin accessing admin endpoint, `404` record/route not found, `409` duplicate email/vote, and `500` unexpected server/database error. Responses include a readable `error` message.

## 10. How to use the app

1. Click **Join the board** and create a student account.
2. Sign in and click **Post an idea**.
3. Enter a title (5–120 characters), description (20–1,500 characters), and category.
4. Browse ideas, use search/filter/sort, and click the heart to vote. Click it again to remove your vote.
5. Open **Details** to read comments or add a comment.
6. Sign in with the administrator email and the password configured in `.env` to update statuses or delete ideas.

## 11. Testing checklist

| Test | Expected result |
|---|---|
| Open `/api/health` | JSON status `ok` |
| Create a valid account | Account is stored; user is signed in |
| Reuse an email at signup | Friendly duplicate-account error |
| Sign in with incorrect password | `401` error; no token issued |
| Post an idea while signed out | App asks you to sign in |
| Submit a short title/description | Validation message; no idea saved |
| Create an idea with valid fields | Idea appears after refresh/reload |
| Vote while signed out | App asks you to sign in |
| Vote twice on one idea | First adds support, second removes it |
| Add a comment | Comment appears in idea details |
| Filter by category/status or search | Only matching ideas are displayed |
| Admin changes status | Updated status appears on card |
| Student calls admin endpoint | `403` response |
| Admin deletes an idea | Idea disappears; related votes/comments cascade-delete |
| Refresh browser | Ideas remain because they are in PostgreSQL |
| Resize browser to mobile width | Layout adapts to a narrow screen |

## 12. Troubleshooting

- **Missing environment variables:** check `backend/.env` spelling and ensure you run `npm start` from `backend/`.
- **Database connection or schema errors:** confirm the Supabase URL/key, internet connection, and that you ran all of `database/schema.sql`.
- **Invalid JWT secret:** set `JWT_SECRET` to at least 32 characters; a random 48-byte secret is recommended.
- **Admin setup rejects password:** `ADMIN_PASSWORD` must be at least 12 characters.
- **Port already in use:** change `PORT=3001` in `.env`, restart, then open `http://localhost:3001`.
- **Page loads but API errors:** keep the server terminal open and read the server-side error message. Never paste your service-role key into a chat or screenshot.
- **No ideas on first load:** this is normal. Create a student account and post the first idea; no demo records are required.

## 13. Git and GitHub upload

1. Create a new repository on GitHub. Do not add a README there if this local project already has one.
2. Open a terminal at the project root (not inside `backend`):
   ```bash
   git init
   git status
   git add .
   git status
   git commit -m "Build Campus Green Ideas Board"
   git branch -M main
   git remote add origin YOUR_GITHUB_REPOSITORY_URL
   git push -u origin main
   ```
3. Replace `YOUR_GITHUB_REPOSITORY_URL` with the URL of your own repository.
4. Before `git add`, check that `.env` and `node_modules/` are ignored, and that `.env.example` is included.
5. Open the GitHub repository in your browser and verify the expected files are present.

If a real secret was committed, `.gitignore` alone does not remove it. Rotate/revoke that secret immediately, then remove it from repository history as appropriate.

## 14. Limitations and future improvements

This MVP uses a server-signed token saved in localStorage, has no email verification or password reset, and does not include image uploads or moderation reports. For a public production deployment, use secure HttpOnly cookie sessions or a managed auth provider, add CSRF protections where applicable, stronger abuse prevention, audit logging, backups, and a reviewed deployment configuration.

## 15. Security checklist

- [x] Passwords are hashed; they are not stored as plaintext.
- [x] Service-role key is read only by the server from `.env`.
- [x] `.env` is ignored by Git.
- [x] Backend checks user identity and admin role.
- [x] Request bodies are limited and validated.
- [x] Database uniqueness prevents duplicate email and duplicate vote records.
- [x] RLS is enabled with no public table policies.
- [ ] Replace local example credentials/configuration before deployment.
- [ ] Review production hosting, cookie/token storage, monitoring, and backup settings.
