import { useState } from 'react'
import './Reports.css'

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('')
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: ''
  })

  const handleGenerateReport = () => {
    // هنا يمكن إضافة منطق إنشاء التقارير
    alert(`سيتم إنشاء تقرير ${selectedReport} للفترة من ${dateRange.startDate} إلى ${dateRange.endDate}`)
  }

  return (
    <>
      <h1>التقارير</h1>

      <div className="container">
        <div className="report-form">
          <h2>إنشاء تقرير جديد</h2>
          
          <div className="form-group">
            <label htmlFor="reportType">نوع التقرير</label>
            <select
              id="reportType"
              value={selectedReport}
              onChange={(e) => setSelectedReport(e.target.value)}
            >
              <option value="">اختر نوع التقرير</option>
              <option value="financial">التقرير المالي الشامل</option>
              <option value="employees">تقرير الموظفين والرواتب</option>
              <option value="expenses">تقرير المصروفات</option>
              <option value="revenues">تقرير الإيرادات</option>
              <option value="budget">تقرير الميزانية</option>
              <option value="performance">تقرير الأداء</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="startDate">تاريخ البداية</label>
            <input
              type="date"
              id="startDate"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="endDate">تاريخ النهاية</label>
            <input
              type="date"
              id="endDate"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
            />
          </div>

          <button onClick={handleGenerateReport} disabled={!selectedReport || !dateRange.startDate || !dateRange.endDate}>
            إنشاء التقرير
          </button>
        </div>

        <div className="reports-grid">
          <div className="report-card">
            <h3>التقرير المالي الشامل</h3>
            <p>تقرير شامل عن الوضع المالي للشركة</p>
            <button className="btn-secondary">عرض التقرير</button>
          </div>

          <div className="report-card">
            <h3>تقرير الموظفين</h3>
            <p>تقرير تفصيلي عن الموظفين والرواتب</p>
            <button className="btn-secondary">عرض التقرير</button>
          </div>

          <div className="report-card">
            <h3>تقرير المصروفات</h3>
            <p>تحليل المصروفات حسب الفئات</p>
            <button className="btn-secondary">عرض التقرير</button>
          </div>

          <div className="report-card">
            <h3>تقرير الإيرادات</h3>
            <p>تحليل الإيرادات ومصادرها</p>
            <button className="btn-secondary">عرض التقرير</button>
          </div>

          <div className="report-card">
            <h3>تقرير الميزانية</h3>
            <p>مقارنة الميزانية المخططة مع الفعلية</p>
            <button className="btn-secondary">عرض التقرير</button>
          </div>

          <div className="report-card">
            <h3>تقرير الأداء</h3>
            <p>تحليل أداء الشركة خلال الفترة</p>
            <button className="btn-secondary">عرض التقرير</button>
          </div>
        </div>
      </div>
    </>
  )
}

export default Reports 