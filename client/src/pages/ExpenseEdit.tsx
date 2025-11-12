import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Expense {
  _id: string;
  amount: number;
  description: string;
  type: string;
  createdAt: string;
}

const ExpenseEdit = () => {
  const { id } = useParams<{ id: string }>();
  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ description: '', amount: '', type: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const { admin, getToken } = useAuth();
  const token = useMemo(() => getToken?.() ?? admin?.token ?? null, [admin, getToken]);

  useEffect(() => {
    const fetchExpense = async () => {
      setLoading(true);
      try {
        if (!token) {
          throw new Error('يجب تسجيل الدخول أولاً');
        }

        const res = await fetch(`/api/expenses/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'لم يتم العثور على المصروف');
        }

        if (data.expense) {
          setExpense(data.expense);
          setForm({
            description: data.expense.description || '',
            amount: data.expense.amount?.toString() || '',
            type: data.expense.type || '',
          });
        } else {
          setError('لم يتم العثور على المصروف');
        }
      } catch (err) {
        console.error('Fetch expense error:', err);
        setError(err instanceof Error ? err.message : 'خطأ في الاتصال بالخادم');
      } finally {
        setLoading(false);
      }
    };
    if (!id || !token) {
      setLoading(false);
      return;
    }
    fetchExpense();
  }, [id, token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (!token) {
        throw new Error('يجب تسجيل الدخول أولاً');
      }

      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          description: form.description,
          amount: Number(form.amount),
          type: form.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'فشل في التعديل');
      }
      if (data.expense) {
        navigate('/expenses-list');
      } else {
        throw new Error('فشل في التعديل');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ في الاتصال بالخادم');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div className="error-message">{error}</div>;
  if (!expense) return null;

  return (
    <div className="container">
      <h1>تعديل المصروف</h1>
      <form onSubmit={handleSubmit} className="edit-form">
        <div className="form-group">
          <label>الوصف</label>
          <input name="description" value={form.description} onChange={handleChange} required />
        </div>
        <div className="form-group">
          <label>المبلغ</label>
          <input name="amount" type="number" value={form.amount} onChange={handleChange} required min="0" />
        </div>
        <div className="form-group">
          <label>النوع</label>
          <input name="type" value={form.type} onChange={handleChange} required />
        </div>
        <button type="submit" disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ التعديلات'}</button>
      </form>
    </div>
  );
};

export default ExpenseEdit; 