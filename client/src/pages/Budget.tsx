import { useState } from 'react'
import './Budget.css'

interface BudgetItem {
  id: number
  category: string
  planned: number
  actual: number
  variance: number
}

const Budget = () => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([])
  const [editingId, setEditingId] = useState<number | null>(null)
  const [formData, setFormData] = useState({
    category: '',
    planned: '',
    actual: ''
  })

  const calculateVariance = (planned: number, actual: number) => {
    return actual - planned
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newBudgetItem: BudgetItem = {
      id: editingId || Date.now(),
      category: formData.category,
      planned: Number(formData.planned),
      actual: Number(formData.actual),
      variance: calculateVariance(Number(formData.planned), Number(formData.actual))
    }

    if (editingId) {
      setBudgetItems(budgetItems.map(item => item.id === editingId ? newBudgetItem : item))
      setEditingId(null)
    } else {
      setBudgetItems([...budgetItems, newBudgetItem])
    }

    setFormData({
      category: '',
      planned: '',
      actual: ''
    })
  }

  // const handleEdit = (item: BudgetItem) => {
  //   setEditingId(item.id)
  //   setFormData({
  //     category: item.category,
  //     planned: item.planned.toString(),
  //     actual: item.actual.toString()
  //   })
  // }

  const handleDelete = (id: number) => {
    setBudgetItems(budgetItems.filter(item => item.id !== id))
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const totalPlanned = budgetItems.reduce((sum, item) => sum + item.planned, 0)
  const totalActual = budgetItems.reduce((sum, item) => sum + item.actual, 0)
  const totalVariance = totalActual - totalPlanned

  return (
    <>
      <h1>إدارة الميزانية</h1>

      <div className="container">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="category">الفئة</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
            >
              <option value="">اختر الفئة</option>
              <option value="رواتب">رواتب</option>
              <option value="إيجار">إيجار</option>
              <option value="كهرباء">كهرباء</option>
              <option value="مياه">مياه</option>
              <option value="صيانة">صيانة</option>
              <option value="مشتريات">مشتريات</option>
              <option value="تسويق">تسويق</option>
              <option value="أخرى">أخرى</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="planned">الميزانية المخططة (ريال)</label>
            <input
              type="number"
              id="planned"
              name="planned"
              placeholder="0"
              min="0"
              step="0.01"
              value={formData.planned}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="actual">الميزانية الفعلية (ريال)</label>
            <input
              type="number"
              id="actual"
              name="actual"
              placeholder="0"
              min="0"
              step="0.01"
              value={formData.actual}
              onChange={handleInputChange}
              required
            />
          </div>

          <button type="submit" className="add-btn">
            {editingId ? 'تحديث العنصر' : 'إضافة عنصر'}
          </button>
        </form>

        <div className="summary">
          <div className="summary-item">
            <h3>إجمالي الميزانية المخططة: {totalPlanned.toLocaleString()} ريال</h3>
          </div>
          <div className="summary-item">
            <h3>إجمالي الميزانية الفعلية: {totalActual.toLocaleString()} ريال</h3>
          </div>
          <div className={`summary-item ${totalVariance >= 0 ? 'positive' : 'negative'}`}>
            <h3>الفرق: {totalVariance.toLocaleString()} ريال</h3>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>الفئة</th>
              <th>الميزانية المخططة</th>
              <th>الميزانية الفعلية</th>
              <th>الفرق</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {budgetItems.map((item) => (
              <tr key={item.id}>
                <td>{item.category}</td>
                <td>{item.planned.toLocaleString()} ريال</td>
                <td>{item.actual.toLocaleString()} ريال</td>
                <td className={item.variance >= 0 ? 'positive' : 'negative'}>
                  {item.variance.toLocaleString()} ريال
                </td>
                <td>
                  <button
                    className="btn-delete"
                    onClick={() => handleDelete(item.id)}
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default Budget 