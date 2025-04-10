# SymptomSync

> Developed by Caroline Bryan, Kathryn Brown, David Nguyen, and Erica Ocbu for COMP 426: Modern Web Programming at UNC-Chapel Hill.

![TypeScript](https://img.shields.io/badge/-TypeScript-05122A?style=flat&logo=typescript)
![Next.js](https://img.shields.io/badge/-Next.js-05122A?style=flat&logo=nextdotjs)
![Shadcn/ui](https://img.shields.io/badge/-Shadcn_UI-05122A?style=flat&logo=shadcnui)
![Tailwind](https://img.shields.io/badge/-Tailwind-05122A?style=flat&logo=tailwindcss)
![Supabase](https://img.shields.io/badge/-Supabase-05122A?style=flat&logo=supabase)

---

## DEVELOPMENT NOTES: (TO BE REMOVED BEFORE SUBMISSION)

To install the dependencies:

```bash
npm install --legacy-peer-deps
```

This is of utmost importance because the `@shadcn/ui` package has a peer dependency on `react@^18.0.0`, and the latest version of `react` is `18.2.0`. If you do not use the `--legacy-peer-deps` flag, you will get an error.

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

---

_Add some screenshots or graphics here that show your app being used!_

_Include a short description of your app here._

## Features

_Describe the features of your app here._

## ...

Feel free to add other sections as you see fit!
