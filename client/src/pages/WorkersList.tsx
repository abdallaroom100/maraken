import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../hooks/useAuth'
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

interface WorkerAdvance {
  advance: number
  finalSalary: number
  absenceDays?: number
}

const WorkersList = () => {
  const { admin, getToken } = useAuth()
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [salaryStatus, setSalaryStatus] = useState<{ [workerId: string]: boolean | null }>({})
  const [workerAdvances, setWorkerAdvances] = useState<{ [workerId: string]: WorkerAdvance }>({})

  // Fetch all workers
  const fetchWorkers = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/workers')
      const data = await response.json()

      if (data.success) {
        setWorkers(data.data)
      } else {
        setError(data.message || 'خطأ في جلب الموظفين')
      }
    } catch (err) {
      setError('خطأ في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWorkers()
  }, [])

  // Fetch salary status and advances for selected month/year for all workers
  useEffect(() => {
    const fetchSalaryStatus = async () => {
      const statusObj: { [workerId: string]: boolean | null } = {}
      const advancesObj: { [workerId: string]: WorkerAdvance } = {}

      await Promise.all(
        workers.map(async (worker) => {
          try {
            const res = await fetch(`/api/workers/${worker._id}/salary-history`)
            const data = await res.json()
            if (data.success && Array.isArray(data.data)) {
              const salary = data.data.find((s: any) => Number(s.year) === selectedYear && Number(s.month) === selectedMonth)
              statusObj[worker._id] = salary ? !!salary.isPaid : null
              if (salary) {
                console.log(`[WorkersList] Worker ${worker._id}: Advance=${salary.advance}, Final=${salary.finalSalary}, Absence=${salary.absenceDays}`);
                advancesObj[worker._id] = {
                  advance: salary.advance || 0,
                  finalSalary: salary.finalSalary ?? worker.basicSalary,
                  absenceDays: salary.absenceDays || 0
                }
              } else {
                advancesObj[worker._id] = {
                  advance: 0,
                  finalSalary: worker.basicSalary,
                  absenceDays: 0
                }
              }
            } else {
              statusObj[worker._id] = null
              advancesObj[worker._id] = {
                advance: 0,
                finalSalary: worker.basicSalary
              }
            }
          } catch {
            statusObj[worker._id] = null
            advancesObj[worker._id] = {
              advance: 0,
              finalSalary: worker.basicSalary
            }
          }
        })
      )
      setSalaryStatus(statusObj)
      setWorkerAdvances(advancesObj)
    }
    if (workers.length > 0) fetchSalaryStatus()
  }, [workers, selectedMonth, selectedYear])

  // Delete worker
  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الموظف؟')) return

    try {
      const response = await fetch(`/api/workers/${id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        fetchWorkers()
        alert('تم حذف الموظف بنجاح')
      } else {
        alert(data.message || 'خطأ في حذف الموظف')
      }
    } catch (err) {
      alert('خطأ في الاتصال بالخادم')
    }
  }

  // Navigate to edit page
  const handleEdit = (worker: Worker) => {
    navigate(`/workers/edit/${worker._id}`, { state: { worker } })
  }

  // Navigate to add worker page
  const handleAddWorker = () => {
    navigate('/employees')
  }

  // Pay Salary
  const handlePaySalary = async (worker: Worker) => {
    const advanceData = workerAdvances[worker._id]
    const currentFinalSalary = advanceData?.finalSalary || worker.basicSalary

    if (currentFinalSalary <= 0) {
      toast.error('لا يوجد راتب مستحق للدفع')
      return
    }

    if (!confirm(`هل أنت متأكد من دفع الراتب المتبقي (${currentFinalSalary.toLocaleString()} ريال) للموظف ${worker.name}؟`)) {
      return
    }

    const token = getToken?.() || admin?.token

    try {
      const response = await fetch('/api/workers/salaries/advance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          workerId: worker._id,
          advance: currentFinalSalary,
          notes: 'تسليم الراتب النهائي'
        })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('تم دفع الراتب بنجاح')
        // Refresh data by re-fetching workers which triggers the useEffect
        fetchWorkers()
      } else {
        toast.error(data.message || 'خطأ في دفع الراتب')
      }
    } catch (err) {
      toast.error('خطأ في الاتصال بالخادم')
    }
  }

  const totalBasicSalary = workers.reduce((sum, worker) => sum + worker.basicSalary, 0)
  console.log(totalBasicSalary)
  if (loading) {
    return <div className="loading">جاري التحميل...</div>
  }

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
    { value: 12, label: 'ديسمبر' },
  ]

  const years = Array.from({ length: 5 }, (_, i) => 2024 + i)

  return (
    <>
      <h1 className="page-title">بيانات الموظفين</h1>

      <div className="container">
        {error && <div className="error-message">{error}</div>}

        {/* <div className="summary bg-white p-6 rounded-lg shadow-md flex flex-col gap-4 text-right">
  <h3 className="text-xl font-bold text-gray-800">
    إجمالي الرواتب الأساسية: {totalBasicSalary.toLocaleString()} ريال
  </h3>
  <p className="text-lg text-gray-600">عدد الموظفين: {workers.length}</p>
</div> */}

        <div className="table-section">
          <div className="table-header flex-wrap gap-4">
            <h2 className='!m-0'>قائمة الموظفين</h2>

            <div className="flex gap-4 items-center flex-wrap  justify-end">
              <div className="flex gap-2 items-center">
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="p-2 border rounded-md "
                  style={{ width: '120px' }}
                >
                  {months.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="p-2 border rounded-md !w-[120px]"
                  style={{ width: '120px' }}
                >
                  {years.map(y => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>

              <button className="add-worker-btn !w-fit" onClick={handleAddWorker}>
                + إضافة موظف جديد
              </button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>اسم الموظف</th>
                <th>الوظيفة</th>
                <th>الراتب الأساسي</th>
                <th style={{ textAlign: 'center' }}>أيام الغياب</th>
                <th style={{ textAlign: 'center' }}>خصم الغياب</th>
                <th>الصرفات</th>
                <th>الراتب النهائي</th>
                <th>تاريخ الإضافة</th>
                <th>حالة الراتب ({months.find(m => m.value === selectedMonth)?.label} {selectedYear})</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="no-data">لا يوجد موظفين</td>
                </tr>
              ) : (
                workers.map((worker) => {
                  const hasSalary = salaryStatus[worker._id] !== null
                  const advance = workerAdvances[worker._id]?.advance || 0
                  // If salary record exists, use its finalSalary (even if 0). Otherwise default to basicSalary.
                  const finalSalary = hasSalary ? (workerAdvances[worker._id]?.finalSalary ?? 0) : worker.basicSalary

                  return (
                    <tr key={worker._id}>
                      <td style={{ textAlign: 'right', minWidth: 140 }} >
                        <div className='flex'>
                          <span className="user-avatar">👤</span>
                          <span className="worker-name">{worker.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className="worker-job">{worker.job}</span>
                      </td>
                      <td>
                        <span className="salary-basic">{worker.basicSalary.toLocaleString()} ريال</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="absence-days text-red-600 font-bold">
                          {workerAdvances[worker._id]?.absenceDays || 0}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="absence-deduction text-red-600 font-bold">
                          {(Math.floor((worker.basicSalary / 30) * (workerAdvances[worker._id]?.absenceDays || 0)) > 0
                            ? -Math.floor((worker.basicSalary / 30) * (workerAdvances[worker._id]?.absenceDays || 0))
                            : 0).toLocaleString()} ريال
                        </span>
                      </td>
                      <td>
                        <span className="advance-amount" style={{ color: advance > 0 ? '#e53e3e' : '#718096', fontWeight: advance > 0 ? '600' : '400' }}>
                          {advance.toLocaleString()} ريال
                        </span>
                      </td>
                      <td>
                        <span className="final-salary" style={{ color: '#48bb78', fontWeight: '600' }}>
                          {finalSalary.toLocaleString()} ريال
                        </span>
                      </td>
                      <td>{new Date(worker.createdAt).toLocaleDateString('en-GB')}</td>
                      <td style={{ textAlign: 'center' }}>
                        {salaryStatus[worker._id] === true ? (
                          <span className="salary-badge paid"><span className="icon"></span> تم الدفع</span>
                        ) : (
                          <span className="salary-badge unpaid"><span className="icon"></span>  غير مدفوع</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group  !flex-wrap md:!flex-nowrap">
                          <button
                            className="pay-btn"
                            style={{ backgroundColor: '#48bb78', color: 'white', padding: '5px 10px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '14px', marginLeft: '5px' }}
                            onClick={() => handlePaySalary(worker)}
                            title="دفع الراتب النهائي"
                          >
                            دفع الراتب
                          </button>
                          <button
                            className="edit-btn"
                            onClick={() => handleEdit(worker)}
                          >
                            تعديل
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(worker._id)}
                          >
                            حذف
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default WorkersList