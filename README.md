# SymptomSync - A Health Management Web App 💊

Build with patient care in mind, SymptomSync is a web application designed to help users manage their health and wellness. It provides a comprehensive dashboard for tracking medications, appointments, and health logs, all while ensuring real-time synchronization across devices. With features like medication reminders, appointment tracking, and an AI-powered chatbot, SymptomSync empowers users to take control of their health journey.

> Developed by David Nguyen and Erica Ocbu for COMP 426: Modern Web Programming at UNC–Chapel Hill.

![TypeScript](https://img.shields.io/badge/-TypeScript-05122A?style=flat&logo=typescript) ![Next.js](https://img.shields.io/badge/-Next.js-05122A?style=flat&logo=nextdotjs) ![Shadcn/ui](https://img.shields.io/badge/-Shadcn_UI-05122A?style=flat&logo=shadcnui) ![TailwindCSS](https://img.shields.io/badge/-TailwindCSS-05122A?style=flat&logo=tailwindcss) ![Supabase](https://img.shields.io/badge/-Supabase-05122A?style=flat&logo=supabase) ![Framer Motion](https://img.shields.io/badge/-Framer_Motion-05122A?style=flat&logo=framer) ![Chart.js](https://img.shields.io/badge/-Chart.js-05122A?style=flat&logo=chartdotjs) ![React](https://img.shields.io/badge/-React-05122A?style=flat&logo=react) ![Vercel](https://img.shields.io/badge/-Vercel-05122A?style=flat&logo=vercel) ![Google AI](https://img.shields.io/badge/-Google_AI-05122A?style=flat&logo=google)

Currently live on Vercel at [https://symptomsync.vercel.app](https://symptomsync.vercel.app)! 🚀

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

### Dark Mode

<p align="center">
  <img src="docs/img/darkmode.png" alt="Dark Mode Screenshot" width="100%"/>
</p>

... and many more!

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
  - react-query for data fetching & caching
  - react-calendar for calendar view
  - lucide-icons for icons
- **Back End / Data**
  - Supabase (Auth, Postgres, Realtime, Storage, Cron)
- **Notifications & Sync**
  - Supabase Postgres Triggers for real-time updates
  - Supabase Cron Jobs for scheduled reminders
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
         ↑
         │
         │ REST
         ↓
┌──────────────────┐
│   Supabase API   │
│ - Auth           │
│ - Functions      │
│ - Database       │
│ - Storage        │
│ - Cron Jobs      │
│ - Triggers       │
│ - RLS Policies   │
└──────────────────┘
```

- **Supabase**: The backend is powered by Supabase, which provides a Postgres database, authentication, and real-time capabilities.
  - Each table is protected by **Row Level Security (RLS)** policies to ensure user data isolation, so that users can only access/update/delete their own data.
- **Realtime Broadcast**: Any create/update/delete triggers both a `postgres_changes` subscription and a broadcast message so all open clients show a toast notification.
- **Cron Jobs**: Scheduled jobs (via Supabase Cron) that scan upcoming reminders and dispatch notifications every second.
  > Note: If the window loses focus, or when you have a slow connection, the reminder notifications may not show up.
- **Postgres Triggers**: Database triggers that listen for changes in the `medication_reminders`, `appointment_reminders`, and `health_logs` tables, and send messages to the broadcast channel.
  - There is also a trigger on the `auth.users` table to create a corresponding `user_profiles` entry when a new user signs up.
- **AI Chatbot**: The chatbot uses the Google AI API to analyze user symptoms and provide health insights.

---

## Installation

1. Clone the repo

   ```bash
   git clone https://github.com/comp426-25s/final-project-team-16.git
   cd final-project-team-16
   ```

2. Install dependencies (Remember to use `--legacy-peer-deps` if you encounter issues with React versions being incompatible with Shadcn/ui)
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

  - Configure **Auth** settings in the Supabase dashboard
    - Enable email/password signups
    - Uncheck the confirmation email option for now
  - Create tables: `user_profiles`, `medication_reminders`, `appointment_reminders`, `health_logs`, `files`, and `user_notifications` and enable Realtime for all of them.
    - Set relationships between tables using Foreign Keys.
  - Add RLS policies for user isolation to the tables. All tables should have the following policies or similar:
    - `select`: `auth.uid() = user_profile_id`
    - `insert`: `auth.uid() = user_profile_id`
    - `update`: `auth.uid() = user_profile_id`
    - `delete`: `auth.uid() = user_profile_id`
  - Set up **Cron** jobs to run `send_reminders()` stored procedure daily/hourly or even every second.
    - To do so, you might need to enable the `pg_cron` extension in your Supabase project.
  - Create **Postgres Functions** to handle the logic for sending notifications and reminders
    - `send_reminders()`: Check for upcoming reminders and send notifications
    - `create_user_profile()`: Create a new user profile when a user signs up
  - Define **Database Triggers** to write to broadcast channels on insert/update/delete and to create a new user profile on signup
  - Set up **Storage** for file uploads. Create 2 buckets: `avatars` and `documents`

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
- 📊 Advanced analytics & reporting on health trends
- And more!

---

## Contributing

1. Fork & branch: `git checkout -b feature/awesome`
2. Develop something awesome
3. Install & format: `npm install && npm run format`
4. Commit & PR with description
5. Wait for review and merge

---

## Authors

A big thank you to our team members for their hard work and dedication:

- David Nguyen
- Erica Ocbu

---

## Video Demo

Check out our demo video showcasing the app's features and functionality: [Link to Demo Video](https://drive.google.com/file/d/1DKOIBnTep6rMrOBSRWPVhk2s8g8uIYef/view?usp=sharing)

<p align="center">
  <a href="https://drive.google.com/file/d/1DKOIBnTep6rMrOBSRWPVhk2s8g8uIYef/view?usp=sharing" target="_blank">
    <img src="docs/img/demo_thumbnail.png" alt="Demo Video Thumbnail" width="100%"/>
  </a>
</p>

---

## License

[MIT License](LICENSE) - Feel free to use, modify, and distribute this code as you wish. Contributions are welcome!

---

## Acknowledgements

Huge thanks to the 426 team for their support and guidance throughout the project!

---

Thank you for checking out SymptomSync! We hope it helps you manage your health and wellness effectively. If you have any questions or feedback, feel free to reach out! 💊
