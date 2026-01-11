# Smart Project Monitoring Tool - Frontend

AI-Powered Project Management and Abstract Review System Frontend

## Prerequisites

- Node.js (v16 or higher)
- Backend server running

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the frontend directory:

```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Start Development Server

```bash
npm run dev
```

The application will start on `http://localhost:5173`

## Features

### For Students:
- 📊 **Dashboard**: View all projects and submissions
- 🤖 **AI Abstract Reviewer**: Get instant AI feedback on abstracts
- 📝 **Project Management**: Create and manage projects
- 👥 **Group Management**: Create or join project groups
- 📤 **Submissions**: Submit project documents and abstracts
- 🔔 **Notifications**: Real-time updates on project status

### For Guides/Admins:
- 👨‍🏫 **Guide Dashboard**: View assigned projects
- ✍️ **Review System**: Review and rate student submissions
- 📊 **Excel Import**: Bulk import users, groups, and projects
- 📈 **Reports**: Generate comprehensive project reports
- 🔔 **Notifications**: Track student submissions and updates

## Project Structure

```
frontend/
├── src/
│   ├── components/        # Reusable components
│   │   ├── Navbar.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/            # Page components
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── Dashboard.tsx
│   │   ├── AIReviewer.tsx
│   │   ├── CreateProject.tsx
│   │   ├── ProjectDetails.tsx
│   │   ├── Notifications.tsx
│   │   └── ExcelImport.tsx
│   ├── services/         # API service functions
│   │   ├── authService.ts
│   │   ├── projectService.ts
│   │   ├── groupService.ts
│   │   ├── submissionService.ts
│   │   ├── reviewService.ts
│   │   ├── notificationService.ts
│   │   └── userService.ts
│   ├── store/            # State management
│   │   └── authStore.ts
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── config/           # Configuration
│   │   └── api.ts
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   ├── index.css         # Global styles
│   └── App.css           # App styles
├── public/
├── package.json
└── vite.config.ts
```

## Technologies Used

- **React 19** - UI library
- **TypeScript** - Type safety
- **React Router** - Routing
- **Axios** - HTTP client
- **Zustand** - State management
- **Vite** - Build tool

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Role-Based Access

The application implements role-based routing:

- **Students**: Access to projects, AI reviewer, create projects
- **Guides/Admins**: Access to assigned projects, reviews, Excel import

## Authentication

- JWT-based authentication
- Token stored in localStorage
- Automatic redirect on 401 errors
- Protected routes based on user role

## API Integration

All API calls go through a centralized Axios instance configured in `src/config/api.ts`:
- Automatically adds JWT token to requests
- Handles 401 errors (redirects to login)
- Base URL configurable via environment variables
