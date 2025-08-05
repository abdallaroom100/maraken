import { useState, useEffect } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import './Employees.css'

interface Worker {
  _id: string
  name: string
  job: string
  basicSalary: number
  identityNumber: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Salary {
  _id: string
  workerId: string
  year: number
  month: number
  basicSalary: number
  absenceDays: number
  incentives: number
  deductions: number
  withdrawals: number
  finalSalary: number
  isPaid: boolean
  paymentDate?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

const WorkerEdit = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const workerFromState = location.state?.worker as Worker

  const [worker, setWorker] = useState<Worker | null>(workerFromState || null)
  const [loading, setLoading] = useState(!workerFromState)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Form data for worker update
  const [formData, setFormData] = useState({
    name: workerFromState?.name || '',
    job: workerFromState?.job || '',
    basicSalary: workerFromState?.basicSalary?.toString() || '',
    identityNumber: workerFromState?.identityNumber || ''
  })

  // Salary form data
  const [salaryForm, setSalaryForm] = useState({
    year: new Date().getFullYear(),
    month: new Date().getMonth() + 1,
    basicSalary: workerFromState?.basicSalary?.toString() || '',
    absenceDays: '0',
    incentives: '0',
    deductions: '0',
    withdrawals: '0',
    notes: ''
  })

  // Salary history
  const [salaryHistory, setSalaryHistory] = useState<Salary[]>([])
  const [loadingSalary, setLoadingSalary] = useState(false)

  // Generate years array (current year + 6 years ahead)
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 7 }, (_, i) => currentYear + i)

  // Months array
  const months = [
    { value: 1, label: 'يناير' },
    { value: 2, label: 'فبراير' },
    { value: 3, label: 'مارس' },
    { value: 4, label: 'أبريل' },
    { value: 5, label: 'مايو' },
    { value: 6, label: 'يونيو' },
    { value: 7, label: 'يوليو' },
    { value: 8, label: 'أغسطس' },
    { value: 9, label: 'سبتمبر' },
    { value: 10, label: 'أكتوبر' },
    { value: 11, label: 'نوفمبر' },
    { value: 12, label: 'ديسمبر' }
  ]

  // Fetch worker data if not provided
  useEffect(() => {
    if (!workerFromState && id) {
      fetchWorker()
    }
  }, [id, workerFromState])

  // Fetch salary history
  useEffect(() => {
    if (worker?._id) {
      fetchSalaryHistory()
    }
  }, [worker?._id])

  const fetchWorker = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/workers/${id}`)
      const data = await response.json()
      
      if (data.success) {
        setWorker(data.data)
        setFormData({
          name: data.data.name,
          job: data.data.job,
          basicSalary: data.data.basicSalary.toString(),
          identityNumber: data.data.identityNumber
        })
        setSalaryForm(prev => ({
          ...prev,
          basicSalary: data.data.basicSalary.toString()
        }))
      } else {
        setError(data.message || 'خطأ في جلب بيانات الموظف')
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  const fetchSalaryHistory = async () => {
    try {
      setLoadingSalary(true)
      const response = await fetch(`/api/workers/${worker?._id}/salary-history`)
      const data = await response.json()
      
      if (data.success) {
        setSalaryHistory(data.data)
      }
    } catch (err) {
      console.error('خطأ في جلب تاريخ الرواتب')
    } finally {
      setLoadingSalary(false)
    }
  }

  // Update worker
  const handleUpdateWorker = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch(`/api/workers/${id}`, {
        method: 'PUT',
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
        setWorker(data.data)
        alert('تم تحديث بيانات الموظف بنجاح')
      } else {
        alert(data.message || 'خطأ في تحديث بيانات الموظف')
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Create or update salary
  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/workers/salaries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workerId: worker?._id,
          year: Number(salaryForm.year),
          month: Number(salaryForm.month),
          basicSalary: Number(salaryForm.basicSalary),
          absenceDays: Number(salaryForm.absenceDays),
          incentives: Number(salaryForm.incentives),
          deductions: Number(salaryForm.deductions),
          withdrawals: Number(salaryForm.withdrawals),
          notes: salaryForm.notes
        })
      })

      const data = await response.json()
      
      if (data.success) {
        // Reset salary form
        setSalaryForm({
          year: new Date().getFullYear(),
          month: new Date().getMonth() + 1,
          basicSalary: worker?.basicSalary?.toString() || '',
          absenceDays: '0',
          incentives: '0',
          deductions: '0',
          withdrawals: '0',
          notes: ''
        })
        // Refresh salary history
        fetchSalaryHistory()
        alert('تم حفظ الراتب بنجاح')
      } else {
        alert(data.message || 'خطأ في حفظ الراتب')
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Pay salary
  const handlePaySalary = async (salaryId: string) => {
    if (!confirm('هل أنت متأكد من دفع هذا الراتب؟')) return

    try {
      const response = await fetch('/api/workers/salaries/pay', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salaryId,
          paymentMethod: 'cash',
          adminId: 'admin_id_here', // You might want to get this from context or props
          notes: 'تم الدفع من خلال النظام'
        })
      })

      const data = await response.json()
      
      if (data.success) {
        fetchSalaryHistory()
        alert('تم دفع الراتب بنجاح')
      } else {
        alert(data.message || 'خطأ في دفع الراتب')
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم')
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    })
  }

  const handleSalaryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setSalaryForm({
      ...salaryForm,
      [e.target.id]: e.target.value
    })
  }

  const getMonthName = (month: number) => {
    const monthObj = months.find(m => m.value === month)
    return monthObj ? monthObj.label : month.toString()
  }

  if (loading) {
    return <div className="loading">جاري التحميل...</div>
  }

  if (!worker) {
    return <div className="error-message">الموظف غير موجود</div>
  }

  return (
    <>
      <div className="header-actions">
        <button className="back-btn" onClick={() => navigate('/workers-list')}>
          ← العودة لقائمة الموظفين
        </button>
        <h1 className="page-title">تعديل بيانات الموظف</h1>
      </div>

      <div className="container">
        <div className="worker-info">
          <h2>معلومات الموظف</h2>
          <div className="info-grid">
            <div><strong>الاسم:</strong> {worker.name}</div>
            <div><strong>الوظيفة:</strong> {worker.job}</div>
            <div><strong>الراتب الأساسي:</strong> {worker.basicSalary.toLocaleString()} ريال</div>
            <div><strong>رقم الهوية:</strong> {worker.identityNumber}</div>
            <div><strong>تاريخ الإضافة:</strong> {new Date(worker.createdAt).toLocaleDateString('ar-SA')}</div>
          </div>
        </div>

        <div className="form-section">
          <h2>تحديث بيانات الموظف</h2>
          <form onSubmit={handleUpdateWorker}>
            <div className="form-group">
              <label htmlFor="name">اسم الموظف</label>
              <input
                type="text"
                id="name"
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
                value={formData.identityNumber}
                onChange={handleInputChange}
                required
              />
            </div>

            <button type="submit" className="update-btn" disabled={isSubmitting}>
              {isSubmitting ? 'جاري التحديث...' : 'تحديث البيانات'}
            </button>
          </form>
        </div>

        <div className="salary-section">
          <h2>إدارة الرواتب</h2>
          
          <form onSubmit={handleSalarySubmit} className="salary-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="year">السنة</label>
                <select
                  id="year"
                  value={salaryForm.year}
                  onChange={handleSalaryInputChange}
                  required
                >
                  {years.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label htmlFor="month">الشهر</label>
                <select
                  id="month"
                  value={salaryForm.month}
                  onChange={handleSalaryInputChange}
                  required
                >
                  {months.map(month => (
                    <option key={month.value} value={month.value}>{month.label}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="basicSalary">الراتب الأساسي (ريال)</label>
                <input
                  type="number"
                  id="basicSalary"
                  min="0"
                  value={salaryForm.basicSalary}
                  onChange={handleSalaryInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="absenceDays">أيام الغياب</label>
                <input
                  type="number"
                  id="absenceDays"
                  min="0"
                  max="31"
                  value={salaryForm.absenceDays}
                  onChange={handleSalaryInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="incentives">الحوافز (ريال)</label>
                <input
                  type="number"
                  id="incentives"
                  min="0"
                  value={salaryForm.incentives}
                  onChange={handleSalaryInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="deductions">الخصومات (ريال)</label>
                <input
                  type="number"
                  id="deductions"
                  min="0"
                  value={salaryForm.deductions}
                  onChange={handleSalaryInputChange}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="withdrawals">السحبيات (ريال)</label>
                <input
                  type="number"
                  id="withdrawals"
                  min="0"
                  value={salaryForm.withdrawals}
                  onChange={handleSalaryInputChange}
                />
              </div>
              <div className="form-group">
                <label htmlFor="notes">ملاحظات</label>
                <textarea
                  id="notes"
                  value={salaryForm.notes}
                  onChange={handleSalaryInputChange}
                  rows={3}
                  placeholder="أضف ملاحظات حول الراتب..."
                />
              </div>
            </div>

            <button type="submit" className="salary-btn" disabled={isSubmitting}>
              {isSubmitting ? 'جاري الحفظ...' : 'حفظ الراتب'}
            </button>
          </form>
        </div>

        <div className="salary-history">
          <h2>تاريخ الرواتب</h2>
          {loadingSalary ? (
            <div className="loading">جاري التحميل...</div>
          ) : salaryHistory.length === 0 ? (
            <div className="no-data">لا يوجد سجل رواتب</div>
          ) : (
            <div className="table-responsive">
              <table>
                <thead>
                  <tr>
                    <th>الشهر/السنة</th>
                    <th>الراتب الأساسي</th>
                    <th>أيام الغياب</th>
                    <th>الحوافز</th>
                    <th>الخصومات</th>
                    <th>السحبيات</th>
                    <th>الراتب النهائي</th>
                    <th>الحالة</th>
                    <th>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {salaryHistory.map((salary) => (
                    <tr key={salary._id}>
                      <td>{getMonthName(salary.month)} {salary.year}</td>
                      <td>{salary.basicSalary.toLocaleString()} ريال</td>
                      <td>{salary.absenceDays}</td>
                      <td>{salary.incentives.toLocaleString()} ريال</td>
                      <td>{salary.deductions.toLocaleString()} ريال</td>
                      <td>{salary.withdrawals.toLocaleString()} ريال</td>
                      <td>{salary.finalSalary.toLocaleString()} ريال</td>
                      <td>
                        <span className={`status ${salary.isPaid ? 'paid' : 'unpaid'}`}>
                          {salary.isPaid ? 'تم الدفع' : 'لم يتم الدفع'}
                        </span>
                      </td>
                      <td>
                        {!salary.isPaid && (
                          <button
                            className="pay-btn"
                            onClick={() => handlePaySalary(salary._id)}
                          >
                            دفع الراتب
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
export default WorkerEdit 
