# Yellow Lamp Agency – Web Backend & Admin Console

This repository contains the backend and admin panel for the **Yellow Lamp** creative agency website. 

The backend is built with **Node.js** and **Express**, featuring a lightweight JSON file-based database for quick, zero-config local setup. It includes contact submission APIs, portfolio project CRUD, session authentication, and automatic email notifications to `yelllow.lamp@gmail.com` via Nodemailer.

---

## Features

1. **Static File Serving**: Serves the main marketing page and uploads folder dynamically.
2. **Client Inquiry API**: Submits leads, stores them in the local database, and alerts the admin via email.
3. **Portfolio Manager API**: Serves portfolio items ordered dynamically (featured first) and enables full CRUD.
4. **Secure Session Auth**: Cookie-based JWT authentication for the administrator.
5. **Interactive Admin Dashboard**: A premium, frosted-glass dark theme console matching the Yellow Lamp visual brand, enabling lead status updates, lead deletions, and portfolio item uploads (with files).
6. **Robust Database Layer**: File-backed atomic database writes (`db.js`) requiring no SQL setups or binary compilation, meaning 100% platform-agnostic installation.

---

## Installation & Setup

1. Make sure you have **Node.js** (v18+) and **npm** installed.
2. Run the following command in the project directory to install dependencies:
   ```bash
   npm install
   ```
3. Start the application:
   ```bash
   npm start
   ```
   *For development with auto-reload, run:*
   ```bash
   npm run dev
   ```
4. Access the applications:
   - **Frontend Agency Page**: [http://localhost:3000](http://localhost:3000)
   - **Admin Dashboard Console**: [http://localhost:3000/admin](http://localhost:3000/admin)

---

## Admin Credentials

- **Username**: `admin`
- **Default Password**: `hochifyai2026`

*You can customize the password by setting the `ADMIN_PASSWORD` variable in the `.env` file before starting the server for the first time.*

---

## Email Notification Setup (yelllow.lamp@gmail.com)

By default, the server runs in **development fallback mode** where new lead details are logged directly to the server terminal. To send actual email notifications to your inbox:

1. Open the `.env` file in the root of the project.
2. Setup your SMTP configuration. We recommend generating a **Google App Password** for secure sending:
   - Go to your Google Account settings.
   - Enable **2-Step Verification**.
   - Navigate to "App passwords" (search for it in the settings search bar).
   - Generate a new app password for "Mail" and "Other (Custom Name: Yellow Lamp Server)".
   - Copy the generated 16-character password code.
3. Configure the `.env` file as follows:
   ```env
   PORT=3000
   JWT_SECRET=yellow-lamp-secret-key-2026
   ADMIN_PASSWORD=hochifyai2026

   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email-address@gmail.com
   SMTP_PASS=your-16-character-app-password
   ```
4. Restart your server. New form submissions will now be sent directly to `yelllow.lamp@gmail.com` with a client reply-to header.

---

## File Structure

- `/public`: Contains all frontend assets served by Express.
  - `index.html`: Refactored homepage fetching projects dynamically.
  - `/uploads`: Stores user-uploaded portfolio thumbnails.
  - `/admin/index.html`: Admin dashboard panel.
- `/data`: Local database directories.
  - `leads.json`: Contains list of client submissions.
  - `projects.json`: Contains portfolio items (automatically seeded on first load).
  - `config.json`: Contains admin hashed credentials.
- `server.js`: Main Express app file handling static files and API routing.
- `db.js`: Local JSON database helper and management layer.
- `.env`: Active configurations file.
- `.env.example`: Configurations schema.
