import { useState } from 'react'
import { useExpenses } from '../hooks/useExpenses'
import './Expenses.css'

// interface Expense {
//   id: number
//   description: string
//   amount: number
//   category: string
// }

const Expenses = () => {
  const { loading, createExpense } = useExpenses()
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const result = await createExpense(formData)
    
    if (result.success) {
      // مسح البيانات من الفورم بعد النجاح
      setFormData({
        description: '',
        amount: '',
        category: ''
      })
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <>
      <h1>إدارة المصروفات</h1>

      <div className="container expenses">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="description">وصف المصروف</label>
              <input
                type="text"
                id="description"
                name="description"
                placeholder="أدخل وصف المصروف"
                value={formData.description}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="amount">المبلغ (ريال)</label>
              <input
                type="number"
                id="amount"
                name="amount"
                placeholder="0"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange}
                required
              />
            </div>
            
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
                <option value="أخرى">أخرى</option>
              </select>
            </div>
          </div>

          <button 
            className='max-w-[400px] !mx-auto w-full mx-auto' 
            type="submit"
            style={{margin:"auto",minWidth:"300px",background:"linear-gradient(135deg, #a1b1a7 0%, #3a4f41 100%)"}}
            disabled={loading}
          >
            {loading ? 'جاري الإضافة...' : 'إضافة مصروف'}
          </button>
        </form>
      </div>
    </>
  )
}

export default Expenses 