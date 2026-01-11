import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Navbar } from './components/Navbar';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Dashboard } from './pages/Dashboard';
import { AIReviewer } from './pages/AIReviewer';
import { Notifications } from './pages/Notifications';
import { CreateProject } from './pages/CreateProject';
import { ProjectDetails } from './pages/ProjectDetails';
import { ExcelImport } from './pages/ExcelImport';
import { GuideReviewSubmission } from './pages/GuideReviewSubmission';
import { GuideDashboard } from './pages/GuideDashboard';
import './App.css';

// Role-based dashboard wrapper
const RoleDashboard = () => {
  const { user } = useAuthStore();
  return user?.role === 'Student' ? <Dashboard /> : <GuideDashboard />;
};

function App() {
  const { isAuthenticated, initAuth } = useAuthStore();

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <BrowserRouter>
      {isAuthenticated && <Navbar />}
      
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Login />
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? <Navigate to="/" replace /> : <Register />
          }
        />

        {/* Protected Routes - All Roles */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <RoleDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects/:projectId"
          element={
            <ProtectedRoute>
              <ProjectDetails />
            </ProtectedRoute>
          }
        />

        {/* Student Routes */}
        <Route
          path="/ai-reviewer"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <AIReviewer />
            </ProtectedRoute>
          }
        />

        <Route
          path="/create-project"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <CreateProject />
            </ProtectedRoute>
          }
        />

        <Route
          path="/projects"
          element={
            <ProtectedRoute allowedRoles={['Student']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Guide/Admin Routes */}
        <Route
          path="/excel-import"
          element={
            <ProtectedRoute allowedRoles={['Guide', 'Admin', 'Coordinator', 'HOD']}>
              <ExcelImport />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assigned-projects"
          element={
            <ProtectedRoute allowedRoles={['Guide', 'Admin', 'Coordinator', 'HOD']}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/review-submission/:submissionId"
          element={
            <ProtectedRoute allowedRoles={['Guide', 'Admin', 'Coordinator', 'HOD']}>
              <GuideReviewSubmission />
            </ProtectedRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
