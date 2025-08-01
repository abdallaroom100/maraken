import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuth } from './hooks/useAuth'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './pages/Login'
import Signup from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Employees from './pages/Employees'
import Expenses from './pages/Expenses'
import Revenues from './pages/Revenues'
import Budget from './pages/Budget'
import Reports from './pages/Reports'
import './App.css'

function App() {
  const { admin, loading, isAuthenticated } = useAuth()

  // إظهار loading أثناء التحقق من حالة تسجيل الدخول
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#004080',
        fontFamily: 'Tajawal, sans-serif'
      }}>
        جاري التحميل...
      </div>
    )
  }

  // إذا لم يكن هناك مدير مسجل، اعرض صفحة Login
  if (!isAuthenticated) {
    return (
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
        <Toaster position="top-center" />
      </Router>
    )
  }

  // إذا كان المدير مسجل، اعرض التطبيق الكامل
  return (
    <Router>
      <Routes>
        {/* Public Routes - إعادة توجيه للمدير المسجل */}
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/signup" element={<Navigate to="/" replace />} />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute admin={admin} loading={loading}>
            <Layout admin={admin}>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/employees" element={
          <ProtectedRoute admin={admin} loading={loading}>
            <Layout admin={admin}>
              <Employees />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/expenses" element={
          <ProtectedRoute admin={admin} loading={loading}>
            <Layout admin={admin}>
              <Expenses />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/revenues" element={
          <ProtectedRoute admin={admin} loading={loading}>
            <Layout admin={admin}>
              <Revenues />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/budget" element={
          <ProtectedRoute admin={admin} loading={loading}>
            <Layout admin={admin}>
              <Budget />
            </Layout>
          </ProtectedRoute>
        } />
        
        <Route path="/reports" element={
          <ProtectedRoute admin={admin} loading={loading}>
            <Layout admin={admin}>
              <Reports />
            </Layout>
          </ProtectedRoute>
        } />
        
        {/* Redirect to dashboard if route not found */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      <Toaster position="top-center" />
    </Router>
  )
}

export default App
