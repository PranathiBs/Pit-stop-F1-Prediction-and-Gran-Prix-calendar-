# 🏎️ Pit Stop: F1 Prediction Platform

A high-performance, full-stack Formula 1 prediction application built with **Next.js 15**, **React 19**, and **Supabase**. Compete with fans worldwide, predict race outcomes, and climb the leaderboard with a sleek cyberpunk-inspired UI.

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?style=for-the-badge&logo=react)
![Supabase](https://img.shields.io/badge/Supabase-Database-green?style=for-the-badge&logo=supabase)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)

---

## 🚀 Features

- **Dynamic Race Calendar**: Stay updated with the latest F1 season schedule.
- **Podium Predictions**: Cast your votes for the top 3 finishers, fastest lap, and more.
- **Cyberpunk UI**: A stunning, responsive interface with neon glows, glassmorphism, and smooth animations.
- **Real-time Leaderboards**: Track your performance against other predictors globally.
- **Secure Authentication**: Built-in user management powered by Supabase Auth.
- **Mobile Responsive**: Perfect for making last-minute predictions on your phone.

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions)
- **Deployment**: Vercel
- **Icons**: Lucide React

---

## 📦 Getting Started

### 1. Clone the repository
```bash
git clone https://github.com/your-username/pit-stop.git
cd pit-stop
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Environment Variables
Create a `.env.local` file in the root directory and add your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🏁 Deployment

The easiest way to deploy this project is via [Vercel](https://vercel.com). Simply connect your GitHub repository and Vercel will handle the rest, including automatic builds on every push to the `master` branch.

---

## ✨ Developed by
**[Your Name]** – *F1 Enthusiast & Developer*

---

Licensed under the [MIT License](LICENSE).
