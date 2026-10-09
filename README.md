<h1 align="center">🛡️ Casefile</h1>

<p align="center">
  <b>A role-based portal for tracking background verification cases</b><br/>
  Built for the NSQTech Software Intern code challenge
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Angular-18-DD0031?logo=angular&logoColor=white" alt="Angular 18" />
  <img src="https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white" alt="Node.js and Express" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white" alt="JWT" />
</p>

---

## 🎬 Demo video

▶️ **[Watch the walkthrough](https://drive.google.com/file/d/1JLAOvco8cVPJOx61T28l6QihXt-pvwYz/view?usp=sharing)**

---

## 📸 Screenshots

### 🔐 Login
<img width="1892" height="902" alt="image" src="https://github.com/user-attachments/assets/043ce042-1b13-48b5-9540-b20cbc0870d7" />

### 🛠️ Admin dashboard
<img width="1915" height="902" alt="image" src="https://github.com/user-attachments/assets/3ca6453b-dadf-4fae-baa3-7772be712d69" />

### 👤 User dashboard
<img width="1918" height="911" alt="image" src="https://github.com/user-attachments/assets/5224c7e1-5fb8-4aed-9756-90853719a88e" />

### ➕ Admin: add and assign
<img width="1896" height="901" alt="image" src="https://github.com/user-attachments/assets/c14cfdb6-a5e1-4520-964c-987fe7421ba8" />

### ➕ Admin: add user
<img width="1917" height="906" alt="image" src="https://github.com/user-attachments/assets/16f9a8a2-7774-4b99-9b70-d60c38ecdc5e" />

### 📋 User view: my cases
<img width="1918" height="897" alt="image" src="https://github.com/user-attachments/assets/737dd339-b791-4c24-814b-5793a114a2ee" />


---

## ✨ Highlights

- 🔐 **Secure login** with user ID, password and role, using JWT tokens and hashed passwords
- 👥 **Two roles** with different access: a General User sees only their own cases, an Admin sees everything
- 📊 **Dashboard** with live case counts by status. Click a card to jump to a filtered list
- 🧾 **Admin tools** to add users, add cases, assign them and update their status
- ⏳ **Async processing demo**: slow down the API from the sidebar and watch each page show its own loading skeleton
- 🧩 **Clean architecture** on both sides: routes, controllers and services on the server, services, guards and an interceptor in Angular

---

## 🔑 Demo accounts

| Role | User ID | Password |
|---|---|---|
| 🛠️ Admin | `admin` | `Admin@123` |
| 👤 General User | `almaj` | `User@123` |

---

## 🚀 How to run it

You need **Node.js 18 or newer**. Open two terminals.

**1️⃣ Start the API** (runs on http://localhost:4000)

```bash
cd server
copy .env.example .env      # on Mac or Linux: cp .env.example .env
npm install
npm run dev
```

**2️⃣ Start the Angular app** (runs on http://localhost:4200)

```bash
cd client
npm install
npm start
```

Then open **http://localhost:4200** and sign in with a demo account. The API creates its starting data the first time it runs.

---

## 🧭 What each role can do

| Feature | 👤 General User | 🛠️ Admin |
|---|:---:|:---:|
| Sign in and see own details | ✅ | ✅ |
| Dashboard with case counts | ✅ (own cases) | ✅ (all cases) |
| My cases with status filter | ✅ | - |
| See assignee and internal notes | ❌ | ✅ |
| Manage cases (add, assign, update status) | ❌ | ✅ |
| Manage users (add, edit, delete) | ❌ | ✅ |

> 🔒 Access control happens on the **server**. A General User never receives other people's cases or internal notes, even if they call the API directly.

---

## ⏱️ Async processing

Every API route accepts a `delay` parameter in milliseconds, for example `/api/records?delay=3000`.

The sidebar has a **Simulate slow API** control that sets it. Each page then shows a loading skeleton while it waits, and the user's details and the cases load **independently**, so one can appear while the other is still loading.

---

## 🌐 API

| Method | Path | Access |
|---|---|---|
| `POST` | `/api/auth/login` | Public |
| `GET` | `/api/me` | Signed in |
| `GET` | `/api/records` | Signed in (filtered by role) |
| `POST` | `/api/records` | Admin |
| `PUT` | `/api/records/:id` | Admin |
| `GET` `POST` | `/api/users` | Admin |
| `PUT` `DELETE` | `/api/users/:id` | Admin |

---

## 🗂️ Project structure

```
server/src
├── routes/        which address maps to which controller, and which guards apply
├── controllers/   read the request and send the response
├── services/      business logic (login, cases, users)
├── middleware/    authentication, admin check, simulated delay
├── data.ts        starting data, saved to server/data/db.json
├── config.ts      reads settings from the .env file
└── app.ts         builds the Express app and the error handler

client/src/app
├── core/          services, HTTP interceptor, route guards
├── features/      login, shell (sidebar), dashboard, cases, admin pages
└── shared/        status stamp and case table components
```

---

## 🅰️ Angular design

- 🧰 **Services**: `AuthService`, `UserService` and `RecordsService` hold all API calls, so components never write API addresses
- 🪪 **Interceptor**: adds the JWT to every request and signs the user out on a 401
- 🔄 **App initializer**: restores the session on app load, so a refresh does not log the user out
- 🚧 **Guards**: `authGuard`, `guestGuard` and `adminGuard`
- 💤 **Lazy loading**: every page is loaded when it is first visited
- 📡 **Signals and computed values**: only the part of the screen whose data changed updates
- 🛑 **`switchMap`**: cancels an older request when a newer one starts

---

## ☁️ Swapping the database

Controllers only call the service layer, and the services are the only code that touches the data. To move to **MongoDB** or **AWS DynamoDB**, replace the data access in `server/src/services` and keep the routes and controllers unchanged.

---

## 📝 Notes

- Settings live in `server/.env` (`JWT_SECRET` and `PORT`). That file is not committed, and `.env.example` shows the format.
- All data is dummy data created for this challenge.
- Possible next steps: a cloud database, automated tests, and deployment (for example the API on AWS Lambda behind API Gateway).
