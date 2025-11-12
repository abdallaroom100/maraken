import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../hooks/useAuth';
import './AdvanceHistory.css';

interface AdvanceRecord {
  _id: string;
  salaryId: string;
  workerId?: string;
  workerName: string;
  workerJob: string;
  amount: number;
  totalAdvance?: number | null;
  basicSalary?: number | null;
  finalSalary?: number | null;
  notes: string;
  createdAt: string;
  updatedAt?: string;
  month: number;
  year: number;
  adminId?: string | null;
  adminName?: string;
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
  { value: '12', label: 'ديسمبر' }
];

const getMonthLabel = (value: string | number) => {
  const lookupValue = value.toString();
  return monthOptions.find(option => option.value === lookupValue)?.label || lookupValue;
};

const AdvanceHistory = () => {
  const { admin, getToken } = useAuth();
  const isModerator = admin?.role === 'moderator';
  const isManager = admin?.role === 'manager';

  const currentDate = useMemo(() => new Date(), []);
  const currentYearValue = useMemo(() => currentDate.getFullYear().toString(), [currentDate]);
  const currentMonthValue = useMemo(() => (currentDate.getMonth() + 1).toString(), [currentDate]);

  const [advances, setAdvances] = useState<AdvanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ advance: '', notes: '' });
  const [errorMessage, setErrorMessage] = useState('');
  const [admins, setAdmins] = useState<AdminOption[]>([]);
  const [isFetchingAdmins, setIsFetchingAdmins] = useState(false);
  const [filters, setFilters] = useState({
    adminId: '',
    month: currentMonthValue,
    year: currentYearValue
  });

  const token = useMemo(() => getToken?.() ?? admin?.token ?? null, [admin, getToken]);

  useEffect(() => {
    setFilters(prev => {
      const desiredMonth = isManager ? '' : currentMonthValue;
      if (prev.month === desiredMonth) {
        return prev;
      }
      return {
        ...prev,
        month: desiredMonth
      };
    });
  }, [isManager, currentMonthValue]);

  useEffect(() => {
    if (!isManager) {
      setFilters(prev => (prev.adminId === '' ? prev : { ...prev, adminId: '' }));
    }
  }, [isManager]);

  const fetchAdmins = async () => {
    if (!isManager || !token) return;

    setIsFetchingAdmins(true);
    try {
      const response = await fetch('/api/admin?role=moderator', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'فشل في تحميل قائمة المشرفين');
      }

      setAdmins(data.admins || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ في تحميل قائمة المشرفين';
      toast.error(message);
    } finally {
      setIsFetchingAdmins(false);
    }
  };

  const fetchAdvanceHistory = async () => {
    if (!token) {
      setAdvances([]);
      setErrorMessage('يجب تسجيل الدخول أولاً');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const params = new URLSearchParams();

      if (filters.month) {
        params.append('month', filters.month);
      }
      if (filters.year) {
        params.append('year', filters.year);
      }
      if (isManager && filters.adminId) {
        params.append('adminId', filters.adminId);
      }

      const queryString = params.toString();
      const url = queryString
        ? `/api/workers/salaries/advance-history?${queryString}`
        : '/api/workers/salaries/advance-history';

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'فشل في جلب سجل الصرفات');
      }

      setAdvances(data.data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ في الاتصال بالخادم';
      setAdvances([]);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isManager) {
      fetchAdmins();
    }
  }, [isManager, token]);

  useEffect(() => {
    fetchAdvanceHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, filters.adminId, filters.month, filters.year, isManager, isModerator]);

  const handleFilterChange = (event: ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = event.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      adminId: '',
      month: isManager ? '' : currentMonthValue,
      year: currentYearValue
    });
  };

  const handleEdit = (advance: AdvanceRecord) => {
    if (!isModerator) return;

    setEditingId(advance._id);
    setEditForm({
      advance: advance.amount.toString(),
      notes: advance.notes || ''
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ advance: '', notes: '' });
  };

  const handleUpdate = async (id: string) => {
    if (!isModerator) return;

    const advanceAmount = Number(editForm.advance);
    const advance = advances.find(a => a._id === id);

    if (!advance) return;

    if (Number.isNaN(advanceAmount) || advanceAmount < 0) {
      toast.error('قيمة الصرفة يجب أن تكون أكبر من أو تساوي صفر');
      return;
    }

    if (advance.basicSalary !== null && advance.basicSalary !== undefined && advanceAmount > advance.basicSalary) {
      toast.error(`الصرفة (${advanceAmount}) لا يمكن أن تكون أكبر من الراتب الأساسي (${advance.basicSalary})`);
      return;
    }

    if (!token) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      const response = await fetch(`/api/workers/salaries/advance/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          advance: advanceAmount,
          notes: editForm.notes.trim() || undefined
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'خطأ في تحديث الصرفة');
      }

      toast.success('تم تحديث الصرفة بنجاح');
      setEditingId(null);
      setEditForm({ advance: '', notes: '' });
      fetchAdvanceHistory();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ في الاتصال بالخادم';
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!isModerator) return;
    if (!confirm('هل أنت متأكد من حذف هذه الصرفة؟')) return;

    if (!token) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    try {
      const response = await fetch(`/api/workers/salaries/advance/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'خطأ في حذف الصرفة');
      }

      toast.success('تم حذف الصرفة بنجاح');
      fetchAdvanceHistory();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ في الاتصال بالخادم';
      toast.error(message);
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

  const periodDescription = filters.month
    ? `${getMonthLabel(filters.month)} ${filters.year || currentYearValue}`
    : filters.year
      ? `السنة: ${filters.year}`
      : 'كل السنوات';

  if (!isModerator && !isManager) {
    return (
      <div className="advance-history-container">
        <div className="access-denied">
          <h2>غير مسموح بالوصول</h2>
          <p>هذه الصفحة متاحة للمشرفين والمدير فقط</p>
        </div>
      </div>
    );
  }

  return (
    <div className="advance-history-container">
      <div className="advance-history-header">
        <h1>سجل الصرفات</h1>
        <p>
          {isManager
            ? 'يمكنك عرض جميع الصرفات وتصفيتها حسب المشرف أو الشهر أو السنة'
            : `عرض الصرفات للفترة: ${periodDescription}`}
        </p>
      </div>

      <div className="filters-card" style={{ marginBottom: 24 }}>
        <h2 style={{ marginBottom: 16 }}>تصفية الصرفات</h2>
        <div className="filters-grid" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
          {isManager && (
            <div className="form-group" style={{ minWidth: 220 }}>
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
          )}

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
              placeholder="مثال: 2025"
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

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>جاري التحميل...</p>
        </div>
      ) : errorMessage ? (
        <div className="error-message">{errorMessage}</div>
      ) : advances.length === 0 ? (
        <div className="no-advances">
          <div className="no-advances-icon">💰</div>
          <h3>لا توجد صرفات</h3>
          <p>لم يتم إضافة أي صرفات للفترة المحددة</p>
        </div>
      ) : (
        <div className="advances-table-container">
          <table className="advances-table">
            <thead>
              <tr>
                <th>اسم الموظف</th>
                <th>الوظيفة</th>
                <th>الصرفة</th>
                <th>إجمالي الصرفات للشهر</th>
                <th>الراتب الأساسي</th>
                <th>الراتب النهائي</th>
                <th>الوصف/الملاحظات</th>
                <th>الشهر</th>
                <th>السنة</th>
                {isManager && <th>المشرف</th>}
                <th>آخر تحديث</th>
                {isModerator && <th>الإجراءات</th>}
              </tr>
            </thead>
            <tbody>
              {advances.map(advance => {
                const isEditing = isModerator && editingId === advance._id;
                const monthLabel = getMonthLabel(advance.month);
                const lastUpdated = formatDate(advance.updatedAt || advance.createdAt);
                const adminName = advance.adminName || 'غير محدد';
                const basicSalaryLabel = advance.basicSalary !== null && advance.basicSalary !== undefined
                  ? `${advance.basicSalary.toLocaleString()} ريال`
                  : '--';
                const finalSalaryLabel = advance.finalSalary !== null && advance.finalSalary !== undefined
                  ? `${advance.finalSalary.toLocaleString()} ريال`
                  : '--';
                const totalAdvanceLabel = advance.totalAdvance !== null && advance.totalAdvance !== undefined
                  ? `${advance.totalAdvance.toLocaleString()} ريال`
                  : '--';

                if (isEditing) {
                  const currentTotal = advance.totalAdvance ?? 0;
                  const previewTotal = currentTotal - advance.amount + Number(editForm.advance || 0);

                  return (
                    <tr key={advance._id}>
                      <td>{advance.workerName}</td>
                      <td>{advance.workerJob}</td>
                      <td>
                        <input
                          type="number"
                          className="edit-input"
                          min="0"
                          max={advance.basicSalary ?? undefined}
                          value={editForm.advance}
                          onChange={e => setEditForm({ ...editForm, advance: e.target.value })}
                        />
                      </td>
                      <td>
                        {advance.totalAdvance !== null && advance.totalAdvance !== undefined
                          ? `${previewTotal.toLocaleString()} ريال`
                          : '--'}
                      </td>
                      <td>{basicSalaryLabel}</td>
                      <td>
                        {advance.finalSalary !== null && advance.finalSalary !== undefined
                          ? `${advance.finalSalary.toLocaleString()} ريال`
                          : '--'}
                      </td>
                      <td>
                        <textarea
                          className="edit-textarea"
                          rows={2}
                          value={editForm.notes}
                          onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                          placeholder="الوصف أو الملاحظات..."
                        />
                      </td>
                      <td>{monthLabel}</td>
                      <td>{advance.year}</td>
                      {isManager && <td>{adminName}</td>}
                      <td>{lastUpdated}</td>
                      {isModerator && (
                        <td>
                          <div className="edit-actions">
                            <button className="save-btn" onClick={() => handleUpdate(advance._id)}>
                              حفظ
                            </button>
                            <button className="cancel-btn" onClick={handleCancelEdit}>
                              إلغاء
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                }

                return (
                  <tr key={advance._id}>
                    <td>
                      <div className="worker-cell">
                        <span className="worker-avatar">👤</span>
                        <span className="worker-name">{advance.workerName}</span>
                      </div>
                    </td>
                    <td>{advance.workerJob}</td>
                    <td>
                      <span className="advance-amount">{advance.amount.toLocaleString()} ريال</span>
                    </td>
                    <td>{totalAdvanceLabel}</td>
                    <td>{basicSalaryLabel}</td>
                    <td>
                      <span className="final-salary">{finalSalaryLabel}</span>
                    </td>
                    <td>
                      <div className="notes-cell">
                        {advance.notes ? (
                          <span className="notes-text" title={advance.notes}>
                            {advance.notes.length > 50 ? `${advance.notes.substring(0, 50)}...` : advance.notes}
                          </span>
                        ) : (
                          <span className="no-notes">لا يوجد وصف</span>
                        )}
                      </div>
                    </td>
                    <td>{monthLabel}</td>
                    <td>{advance.year}</td>
                    {isManager && <td>{adminName}</td>}
                    <td>{lastUpdated}</td>
                    {isModerator && (
                      <td>
                        <div className="action-buttons">
                          <button className="edit-button" onClick={() => handleEdit(advance)} title="تعديل">
                            ✏️
                          </button>
                          <button className="delete-button" onClick={() => handleDelete(advance._id)} title="حذف">
                            🗑️
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdvanceHistory;

