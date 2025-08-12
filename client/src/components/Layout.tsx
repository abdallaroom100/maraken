import { useState, useEffect } from 'react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import './Layout.css'

interface LayoutProps {
  children: ReactNode
  admin?: any
}

type MenuLists ={
  path:string,icon:string,label:string
}
const Layout = ({ children, admin }: LayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const { logout } = useAuth()
  
  // إغلاق القائمة عند تغيير حجم الشاشة
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // إغلاق القائمة عند النقر خارجها
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('sidebar')
      const toggleButton = document.querySelector('.mobile-menu-toggle')
      
      if (sidebar && toggleButton && isSidebarOpen) {
        if (!sidebar.contains(event.target as Node) && !toggleButton.contains(event.target as Node)) {
          setIsSidebarOpen(false)
        }
      }
    }

    if (isSidebarOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isSidebarOpen])

  let menuItems:MenuLists[] = [];
  if (admin?.role === 'manager') {
    menuItems = [
      { path: '/', icon: 'fas fa-home', label: 'لوحة التحكم' },
      { path: '/employees', icon: 'fas fa-user-plus', label: 'إضافة موظف' },
      { path: '/workers-list', icon: 'fas fa-users', label: 'قائمة الموظفين' },
      { path: '/operations-log', icon: 'fas fa-history', label: 'سجل العمليات' },
      { path: '/create-invoice', icon: 'fas fa-file-invoice', label: 'إنشاء فاتورة' },
      { path: '/invoices-list', icon: 'fas fa-list-alt', label: 'قائمة الفواتير' },
      // { path: '/expenses', icon: 'fas fa-wallet', label: 'المصروفات' },
      // { path: '/expenses-list', icon: 'fas fa-list-alt', label: 'سجل المصروفات' },
      // { path: '/revenues', icon: 'fas fa-coins', label: 'الإيرادات' },
      // { path: '/revenues-list', icon: 'fas fa-list', label: 'سجل الإيرادات' },
      // { path: '/budget', icon: 'fas fa-balance-scale', label: 'الميزانية' },
      // { path: '/reports', icon: 'fas fa-chart-line', label: 'التقارير' },
    ];
  } else if (admin?.role === 'moderator') {
    menuItems = [
      { path: '/expenses', icon: 'fas fa-wallet', label: 'المصروفات' },
      { path: '/expenses-list', icon: 'fas fa-list-alt', label: 'سجل المصروفات' },
      { path: '/revenues', icon: 'fas fa-coins', label: 'الإيرادات' },
      { path: '/revenues-list', icon: 'fas fa-list', label: 'سجل الإيرادات' },
      { path: '/create-invoice', icon: 'fas fa-file-invoice', label: 'إنشاء فاتورة' },
      { path: '/invoices-list', icon: 'fas fa-list-alt', label: 'قائمة الفواتير' },
      // { path: '/budget', icon: 'fas fa-balance-scale', label: 'الميزانية' },
      // { path: '/reports', icon: 'fas fa-chart-line', label: 'التقارير' },
      // { path: '/', icon: 'fas fa-home', label: 'لوحة التحكم' },
      // { path: '/employees', icon: 'fas fa-user-plus', label: 'إضافة موظف' },
      // { path: '/workers-list', icon: 'fas fa-users', label: 'قائمة الموظفين' },
    ];
  }

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

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case 'manager':
        return 'مدير النظام';
      case 'moderator':
        return 'مشرف';
      default:
        return role;
    }
  }

  return (
    <div className="layout">
      {/* زر القائمة للموبايل */}
      <button 
        className="mobile-menu-toggle"
        onClick={toggleSidebar}
        aria-label="فتح القائمة"
      >
        <i className="fas fa-bars"></i>
      </button>

      {/* Overlay للموبايل */}
      <div 
        className={`mobile-overlay ${isSidebarOpen ? 'active' : ''}`}
        onClick={closeSidebar}
      />

      {/* الشريط الجانبي الجديد */}
      <div className={`sidebar ${isSidebarOpen ? 'open' : ''}`} id="sidebar">
        {/* Header الجديد مع اللوجو */}
        <div className="sidebar-header">
          <div className="logo-container">
            <img 
              src="/img/maraken.jpg" 
              alt="مراكن الورد" 
              className="logo-image"
            />
            {/* <h1>مراكن الورد</h1> */}
                         {admin && (
               <div className="admin-info">
                 <div className="admin-field">
                   <span className="admin-label">الأسم:</span>
                   <span className="admin-value">{admin.name}</span>
                 </div>
                 <div className="admin-field">
                   <span className="admin-label">الدور:</span>
                   <span className="admin-value">{getRoleDisplayName(admin.role)}</span>
                 </div>
               </div>
             )}
          </div>
          
        </div>

        {/* قائمة التنقل الجديدة */}
        <ul className="nav-menu">
          {menuItems.map((item) => (
            <li key={item.path} className="nav-item">
              <NavLink 
                to={item.path}
                className={({ isActive }) => isActive ? 'nav-link active' : 'nav-link'}
                onClick={closeSidebar}
              >
                <i className={`${item.icon} nav-icon`}></i>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
          
          {/* زر تسجيل الخروج */}
          <li className="nav-item">
            <button 
              onClick={handleLogout}
              className="nav-link"
              style={{ 
                width: '100%', 
                background: '#c51c1c', 
                border: 'none',
                color:"white",
              
                cursor: 'pointer',
                fontFamily: 'inherit'
              }}
            >
              <i className="fas fa-sign-out-alt nav-icon" style={{color:'white'}}></i>
              <span>تسجيل الخروج</span>
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