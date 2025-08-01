import { useState, useEffect } from 'react'

export const useAuth = () => {
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  const verifyToken = async (token) => {
    try {
      const response = await fetch('http://localhost:8000/api/admin/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.admin
      }
      return null
    } catch (error) {
      console.error('Token verification error:', error)
      return null
    }
  }

  const checkAuth = async () => {
    // التحقق من وجود بيانات المدير في localStorage
    const adminData = localStorage.getItem('admin')
    if (adminData) {
      try {
        const parsedAdmin = JSON.parse(adminData)
        
        // التحقق من صحة الـ token مع الخادم
        if (parsedAdmin.token) {
          const verifiedAdmin = await verifyToken(parsedAdmin.token)
          if (verifiedAdmin) {
            setAdmin({ ...parsedAdmin, ...verifiedAdmin })
          } else {
            // الـ token غير صحيح، حذف البيانات
            localStorage.removeItem('admin')
            setAdmin(null)
          }
        } else {
          // لا يوجد token، حذف البيانات
          localStorage.removeItem('admin')
          setAdmin(null)
        }
      } catch (error) {
        console.error('Error parsing admin data:', error)
        localStorage.removeItem('admin')
        setAdmin(null)
      }
    } else {
      setAdmin(null)
    }
    setLoading(false)
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const login = (adminData) => {
    localStorage.setItem('admin', JSON.stringify(adminData))
    setAdmin(adminData)
  }

  const logout = () => {
    // حذف البيانات من localStorage أولاً
    localStorage.removeItem('admin')
    // تحديث الحالة
    setAdmin(null)
    // إعادة تحميل الصفحة للتأكد من تحديث حالة تسجيل الدخول
    setTimeout(() => {
      window.location.href = '/login'
    }, 100)
  }

  const getAdminId = () => {
    return admin?.id || admin?._id
  }

  const getToken = () => {
    // الحصول على الـ token من localStorage مباشرة
    try {
      const adminData = localStorage.getItem('admin')
      if (adminData) {
        const parsedAdmin = JSON.parse(adminData)
        return parsedAdmin.token
      }
    } catch (error) {
      console.error('Error getting token:', error)
    }
    return null
  }

  return {
    admin,
    loading,
    login,
    logout,
    getAdminId,
    getToken,
    isAuthenticated: !!admin,
    checkAuth
  }
} 