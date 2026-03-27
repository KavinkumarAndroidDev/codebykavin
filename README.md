# CodeByKavin - Modern Digital Storefront

A high-performance, elite-designed personal app store and portfolio built with Next.js 14, Firebase, and Framer Motion. This platform showcases a curated collection of experimental applications and productivity tools with a server-less architecture and premium aesthetics.

## 🚀 Built With

*   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
*   **Aesthetics**: Vanilla CSS + Framer Motion (Glassmorphism & Micro-animations)
*   **Database**: [Firebase Cloud Firestore](https://firebase.google.com/products/firestore) (Real-time data fetching & mutations)
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Deployment**: [Netlify](https://www.netlify.com/) (Optimized for production builds)

## 🛠️ Getting Started

### Prerequisites

*   Node.js 18.x or later
*   npm or yarn

### Installation

1.  Clone the repository.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure environment variables:
    *   Rename `.env.example` to `.env.local`.
    *   Populate with your Firebase project credentials.
4.  Run the development server:
    ```bash
    npm run dev
    ```

## 📦 Project Structure

*   `src/app/`: Next.js App Router routes and pages.
*   `src/components/`: Reusable UI components (Navbar, Footer, StarRating).
*   `src/context/`: `AppContext.tsx` for global state management (Firebase data fetching).
*   `src/lib/`: `firebase.ts` for database and auth initialization.
*   `artifacts/`: Legacy data paths for Firestore synchronization.

## 🔥 Firebase Data Structure

The application dynamically pulls data from the following Firestore paths:

*   **Apps**: `artifacts/{projectId}/public/data/apps`
*   **Changelog**: `artifacts/{projectId}/public/data/apps/{appId}/changelog`
*   **Developer Info**: `artifacts/{projectId}/public/data/developer`
*   **User Ratings**: `artifacts/{projectId}/public/data/apps/{appId}/ratings`

## 💎 Production Deployment (Netlify)

When deploying to Netlify, ensure you add the following Environment Variables in the Netlify Dashboard:

*   `NEXT_PUBLIC_FIREBASE_API_KEY`
*   `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
*   `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
*   `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
*   `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
*   `NEXT_PUBLIC_FIREBASE_APP_ID`
*   `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

## 👤 Author

*   **Kavin** - *Main Developer & Creator* - [GitHub](https://github.com/KavinkumarAndroidDev)

---
*Built with passion and pixels.*
