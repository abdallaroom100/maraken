import { useState } from 'react'
import { useRevenues } from '../hooks/useRevenues'
import './Revenues.css'

// interface Revenue {
//   id: number
//   description: string
//   amount: number
//   source: string
// }

const Revenues = () => {
  const { loading, createRevenue } = useRevenues()
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    source: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const result = await createRevenue(formData)
    
    if (result.success) {
      // مسح البيانات من الفورم بعد النجاح
      setFormData({
        description: '',
        amount: '',
        source: ''
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
      <h1>إدارة الإيرادات</h1>

      <div className="container revenues">
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="description">وصف الإيراد</label>
              <input
                type="text"
                id="description"
                name="description"
                placeholder="أدخل وصف الإيراد"
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
              <label htmlFor="source">المصدر</label>
              <select
                id="source"
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                required
              >
                <option value="">اختر المصدر</option>
                <option value="مبيعات">مبيعات</option>
                <option value="خدمات">خدمات</option>
                <option value="إيجارات">إيجارات</option>
                <option value="استثمارات">استثمارات</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
          </div>

          <button 
            className='w-[400px] !mx-auto w-full !mx-auto' 
            type="submit"
            style={{margin:"auto",minWidth:"300px",background:"linear-gradient(135deg, #a1b1a7 0%, #3a4f41 100%)"}}
            disabled={loading}
          >
            {loading ? 'جاري الإضافة...' : 'إضافة إيراد'}
          </button>
        </form>
      </div>
    </>
  )
}

export default Revenues 