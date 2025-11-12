  import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Expense {
  _id: string;
  amount: number;
  description: string;
  type: string;
  adminId: string;
  adminName?: string;
  createdAt: string;
}

interface AdminOption {
  _id: string;
  name: string;
  role: string;
}

const monthOptions = [
  { value: '', label: 'كل الشهور' },
  { value: '1', label: 'يناير' },
  { value: '2', label: 'فبراير' },
  { value: '3', label: 'مارس' },
  { value: '4', label: 'أبريل' },
  { value: '5', label: 'مايو' },
  { value: '6', label: 'يونيو' },
  { value: '7', label: 'يوليو' },
  { value: '8', label: 'أغسطس' },
  { value: '9', label: 'سبتمبر' },
  { value: '10', label: 'أكتوبر' },
  { value: '11', label: 'نوفمبر' },
  { value: '12', label: 'ديسمبر' },
];

const ExpensesList = () => {
  const navigate = useNavigate();
  const { admin, getToken } = useAuth();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    adminId: '',
    month: '',
    year: '',
  });
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [isFetchingAdmins, setIsFetchingAdmins] = useState(false);

  const isManager = admin?.role === 'manager';
  const token = useMemo(() => getToken?.() ?? admin?.token ?? null, [admin, getToken]);

  const fetchAdmins = async () => {
    if (!isManager || !token) return;

    setIsFetchingAdmins(true);
    try {
      const res = await fetch('/api/admin?role=moderator', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'فشل في تحميل قائمة المشرفين');
      }
      setAdmins(data.admins || []);
    } catch (err) {
      console.error('Fetch admins error:', err);
      setError(err instanceof Error ? err.message : 'فشل في تحميل قائمة المشرفين');
    } finally {
      setIsFetchingAdmins(false);
    }
  };

  const fetchExpenses = async () => {
    if (!token) {
      setExpenses([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {

      const params = new URLSearchParams();

      if (isManager) {
        if (filters.adminId) {
          params.append('adminId', filters.adminId);
        }
        if (filters.month) {
          params.append('month', filters.month);
        }
        if (filters.year) {
          params.append('year', filters.year);
        }
      }

      const queryString = params.toString();
      const url = queryString ? `/api/expenses?${queryString}` : '/api/expenses';

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'فشل في جلب البيانات');
      }

      setExpenses(data.expenses || []);
    } catch (err) {
      console.error('Fetch expenses error:', err);
      setError(err instanceof Error ? err.message : 'خطأ في الاتصال بالخادم');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManager) {
      fetchAdmins();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager, token]);

  useEffect(() => {
    fetchExpenses();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isManager, filters.adminId, filters.month, filters.year, token]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;

    try {
      if (!token) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'فشل في حذف المصروف');
      }

      setExpenses(current => current.filter(expense => expense._id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ في الاتصال بالخادم');
    }
  };

  const handleFilterChange = (event: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      adminId: '',
      month: '',
      year: '',
    });
  };

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="container">
      <h1>سجل المصروفات</h1>

      {isManager && (
        <div className="filters-card" style={{ marginBottom: 24 }}>
          <h2 style={{ marginBottom: 16 }}>تصفية المصروفات</h2>
          <div className="filters-grid" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div className="form-group" style={{ minWidth: 200 }}>
              <label>المشرف</label>
              <select
                name="adminId"
                value={filters.adminId}
                onChange={handleFilterChange}
                disabled={isFetchingAdmins}
              >
                <option value="">كل المشرفين</option>
                {admins.map(option => (
                  <option key={option._id} value={option._id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ minWidth: 160 }}>
              <label>الشهر</label>
              <select
                name="month"
                value={filters.month}
                onChange={handleFilterChange}
              >
                {monthOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ minWidth: 140 }}>
              <label>السنة</label>
              <input
                type="number"
                name="year"
                placeholder="مثال: 2024"
                value={filters.year}
                onChange={handleFilterChange}
                min="2000"
                max="2100"
              />
            </div>
          </div>

          <button type="button" onClick={handleResetFilters} style={{ marginTop: 12 }}>
            إعادة التصفية
          </button>
        </div>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              {isManager && <th>المشرف</th>}
              <th>الوصف</th>
              <th>المبلغ</th>
              <th>النوع</th>
              <th>تاريخ الإضافة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr>
                <td colSpan={isManager ? 6 : 5}>لا يوجد مصروفات</td>
              </tr>
            ) : (
              expenses.map(expense => (
                <tr key={expense._id}>
                  {isManager && <td>{expense.adminName || 'غير معروف'}</td>}
                  <td>{expense.description}</td>
                  <td>
                    <span className="amount-badge">{expense.amount} ريال</span>
                  </td>
                  <td>{expense.type}</td>
                  <td>{new Date(expense.createdAt).toLocaleDateString('en-GB')}</td>
                  <td>
                    <button onClick={() => navigate(`/expenses/edit/${expense._id}`)}>تعديل</button>
                    <button
                      onClick={() => handleDelete(expense._id)}
                      style={{ marginRight: 8, color: 'red' }}
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExpensesList;
