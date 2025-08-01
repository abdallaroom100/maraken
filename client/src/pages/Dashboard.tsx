import { useDashboard } from '../hooks/useDashboard'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts'
import './Dashboard.css'
import { FaArrowUp, FaArrowDown } from 'react-icons/fa'
import { MdShowChart } from 'react-icons/md'

const Dashboard = () => {
  const { stats, admins, loading, error, filters, updateFilters, resetFilters } = useDashboard()

  // تنسيق الأرقام
  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ar-SA').format(num)
  }

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-SA')
  }

  // الحصول على لون حسب القيمة
  const getColorByValue = (value: number) => {
    if (value > 0) return '#10b981' // أخضر
    if (value < 0) return '#ef4444' // أحمر
    return '#6b7280' // رمادي
  }

  // الحصول على اسم الشهر
  const getMonthName = (month: number) => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ]
    return months[month - 1]
  }

  // تحضير بيانات الرسم البياني الرئيسي
  const mainChartData = stats ? [
    {
      name: 'الإيرادات',
      value: stats.summary.totalRevenues,
      fill: '#22c55e',
      color: '#22c55e'
    },
    {
      name: 'المصروفات',
      value: stats.summary.totalExpenses,
      fill: '#ef4444',
      color: '#ef4444'
    },
    {
      name: 'صافي الربح',
      value: stats.summary.netAmount,
      fill: '#3b82f6',
      color: '#3b82f6'
    }
  ] : []

  // تحضير بيانات الإيرادات حسب النوع
  // const revenuesData = stats?.revenuesByType.map(item => ({
  //   name: item._id,
  //   value: item.total,
  //   fill: '#22c55e'
  // })) || []

  // تحضير بيانات المصروفات حسب النوع
  // const expensesData = stats?.expensesByType.map(item => ({
  //   name: item._id,
  //   value: item.total,
  //   fill: '#ef4444'
  // })) || []

  // ألوان متدرجة للمصروفات
  // const expensesColors = ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d']

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <i className="fas fa-exclamation-triangle"></i>
          <h3>حدث خطأ</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-btn">
            إعادة المحاولة
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {/* العنوان الرئيسي */}
      <div className="dashboard-header">
        <h1>لوحة التحكم</h1>
        <p>نظام إدارة الأعمال المتكامل</p>
      </div>

      {/* فلترة البيانات */}
      <div className="filters-section">
        <h3>فلترة البيانات</h3>
        <div className="filters-grid" >
          <div className="filter-group " >
            <label>السنة:</label>
            <select 
            dir='ltr'
              value={filters.year} 
              onChange={(e) => updateFilters({ year: parseInt(e.target.value) })}
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group">
            <label>الشهر:</label>
            <select 
              value={filters.month} 
               dir='ltr'
              onChange={(e) => updateFilters({ month: parseInt(e.target.value) })}
            >
              {[
                { value: 1, name: 'يناير' },
                { value: 2, name: 'فبراير' },
                { value: 3, name: 'مارس' },
                { value: 4, name: 'إبريل' },
                { value: 5, name: 'مايو' },
                { value: 6, name: 'يونيو' },
                { value: 7, name: 'يوليو' },
                { value: 8, name: 'أغسطس' },
                { value: 9, name: 'سبتمبر' },
                { value: 10, name: 'أكتوبر' },
                { value: 11, name: 'نوفمبر' },
                { value: 12, name: 'ديسمبر' }
              ].map(month => (
                <option key={month.value} value={month.value}>{month.name}</option>
              ))}
            </select>
          </div>
          
          <div className="filter-group " >
            <label>الأدمن:</label>
            <select 
              value={filters.adminId} 
              dir='ltr'
              onChange={(e) => {
                console.log('Selected adminId:', e.target.value)
                updateFilters({ adminId: e.target.value })
              }}
            >
              <option value="">جميع الأدمن</option>
              {admins.map(admin => {
                console.log('Admin in dropdown:', admin)
                return (
                  <option key={admin._id} value={admin._id}>{admin.name}</option>
                )
              })}
            </select>
          </div>
          
          <div className="filter-group">
            <button onClick={resetFilters} className="reset-btn">
              إعادة تعيين
            </button>
          </div>
        </div>
      </div>

      {/* عرض الفترة المحددة */}
      <div className="period-display">
        <h3>إحصائيات {getMonthName(filters.month)} {filters.year}</h3>
        {filters.adminId && (
          <p>الأدمن: {admins.find((admin: any) => admin._id === filters.adminId)?.name}</p>
        )}
       
      </div>

      {/* ملخص الأداء المالي */}
      {stats && (
        <>
          <div className="stats-grid">
            <div className="stat-card revenues">
              <div className="stat-icon">
                <FaArrowUp size={28} color="#10b981" />
              </div>
              <div className="stat-content">
                <h3>إجمالي الإيرادات</h3>
                <div className="stat-amount">{formatNumber(stats.summary.totalRevenues)} ريال</div>
                <div className="stat-count">{stats.summary.revenuesCount} معاملة</div>
              </div>
            </div>

            <div className="stat-card expenses">
              <div className="stat-icon">
                <FaArrowDown size={28} color="#ef4444" />
              </div>
              <div className="stat-content">
                <h3>إجمالي المصروفات</h3>
                <div className="stat-amount">{formatNumber(stats.summary.totalExpenses)} ريال</div>
                <div className="stat-count">{stats.summary.expensesCount} معاملة</div>
              </div>
            </div>

            <div className="stat-card net">
              <div className="stat-icon">
                <MdShowChart size={32} fill='white' color="#3b82f6" />
              </div>
              <div className="stat-content">
                <h3>صافي الربح</h3>
                <div 
                  className="stat-amount" 
                  style={{ color: getColorByValue(stats.summary.netAmount) }}
                >
                  {formatNumber(stats.summary.netAmount)} ريال
                </div>
                <div className="stat-status">
                  {stats.summary.netAmount >= 0 ? 'ربح' : 'خسارة'}
                </div>
              </div>
            </div>
          </div>

          {/* الرسم البياني الرئيسي */}
          <div className="chart-section">
            <h3>ملخص الأداء المالي - {getMonthName(filters.month)} {filters.year}</h3>
            <div className="chart-container max-w-[900px] !mx-auto">
              <ResponsiveContainer width="100%"   height={400}>
                <BarChart data={mainChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontFamily: 'Tajawal', fontSize: 14, fontWeight: 'bold', fill: '#374151' }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    tick={{ fontFamily: 'Tajawal', fontSize: 12, fill: '#6b7280' }}
                    tickFormatter={(value) => formatNumber(value)}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <Tooltip 
                    formatter={(value: any) => [formatNumber(value) + ' ريال', 'المبلغ']}
                    labelStyle={{ fontFamily: 'Tajawal', fontWeight: 'bold', color: '#1f2937' }}
                    contentStyle={{ 
                      fontFamily: 'Tajawal',
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                    cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  />
                  
                  <Bar 
                    dataKey="value" 
                    radius={[6, 6, 0, 0]}
                  >
                    {mainChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* إحصائيات الأدمنين */}
          {stats.adminStats && stats.adminStats.length > 0 && (
            <div className="tables-grid">
              <div className="table-section">
                <h3>إحصائيات الأدمنين</h3>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>الأدمن</th>
                      <th>الإيرادات</th>
                      <th>المصروفات</th>
                      <th>صافي الربح</th>
                      <th>عدد المعاملات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.adminStats.map((admin: any) => (
                      <tr key={admin.adminId}>
                        <td>{admin.adminName}</td>
                        <td>{formatNumber(admin.totalRevenues)} ريال</td>
                        <td>{formatNumber(admin.totalExpenses)} ريال</td>
                        <td style={{ color: getColorByValue(admin.netAmount) }}>
                          {formatNumber(admin.netAmount)} ريال
                        </td>
                        <td>{admin.expensesCount + admin.revenuesCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* أحدث المعاملات */}
              <div className="table-section">
                <h3>أحدث المعاملات</h3>
                <div className="recent-transactions">
                  {stats.recentExpenses.slice(0, 5).map((expense: any) => (
                    <div key={expense._id} className="transaction-item">
                      <div className="transaction-info">
                        <div className="transaction-amount" style={{ color: '#ef4444' }}>
                          -{formatNumber(expense.amount)} ريال
                        </div>
                        <div className="transaction-date">{formatDate(expense.createdAt)}</div>
                        <div className="transaction-admin">{expense.adminId?.name || 'غير محدد'}</div>
                      </div>
                    </div>
                  ))}
                  {stats.recentRevenues.slice(0, 5).map((revenue: any) => (
                    <div key={revenue._id} className="transaction-item">
                      <div className="transaction-info">
                        <div className="transaction-amount" style={{ color: '#10b981' }}>
                          +{formatNumber(revenue.amount)} ريال
                        </div>
                        <div className="transaction-date">{formatDate(revenue.createdAt)}</div>
                        <div className="transaction-admin">{revenue.adminId?.name || 'غير محدد'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Dashboard 