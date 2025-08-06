import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface Revenue {
  _id: string;
  amount: number;
  description: string;
  type: string;
  adminId?: string;
  createdAt: string;
}

const RevenuesList = () => {
  const [revenues, setRevenues] = useState<Revenue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { admin } = useAuth();

  const fetchRevenues = async () => {
    setLoading(true);
    try {
      const adminId = admin?._id || admin?.id;
      if (!adminId) {
        setRevenues([]);
        setLoading(false);
        return;
      }
      const res = await fetch(`/api/revenues/${adminId}`);
      const data = await res.json();
      if (data.revenues) {
        setRevenues(data.revenues);
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
    fetchRevenues();
    // eslint-disable-next-line
  }, [admin]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('هل أنت متأكد من حذف هذا الإيراد؟')) return;
    try {
      const res = await fetch(`/api/revenues/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.message) {
        setRevenues(revenues.filter(r => r._id !== id));
      } else {
        alert('فشل في حذف الإيراد');
      }
    } catch {
      alert('خطأ في الاتصال بالخادم');
    }
  };

  if (loading) return <div>جاري التحميل...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="container">
      <h1>سجل الإيرادات</h1>
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
            {revenues.length === 0 ? (
              <tr><td colSpan={5}>لا يوجد إيرادات</td></tr>
            ) : (
              revenues.map(revenue => (
                <tr key={revenue._id}>
                  <td>{revenue.description}</td>
                  <td><span className="amount-badge">{revenue.amount} ريال</span></td>
                  <td>{revenue.type}</td>
                  <td>{new Date(revenue.createdAt).toLocaleDateString('en-GB')}</td>
                  <td>
                    <button onClick={() => navigate(`/revenues/edit/${revenue._id}`)}>تعديل</button>
                    <button onClick={() => handleDelete(revenue._id)} style={{marginRight: 8, color: 'red'}}>حذف</button>
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

export default RevenuesList; 