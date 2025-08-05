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

  if (loading) {
    return <div className="loading">جاري التحميل...</div>
  }

  return (
    <>
      <h1 className="page-title">بيانات الموظفين</h1>

      <div className="container">
        {error && <div className="error-message">{error}</div>}

        <div className="summary">
          <h3>إجمالي الرواتب الأساسية: {totalBasicSalary.toLocaleString()} ريال</h3>
          <p>عدد الموظفين: {workers.length}</p>
        </div>

        <div className="table-section">
          <div className="table-header">
            <h2>قائمة الموظفين</h2>
            <button className="add-worker-btn" onClick={handleAddWorker}>
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
                <th>الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {workers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="no-data">لا يوجد موظفين</td>
                </tr>
              ) : (
                workers.map((worker) => (
                  <tr key={worker._id}>
                    <td>{worker.name}</td>
                    <td>{worker.job}</td>
                    <td>{worker.basicSalary.toLocaleString()} ريال</td>
                    <td>{worker.identityNumber}</td>
                    <td>{new Date(worker.createdAt).toLocaleDateString('ar-SA')}</td>
                    <td>
                      <div className="btn-group">
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