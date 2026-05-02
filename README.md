# audit.ijt

Audit.ijt is a comprehensive financial audit management web application designed for organizations. It streamlines the tracking of donors, managing monthly income and expenses, calculating balances with carry-forward logic, and generating professional PDF reports.

## Features

- **Donor Management (Muawineen):** Track individual contributors, their contact details, and committed contribution amounts.
- **Monthly Income Tracking:** Record donations categorized as "Amoomi" (Monthly) or "Khasoosi" (Special Purpose).
- **Expense Management:** Track organizational spending with customizable expense categories.
- **Financial Period Selection:** Easily switch between months to view historical data and manage the current session.
- **Summary Dashboard:** Real-time visibility into total income, expenses, and current balance.
- **Balance Carry-Forward:** Automatic calculation of starting balances based on the closing balance of the previous month.
- **PDF Report Generation:** Export detailed monthly financial reports for auditing and transparency.
- **Responsive Design:** Fully accessible on desktop and mobile devices.

## Tech Stack

- **Frontend:** React 19 (Vite, TypeScript)
- **Database & Auth:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS + shadcn/ui
- **Animations:** Motion (formerly Framer Motion)
- **PDF Export:** jsPDF + jspdf-autotable
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- **Node.js:** Version 18.0.0 or higher
- **Supabase Account:** A free or paid account at [supabase.com](https://supabase.com)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/audit-ijt.git
   cd audit-ijt
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

### Supabase Setup

1. **Create a New Project:** Log in to Supabase and create a new project.
2. **Database Schema:** Navigate to the SQL Editor in the Supabase dashboard and run the provided schema scripts to create tables for `muawineen`, `income_entries`, `expense_entries`, etc.
3. **API Keys:** Find your `SUPABASE_URL` and `SUPABASE_ANON_KEY` in the Project Settings -> API section.
4. **Disable Email Confirmation:** For the application to work correctly with initial users, go to **Authentication -> Providers -> Email** and toggle **"Confirm email"** to **OFF**. This allows users to sign up and log in immediately.

### Running Locally

To start the development server:
```bash
npm run dev
```
The app will be available at `http://localhost:3000`.

## Project Structure

```text
/src
├── /components  # Reusable UI components (shadcn/ui and shared)
├── /hooks       # Custom React hooks (e.g., auth, organization)
├── /lib         # Supabase client and shared utility functions
├── /pages       # Application views (Dashboard, Income, Expenses, etc.)
├── /types       # TypeScript interfaces and type definitions
└── /utils       # Helper functions for PDF, Session, and Summary calculations
```

## Key Concepts

- **Muawin:** A contributor or donor. Muawineen are the lifeblood of the organization's funding.
- **Amoomi vs Khasoosi:** 
  - **Amoomi:** General monthly contributions intended for standard operations.
  - **Khasoosi:** Special donations earmarked for a specific purpose (e.g., a specific project or event).
- **Session/Financial Year:** The app tracks data by month. Each month is considered a session where income and expenses are reconciled.
- **Balance Carry-forward:** The "Opening Balance" for any month is automatically fetched from the "Closing Balance" of the immediately preceding month, ensuring a continuous financial trail.

## Deployment

1. **Push your code** to a GitHub repository.
2. **Connect to Vercel:** Import your repository in [Vercel](https://vercel.com).
3. **Environment Variables:** During the build step, add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to the Vercel project settings.
4. **Deploy:** Click deploy. Vercel will automatically handle the build and provide a live URL.

## Database Schema

| Table | Description |
| :--- | :--- |
| `muawineen` | Stores donor profiles, commitment amounts, and status. |
| `income_entries` | Records every donation received (Amoomi or Khasoosi). |
| `expense_entries`| Records all organizational expenditures. |
| `expense_categories` | Defines categories like Rent, Utilities, Salaries, etc. |
| `monthly_summaries` | Stores calculated totals for each month to improve performance. |
| `organizations` | Multi-tenant support for different organizational branches. |

## Contributing

1. Fork the project.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

- **Email Rate Limit Exceeded:** If you get this error during login/signup, ensure "Confirm Email" is disabled in Supabase or use a different email for testing.
- **RLS Errors (Rows not showing):** Ensure that Row Level Security (RLS) policies are correctly configured in Supabase to allow authenticated users to read/write data for their organization.
- **Environment Variables not loading:** Double-check that your `.env.local` variables start with `NEXT_PUBLIC_` if you are using the provided Supabase client configuration.
