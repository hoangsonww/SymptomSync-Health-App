# Getting Started

Welcome to the final project repository! This repository is mostly blank and does not include a Next.js project. You will be creating your project from scratch. This will help you become more familiar with how to set up Next.js projects yourself if you ever want to work on your own projects in the future.

Only one person needs to complete these steps and you can commit your code to GitHub. I recommend that your entire team works on this together so that everyone is aware of the steps.

## Creating your Next.js Project

First, you will want to create a brand-new Next.js project in this repository using the `create-next-app` utility from Next.js. Run the following in the terminal:

```bash
npx create-next-app@latest
```

You will be asked some setup questions. Use the following answers:

- *What is your project named?*  **web**
- *Would you like to use TypeScript?* **Yes**
- *Would you like to use ESLint?* **Yes**
- *Would you like to use TailwindCSS?* **Yes**
- *Would you like your code inside a `src/` directory?* **No**
- *Would you like to use App Router? (recommended)* **No**
- *Would you like to use Turbopack for `next dev`?* **Yes**
- *Would you like to customize the import alias (`@/*` by default)?* **No**

This will create a new directory `/web`, containing the newly initialized Next.js application.

To start your app to test it works, complete the following in the terminal:

```bash
cd web
npm install
npm run dev
```

You should delete the `/api` folder that is inside of the `/pages` directory.

## Installing Tools

There are a few tools that need to be installed, which include:

### React Query

To install React Query, check out the instructions in [a05: Pokedex](https://comp426-25s.github.io/assignments/a05-pokedex).

### Supabase JS Client

To follow the Supabase JS Client, follow the tutorial [here](https://supabase.com/docs/guides/auth/server-side/nextjs?queryGroups=router&router=pages). *Complete steps 1-3.*

### Shadcn UI

To install Shadcn UI, follow the instructions [here](https://ui.shadcn.com/docs/installation/next). This should also install Lucide icons. I recommend selecting the `New York` style with the `Zinc` color to start out with, but you are free to edit this or choose any options you would prefer for your project.

*To set up light mode / dark mode in Shadcn, follow their official guide [here](https://ui.shadcn.com/docs/dark-mode/next).
