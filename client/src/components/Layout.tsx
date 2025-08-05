import { useState } from 'react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
  admin?: any
}

const Layout = ({ children, admin }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { logout } = useAuth()

  const menuItems = [
    { path: '/', icon: 'fas fa-home', label: 'لوحة التحكم' },
    { path: '/employees', icon: 'fas fa-user-plus', label: 'إضافة موظف' },
    { path: '/workers-list', icon: 'fas fa-users', label: 'قائمة الموظفين' },
    { path: '/expenses', icon: 'fas fa-wallet', label: 'المصروفات' },
    { path: '/revenues', icon: 'fas fa-coins', label: 'الإيرادات' },
    { path: '/budget', icon: 'fas fa-balance-scale', label: 'الميزانية' },
    { path: '/reports', icon: 'fas fa-chart-line', label: 'التقارير' },
  ]

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const handleLogout = () => {
    logout()
    // لا حاجة لـ navigate لأن logout function تعيد التوجيه تلقائياً
  }

  return (
    <div className="layout">
      {/* زر القائمة للموبايل */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleSidebar}
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* الشريط الجانبي */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`} id="sidebar">
        <ul>
          <li className="logo-item">
            <img 
              src="/img/15848176933.png" 
              alt="Logo" 
              style={{ width: '90px', borderRadius: '50%', border: '#1a1a1a 2px solid' }}
            />
            <h3>مراكن الورد</h3>
            {admin && (
              <p style={{ fontSize: '12px', color: '#aad4ff', marginTop: '5px' }}>
                {admin.name}
              </p>
            )}
          </li>
          
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path}
                className={({ isActive }) => isActive ? 'menu-link active' : 'menu-link'}
                style={{ textDecoration: 'none', color: 'inherit' }}
                onClick={closeSidebar}
              >
                <div className="menu-item-content">
                  <i className={item.icon}></i>
                  <span>{item.label}</span>
                </div>
              </NavLink>
            </li>
          ))}
          
         

          {/* زر تسجيل الخروج */}
          <li className='!mt-0'>
            <button 
              onClick={handleLogout}
              className="menu-link"
              style={{ 
                width: '100%', 
                background: 'none', 
                border: 'none', 
                textAlign: 'right',
                cursor: 'pointer'
              }}
            >
              <div className="menu-item-content">
                <i className="fas fa-sign-out-alt"></i>
                <span>تسجيل الخروج</span>
              </div>
            </button>
          </li>
        </ul>
      </div>

      {/* المحتوى الرئيسي */}
      <div className="main-content">
        <div className="content-wrapper">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Layout 