import { useState } from 'react'
import './Employees.css'

interface Employee {
  id: number
  name: string
  job: string
  salary: number
  absence: number
  bonus: number
  deductions: number
  withdrawals: number
  totalSalary: number
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    job: '',
    salary: '',
    absence: '0',
    bonus: '0',
    deductions: '0',
    withdrawals: '0'
  })

  const calculateTotalSalary = (salary: number, absence: number, bonus: number, deductions: number, withdrawals: number) => {
    const dailySalary = salary / 30
    const absenceDeduction = absence * dailySalary
    return salary - absenceDeduction + bonus - deductions - withdrawals
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newEmployee: Employee = {
      id: editingId || Date.now(),
      name: formData.name,
      job: formData.job,
      salary: Number(formData.salary),
      absence: Number(formData.absence),
      bonus: Number(formData.bonus),
      deductions: Number(formData.deductions),
      withdrawals: Number(formData.withdrawals),
      totalSalary: calculateTotalSalary(
        Number(formData.salary),
        Number(formData.absence),
        Number(formData.bonus),
        Number(formData.deductions),
        Number(formData.withdrawals)
      )
    }

    if (editingId) {
      setEmployees(employees.map(emp => emp.id === editingId ? newEmployee : emp))
      setEditingId(null)
    } else {
      setEmployees([...employees, newEmployee])
    }

    setFormData({
      name: '',
      job: '',
      salary: '',
      absence: '0',
      bonus: '0',
      deductions: '0',
      withdrawals: '0'
    })
  }

  const handleEdit = (employee: Employee) => {
    setEditingId(employee.id)
    setFormData({
      name: employee.name,
      job: employee.job,
      salary: employee.salary.toString(),
      absence: employee.absence.toString(),
      bonus: employee.bonus.toString(),
      deductions: employee.deductions.toString(),
      withdrawals: employee.withdrawals.toString()
    })
  }

  const handleDelete = (id: number) => {
    setEmployees(employees.filter(emp => emp.id !== id))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    })
  }

  const totalSalaries = employees.reduce((sum, emp) => sum + emp.totalSalary, 0)

  return (
    <>
      <h1>إدارة الموظفين والرواتب</h1>

      <div className="container">
        {editingId && (
          <div className="edit-mode">
            وضع التعديل - قم بتعديل بيانات الموظف
          </div>
        )}

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
            <label htmlFor="salary">الراتب الأساسي (ريال)</label>
            <input
              type="number"
              id="salary"
              placeholder="0"
              min="0"
              value={formData.salary}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="absence">أيام الغياب</label>
            <input
              type="number"
              id="absence"
              placeholder="0"
              min="0"
              value={formData.absence}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="bonus">الحوافز (ريال)</label>
            <input
              type="number"
              id="bonus"
              placeholder="0"
              min="0"
              value={formData.bonus}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="deductions">الخصومات (ريال)</label>
            <input
              type="number"
              id="deductions"
              placeholder="0"
              min="0"
              value={formData.deductions}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="withdrawals">السحبيات (ريال)</label>
            <input
              type="number"
              id="withdrawals"
              placeholder="0"
              min="0"
              value={formData.withdrawals}
              onChange={handleInputChange}
            />
          </div>

          <button type="submit" className="add-btn">
            {editingId ? 'تحديث موظف' : 'إضافة موظف'}
          </button>
        </form>

        <div className="summary">
          <h3>إجمالي الرواتب: {totalSalaries.toLocaleString()} ريال</h3>
        </div>

        <table>
          <thead>
            <tr>
              <th>اسم الموظف</th>
              <th>الوظيفة</th>
              <th>الراتب الأساسي</th>
              <th>أيام الغياب</th>
              <th>الحوافز</th>
              <th>الخصومات</th>
              <th>السحبيات</th>
              <th>الراتب النهائي</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {employees.map((employee) => (
              <tr key={employee.id}>
                <td>{employee.name}</td>
                <td>{employee.job}</td>
                <td>{employee.salary.toLocaleString()} ريال</td>
                <td>{employee.absence}</td>
                <td>{employee.bonus.toLocaleString()} ريال</td>
                <td>{employee.deductions.toLocaleString()} ريال</td>
                <td>{employee.withdrawals.toLocaleString()} ريال</td>
                <td>{employee.totalSalary.toLocaleString()} ريال</td>
                <td>
                  <div className="btn-group">
                    <button
                      className="edit-btn"
                      onClick={() => handleEdit(employee)}
                    >
                      تعديل
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(employee.id)}
                    >
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Employees 