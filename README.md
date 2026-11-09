# ABC Company - QA Inspection Portal

> **Quality Meets Precision** — Manufacturing Quality Assurance (QA) and Quality Control (QC) portal for modular inspection workflows, deployed form controls, and live lot verification.

---

## 📌 Overview

**ABC Company QA Inspection Portal** is a manufacturing quality management system designed for production floors, QA inspectors, and plant managers. It streamlines lot tracking, incoming raw material inspections, in-process assembly quality verification, subcontracting QA, and live lot sign-offs with print-ready single-page A4 inspection certificates.

---

## ✨ Features

- **Multi-Role Workspaces**:
  - **Inspector Workspace**: Rapid data entry, barcode/lot scanning, live verification, defect logging, and inspection sign-offs.
  - **Admin Panel**: Spec management, inspection history auditing, defect analytics, form creation/deployment, and user role management (`SUPER_ADMIN`, `ADMIN`, `USER`).
- **Inspection Modules**:
  - **Incoming Inspection**: Material receiving, supplier lot audits, dimension & defect checks.
  - **In-Process Inspection**: Step-by-step production line checkpoints and tolerance validation.
  - **Subcontracting & Custom Modules**: Dynamic modules tailored to vendor assembly workflows.
- **Form Editor Studio & Deployed Forms**: Visual builder and runner for production checklists, inspection criteria, and QA parameters.
- **Official Print Engine**: Specially calibrated CSS print styles for printing single A4 portrait inspection sheets without page overflow or styling distortion.
- **Database & Authentication**: Supabase integration with role-based access control, persistent inspection records, and offline-resilient local fallbacks.

---

## 🛠️ Tech Stack

- **Frontend**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
- **Bundler & Dev Server**: [Vite 6](https://vitejs.dev/) with `@tailwindcss/vite`
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons & Motion**: [Lucide React](https://lucide.dev/), [Motion](https://motion.dev/)
- **Backend / Database**: [Supabase](https://supabase.com/) (`@supabase/supabase-js`)
- **Notifications**: `react-hot-toast`

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20 or Node.js 22
- npm (Node Package Manager)

### Installation

1. Clone or download the repository:
   ```bash
   git clone https://github.com/tpgajasinghe-star/qa_inspection.git
   cd qa_inspection
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
   Provide your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the Vite dev server on port `3000` |
| `npm run build` | Builds the production bundle into `/dist` |
| `npm run preview` | Previews the production build locally |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`) |
| `npm run clean` | Removes build outputs (`dist/`) |

---

## 📄 License

Proprietary — ABC Company Private Limited. All rights reserved.
