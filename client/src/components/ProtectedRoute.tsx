import { Navigate } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  admin?: any
  loading?: boolean
}

const ProtectedRoute = ({ children, admin, loading }: ProtectedRouteProps) => {
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#004080'
      }}>
        جاري التحميل...
      </div>
    )
  }

  if (!admin) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

export default ProtectedRoute 