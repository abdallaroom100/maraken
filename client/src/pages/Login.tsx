import { useState } from 'react'
import toast from 'react-hot-toast'
import './Login.css'

const Login = () => {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  })

  const validateForm = () => {
    const newErrors = { email: '', password: '' }
    let isValid = true

    // التحقق من البريد الإلكتروني
    if (!formData.email) {
      newErrors.email = 'البريد الإلكتروني مطلوب'
      isValid = false
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح'
      isValid = false
    }

    // التحقق من كلمة المرور
    if (!formData.password) {
      newErrors.password = 'كلمة المرور مطلوبة'
      isValid = false
    } else if (formData.password.length < 6) {
      newErrors.password = 'كلمة المرور يجب أن تكون 6 أحرف على الأقل'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch('http://localhost:8000/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'حدث خطأ في تسجيل الدخول')
      }

      // حفظ بيانات المدير في localStorage
      localStorage.setItem('admin', JSON.stringify({
        id: data._id,
        name: data.name,
        email: data.email,
        role: data.role,
        token: data.token
      }))

      toast.success(`مرحباً ${data.name}! تم تسجيل الدخول بنجاح`)
      
      // إعادة تحميل الصفحة لتحديث حالة تسجيل الدخول
      window.location.href = '/'
    } catch (error: any) {
      console.error('Login error:', error)
      toast.error(error.message || 'حدث خطأ في تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
    
    // مسح رسالة الخطأ عند الكتابة
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: ''
      })
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img 
            src="/img/15848176933.png" 
            alt="Logo" 
            className="login-logo"
          />
          <h1>تسجيل الدخول</h1>
          <p>مرحباً بك في نظام إدارة الأعمال</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="أدخل بريدك الإلكتروني"
              value={formData.email}
              onChange={handleInputChange}
              className={errors.email ? 'error' : ''}
              required
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="password">كلمة المرور</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="أدخل كلمة المرور"
              value={formData.password}
              onChange={handleInputChange}
              className={errors.password ? 'error' : ''}
              required
            />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button 
            type="submit" 
            className="login-btn"
            disabled={loading}
          >
            {loading ? 'جاري تسجيل الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <div className="login-footer">
   
        </div>
      </div>
    </div>
  )
}

export default Login 