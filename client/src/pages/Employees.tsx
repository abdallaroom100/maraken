import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './Employees.css'

const Employees = () => {
  const [formData, setFormData] = useState({
    name: '',
    job: '',
    basicSalary: '',
    identityNumber: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  // Create new worker
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/workers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          job: formData.job,
          basicSalary: Number(formData.basicSalary),
          identityNumber: formData.identityNumber
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Reset form
        setFormData({
          name: '',
          job: '',
          basicSalary: '',
          identityNumber: ''
        })
        alert('تم إضافة الموظف بنجاح')
        // Navigate to workers list
        navigate('/workers-list')
      } else {
        alert(data.message || 'خطأ في إضافة الموظف')
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    })
  }

  return (
    <>
      <h1 className="page-title">إضافة موظف جديد</h1>

      <div className="container">
        <div className="form-section">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">اسم الموظف</label>
              <input
                type="text"
                id="name"
                placeholder="أدخل اسم الموظف"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="job">الوظيفة</label>
              <input
                type="text"
                id="job"
                placeholder="أدخل الوظيفة"
                value={formData.job}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="basicSalary">الراتب الأساسي (ريال)</label>
              <input
                type="number"
                id="basicSalary"
                placeholder="0"
                min="0"
                value={formData.basicSalary}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="identityNumber">رقم الهوية</label>
              <input
                type="text"
                id="identityNumber"
                placeholder="أدخل رقم الهوية"
                value={formData.identityNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <button type="submit" className="add-btn" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الإضافة...' : 'إضافة موظف'}
            </button>
          </form>
        </div>
      </div>
    </>
  )
}

export default Employees 