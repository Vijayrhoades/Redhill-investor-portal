import { useState, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { User } from './types';

// Lazy loaded pages
const Login = lazy(() => import('./pages/Login'));
const InvestorDashboard = lazy(() => import('./pages/InvestorDashboard'));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center bg-redhill-gray">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-redhill-red"></div>
  </div>
);

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/me')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        setUser(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
    } catch (err) {
      console.error('Logout failed', err);
    }
    setUser(null);
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <BrowserRouter>
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to={user.role === 'investor' ? '/dashboard' : '/admin'} /> : <Login onLogin={setUser} />} 
          />
          
          <Route 
            path="/dashboard" 
            element={user?.role === 'investor' ? <InvestorDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />
          
          <Route 
            path="/project/:id" 
            element={user ? <ProjectDetail user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />

          <Route 
            path="/admin" 
            element={user && user.role !== 'investor' ? <AdminDashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
          />

          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
