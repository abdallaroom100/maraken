import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Expense {
  _id: string;
  amount: number;
  description: string;
  type: string;
  adminId?: string;
  createdAt: string;
}

const ExpensesList = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { admin } = useAuth();

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      const adminId = admin?._id || admin?.id;
      if (!adminId) {
        setExpenses([]);
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/expenses/${adminId}`);
      const data = await res.json();
      if (data.expenses) {
        setExpenses(data.expenses);
      } else {
        setError('فشل في جلب البيانات');
      }
    } catch {
      setError('خطأ في الاتصال بالخادم');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
    // eslint-disable-next-line
  }, [admin]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا المصروف؟')) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.message) {
        setExpenses(expenses.filter(e => e._id !== id));
      } else {
        alert('فشل في حذف المصروف');
      }
    } catch {
      alert('خطأ في الاتصال بالخادم');
    }
  };

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="container">
      <h1>سجل المصروفات</h1>
      <div style={{overflowX: 'auto'}}>
        <table>
          <thead>
            <tr>
              <th>الوصف</th>
              <th>المبلغ</th>
              <th>النوع</th>
              <th>تاريخ الإضافة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {expenses.length === 0 ? (
              <tr><td colSpan={5}>لا يوجد مصروفات</td></tr>
            ) : (
              expenses.map(expense => (
                <tr key={expense._id}>
                  <td>{expense.description}</td>
                  <td><span className="amount-badge">{expense.amount} ريال</span></td>
                  <td>{expense.type}</td>
                  <td>{new Date(expense.createdAt).toLocaleDateString('en-GB')}</td>
                  <td>
                    <button onClick={() => navigate(`/expenses/edit/${expense._id}`)}>تعديل</button>
                    <button onClick={() => handleDelete(expense._id)} style={{marginRight: 8, color: 'red'}}>حذف</button>
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