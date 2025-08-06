import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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

  useEffect(() => {
    const fetchExpense = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/expenses/find/${id}`);
        const data = await res.json();
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
      } catch {
        setError('خطأ في الاتصال بالخادم');
      } finally {
        setLoading(false);
      }
    };
    fetchExpense();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.description,
          amount: Number(form.amount),
          type: form.type,
        }),
      });
      const data = await res.json();
      if (data.expense) {
        navigate('/expenses-list');
      } else {
        alert('فشل في التعديل');
      }
    } catch {
      alert('خطأ في الاتصال بالخادم');
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