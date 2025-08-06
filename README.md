# Task Vault Backend

A Node.js/Express backend for the Task Vault application with Supabase integration for authentication and database management.

## Features

- User authentication (signup, signin, signout)
- Task CRUD operations
- User-specific task management
- JWT-based authentication
- Rate limiting
- CORS support

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Supabase account and project

## Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Environment Variables

Copy the example environment file and fill in your Supabase credentials:

```bash
cp env.example .env
```

Edit `.env` with your Supabase project details:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Secret (for custom auth if needed)
JWT_SECRET=your_jwt_secret_key

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

### 3. Database Setup

Run these SQL commands in your Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);
```

### 4. Supabase Auth Setup

1. Go to your Supabase Dashboard
2. Navigate to Authentication → Settings
3. Enable Email auth
4. Configure your site URL (e.g., `http://localhost:3000` for development)
5. Set up any additional auth providers you want

### 5. Run the Server

Development mode:
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start on `http://localhost:3001`

## API Endpoints

### Authentication

- `POST /api/auth/signup` - User registration
- `POST /api/auth/signin` - User login
- `POST /api/auth/signout` - User logout
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh session

### Tasks

- `GET /api/tasks` - Get all tasks for user
- `GET /api/tasks/:id` - Get specific task
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `GET /api/tasks/status/:status` - Get tasks by status
- `GET /api/tasks/priority/:priority` - Get tasks by priority

## Authentication

The API uses Supabase Auth for user authentication. All task endpoints require authentication via Bearer token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Task Schema

```json
{
  "id": "uuid",
  "user_id": "uuid",
  "title": "string",
  "description": "string (optional)",
  "status": "pending|in_progress|completed|cancelled",
  "priority": "low|medium|high",
  "due_date": "ISO date string (optional)",
  "created_at": "ISO date string",
  "updated_at": "ISO date string"
}
```

## Error Handling

The API returns consistent error responses:

```json
{
  "error": "Error message",
  "message": "Additional details (development only)"
}
```

## Security Features

- Rate limiting (100 requests per 15 minutes per IP)
- CORS protection
- Input validation
- User-specific data isolation
- JWT token verification

## Development

To run tests:
```bash
npm test
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Configure proper CORS origins
3. Use environment variables for all sensitive data
4. Set up proper logging and monitoring
5. Consider using a process manager like PM2 