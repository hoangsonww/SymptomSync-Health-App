# SymptomSync

> Developed by Caroline Bryan, Kathryn Brown, David Nguyen, and Erica Ocbu for COMP 426: Modern Web Programming at UNC-Chapel Hill.

![TypeScript](https://img.shields.io/badge/-TypeScript-05122A?style=flat&logo=typescript)
![Next.js](https://img.shields.io/badge/-Next.js-05122A?style=flat&logo=nextdotjs)
![Shadcn/ui](https://img.shields.io/badge/-Shadcn_UI-05122A?style=flat&logo=shadcnui)
![Tailwind](https://img.shields.io/badge/-Tailwind-05122A?style=flat&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/-Supabase-05122A?style=flat&logo=supabase)

**Supabase Features Used**

1. Authentication
2. Database
3. File Storage
4. Realtime (primarily `postgres_changes`)
5. Cron Jobs (to send meds & appts reminders to users)
6. Triggers

---

## DEVELOPMENT NOTES: (TO BE REMOVED BEFORE SUBMISSION)

### Getting Started

To install the dependencies:

```bash
npm install --legacy-peer-deps
```

This is of utmost importance because the `@shadcn/ui` package has a peer dependency on `react@^18.0.0`, and the latest version of `react` is `18.2.0`. If you do not use the `--legacy-peer-deps` flag, you will get an error.

Also, remember to create a `.env.local` file in the `web` directory of the project and add your Supabase URL and Anon Key. You can find these in our Supabase project settings.

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_GOOGLE_AI_API_KEY=your_google_ai_api_key
```

> Note: Get the Google AI API key from [https://aistudio.google.com/prompts/new_chat](https://aistudio.google.com/prompts/new_chat) and create a new project. You can find the API key in the project settings.

> For now, instead of the regular chat feature, I'm just introducing a simple chatbot for users to ask about their health.

### Next Issues

If you run into some issues during development, e.g. reloading and it is showing a blank page, try running the following command:

```bash
rm -rf .next
```

This will remove the `.next` folder and force Next.js to rebuild the project.

Then, run the development server again:

```bash
npm run dev
```

### Test User Credentials

Email: newemail@example.com1
Password: 09112004@

### Code Formatting with Prettier

I also added a `format` script in `package.json` for you to easily run to format the entire
project according to the Prettier configuration. You can run it with:

```bash
npm run format
```

This is recommended to be run before committing your changes to ensure that the code is formatted consistently.

---

_Add some screenshots or graphics here that show your app being used!_

_Include a short description of your app here._

## Features

_Describe the features of your app here._

## ...

Feel free to add other sections as you see fit!
