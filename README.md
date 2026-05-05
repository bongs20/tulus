# TULUS (Teknologi Usulan Layanan Sosial)

TULUS is a comprehensive web-based social welfare management system designed for Indonesian local government agencies (Dinas Sosial). It streamlines the process of registering, verifying, and distributing social aid to eligible citizens, while providing transparency and accountability through a public portal.

## Tech Stack

-   **Frontend:** Next.js 14 (App Router) + TypeScript
-   **Styling:** Tailwind CSS + shadcn/ui
-   **Database:** PostgreSQL (with SQLite for local development) + Prisma ORM
-   **Auth:** NextAuth.js (credentials provider)
-   **Realtime:** Pusher (WebSocket for live status updates)
-   **SMS:** Twilio API
-   **File Upload:** Uploadthing
-   **PDF Export:** @react-pdf/renderer
-   **Excel Export:** exceljs
-   **State Management:** Zustand
-   **Form Validation:** React Hook Form + Zod

## Getting Started

### Prerequisites

-   Node.js (v18 or later)
-   npm or yarn
-   PostgreSQL (optional, for production)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/tulus.git
    cd tulus
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Set up environment variables:**
    -   Copy the `.env.example` file to `.env`:
        ```bash
        cp .env.example .env
        ```
    -   Fill in the required values in the `.env` file. For local development with SQLite, you can leave `DATABASE_URL` as is. For production with PostgreSQL, update `DATABASE_URL` with your connection string.
    -   Generate a `NEXTAUTH_SECRET` using:
        ```bash
        openssl rand -base64 32
        ```
    -   For deployments behind a reverse proxy, set `NEXTAUTH_URL` to the public HTTPS URL exposed by the proxy, not the internal app address.
    -   Update the other service keys (Twilio, Pusher, Uploadthing) with your credentials.

4.  **Run database migrations and seeding:**
    -   This will set up your database schema (SQLite by default) and populate it with initial data.
    ```bash
    npx prisma migrate dev --name init
    npx prisma db seed
    ```

5.  **Run the development server:**
    ```bash
    npm run dev
    # or
    yarn dev
    ```
    Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Seed Data & Login Credentials

The database is seeded with the following user accounts:

-   **Administrator:**
    -   Username: `admin`
    -   Password: `Admin@12345`
-   **Kepala Bidang:**
    -   Username: `kepala`
    -   Password: `Kepala@12345`
-   **Petugas Verifikator:**
    -   Username: `verifikator1`
    -   Password: `Verifikator@123`

## Features

-   **Role-Based Access Control:** Differentiated dashboards and permissions for Administrators, Field Officers, and Managers.
-   **Multi-Step Data Entry:** An intuitive wizard for inputting new recipient data, including identity, economic status, and photo uploads.
-   **Automated DTKS Sync:** Mock DTKS synchronization on data entry to pre-validate recipients.
-   **Verification & Disbursement Workflow:** A seamless process from verification queue to aid distribution, with real-time status updates via UI and SMS notifications.
-   **Analytics & Reporting:** An advanced dashboard for managers with real-time charts and KPIs, plus exportable PDF and Excel reports.
-   **Public Transparency Portal:** A public-facing page for citizens to view a list of approved aid recipients, promoting trust and accountability.
-   **User Management:** An interface for administrators to manage user accounts.
-   **Security:** Includes encryption for sensitive data, API rate limiting, XSS protection, and comprehensive audit logging.
