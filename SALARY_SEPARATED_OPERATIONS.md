# نظام الرواتب - العمليات المنفصلة

## نظرة عامة
تم فصل عمليات الرواتب إلى عمليات منفصلة لسهولة الاستخدام والتحكم.

## العمليات الجديدة

### 1. تحديث بيانات الراتب فقط
**الوصف:** تحديث البيانات مثل الحوافز، الخصومات، أيام الغياب، إلخ.

**الـ Route:**
```
PUT /api/workers/salaries/:id/data
```

**البيانات المطلوبة:**
```json
{
  "basicSalary": 1200,
  "absenceDays": 2,
  "incentives": 100,
  "deductions": 50,
  "withdrawals": 0,
  "notes": "ملاحظات حول الراتب"
}
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم تحديث بيانات الراتب بنجاح",
  "data": {
    "_id": "salary_id",
    "workerName": "اسم الموظف",
    "year": 2025,
    "month": 8,
    "basicSalary": 1200,
    "absenceDays": 2,
    "incentives": 100,
    "deductions": 50,
    "withdrawals": 0,
    "finalSalary": 1250,
    "isPaid": false,
    "notes": "ملاحظات حول الراتب"
  }
}
```

### 2. دفع الراتب
**الوصف:** تغيير حالة الراتب إلى "مدفوع" وإنشاء سجلات الدفع والمصروفات.

**الـ Route:**
```
POST /api/workers/salaries/mark-paid
```

**البيانات المطلوبة:**
```json
{
  "salaryId": "salary_id",
  "paymentMethod": "cash",
  "notes": "دفع نقدي",
  "adminId": "admin_id"
}
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم دفع الراتب بنجاح",
  "data": {
    "_id": "salary_id",
    "workerName": "اسم الموظف",
    "year": 2025,
    "month": 8,
    "finalSalary": 1250,
    "isPaid": true,
    "paymentDate": "2025-08-06T10:30:00.000Z"
  }
}
```

### 3. إلغاء دفع الراتب
**الوصف:** تغيير حالة الراتب إلى "غير مدفوع" وحذف سجلات الدفع والمصروفات.

**الـ Route:**
```
POST /api/workers/salaries/mark-unpaid
```

**البيانات المطلوبة:**
```json
{
  "salaryId": "salary_id"
}
```

**الاستجابة:**
```json
{
  "success": true,
  "message": "تم إلغاء دفع الراتب بنجاح",
  "data": {
    "_id": "salary_id",
    "workerName": "اسم الموظف",
    "year": 2025,
    "month": 8,
    "finalSalary": 1250,
    "isPaid": false,
    "paymentDate": null
  }
}
```

## كيفية الاستخدام في Frontend

### 1. زر "تحديث البيانات"
```javascript
const updateSalaryData = async (salaryId, data) => {
  try {
    const response = await fetch(`/api/workers/salaries/${salaryId}/data`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    
    const result = await response.json();
    if (result.success) {
      // تحديث الواجهة
      console.log('تم تحديث البيانات بنجاح');
    }
  } catch (error) {
    console.error('خطأ في تحديث البيانات:', error);
  }
};
```

### 2. زر "دفع الراتب"
```javascript
const paySalary = async (salaryId, paymentData) => {
  try {
    const response = await fetch('/api/workers/salaries/mark-paid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        salaryId,
        paymentMethod: 'cash',
        notes: 'دفع نقدي',
        adminId: currentAdminId
      })
    });
    
    const result = await response.json();
    if (result.success) {
      // تحديث الواجهة
      console.log('تم دفع الراتب بنجاح');
    }
  } catch (error) {
    console.error('خطأ في دفع الراتب:', error);
  }
};
```

### 3. زر "إلغاء الدفع"
```javascript
const cancelSalaryPayment = async (salaryId) => {
  try {
    const response = await fetch('/api/workers/salaries/mark-unpaid', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ salaryId })
    });
    
    const result = await response.json();
    if (result.success) {
      // تحديث الواجهة
      console.log('تم إلغاء دفع الراتب بنجاح');
    }
  } catch (error) {
    console.error('خطأ في إلغاء دفع الراتب:', error);
  }
};
```

## مثال على الواجهة

```jsx
const SalaryForm = ({ salary, onUpdate }) => {
  const [formData, setFormData] = useState({
    basicSalary: salary.basicSalary,
    absenceDays: salary.absenceDays,
    incentives: salary.incentives,
    deductions: salary.deductions,
    withdrawals: salary.withdrawals,
    notes: salary.notes
  });

  const handleUpdateData = async () => {
    await updateSalaryData(salary._id, formData);
    onUpdate(); // تحديث الواجهة
  };

  const handlePaySalary = async () => {
    await paySalary(salary._id);
    onUpdate(); // تحديث الواجهة
  };

  const handleCancelPayment = async () => {
    await cancelSalaryPayment(salary._id);
    onUpdate(); // تحديث الواجهة
  };

  return (
    <div>
      {/* حقول البيانات */}
      <input 
        value={formData.basicSalary}
        onChange={(e) => setFormData({...formData, basicSalary: e.target.value})}
        placeholder="الراتب الأساسي"
      />
      {/* باقي الحقول */}
      
      {/* الأزرار */}
      <button onClick={handleUpdateData}>
        تحديث البيانات
      </button>
      
      {!salary.isPaid ? (
        <button onClick={handlePaySalary} className="pay-btn">
          دفع الراتب
        </button>
      ) : (
        <button onClick={handleCancelPayment} className="cancel-btn">
          إلغاء الدفع
        </button>
      )}
    </div>
  );
};
```

## المزايا

### ✅ **فصل العمليات**
- تحديث البيانات منفصل عن الدفع
- كل عملية لها وظيفة محددة

### ✅ **سهولة الاستخدام**
- أزرار واضحة لكل عملية
- رسائل واضحة للمستخدم

### ✅ **المرونة**
- يمكن تحديث البيانات بدون دفع
- يمكن إلغاء الدفع وإعادة الدفع

### ✅ **الأمان**
- التحقق من الحالة قبل كل عملية
- معالجة الأخطاء بشكل مناسب

## ملاحظات مهمة

1. **تحديث البيانات** لا يؤثر على حالة الدفع
2. **دفع الراتب** يتطلب أن يكون الراتب غير مدفوع مسبقاً
3. **إلغاء الدفع** يحذف سجلات الدفع والمصروفات
4. **العمليات القديمة** ما زالت متاحة للتوافق مع الكود القديم 