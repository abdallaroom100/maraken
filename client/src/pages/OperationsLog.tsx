import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import toast from 'react-hot-toast';
import './OperationsLog.css';

interface Admin {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Revenue {
  _id: string;
  amount: number;
  description: string;
  type: string;
  adminId: Admin;
  createdAt: string;
}

interface Expense {
  _id: string;
  amount: number;
  description: string;
  type: string;
  adminId: Admin;
  createdAt: string;
}

interface OperationsData {
  revenues: Revenue[];
  expenses: Expense[];
  totalRevenues: number;
  totalExpenses: number;
  netProfit: number;
}

const OperationsLog = () => {
  const { admin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [operations, setOperations] = useState<OperationsData | null>(null);
  const [currentMonthStats, setCurrentMonthStats] = useState<any>(null);

  // فلاتر
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedOperationType, setSelectedOperationType] = useState('all');
  const [selectedAdminId, setSelectedAdminId] = useState('all');

  // التحقق من أن المستخدم مدير
  useEffect(() => {
    // if (admin?.role !== 'manager') {
    //   toast.error('ليس لديك صلاحية للوصول لهذه الصفحة');
    //   return;
    // }
  }, [admin]);

  // جلب قائمة الأدمن
  useEffect(() => {
    fetchAdmins();
    fetchCurrentMonthStats();
  }, []);

  // جلب العمليات عند تغيير الفلاتر
  useEffect(() => {
      fetchOperations();
   
  }, [selectedYear, selectedMonth, selectedOperationType, selectedAdminId]);

  const fetchAdmins = async () => {
      let token ;
        try {
          try {
            const admin  =   JSON.parse(localStorage.getItem('admin') || "{}")
            if(admin.token){
               token = admin.token
            }
          
        } catch (error) {
          console.log(error)
        }
      const response = await fetch('/api/operations/admins', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAdmins(data.admins);
      } else {
        toast.error('فشل في جلب قائمة الأدمن');
      }
    } catch (error) {
      console.error('Error fetching admins:', error);
      toast.error('حدث خطأ في جلب قائمة الأدمن');
    }
  };

  const fetchCurrentMonthStats = async () => {
      let token ;
    try {
      try {
        const admin  =   JSON.parse(localStorage.getItem('admin') || "{}")
        if(admin.token){
           token = admin.token
        }
      } catch (error) {
        console.log(error)
      }
      const response = await fetch('/api/operations/current-month-stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentMonthStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching current month stats:', error);
    }
  };

  const fetchOperations = async () => {
    setLoading(true);
    try {
      let token ;
      try {
        const admin  =   JSON.parse(localStorage.getItem('admin') || "{}")
        if(admin.token){
           token = admin.token
        }
      } catch (error) {
        console.log(error)
      }
      const params = new URLSearchParams({
        year: selectedYear.toString(),
        month: selectedMonth.toString(),
        operationType: selectedOperationType,
        adminId: selectedAdminId
      });

      const response = await fetch(`/api/operations/log?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOperations(data.operations);
      } else {
        toast.error('فشل في جلب سجل العمليات');
      }
    } catch (error) {
      console.error('Error fetching operations:', error);
      toast.error('حدث خطأ في جلب سجل العمليات');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: 'sar'
    }).format(amount);
  };

  const getMonthName = (month: number) => {
    const months = [
      'يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];
    return months[month - 1];
  };

  if (admin?.role !== 'manager') {
    return (
      <div className="operations-log-container">
        <div className="access-denied">
          <h2>غير مسموح بالوصول</h2>
          <p>هذه الصفحة متاحة للمدير فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="operations-log-container">
      <div className="operations-header">
        <h1>سجل العمليات</h1>
        <p>عرض وتصفية الإيرادات والمصروفات</p>
      </div>

      {/* إحصائيات الشهر الحالي */}
      {/* {currentMonthStats && (
        <div className="current-month-stats">
          <h3>إحصائيات الشهر الحالي ({getMonthName(currentMonthStats.currentMonth)} {currentMonthStats.currentYear})</h3>
          <div className="stats-grid">
            <div className="stat-card revenue">
              <h4>إجمالي الإيرادات</h4>
              <p>{formatCurrency(currentMonthStats.totalRevenues)}</p>
            </div>
            <div className="stat-card expense">
              <h4>إجمالي المصروفات</h4>
              <p>{formatCurrency(currentMonthStats.totalExpenses)}</p>
            </div>
            <div className={`stat-card ${currentMonthStats.netProfit >= 0 ? 'profit' : 'loss'}`}>
              <h4>صافي الربح</h4>
              <p>{formatCurrency(currentMonthStats.netProfit)}</p>
            </div>
          </div>
        </div>
      )} */}

      {/* الفلاتر */}
      <div className="filters-section">
        <h3>فلاتر البحث</h3>
        <div className="filters-grid">
          <div className="filter-group">
            <label>السنة:</label>
            <select 
              value={selectedYear} 
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            >
              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>الشهر:</label>
            <select 
              value={selectedMonth} 
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => (
                <option key={month} value={month}>{getMonthName(month)}</option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>نوع العملية:</label>
            <select 
              value={selectedOperationType} 
              onChange={(e) => setSelectedOperationType(e.target.value)}
            >
              <option value="all">جميع العمليات</option>
              <option value="revenues">الإيرادات فقط</option>
              <option value="expenses">المصروفات فقط</option>
            </select>
          </div>

          <div className="filter-group">
            <label>الأدمن:</label>
            <select 
              value={selectedAdminId} 
              onChange={(e) => setSelectedAdminId(e.target.value)}
            >
              <option value="all">جميع الأدمن</option>
              {admins.map(admin => (
                <option key={admin._id} value={admin._id}>{admin.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* نتائج البحث */}
      {loading ? (
        <div className="loading">
          <p>جاري تحميل البيانات...</p>
        </div>
      ) : operations && (
        <div className="results-section">
          <div className="summary-stats">
            <h3>ملخص العمليات - {getMonthName(selectedMonth)} {selectedYear}</h3>
            <div className="summary-grid">
              <div className="summary-card revenue">
                <h4>إجمالي الإيرادات</h4>
                <p>{formatCurrency(operations.totalRevenues)}</p>
                <span>{operations.revenues.length} عملية</span>
              </div>
              <div className="summary-card expense">
                <h4>إجمالي المصروفات</h4>
                <p>{formatCurrency(operations.totalExpenses)}</p>
                <span>{operations.expenses.length} عملية</span>
              </div>
              <div className={`summary-card ${operations.netProfit >= 0 ? 'profit' : 'loss'}`}>
                <h4>صافي الربح</h4>
                <p>{formatCurrency(operations.netProfit)}</p>
              </div>
            </div>
          </div>

          {/* عرض الإيرادات */}
          {(selectedOperationType === 'revenues' || selectedOperationType === 'all') && operations.revenues.length > 0 && (
            <div className="operations-section">
              <h3>الإيرادات</h3>
              <div className="operations-table">
                <table>
                  <thead>
                    <tr>
                      <th>المبلغ</th>
                      <th>النوع</th>
                      <th>الوصف</th>
                      <th>الأدمن</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operations.revenues.map(revenue => (
                      <tr key={revenue._id}>
                        <td className="amount revenue">{formatCurrency(revenue.amount)}</td>
                        <td>{revenue.type}</td>
                        <td>{revenue.description}</td>
                        <td>{revenue.adminId?.name || 'غير محدد'}</td>
                        <td>{formatDate(revenue.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* عرض المصروفات */}
          {(selectedOperationType === 'expenses' || selectedOperationType === 'all') && operations.expenses.length > 0 && (
            <div className="operations-section">
              <h3>المصروفات</h3>
              <div className="operations-table">
                <table>
                  <thead>
                    <tr>
                      <th>المبلغ</th>
                      <th>النوع</th>
                      <th>الوصف</th>
                      <th>الأدمن</th>
                      <th>التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {operations.expenses.map(expense => (
                      <tr key={expense._id}>
                        <td className="amount expense">{formatCurrency(expense.amount)}</td>
                        <td>{expense.type}</td>
                        <td>{expense.description}</td>
                        <td>{expense.adminId?.name || 'غير محدد'}</td>
                        <td>{formatDate(expense.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* رسالة إذا لم توجد عمليات */}
          {((selectedOperationType === 'revenues' && operations.revenues.length === 0) ||
            (selectedOperationType === 'expenses' && operations.expenses.length === 0) ||
            (selectedOperationType === 'all' && operations.revenues.length === 0 && operations.expenses.length === 0)) && (
            <div className="no-data">
              <p>لا توجد عمليات في الفترة المحددة</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OperationsLog;