# نظام إدارة الموظفين والرواتب

## نظرة عامة

تم إنشاء نظام منفصل لإدارة الموظفين والرواتب بحيث:

1. **البيانات الأساسية للموظف** محفوظة في `Worker` model
2. **الرواتب الشهرية** محفوظة في `Salary` model  
3. **المدفوعات الفعلية** محفوظة في `SalaryPayment` model
4. **المصروفات** تبقى محفوظة حتى لو تم حذف الموظف

## المميزات

### ✅ الحفاظ على البيانات التاريخية
- عند حذف موظف، تبقى جميع الرواتب والمصروفات محفوظة
- يمكن تتبع تاريخ الرواتب لكل موظف
- إحصائيات شاملة للمصروفات

### ✅ إدارة مرنة للرواتب
- تحديث الرواتب شهرياً
- حساب تلقائي للراتب النهائي
- تتبع الحوافز والخصومات والسحبيات

### ✅ نظام دفع متكامل
- تسجيل المدفوعات الفعلية
- ربط تلقائي بالمصروفات
- تتبع طرق الدفع المختلفة

## Models

### 1. Worker Model
```javascript
{
  name: String,           // اسم الموظف
  job: String,           // الوظيفة
  basicSalary: Number,   // الراتب الأساسي
  identityNumber: String, // رقم الهوية (فريد)
  isActive: Boolean,     // حالة الموظف
  timestamps: true
}
```

### 2. Salary Model
```javascript
{
  workerId: ObjectId,    // ربط بالموظف
  year: Number,          // السنة
  month: Number,         // الشهر
  basicSalary: Number,   // الراتب الأساسي
  absenceDays: Number,   // أيام الغياب
  incentives: Number,    // الحوافز
  deductions: Number,    // الخصومات
  withdrawals: Number,   // السحبيات
  finalSalary: Number,   // الراتب النهائي
  isPaid: Boolean,       // تم الدفع؟
  paymentDate: Date,     // تاريخ الدفع
  notes: String,         // ملاحظات
  timestamps: true
}
```

### 3. SalaryPayment Model
```javascript
{
  salaryId: ObjectId,    // ربط بالراتب
  workerId: ObjectId,    // ربط بالموظف
  workerName: String,    // اسم الموظف (محفوظ)
  workerJob: String,     // الوظيفة (محفوظة)
  year: Number,          // السنة
  month: Number,         // الشهر
  amount: Number,        // المبلغ المدفوع
  paymentMethod: String, // طريقة الدفع
  adminId: ObjectId,     // ربط بالإداري
  notes: String,         // ملاحظات
  timestamps: true
}
```

## API Endpoints

### إدارة الموظفين

#### إنشاء موظف جديد
```http
POST /api/workers
Content-Type: application/json

{
  "name": "أحمد محمد",
  "job": "مصمم",
  "basicSalary": 3000,
  "identityNumber": "1234567890"
}
```

#### جلب جميع الموظفين
```http
GET /api/workers
```

#### جلب موظف محدد
```http
GET /api/workers/:id
```

#### تحديث بيانات موظف
```http
PUT /api/workers/:id
Content-Type: application/json

{
  "name": "أحمد محمد علي",
  "job": "مصمم جرافيك",
  "basicSalary": 3500,
  "identityNumber": "1234567890"
}
```

#### حذف موظف (soft delete)
```http
DELETE /api/workers/:id
```

#### تاريخ رواتب موظف
```http
GET /api/workers/:id/salary-history?year=2024&month=12
```

### إدارة الرواتب

#### إنشاء/تحديث راتب
```http
POST /api/salaries
Content-Type: application/json

{
  "workerId": "worker_id_here",
  "year": 2024,
  "month": 12,
  "basicSalary": 3000,
  "absenceDays": 2,
  "incentives": 500,
  "deductions": 100,
  "withdrawals": 200,
  "notes": "راتب شهر ديسمبر"
}
```

#### دفع راتب
```http
POST /api/salaries/pay
Content-Type: application/json

{
  "salaryId": "salary_id_here",
  "paymentMethod": "cash",
  "notes": "تم الدفع نقداً",
  "adminId": "admin_id_here"
}
```

#### جلب رواتب شهر محدد
```http
GET /api/salaries?year=2024&month=12
```

#### جلب راتب محدد
```http
GET /api/salaries/:id
```

#### سجل المدفوعات
```http
GET /api/salary-payments?year=2024&month=12&workerId=worker_id_here
```

#### إحصائيات الرواتب
```http
GET /api/salary-stats?year=2024&month=12
```

## مثال على الاستخدام

### 1. إنشاء موظف جديد
```javascript
const newWorker = await fetch('/api/workers', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'أحمد محمد',
    job: 'مصمم',
    basicSalary: 3000,
    identityNumber: '1234567890'
  })
});
```

### 2. تسجيل راتب شهر ديسمبر
```javascript
const salary = await fetch('/api/salaries', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    workerId: 'worker_id',
    year: 2024,
    month: 12,
    basicSalary: 3000,
    absenceDays: 2,
    incentives: 500,
    deductions: 100,
    withdrawals: 200
  })
});
```

### 3. دفع الراتب
```javascript
const payment = await fetch('/api/salaries/pay', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    salaryId: 'salary_id',
    paymentMethod: 'cash',
    adminId: 'admin_id'
  })
});
```

## المزايا الأمنية

1. **Soft Delete**: الموظفين لا يتم حذفهم نهائياً، بل يتم تعطيلهم فقط
2. **حفظ البيانات التاريخية**: جميع الرواتب والمصروفات تبقى محفوظة
3. **التحقق من البيانات**: التحقق من عدم تكرار رقم الهوية
4. **ربط آمن**: ربط آمن بين جميع الجداول

## الاستعلامات المفيدة

### جلب إجمالي رواتب الشهر
```javascript
GET /api/salary-stats?year=2024&month=12
```

### جلب تاريخ رواتب موظف
```javascript
GET /api/workers/:id/salary-history
```

### جلب سجل المدفوعات
```javascript
GET /api/salary-payments?year=2024
``` 