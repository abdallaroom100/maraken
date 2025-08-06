import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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

const WorkersList = () => {
  const [workers, setWorkers] = useState<Worker[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const [salaryStatus, setSalaryStatus] = useState<{ [workerId: string]: boolean | null }>({})

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

  // Fetch salary status for current month for all workers
  useEffect(() => {
    const fetchSalaryStatus = async () => {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      const statusObj: { [workerId: string]: boolean | null } = {}
      await Promise.all(
        workers.map(async (worker) => {
          try {
            const res = await fetch(`/api/workers/${worker._id}/salary-history`)
            const data = await res.json()
            if (data.success && Array.isArray(data.data)) {
              const salary = data.data.find((s: any) => Number(s.year) === year && Number(s.month) === month)
              statusObj[worker._id] = salary ? !!salary.isPaid : null
            } else {
              statusObj[worker._id] = null
            }
          } catch {
            statusObj[worker._id] = null
          }
        })
      )
      setSalaryStatus(statusObj)
    }
    if (workers.length > 0) fetchSalaryStatus()
  }, [workers])

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

  const totalBasicSalary = workers.reduce((sum, worker) => sum + worker.basicSalary, 0)
   console.log(totalBasicSalary)
  if (loading) {
    return <div className="loading">جاري التحميل...</div>
  }

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
          <div className="table-header">
            <h2 className='!m-0'>قائمة الموظفين</h2>
            <button className="add-worker-btn !w-fit" onClick={handleAddWorker}>
              + إضافة موظف جديد
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>اسم الموظف</th>
                <th>الوظيفة</th>
                <th>الراتب الأساسي</th>
                <th>رقم الهوية</th>
                <th>تاريخ الإضافة</th>
                <th>حالة راتب الشهر الحالي</th>
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="no-data">لا يوجد موظفين</td>
                </tr>
              ) : (
                workers.map((worker) => (
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
                    <td>
                      <span className="identity-badge">{worker.identityNumber}</span>
                    </td>
                    <td>{new Date(worker.createdAt).toLocaleDateString('en-GB')}</td>
                    <td style={{ textAlign: 'center' }}>
                      {salaryStatus[worker._id] === true ? (
                        <span className="salary-badge paid"><span className="icon"></span> تم الدفع</span>
                      ) : (
                        <span className="salary-badge unpaid"><span className="icon"></span>  غير مدفوع</span>
                      ) }
                    </td>
                    <td>
                      <div  className="btn-group  !flex-wrap md:!flex-nowrap">
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}

export default WorkersList 