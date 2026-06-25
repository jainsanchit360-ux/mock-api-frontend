# QuickMock API 🚀

A lightweight micro-SaaS tool designed for hackathons and rapid prototyping. Frontend developers can instantly paste raw JSON data, generate a unique hosted URL, and mock GET HTTP responses in real-time.

---

## 🛠️ Tech Stack
- **Frontend:** React (Vite) + Tailwind CSS v4 (Hacker-themed dark mode)
- **Backend:** Python (FastAPI) structured for Vercel Serverless Functions
- **Database:** Supabase (PostgreSQL)

---

## 💾 1. Database Schema Setup

Execute the following SQL commands in your **Supabase SQL Editor** to create the `mock_endpoints` table and configure RLS (Row Level Security) policies so anonymous clients can read/create mock endpoints safely:

```sql
-- 1. Create the mock_endpoints table
create table public.mock_endpoints (
  id uuid default gen_random_uuid() primary key,
  json_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Row Level Security (RLS)
alter table public.mock_endpoints enable row level security;

-- 3. Policy: Allow anyone (public anon key) to read mock endpoints by UUID
create policy "Allow public read access" 
on public.mock_endpoints for select 
using (true);

-- 4. Policy: Allow anyone (public anon key) to create new mock endpoints
create policy "Allow public insert access" 
on public.mock_endpoints for insert 
with check (true);
```

---

## ⚙️ 2. Environment Configuration

Create a `.env` file in the root of the project to store your Supabase credentials. A `.env.example` has been provided for guidance:

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_KEY=your-supabase-anon-key-or-service-role-key
```

---

## 🏃‍♂️ 3. How to Run Locally

### Step A: Start the FastAPI Backend
1. Initialize a Python virtual environment (recommended):
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the FastAPI development server:
   ```bash
   uvicorn api.index:app --reload --port 8000
   ```
   *The backend will be running at `http://127.0.0.1:8000`.*

### Step B: Start the Vite React Frontend
1. In a separate terminal, install the package dependencies:
   ```bash
   npm install
   ```
2. Launch the Vite development server:
   ```bash
   npm run dev
   ```
   *The frontend will run at `http://localhost:5173`. Vite will automatically proxy all `/api/*` requests to your local FastAPI server running on port 8000.*

---

## ⚡ 4. Testing Endpoints

Once you generate a mock endpoint (e.g. `http://localhost:5173/api/mock/b39cb68b-59d4-42f5-b3eb-2ee5bb14a7ff`), you can fetch it in your application code, test it in your browser, or call it via terminal:

```bash
curl -X GET http://localhost:5173/api/mock/b39cb68b-59d4-42f5-b3eb-2ee5bb14a7ff
```

---

## 🚀 5. Deploying to Vercel

This repository is optimized to deploy with zero-configuration on **Vercel**:
1. Push this code to a GitHub repository.
2. Link the repository to your Vercel Dashboard.
3. Configure your Environment Variables in the project settings on Vercel:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
4. Click **Deploy**. Vercel will automatically serve the static React frontend from Vite and route any `/api/*` paths to your Python serverless functions in `api/index.py`.
