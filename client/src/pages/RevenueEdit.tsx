import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Revenue {
  _id: string;
  amount: number;
  description: string;
  type: string;
  createdAt: string;
}

const RevenueEdit = () => {
  const { id } = useParams<{ id: string }>();
  const [revenue, setRevenue] = useState<Revenue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ description: '', amount: '', type: '' });
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRevenue = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/revenues/find/${id}`);
        const data = await res.json();
        if (data.revenue) {
          setRevenue(data.revenue);
          setForm({
            description: data.revenue.description || '',
            amount: data.revenue.amount?.toString() || '',
            type: data.revenue.type || '',
          });
        } else {
          setError('لم يتم العثور على الإيراد');
        }
      } catch {
        setError('خطأ في الاتصال بالخادم');
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch(`/api/revenues/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.description,
          amount: Number(form.amount),
          type: form.type,
        }),
      });
      const data = await res.json();
      if (data.revenue) {
        navigate('/revenues-list');
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
  if (!revenue) return null;

  return (
    <div className="container">
      <h1>تعديل الإيراد</h1>
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

export default RevenueEdit; 