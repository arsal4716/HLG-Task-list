import { Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { AppLayout } from './layouts/AppLayout.jsx';
import { PageLoader } from './components/ui/Spinner.jsx';
import { ROLES } from './utils/constants.js';

// Auth pages (eager — small, first paint)
import Login from './pages/auth/Login.jsx';
import Register from './pages/auth/Register.jsx';
import ForgotPassword from './pages/auth/ForgotPassword.jsx';
import ResetPassword from './pages/auth/ResetPassword.jsx';

// App pages (lazy)
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Tasks = lazy(() => import('./pages/Tasks.jsx'));
const TaskDetail = lazy(() => import('./pages/TaskDetail.jsx'));
const KanbanBoard = lazy(() => import('./pages/KanbanBoard.jsx'));
const Calendar = lazy(() => import('./pages/Calendar.jsx'));
const Users = lazy(() => import('./pages/Users.jsx'));
const UserProfile = lazy(() => import('./pages/UserProfile.jsx'));
const Reports = lazy(() => import('./pages/Reports.jsx'));
const Performance = lazy(() => import('./pages/Performance.jsx'));
const Notifications = lazy(() => import('./pages/Notifications.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const NotFound = lazy(() => import('./pages/NotFound.jsx'));

const App = () => (
  <Suspense fallback={<PageLoader />}>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/tasks/:id" element={<TaskDetail />} />
        <Route path="/board" element={<KanbanBoard />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/profile" element={<Profile />} />

        <Route
          path="/users"
          element={
            <ProtectedRoute roles={[ROLES.OWNER, ROLES.MANAGER]}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route path="/users/:id" element={<UserProfile />} />
        <Route
          path="/reports"
          element={
            <ProtectedRoute roles={[ROLES.OWNER, ROLES.MANAGER]}>
              <Reports />
            </ProtectedRoute>
          }
        />
        <Route
          path="/performance"
          element={
            <ProtectedRoute roles={[ROLES.OWNER, ROLES.MANAGER]}>
              <Performance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute roles={[ROLES.OWNER]}>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  </Suspense>
);

export default App;
