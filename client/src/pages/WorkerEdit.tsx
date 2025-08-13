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
  console.log(error)
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
  const [currentSalary, setCurrentSalary] = useState<Salary | null>(null)

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

  // Load salary data when year/month changes
  useEffect(() => {
    console.log('useEffect triggered - worker:', worker?._id, 'year:', salaryForm.year, 'month:', salaryForm.month)
    if (worker?._id && salaryForm.year && salaryForm.month) {
      loadSalaryData(salaryForm.year, salaryForm.month)
    }
  }, [worker?._id, salaryForm.year, salaryForm.month])

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
      
      console.log('Salary history response:', data)
      
      if (data.success) {
        setSalaryHistory(data.data)
      }
    } catch (err) {
      console.error('خطأ في جلب تاريخ الرواتب')
    } finally {
      setLoadingSalary(false)
    }
  }

  const loadSalaryData = async (year: number, month: number) => {
    try {
      // Use a simpler approach - get all salaries for this worker and filter
      const response = await fetch(`/api/workers/${worker?._id}/salary-history`)
      const data = await response.json()
      
      console.log('All salary history:', data)
      
      if (data.success && data.data) {
        // Find the salary for this specific year and month
        const salary = data.data.find((s: any) => 
          Number(s.year) === Number(year) && Number(s.month) === Number(month)
        )
        
        console.log('Looking for salary with year:', year, 'month:', month)
        console.log('Available salaries:', data.data.map((s: any) => ({ year: s.year, month: s.month, isPaid: s.isPaid })))
        console.log('Found salary:', salary)
        
        if (salary) {
          // Salary exists - load it for editing
          setCurrentSalary(salary)
          setSalaryForm({
            year: salary.year,
            month: salary.month,
            basicSalary: salary.basicSalary.toString(),
            absenceDays: salary.absenceDays.toString(),
            incentives: salary.incentives.toString(),
            deductions: salary.deductions.toString(),
            withdrawals: salary.withdrawals.toString(),
            notes: salary.notes || ''
          })
        } else {
          // No salary exists for this month - create new form
          setCurrentSalary(null)
          setSalaryForm(prev => ({
            ...prev,
            year: year,
            month: month,
            basicSalary: worker?.basicSalary?.toString() || '',
            absenceDays: '0',
            incentives: '0',
            deductions: '0',
            withdrawals: '0',
            notes: ''
          }))
        }
      } else {
        // No salary exists for this month - create new form
        setCurrentSalary(null)
        setSalaryForm(prev => ({
          ...prev,
          year: year,
          month: month,
          basicSalary: worker?.basicSalary?.toString() || '',
          absenceDays: '0',
          incentives: '0',
          deductions: '0',
          withdrawals: '0',
          notes: ''
        }))
      }
    } catch (err) {
      console.error('خطأ في جلب بيانات الراتب:', err)
      setCurrentSalary(null)
      setSalaryForm(prev => ({
        ...prev,
        year: year,
        month: month,
        basicSalary: worker?.basicSalary?.toString() || '',
        absenceDays: '0',
        incentives: '0',
        deductions: '0',
        withdrawals: '0',
        notes: ''
      }))
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

  // Create or update salary with payment
  const handleSalarySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      // Calculate final salary
      const basicSalary = Number(salaryForm.basicSalary)
      const absenceDays = Number(salaryForm.absenceDays)
      const incentives = Number(salaryForm.incentives)
      const deductions = Number(salaryForm.deductions)
      const withdrawals = Number(salaryForm.withdrawals)
      
      // Calculate daily salary (assuming 30 days per month)
      const dailySalary = basicSalary / 30
      const absenceDeduction = absenceDays * dailySalary
      
      const finalSalary = basicSalary - absenceDeduction + incentives - deductions - withdrawals
  console.log(finalSalary)
      const salaryData = {
        workerId: worker?._id,
        year: salaryForm.year,
        month: salaryForm.month,
        basicSalary: basicSalary,
        absenceDays: absenceDays,
        incentives: incentives,
        deductions: deductions,
        withdrawals: withdrawals,
        notes: salaryForm.notes
      }

      let response
      if (currentSalary) {
        // Update existing salary
        response = await fetch(`/api/workers/salaries/${currentSalary._id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(salaryData)
        })
      } else {
        // Create new salary
        response = await fetch('/api/workers/salaries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(salaryData)
        })
      }

      const data = await response.json()
      
      if (data.success) {
        // After creating/updating salary, mark it as paid
        if (currentSalary) {
          // Update payment status
          await fetch(`/api/workers/salaries/${currentSalary._id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...salaryData,
              isPaid: true,
              paymentDate: new Date().toISOString()
            })
          })
        } else {
          // For new salary, create payment record
          await fetch('/api/workers/salaries/pay', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              salaryId: data.data._id,
              paymentMethod: 'cash',
              notes: 'تم الدفع من خلال النظام'
            })
          })
        }
        
        alert(currentSalary ? 'تم تحديث الراتب ودفعه بنجاح' : 'تم حفظ الراتب ودفعه بنجاح')
        fetchSalaryHistory()
        loadSalaryData(salaryForm.year, salaryForm.month)
      } else {
        alert(data.message || 'خطأ في حفظ الراتب')
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Update salary data only (without payment)
  const handleUpdateSalaryData = async () => {
    setIsSubmitting(true)
    
    try {
      const salaryData = {
        basicSalary: Number(salaryForm.basicSalary),
        absenceDays: Number(salaryForm.absenceDays),
        incentives: Number(salaryForm.incentives),
        deductions: Number(salaryForm.deductions),
        withdrawals: Number(salaryForm.withdrawals),
        notes: salaryForm.notes
      }

      const response = await fetch(`/api/workers/salaries/${currentSalary?._id}/data`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(salaryData)
      })

      const data = await response.json()
      
      if (data.success) {
        alert('تم تحديث بيانات الراتب بنجاح')
        fetchSalaryHistory()
        loadSalaryData(salaryForm.year, salaryForm.month)
      } else {
        alert(data.message || 'خطأ في تحديث بيانات الراتب')
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mark salary as paid
  const handleMarkAsPaid = async () => {
    if (!currentSalary) return
    
    if (!confirm('هل أنت متأكد من دفع هذا الراتب؟')) return

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/workers/salaries/mark-paid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salaryId: currentSalary._id,
          paymentMethod: 'cash',
          notes: 'دفع من خلال النظام',
          adminId: null
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('تم دفع الراتب بنجاح')
        fetchSalaryHistory()
        loadSalaryData(salaryForm.year, salaryForm.month)
      } else {
        alert(data.message || 'خطأ في دفع الراتب')
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Cancel payment
  const handleCancelPayment = async () => {
    if (!currentSalary) return
    
    if (!confirm('هل أنت متأكد من إلغاء دفع هذا الراتب؟')) return

    try {
      setIsSubmitting(true)
      const response = await fetch('/api/workers/salaries/mark-unpaid', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          salaryId: currentSalary._id
        })
      })

      const data = await response.json()
      
      if (data.success) {
        alert('تم إلغاء دفع الراتب بنجاح')
        fetchSalaryHistory()
        loadSalaryData(salaryForm.year, salaryForm.month)
      } else {
        alert(data.message || 'خطأ في إلغاء دفع الراتب')
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم')
    } finally {
      setIsSubmitting(false)
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
    console.log(month)
    const monthObj = months.find(m => m.value == month)
    return monthObj ? monthObj.label : month.toString()
  }

  if (loading) {
    return (
      <div className="!min-h-screen !flex !items-center !justify-center !bg-gray-50">
        <div className="!flex !flex-col !items-center !space-y-4">
          <div className="!animate-spin !rounded-full !h-12 !w-12 !border-b-2 !border-blue-600"></div>
          <p className="!text-gray-600 !font-medium">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  if (!worker) {
    return (
      <div className="!min-h-screen !flex !items-center !justify-center !bg-gray-50">
        <div className="!bg-white !rounded-lg !shadow-lg !p-8 !text-center">
          <p className="!text-red-600 !text-xl !font-bold">الموظف غير موجود</p>
          <button 
            onClick={() => navigate('/workers-list')}
            className="!mt-4 !px-6 !py-2 !bg-blue-600 !text-white !rounded-lg !hover:bg-blue-700 !transition-colors"
          >
            العودة للقائمة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="container !min-h-screen !bg-gradient-to-br !from-gray-50 !to-blue-50 !py-6">
      {/* Header */}
      <div className="!max-w-7xl !mx-auto !px-4 !mb-8">
        <div className="!bg-white !rounded-xl !shadow-lg !p-6">
          <div className="!flex !items-center !justify-between !flex-wrap !gap-4">
            <button 
              className="!flex !items-center !gap-2 !px-4 !py-2 !bg-gray-100 !w-fit !rounded-lg  !hover:bg-gray-200 !transition-all !duration-300 !hover:shadow-md"
              onClick={() => navigate('/workers-list')}
            >
              <span className="!text-lg">←</span>
              العودة لقائمة الموظفين
            </button>
            <h1 className="page-title !text-2xl !font-bold !text-gray-800 !bg-gradient-to-r !from-blue-600 !to-purple-600 !bg-clip-text !text-transparent">
              تعديل بيانات الموظف
            </h1>
          </div>
        </div>
      </div>

      <div className="!max-w-7xl !mx-auto md:!px-4 !space-y-8">
      
        {/* تحديث بيانات الموظف */}
        <div className="form-section !bg-white !rounded-xl !shadow-lg !overflow-hidden">
          <div className="!bg-gradient-to-r !from-green-600 !to-teal-600 !px-6 !py-4">
            <h2 className="!text-xl !font-bold !text-white">تحديث بيانات الموظف</h2>
          </div>
          <div className="md:!p-6">
            <form onSubmit={handleUpdateWorker} className="!space-y-6 ">
             <div className='flex flex-col '>
             <div className="form-row !grid !grid-cols-1 !md:grid-cols-2 !gap-6">
                <div className="form-group !space-y-2">
                  <label htmlFor="name" className="!block !text-sm !font-medium !text-gray-700">اسم الموظف</label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="!w-full !px-4 !py-3 !border !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-blue-500 !focus:border-transparent !transition-all !duration-300"
                    required
                  />
                </div>
                <div className="form-group !space-y-2 min-w-[210px]">
                  <label htmlFor="job" className="!block !text-sm !font-medium !text-gray-700">الوظيفة</label>
                  <input
                    type="text"
                    id="job"
                    value={formData.job}
                    onChange={handleInputChange}
                    className="!w-full !px-4 !py-3 !border !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-blue-500 !focus:border-transparent !transition-all !duration-300"
                    required
                  />
                </div>
                <div className="form-group !space-y-2 min-w-[210px]">
                  <label htmlFor="basicSalary" className="!block !text-sm !font-medium !text-gray-700">الراتب الأساسي (ريال)</label>
                  <input
                    type="number"
                    id="basicSalary"
                    min="0"
                    value={formData.basicSalary}
                    onChange={handleInputChange}
                    className="!w-full !px-4 !py-3 !border !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-blue-500 !focus:border-transparent !transition-all !duration-300"
                    required
                  />
                </div>
                <div className="form-group !space-y-2 w-full sm:w-auto sm:!min-w-[210px]">
                  <label htmlFor="identityNumber" className="!block !text-sm !font-medium !text-gray-700">رقم الهوية</label>
                  <input
                    type="text"
                    id="identityNumber"
                    value={formData.identityNumber}
                    onChange={handleInputChange}
                    className="!w-full !px-4 !py-3 !border !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-blue-500 !focus:border-transparent !transition-all !duration-300"
                    required
                  />
                </div>
              </div>
              <div className='flex justify-center items-center'>
              <button 
                type="submit" 
                disabled={isSubmitting}
                style={{maxWidth: '300px', margin: 'auto',background:"linear-gradient(135deg, #a1b1a7 0%, #3a4f41 100%)"}}
                className="update-btn !w-full !md:w-auto !px-8 !py-3 max-w-[400px] mx-auto text-center flex justify-center  !bg-gradient-to-r !from-green-600 !to-teal-600 !text-white !font-semibold !rounded-lg !hover:from-green-700 !hover:to-teal-700 !disabled:opacity-50 !disabled:cursor-not-allowed !transition-all !duration-300 !transform !hover:scale-105"
              >
                {isSubmitting ? 'جاري التحديث...' : 'تحديث البيانات'}
              </button>
              </div>
             </div>

            </form>
          </div>
        </div>

        {/* إدارة الرواتب */}
        <div className="salary-section !bg-white !rounded-xl !shadow-lg !overflow-hidden">
          <div className="!bg-gradient-to-r !from-purple-600 !to-pink-600 !px-6 !py-4">
            <h2 className="!text-xl !font-bold !text-white">إدارة الرواتب</h2>
          </div>
          <div className="sm:!p-6">
            {/* حالة الراتب الحالية */}
            <div className="!mb-6 !p-4 !bg-gradient-to-r !from-blue-50 !to-indigo-50 !rounded-xl !border !border-blue-200">
              <div className="!flex !items-center !justify-between !flex-wrap !gap-4">
                <span className="!text-sm !font-medium !text-gray-700">
                  حالة الراتب: {getMonthName(salaryForm.month)} {salaryForm.year}
                </span>
                <span className={`!inline-flex !px-4 !py-2 !text-sm !font-semibold !rounded-full !transition-all !duration-300 ${
                  currentSalary?.isPaid 
                    ? '!bg-green-100 !text-green-800 !border !border-green-200' 
                    : '!bg-red-100 !text-red-800 !border !border-red-200'
                }`}>
                  {currentSalary?.isPaid ? '✅ تم الدفع' : '❌ لم يتم الدفع'}
                </span>
              </div>
            </div>
            
            <form onSubmit={handleSalarySubmit} className="salary-form !p-0 md:!p-4 sm:!space-y-6 !flex flex-col">
              <div className="form-row container mx-auto w-full !flex flex-wrap !gap-6  items-center">
              <div className="form-group !space-y-2 w-full sm:w-auto sm:!min-w-[210px]">
                  <label htmlFor="month" className="!block !text-sm !font-medium !text-gray-700">الشهر</label>
                  <select
                    id="month"
                    value={salaryForm.month}
                    onChange={handleSalaryInputChange}
                    className="!w-full !px-4 !py-3 !border !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-purple-500 !focus:border-transparent !transition-all !duration-300"
                    required
                  >
                    {months.map(month => (
                      <option key={month.value} value={month.value}>{month.label}</option>
                    ))}
                  </select>
                </div>

 
                <div className="form-group !space-y-2 w-full sm:w-auto sm:!min-w-[210px]">
    <label htmlFor="year" className="!block !text-sm !font-medium !text-gray-700">السنة</label>
    <select
      id="year"
      value={salaryForm.year}
      onChange={handleSalaryInputChange}
      className="!w-full !px-4 !py-3 !border !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-purple-500 !focus:border-transparent !transition-all !duration-300"
      required
    >
      {years.map(year => (
        <option key={year} value={year}>{year}</option>
      ))}
    </select>
  </div>
  <div className="form-group !space-y-2 w-full sm:w-auto sm:!min-w-[210px]">
                  <label htmlFor="basicSalary" className="!block !text-sm !font-medium !text-gray-700">الراتب الأساسي (ريال)</label>
                  <input
                    type="number"
                    id="basicSalary"
                    min="0"
                    value={salaryForm.basicSalary}
                    onChange={handleSalaryInputChange}
                    className="!w-full !px-4 !py-3 !border !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-purple-500 !focus:border-transparent !transition-all !duration-300"
                    required
                  />
                </div>
                <div className="form-group !space-y-2 w-full sm:w-auto sm:!min-w-[210px]">
                  <label htmlFor="absenceDays" className="!block !text-sm !font-medium !text-gray-700">أيام الغياب</label>
                  <input
                    type="number"
                    id="absenceDays"
                    min="0"
                    max="31"
                    value={salaryForm.absenceDays}
                    onChange={handleSalaryInputChange}
                    className="!w-full !px-4 !py-3 !border !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-purple-500 !focus:border-transparent !transition-all !duration-300"
                  />
                </div>
                <div className="form-group !space-y-2 w-full sm:w-auto sm:!min-w-[210px]">
                  <label htmlFor="incentives" className="!block !text-sm !font-medium !text-gray-700">الحوافز (ريال)</label>
                  <input
                    type="number"
                    id="incentives"
                    min="0"
                    value={salaryForm.incentives}
                    onChange={handleSalaryInputChange}
                    className="!w-full !px-4 !py-3 !border !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-purple-500 !focus:border-transparent !transition-all !duration-300"
                  />
                </div>
                <div className="form-group !space-y-2 w-full sm:w-auto sm:!min-w-[210px]">
                  <label htmlFor="deductions" className="!block !text-sm !font-medium !text-gray-700">الخصومات (ريال)</label>
                  <input
                    type="number"
                    id="deductions"
                    min="0"
                    value={salaryForm.deductions}
                    onChange={handleSalaryInputChange}
                    className="!w-full !px-4 !py-3 !border !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-purple-500 !focus:border-transparent !transition-all !duration-300"
                  />
                </div>
                <div className="form-group !space-y-2 w-full sm:w-auto sm:!min-w-[210px]">
                  <label htmlFor="withdrawals" className="!block !text-sm !font-medium !text-gray-700">السحبيات (ريال)</label>
                  <input
                    type="number"
                    id="withdrawals"
                    min="0"
                    value={salaryForm.withdrawals}
                    onChange={handleSalaryInputChange}
                    className="!w-full !px-4 !py-3 !border !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-purple-500 !focus:border-transparent !transition-all !duration-300"
                  />
                </div>
                <div className="form-group !space-y-2 !md:col-span-2 w-full !lg:col-span-1 lg:min-w-[450px]">
                  <label htmlFor="notes" className="!block !text-sm !font-medium !text-gray-700">ملاحظات</label>
                  <textarea
                    id="notes"
                    value={salaryForm.notes}
                    onChange={handleSalaryInputChange}
                    rows={3}
                    placeholder="أضف ملاحظات حول الراتب..."
                    className="!w-full !px-4 !py-3 !border !border-gray-300 !rounded-lg !focus:ring-2 !focus:ring-purple-500 !focus:border-transparent !transition-all !duration-300 !resize-none"
                  />
                </div>
        

              </div>
              
              {/* أزرار الإجراءات */}
              <div  className="salary-buttons !flex !flex-wrap !gap-4 !pt-6 !border-t !border-gray-200 !justify-center !items-center">
                {/* زر تحديث البيانات */}

                {/* زر دفع الراتب أو إلغاء الدفع */}
                <div  className='!flex justify-center items-center !gap-4'>
                <button 
                  type="button" 
                  onClick={handleUpdateSalaryData}
                  title='تحديث البيانات'
                  disabled={isSubmitting || !currentSalary}
                  className="salary-btn bg-blue-600 !flex-1 !min-w-0 !px-6 !py-3 text-nowrap !text-white !font-semibold !rounded-lg !disabled:opacity-50 !disabled:cursor-not-allowed !transition-all !duration-300 !transform !hover:scale-105 !shadow-lg"
                >
                  {isSubmitting ? 'جاري التحديث...' : 'تحديث البيانات'}
                </button>
                {currentSalary?.isPaid ? (
                  <button 
                    type="button" 
                    onClick={handleCancelPayment}
                    disabled={isSubmitting}
                    className="salary-btn bg-red-600 !flex-1 !min-w-0 !px-6 !py-3 !text-white !font-semibold !rounded-lg !disabled:opacity-50 !disabled:cursor-not-allowed !transition-all !duration-300 !transform !hover:scale-105 !shadow-lg"
                  >
                    {isSubmitting ? 'جاري الإلغاء...' : '❌ إلغاء الدفع'}
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={handleMarkAsPaid}
                    disabled={isSubmitting || !currentSalary}
                    className="salary-btn bg-green-600 !flex-1 !min-w-0 !px-6 !py-3 !text-white !font-semibold !rounded-lg !disabled:opacity-50 !disabled:cursor-not-allowed !transition-all !duration-300 !transform !hover:scale-105 !shadow-lg"
                  >
                    {isSubmitting ? 'جاري الدفع...' : '✅ دفع الراتب'}
                  </button>
                )}

                {/* زر الحفظ والدفع (للرواتب الجديدة) */}
                {!currentSalary && (
                  <button 
                    type="button" 
                    onClick={handleSalarySubmit}
                    disabled={isSubmitting}
                    className="salary-btn bg-purple-600 !flex-1 !min-w-0 !px-6 !py-3 !text-white !font-semibold !rounded-lg !disabled:opacity-50 !disabled:cursor-not-allowed !transition-all !duration-300 !transform !hover:scale-105 !shadow-lg"
                  >
                    {isSubmitting ? 'جاري الحفظ...' : '💾 حفظ ودفع الراتب'}
                  </button>
                )}
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* تاريخ الرواتب */}
        <div className="!bg-white !rounded-xl !shadow-lg !overflow-hidden">
          <div className="!bg-gradient-to-r !from-indigo-600 !to-purple-600 !px-6 !py-4">
            <h2 className="!text-xl !font-bold !text-white">تاريخ الرواتب</h2>
          </div>
          <div className="table-responsive !p-6">
            {loadingSalary ? (
              <div className="!flex !items-center !justify-center !py-12">
                <div className="!flex !flex-col !items-center !space-y-4">
                  <div className="!animate-spin !rounded-full !h-12 !w-12 !border-b-2 !border-indigo-600"></div>
                  <p className="!text-gray-600 !font-medium">جاري التحميل...</p>
                </div>
              </div>
            ) : salaryHistory.length === 0 ? (
              <div className="!text-center !py-12">
                <div className="!text-6xl !text-gray-300 !mb-4">📋</div>
                <p className="!text-gray-500 !text-lg !font-medium">لا يوجد سجل رواتب</p>
                <p className="!text-gray-400 !text-sm !mt-2">ابدأ بإنشاء أول راتب للموظف</p>
              </div>
            ) : (
              <div className="!overflow-x-auto !rounded-lg !border !border-gray-200">
                <table className="!w-full !text-sm">
                  <thead className="!bg-gradient-to-r !from-gray-50 !to-gray-100">
                    <tr>
                      <th className="!px-4 !py-3 !text-right !font-semibold !text-gray-700 !border-b !border-gray-200">الشهر/السنة</th>
                      <th className="!px-4 !py-3 !text-right !font-semibold !text-gray-700 !border-b !border-gray-200">الراتب الأساسي</th>
                      <th className="!px-4 !py-3 !text-right !font-semibold !text-gray-700 !border-b !border-gray-200">أيام الغياب</th>
                      <th className="!px-4 !py-3 !text-right !font-semibold !text-gray-700 !border-b !border-gray-200">الحوافز</th>
                      <th className="!px-4 !py-3 !text-right !font-semibold !text-gray-700 !border-b !border-gray-200">الخصومات</th>
                      <th className="!px-4 !py-3 !text-right !font-semibold !text-gray-700 !border-b !border-gray-200">السحبيات</th>
                      <th className="!px-4 !py-3 !text-right !font-semibold !text-gray-700 !border-b !border-gray-200">الراتب النهائي</th>
                      <th className="!px-4 !py-3 !text-center !font-semibold !text-gray-700 !border-b !border-gray-200">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="!divide-y !divide-gray-200">
                    {salaryHistory.map((salary, index) => (
                      <tr key={salary._id} className={`!transition-all !duration-300 !hover:bg-gray-50 ${index % 2 === 0 ? '!bg-white' : '!bg-gray-25'}`}>
                        <td className="!px-4 !py-4 !font-medium !text-gray-900">
                          {getMonthName(salary.month)} {salary.year}
                        </td>
                        <td className="!px-4 !py-4 !text-gray-700">
                          {salary.basicSalary.toLocaleString()} ريال
                        </td>
                        <td className="!px-4 !py-4 !text-center">
                          <span className={`!inline-flex !items-center !justify-center !w-8 !h-8 !rounded-full !text-sm !font-medium ${
                            salary.absenceDays > 0 
                              ? '!bg-red-100 !text-red-800' 
                              : '!bg-green-100 !text-green-800'
                          }`}>
                            {salary.absenceDays}
                          </span>
                        </td>
                        <td className="!px-4 !py-4 !text-gray-700">
                          <span className="!text-green-600 !font-medium">
                            +{salary.incentives.toLocaleString()} ريال
                          </span>
                        </td>
                        <td className="!px-4 !py-4 !text-gray-700">
                          <span className="!text-red-600 !font-medium">
                            -{salary.deductions.toLocaleString()} ريال
                          </span>
                        </td>
                        <td className="!px-4 !py-4 !text-gray-700">
                          <span className="!text-orange-600 !font-medium">
                            -{salary.withdrawals.toLocaleString()} ريال
                          </span>
                        </td>
                        <td className="!px-4 !py-4 !font-bold !text-lg">
                          <span className="!bg-gradient-to-r !from-blue-600 !to-purple-600 !bg-clip-text !text-transparent">
                            {salary.finalSalary.toLocaleString()} ريال
                          </span>
                        </td>
                        <td className="!px-4 !py-4 !text-center">
                          <span className={`!inline-flex !items-center !px-3 !py-1 !text-xs !font-semibold !rounded-full !transition-all !duration-300 ${
                            salary.isPaid 
                              ? '!bg-green-100 !text-green-800 !border !border-green-200' 
                              : '!bg-red-100 !text-red-800 !border !border-red-200'
                          }`}>
                            {salary.isPaid ? '✅ تم الدفع' : '❌ لم يتم الدفع'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkerEdit 
