import { useState, useEffect, useRef, useMemo } from 'react'
import { useExpenses } from '../hooks/useExpenses'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import './Expenses.css'
import './AddAdvance.css'

interface Worker {
  _id: string;
  name: string;
  job: string;
  basicSalary: number;
}

interface WorkerAdvanceRecord {
  _id: string;
  salaryId: string;
  amount: number;
  notes: string;
  month: number;
  year: number;
  createdAt: string;
  updatedAt?: string;
  adminName?: string;
  totalAdvance?: number | null;
  basicSalary?: number | null;
  finalSalary?: number | null;
}

const Expenses = () => {
  const { loading, createExpense } = useExpenses()
  const { admin, getToken } = useAuth()
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: ''
  })

  // AddAdvance states
  const [searchQuery, setSearchQuery] = useState('');
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  console.log(workers)
  const token = useMemo(() => getToken?.() ?? admin?.token ?? null, [admin, getToken]);
  const currentDate = useMemo(() => new Date(), []);
  const currentYearNumber = useMemo(() => currentDate.getFullYear(), [currentDate]);
  const currentMonthNumber = useMemo(() => currentDate.getMonth() + 1, [currentDate]);

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');
  const [workerAdvances, setWorkerAdvances] = useState<WorkerAdvanceRecord[]>([]);
  const [historyEditingId, setHistoryEditingId] = useState<string | null>(null);
  const [historyEditForm, setHistoryEditForm] = useState({ amount: '', notes: '' });

  const fetchWithAuth = (input: RequestInfo, init: RequestInit = {}) => {
    if (!token) {
      throw new Error('يجب تسجيل الدخول أولاً');
    }
    const headers = new Headers(init.headers || {});
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return fetch(input, { ...init, headers });
  };

  // Check if admin is moderator
  const isModerator = admin?.role === 'moderator';

  // Check if category is "رواتب"
  const isSalaryCategory = formData.category === 'رواتب';

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isSalaryCategory) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current && !searchInputRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSalaryCategory]);

  // Search workers when search query changes
  useEffect(() => {
    if (!isSalaryCategory) return;

    const trimmedQuery = searchQuery.trim();

    if (!token) {
      setWorkers([]);
      setShowDropdown(false);
      return;
    }

    if (selectedWorker && trimmedQuery === selectedWorker.name) {
      setWorkers([]);
      setShowDropdown(false);
      return;
    }

    const searchWorkers = async () => {
      if (trimmedQuery.length < 2) {
        setWorkers([]);
        setShowDropdown(false);
        return;
      }

      setIsSearching(true);
      try {
        const response = await fetchWithAuth(`/api/workers/search?name=${encodeURIComponent(trimmedQuery)}`);
        const data = await response.json();

        if (data.success) {
          setWorkers(data.data);
          setShowDropdown(data.data.length > 0);
        } else {
          setWorkers([]);
          setShowDropdown(false);
        }
      } catch (error) {
        console.error('Error searching workers:', error);
        toast.error('حدث خطأ في البحث عن الموظفين');
        setWorkers([]);
        setShowDropdown(false);
      } finally {
        setIsSearching(false);
      }
    };

    const timeoutId = setTimeout(searchWorkers, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedWorker, token, isSalaryCategory]);

  // Reset AddAdvance form when category changes
  useEffect(() => {
    if (!isSalaryCategory) {
      setSelectedWorker(null);
      setSearchQuery('');
      setAdvanceAmount('');
      setNotes('');
      setWorkers([]);
      setShowDropdown(false);
      setShowHistoryModal(false);
      setWorkerAdvances([]);
      setHistoryEditingId(null);
      setHistoryEditForm({ amount: '', notes: '' });
    }
  }, [isSalaryCategory]);

  // Handle worker selection
  const handleSelectWorker = (worker: Worker) => {
    setSelectedWorker(worker);
    setSearchQuery(worker.name);
    setShowDropdown(false);
    setWorkers([]);
    setShowHistoryModal(false);
    setWorkerAdvances([]);
    setHistoryError('');
    setHistoryEditingId(null);
    setHistoryEditForm({ amount: '', notes: '' });
  };

  const fetchWorkerAdvanceHistory = async (workerId: string) => {
    try {
      setHistoryLoading(true);
      setHistoryError('');
      const params = new URLSearchParams({
        workerId,
        month: currentMonthNumber.toString(),
        year: currentYearNumber.toString(),
      });
      const response = await fetchWithAuth(`/api/workers/salaries/advance-history?${params.toString()}`);
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'فشل في جلب سجل الصرفات');
      }

      setWorkerAdvances(data.data || []);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ في الاتصال بالخادم';
      setWorkerAdvances([]);
      setHistoryError(message);
      toast.error(message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const openHistoryModal = () => {
    if (!selectedWorker) return;
    setShowHistoryModal(true);
    setHistoryEditingId(null);
    setHistoryEditForm({ amount: '', notes: '' });
    fetchWorkerAdvanceHistory(selectedWorker._id);
  };

  const closeHistoryModal = () => {
    setShowHistoryModal(false);
    setHistoryEditingId(null);
    setHistoryEditForm({ amount: '', notes: '' });
    setHistoryError('');
  };

  const handleHistoryEdit = (entry: WorkerAdvanceRecord) => {
    setHistoryEditingId(entry._id);
    setHistoryEditForm({
      amount: entry.amount.toString(),
      notes: entry.notes || ''
    });
  };

  const handleHistoryCancelEdit = () => {
    setHistoryEditingId(null);
    setHistoryEditForm({ amount: '', notes: '' });
  };

  const handleHistoryUpdate = async (id: string) => {
    const entry = workerAdvances.find(item => item._id === id);
    if (!entry) return;

    const amountValue = Number(historyEditForm.amount);
    if (Number.isNaN(amountValue) || amountValue < 0) {
      toast.error('قيمة الصرفة يجب أن تكون أكبر من أو تساوي صفر');
      return;
    }

    if (entry.basicSalary !== null && entry.basicSalary !== undefined && amountValue > entry.basicSalary) {
      toast.error(`الصرفة (${amountValue}) لا يمكن أن تكون أكبر من الراتب الأساسي (${entry.basicSalary})`);
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/workers/salaries/advance/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          advance: amountValue,
          notes: historyEditForm.notes.trim() || undefined,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'خطأ في تحديث الصرفة');
      }

      toast.success('تم تحديث الصرفة بنجاح');
      setHistoryEditingId(null);
      setHistoryEditForm({ amount: '', notes: '' });
      if (selectedWorker) {
        fetchWorkerAdvanceHistory(selectedWorker._id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ في الاتصال بالخادم';
      toast.error(message);
    }
  };

  const handleHistoryDelete = async (id: string) => {
    const entry = workerAdvances.find(item => item._id === id);
    if (!entry) return;

    if (!confirm('هل أنت متأكد من حذف هذه الصرفة؟')) return;

    try {
      const response = await fetchWithAuth(`/api/workers/salaries/advance/${id}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.message || 'خطأ في حذف الصرفة');
      }

      toast.success('تم حذف الصرفة بنجاح');
      if (selectedWorker) {
        fetchWorkerAdvanceHistory(selectedWorker._id);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'حدث خطأ في الاتصال بالخادم';
      toast.error(message);
    }
  };

  const formatDateTime = (dateString: string) =>
    new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });

  const formatMonthLabel = (month: number, year: number) =>
    new Date(year, month - 1).toLocaleDateString('ar-EG', { month: 'long' });

  // Handle form submission for regular expenses
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isSalaryCategory) {
      // Handle salary advance submission
      handleAdvanceSubmit(e);
      return;
    }

    const result = await createExpense(formData)

    if (result.success) {
      // مسح البيانات من الفورم بعد النجاح
      setFormData({
        description: '',
        amount: '',
        category: ''
      })
    }
  }

  // Handle advance submission
  const handleAdvanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isModerator) {
      toast.error('غير مصرح لك بإضافة الصرفة. هذه الميزة متاحة للأدمن العادي فقط');
      return;
    }

    if (!selectedWorker) {
      toast.error('يرجى اختيار موظف');
      return;
    }

    if (!advanceAmount || Number(advanceAmount) <= 0) {
      toast.error('يرجى إدخال قيمة الصرفة');
      return;
    }

    const advance = Number(advanceAmount);
    if (advance > selectedWorker.basicSalary) {
      toast.error(`الصرفة (${advance}) لا يمكن أن تكون أكبر من الراتب الأساسي (${selectedWorker.basicSalary})`);
      return;
    }

    if (!token) {
      toast.error('يجب تسجيل الدخول أولاً');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetchWithAuth('/api/workers/salaries/advance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workerId: selectedWorker._id,
          advance: advance,
          notes: notes.trim() || undefined
        })
      });

      await response.json();

      // Reset form
      setSelectedWorker(null);
      setSearchQuery('');
      setAdvanceAmount('');
      setNotes('');
      setWorkers([]);
      setShowHistoryModal(false);
      setWorkerAdvances([]);
      setHistoryEditingId(null);
      setHistoryEditForm({ amount: '', notes: '' });

      if (showHistoryModal) {
        fetchWorkerAdvanceHistory(selectedWorker._id);
      }
    } catch (error) {
      console.error('Error adding advance:', error);
      const message = error instanceof Error ? error.message : 'حدث خطأ في الاتصال بالخادم';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedWorker(null);
    setSearchQuery('');
    setWorkers([]);
    setShowDropdown(false);
    setShowHistoryModal(false);
    setWorkerAdvances([]);
    setHistoryError('');
    setHistoryEditingId(null);
    setHistoryEditForm({ amount: '', notes: '' });
    setHistoryLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  return (
    <>
      <h1>إدارة المصروفات</h1>

      <div className="container expenses pb-0" style={{ paddingBottom: 0 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="description">وصف المصروف</label>
              <input
                type="text"
                id="description"
                name="description"
                placeholder="أدخل وصف المصروف"
                value={formData.description}
                onChange={handleInputChange}
                required={!isSalaryCategory}
                disabled={isSalaryCategory}
              />
            </div>

            <div className="form-group">
              <label htmlFor="amount">المبلغ (ريال)</label>
              <input
                type="number"
                id="amount"
                name="amount"
                placeholder="0"
                min="0"
                step="0.01"
                value={formData.amount}
                onChange={handleInputChange}
                required={!isSalaryCategory}
                disabled={isSalaryCategory}
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">الفئة</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
              >
                <option value="">اختر الفئة</option>
                <option value="رواتب">رواتب</option>
                <option value="إيجار">إيجار</option>
                <option value="كهرباء">كهرباء</option>
                <option value="مياه">مياه</option>
                <option value="صيانة">صيانة</option>
                <option value="مشتريات">مشتريات</option>
                <option value="أخرى">أخرى</option>
              </select>
            </div>
          </div>

          {!isSalaryCategory && (
            <button
              className='max-w-[400px] !mx-auto w-full mx-auto'
              type="submit"
              style={{ margin: "auto", minWidth: "300px", background: "linear-gradient(98deg, #24324e 0%, #3f4b8e 100%)" }}
              disabled={loading}
            >
              {loading ? 'جاري الإضافة...' : 'إضافة مصروف'}
            </button>
          )}
        </form>
      </div>

      {/* Show AddAdvance content when category is "رواتب" */}
      {isSalaryCategory && (
        <>
          {!isModerator ? (
            <div className="add-advance-container">
              <div className="access-denied">
                <h2>غير مسموح بالوصول</h2>
                <p>هذه الميزة متاحة للأدمن العادي فقط</p>
              </div>
            </div>
          ) : (
            <div className="add-advance-container !pt-0">
              <div className="add-advance-header">
                <h1>إضافة صرفة للموظف</h1>
                <p>أضف صرفة للموظفين للشهر الحالي</p>
                <div className="current-month-info">
                  الشهر الحالي: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })}
                </div>
              </div>

              <div className="add-advance-form-container">
                <form onSubmit={handleAdvanceSubmit} className="add-advance-form">
                  {/* Worker Search */}
                  <div className="form-group">
                    <label htmlFor="workerSearch" className="form-label">
                      اسم الموظف <span className="required">*</span>
                    </label>
                    <div className="search-container" ref={dropdownRef}>
                      <input
                        type="text"
                        id="workerSearch"
                        ref={searchInputRef}
                        className="form-input"
                        placeholder="ابحث عن الموظف بالاسم..."
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSelectedWorker(null);
                        }}
                        onFocus={() => {
                          if (workers.length > 0) {
                            setShowDropdown(true);
                          }
                        }}
                        required
                      />


                      {/* Dropdown */}
                      {showDropdown && workers.length > 0 && (
                        <div className="workers-dropdown">
                          {selectedWorker && (
                            <button
                              type="button"
                              onClick={handleClearSelection}
                              className="clear-button"
                              title="مسح الاختيار"
                            >
                              ✕
                            </button>
                          )}
                          {isSearching ? (
                            <div className="dropdown-loading">جاري البحث...</div>
                          ) : (
                            workers.map((worker) => (
                              <div
                                key={worker._id}
                                className="dropdown-item"
                                onClick={() => handleSelectWorker(worker)}
                              >
                                <div className="worker-name">{worker.name}</div>
                                <div className="worker-info">
                                  <span className="worker-job">{worker.job}</span>
                                  <span className="worker-salary">الراتب: {worker.basicSalary} ريال</span>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>

                    {selectedWorker && (
                      <div className="selected-worker-info">
                        <div className="info-item">
                          <span className="info-label">الاسم:</span>
                          <span className="info-value">{selectedWorker.name}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">الوظيفة:</span>
                          <span className="info-value">{selectedWorker.job}</span>
                        </div>
                        <div className="info-item">
                          <span className="info-label">الراتب الأساسي:</span>
                          <span className="info-value">{selectedWorker.basicSalary} ريال</span>
                        </div>
                        <div className="selected-worker-actions">
                          <button
                            type="button"
                            className="history-button"
                            onClick={openHistoryModal}
                          >
                            عرض سجل الصرفات لهذا الشهر
                          </button>
                          <button
                            type="button"
                            className="clear-selection-button"
                            onClick={handleClearSelection}
                          >
                            مسح الاختيار
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Advance Amount */}
                  <div className="form-group">
                    <label htmlFor="advanceAmount" className="form-label">
                      قيمة الصرفة (ريال) <span className="required">*</span>
                    </label>
                    <input
                      type="number"
                      id="advanceAmount"
                      className="form-input"
                      placeholder="0"
                      min="0"
                      max={selectedWorker?.basicSalary || ''}
                      step="0.01"
                      value={advanceAmount}
                      onChange={(e) => {
                        const value = e.target.value;
                        setAdvanceAmount(value);
                        // Validate that advance doesn't exceed basic salary
                        if (selectedWorker) {
                          const advanceNum = Number(value);
                          if (advanceNum > selectedWorker.basicSalary) {
                            toast.error(`الصرفة لا يمكن أن تكون أكبر من الراتب الأساسي (${selectedWorker.basicSalary})`);
                          }
                        }
                      }}
                      required
                    />
                    {selectedWorker && (
                      <div className="form-hint">
                        الحد الأقصى: {selectedWorker.basicSalary} ريال
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="form-group">
                    <label htmlFor="notes" className="form-label">
                      الوصف أو الملاحظات
                    </label>
                    <textarea
                      id="notes"
                      className="form-textarea"
                      rows={4}
                      placeholder="أضف وصف أو ملاحظات حول الصرفة (اختياري)..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Submit Button */}
                  <div className="form-actions">
                    <button
                      type="submit"
                      className="submit-button"
                      disabled={isSubmitting || !selectedWorker || !advanceAmount}
                    >
                      {isSubmitting ? 'جاري الإضافة...' : 'إضافة الصرفة'}
                    </button>
                  </div>
                </form>
              </div>

              {showHistoryModal && selectedWorker && (
                <div className="advance-history-overlay">
                  <div className="advance-history-modal">
                    <div className="advance-history-modal__header">
                      <h2>سجل صرفات {selectedWorker.name} لشهر {formatMonthLabel(currentMonthNumber, currentYearNumber)} {currentYearNumber}</h2>
                      <button type="button" className="modal-close-button" onClick={closeHistoryModal}>
                        ✕
                      </button>
                    </div>
                    <div className="advance-history-modal__body">
                      {historyLoading ? (
                        <div className="loading-container">
                          <div className="loading-spinner"></div>
                          <p>جاري التحميل...</p>
                        </div>
                      ) : historyError ? (
                        <div className="error-message">{historyError}</div>
                      ) : workerAdvances.length === 0 ? (
                        <div className="no-advances modal-empty-state">
                          <div className="no-advances-icon">💰</div>
                          <h3>لا توجد صرفات</h3>
                          <p>لم يتم إضافة أي صرفات لهذا الموظف خلال الشهر الحالي</p>
                        </div>
                      ) : (
                        <div className="modal-table-wrapper">
                          <table className="modal-advance-table">
                            <thead>
                              <tr>
                                <th>المبلغ</th>
                                <th>إجمالي الشهر</th>
                                <th>الراتب الأساسي</th>
                                <th>الراتب النهائي</th>
                                <th>الوصف/الملاحظات</th>
                                <th>تاريخ الإضافة</th>
                                <th>آخر تحديث</th>
                                <th>المشرف</th>
                                <th>الإجراءات</th>
                              </tr>
                            </thead>
                            <tbody>
                              {workerAdvances.map(entry => {
                                const isEditing = historyEditingId === entry._id;
                                const totalLabel = entry.totalAdvance !== null && entry.totalAdvance !== undefined
                                  ? `${entry.totalAdvance.toLocaleString()} ريال`
                                  : '--';
                                const basicLabel = entry.basicSalary !== null && entry.basicSalary !== undefined
                                  ? `${entry.basicSalary.toLocaleString()} ريال`
                                  : '--';
                                const finalLabel = entry.finalSalary !== null && entry.finalSalary !== undefined
                                  ? `${entry.finalSalary.toLocaleString()} ريال`
                                  : '--';
                                const adminName = entry.adminName || 'غير محدد';

                                if (isEditing) {
                                  const currentTotal = entry.totalAdvance ?? 0;
                                  const previewTotal = currentTotal - entry.amount + Number(historyEditForm.amount || 0);

                                  return (
                                    <tr key={entry._id}>
                                      <td>
                                        <input
                                          type="number"
                                          className="edit-input"
                                          min="0"
                                          max={entry.basicSalary ?? undefined}
                                          value={historyEditForm.amount}
                                          onChange={e => setHistoryEditForm({ ...historyEditForm, amount: e.target.value })}
                                        />
                                      </td>
                                      <td>
                                        {entry.totalAdvance !== null && entry.totalAdvance !== undefined
                                          ? `${previewTotal.toLocaleString()} ريال`
                                          : '--'}
                                      </td>
                                      <td>{basicLabel}</td>
                                      <td>{finalLabel}</td>
                                      <td>
                                        <textarea
                                          className="edit-textarea"
                                          rows={2}
                                          value={historyEditForm.notes}
                                          onChange={e => setHistoryEditForm({ ...historyEditForm, notes: e.target.value })}
                                          placeholder="الوصف أو الملاحظات..."
                                        />
                                      </td>
                                      <td>{formatDateTime(entry.createdAt)}</td>
                                      <td>{formatDateTime(entry.updatedAt || entry.createdAt)}</td>
                                      <td>{adminName}</td>
                                      <td>
                                        <div className="edit-actions">
                                          <button className="save-btn" onClick={() => handleHistoryUpdate(entry._id)}>
                                            حفظ
                                          </button>
                                          <button className="cancel-btn" onClick={handleHistoryCancelEdit}>
                                            إلغاء
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }

                                return (
                                  <tr key={entry._id}>
                                    <td>{`${entry.amount.toLocaleString()} ريال`}</td>
                                    <td>{totalLabel}</td>
                                    <td>{basicLabel}</td>
                                    <td>{finalLabel}</td>
                                    <td>
                                      <div className="notes-cell">
                                        {entry.notes ? (
                                          <span className="notes-text" title={entry.notes}>
                                            {entry.notes.length > 50 ? `${entry.notes.substring(0, 50)}...` : entry.notes}
                                          </span>
                                        ) : (
                                          <span className="no-notes">لا يوجد وصف</span>
                                        )}
                                      </div>
                                    </td>
                                    <td>{formatDateTime(entry.createdAt)}</td>
                                    <td>{formatDateTime(entry.updatedAt || entry.createdAt)}</td>
                                    <td>{adminName}</td>
                                    <td>
                                      <div className="action-buttons">
                                        <button className="edit-button" onClick={() => handleHistoryEdit(entry)} title="تعديل">
                                          ✏️
                                        </button>
                                        <button className="delete-button" onClick={() => handleHistoryDelete(entry._id)} title="حذف">
                                          🗑️
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </>
  )
}

export default Expenses 