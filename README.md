![VITADATA Logo](public/logo.png)

# VITADATA

VITADATA is a technology startup building modern healthcare software for hospitals, doctors, administrators, and patients. This web app is the front end for the platform, with flows for onboarding, authentication, hospital setup, and operational dashboards.

## What this project includes

- Landing page with role-based entry points
- Admin login, signup, and OTP verification flows
- Hospital setup flow
- Dashboard access protection
- SEO metadata and Open Graph tags

## Tech Stack

- Next.js App Router
- React
- Tailwind CSS
- Backend API integration via `NEXT_PUBLIC_URL`

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env.local` file and set your API base URL:

```bash
NEXT_PUBLIC_URL=http://localhost:5000
```

3. Start the development server:

```bash
npm run dev
```

4. Open the app:

```bash
http://localhost:3000
```

## Environment Variables

- `NEXT_PUBLIC_URL`: Base URL for the backend API

## Project Structure

- `src/app/page.js` - landing page
- `src/app/admin/page.js` - admin login
- `src/app/adminSignup/page.js` - admin signup
- `src/app/otpVerification/page.js` - OTP verification
- `src/app/hospitalSetup/page.js` - hospital creation
- `src/app/layout.js` - global layout and SEO metadata

## Notes

- The app uses `/logo.png` from the `public` folder for branding, icons, and social previews.
- Dashboard routes are protected using the app's route guard setup.
