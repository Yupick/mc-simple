import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth.jsx';
import ProtectedRoute from './components/auth/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './components/layout/Dashboard';
import DashboardHome from './pages/DashboardHome';
import ServerPage from './pages/ServerPage';
import WorldsPage from './pages/WorldsPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardHome />} />
              <Route path="servidor" element={<ServerPage />} />
              <Route path="mundos" element={<WorldsPage />} />
              <Route path="plugins" element={<div className="text-text-primary">Plugins (Próximamente)</div>} />
              <Route path="backups" element={<div className="text-text-primary">Backups (Próximamente)</div>} />
              <Route path="configuracion" element={<div className="text-text-primary">Configuración (Próximamente)</div>} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
