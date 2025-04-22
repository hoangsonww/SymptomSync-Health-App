# SymptomSync

Build with patient care in mind, SymptomSync is a web application designed to help users manage their health and wellness. It provides a comprehensive dashboard for tracking medications, appointments, and health logs, all while ensuring real-time synchronization across devices. With features like medication reminders, appointment tracking, and an AI-powered chatbot, SymptomSync empowers users to take control of their health journey.

> Developed by David Nguyen, Erica Ocbu, Caroline Bryan, and Kathryn Brown for COMP 426: Modern Web Programming at UNC–Chapel Hill.

![TypeScript](https://img.shields.io/badge/-TypeScript-05122A?style=flat&logo=typescript)  
![Next.js](https://img.shields.io/badge/-Next.js-05122A?style=flat&logo=nextdotjs)  
![Shadcn/ui](https://img.shields.io/badge/-Shadcn_UI-05122A?style=flat&logo=shadcnui)  
![Tailwind](https://img.shields.io/badge/-Tailwind-05122A?style=flat&logo=tailwindcss)  
![Supabase](https://img.shields.io/badge/-Supabase-05122A?style=flat&logo=supabase)

---

## SymptomSync UI

The UI of the app was designed with Figma and Tailwind CSS. The design is responsive and mobile-first, ensuring a seamless experience across devices. Below are some screenshots of the app in action:

### Home Dashboard

<p align="center">
  <img src="docs/img/dashboard.png" alt="Dashboard Screenshot" width="100%"/>
</p>

### Calendar View

<p align="center">
  <img src="docs/img/calendar.png" alt="Calendar Screenshot" width="100%"/>
</p>

### Documents Page

<p align="center">
  <img src="docs/img/documents.png" alt="Health Logs Screenshot" width="100%"/>
</p>

### Medication Reminders

<p align="center">
  <img src="docs/img/meds.png" alt="Medication Reminders Screenshot" width="100%"/>
</p>

### Chatbot UI

<p align="center">
  <img src="docs/img/chat.png" alt="Chatbot Screenshot" width="100%"/>
</p>

### Auth

<p align="center">
  <img src="docs/img/login.png" alt="Auth Screenshot" width="100%"/>
</p>

---

## Features

SymptomSync offers a range of features to help users manage their health effectively:

- **Medication Reminders**: Schedule, edit, and delete recurring or one‑off med alerts.
- **Appointment Tracking**: Log upcoming appointments with date/time and manage them.
- **Health Logs**: Record symptoms, mood, vitals, and notes; visualize trends over time.
- **Dashboard Visualizations**: Interactive charts for severity trends, symptom & mood distribution, and more.
- **Real‑Time Updates**: Broadcast channel notifications and Supabase Realtime keep all devices in sync instantly.
- **Pagination**: Efficient paginated fetching for large datasets (meds, appts, logs).
- **Notifications**: In-app reminders for due medications and appointments.
- **ICS Export/Import**: Export all events as an ICS calendar file or import from external calendars.
- **Calendar View**: Month/week/day/agenda views for all events, with drag-and-drop support.
- **Documents Page**: Upload/export and manage documents related to health records, prescriptions, etc.
- **Chatbot**: AI-powered chatbot for symptom analysis and health insights.
- **User Profiles**: Create and manage user profiles with personalized settings.
- **Medication Schedules**: Set up complex medication schedules with reminders.
- **Login/Signup**: Secure authentication via Supabase Auth.
- **Reset Password**: Password reset functionality for user accounts.
- **Dark Mode**: Toggle between light and dark themes for better accessibility.
- **Responsive Design**: Mobile-first design with a focus on usability across devices.

---

## Tech Stack

- **Front End**
  - Next.js & React (TypeScript)
  - Tailwind CSS & Shadcn/ui components
  - Framer Motion for animations
  - react-chartjs-2 & Chart.js for charts
- **Back End / Data**
  - Supabase (Auth, Postgres, Realtime, Storage, Cron)
- **Notifications & Sync**
  - Supabase Postgres Triggers & Cron Jobs for scheduled reminders
  - Supabase Broadcast Channels & `postgres_changes` for live updates & notifications

---

## Architecture Overview

```
┌──────────────────┐                   ┌───────────────────────┐
│  Next.js Client  │ <––– WebSocket –> │   Supabase Realtime   │
│ - React Pages    │                   │ - postgres_changes    │
│ - UI Components  │                   │ - broadcast channels  │
│ - TailwindCSS    │                   └───────────────────────┘
│ - React Query    │
└──────────────────┘
         │
         │ REST
         ↓
┌──────────────────┐
│   Supabase API   │
│ - Auth           │
│ - Functions (RPC)│
│ - Database       │
│ - Storage        │
└──────────────────┘
```

- **Realtime Broadcast**: Any create/update/delete triggers both a `postgres_changes` subscription and a broadcast message so all open clients show a toast notification.
- **Cron Jobs**: Scheduled jobs (via Supabase Cron) that scan upcoming reminders and dispatch notifications every second.

---

## Installation

1. Clone the repo

   ```bash
   git clone https://github.com/comp426-25s/final-project-team-16.git
   cd final-project-team-16
   ```

2. Install dependencies
   ```bash
   npm install --legacy-peer-deps
   ```
3. Copy `.env.example` → `.env.local` and fill in your Supabase credentials
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=…
   NEXT_PUBLIC_SUPABASE_ANON_KEY=…
   NEXT_PUBLIC_GOOGLE_AI_API_KEY=…
   ```
4. Run the dev server
   ```bash
   npm run dev
   ```

---

## Configuration

- **Supabase**
  - Configure **Auth**
  - Create tables: `user_profiles`, `medication_reminders`, `appointment_reminders`, `health_logs`
  - Add RLS policies for user isolation
  - Set up **Cron** jobs to run `send_reminders()` stored procedure daily/hourly
  - Define **Database Triggers** to write to broadcast channels on insert/update/delete
- **Environment**
  - `.env.local` holds all keys (refer to `.env.example`)
  - Default port: `3000`

---

## Usage

1. Sign up / log in via Supabase Auth.
2. On the **Home** dashboard, add new medications, appointments, or health logs.
3. View interactive charts—severity trends, symptom distribution, appointment patterns.
4. Navigate to **Calendar** to see a month/week/day/agenda view of all events, add events, or even import/export ICS.
5. All changes sync in real‑time across open tabs/devices; cron‑driven reminders notify you via in-app notifications.
6. Use the **Documents** page to upload/export health records, prescriptions, etc.
7. Chat with the **AI Chatbot** for symptom analysis and health insights.
8. Toggle between light and dark mode for better accessibility.
9. View and manage your **profile**. You can also vies other users' profiles.
10. Visit the **Medication Schedules** page to view/edit a complete list of your medications and their schedules.

---

## Roadmap

If we had more time, we would have added:
- 🔄 Two‑way Calendar Sync (Google, Outlook)
- 🔔 Push notifications via Web Push / FCM
- 🔍 Advanced search & filter on health logs
- 🤖 AI‑powered health insights & suggestions based on
user data and uploaded documents

---

## Contributing

1. Fork & branch: `git checkout -b feature/awesome`
2. Install & format: `npm install && npm run format`
3. Commit & PR with description

---

## Authors

- David Nguyen
- Erica Ocbu
- Caroline Bryan
- Kathryn Brown

---

## License

[MIT License](LICENSE)
