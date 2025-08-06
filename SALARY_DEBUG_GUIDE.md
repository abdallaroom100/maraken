# دليل استكشاف أخطاء دفع الرواتب

## المشكلة
النظام يقول "تم تحديث البيانات" لكن الراتب لا يتم دفعه فعلياً.

## خطوات الاستكشاف

### 1. التحقق من سجلات الخادم
```bash
# في terminal الخادم، راقب السجلات:
npm start
```

ابحث عن هذه الرسائل في السجلات:
- `Pay salary request:`
- `Found salary:`
- `Creating new payment record:`
- `Payment record saved successfully`
- `Salary marked as paid`
- `Expense record saved successfully`

### 2. التحقق من قاعدة البيانات مباشرة

#### أ. التحقق من جدول الرواتب
```javascript
// في MongoDB Compass أو terminal
db.salaries.findOne({ _id: ObjectId("salary_id_here") })
```

#### ب. التحقق من جدول مدفوعات الرواتب
```javascript
db.salarypayments.findOne({ salaryId: ObjectId("salary_id_here") })
```

#### ج. التحقق من جدول المصروفات
```javascript
db.expenses.findOne({ type: "salary", workerId: ObjectId("worker_id_here") })
```

### 3. اختبار API مباشرة

#### أ. دفع الراتب
```bash
curl -X POST http://localhost:5000/api/workers/salaries/pay \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "salaryId": "salary_id_here",
    "paymentMethod": "cash",
    "notes": "دفع تجريبي",
    "adminId": null
  }'
```

#### ب. التحقق من حالة الدفع
```bash
curl -X GET http://localhost:5000/api/workers/salaries/salary_id_here/payment-status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. المشاكل المحتملة والحلول

#### المشكلة 1: خطأ في التوكن
**الأعراض:** خطأ 401 Unauthorized
**الحل:** تأكد من صحة التوكن في الطلب

#### المشكلة 2: خطأ في ID الراتب
**الأعراض:** خطأ 404 Not Found
**الحل:** تأكد من صحة ID الراتب

#### المشكلة 3: خطأ في قاعدة البيانات
**الأعراض:** خطأ 500 Internal Server Error
**الحل:** تحقق من سجلات الخادم للحصول على تفاصيل الخطأ

#### المشكلة 4: مشكلة في البيانات
**الأعراض:** الراتب لا يتم تحديثه
**الحل:** استخدم دالة `check-payment` لإصلاح البيانات

### 5. دالة إصلاح البيانات

```bash
curl -X POST http://localhost:5000/api/workers/salaries/check-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "salaryId": "salary_id_here"
  }'
```

### 6. إعادة تعيين حالة الدفع

```bash
curl -X POST http://localhost:5000/api/workers/salaries/reset-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "salaryId": "salary_id_here"
  }'
```

## خطوات التشخيص السريع

### 1. تحقق من حالة الراتب
```javascript
// في console المتصفح
fetch('/api/workers/salaries/SALARY_ID/payment-status', {
  headers: { 'Authorization': `Bearer ${localStorage.getItem('adminToken')}` }
})
.then(r => r.json())
.then(console.log)
```

### 2. حاول دفع الراتب
```javascript
fetch('/api/workers/salaries/pay', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
  },
  body: JSON.stringify({
    salaryId: 'SALARY_ID',
    paymentMethod: 'cash',
    notes: 'دفع تجريبي'
  })
})
.then(r => r.json())
.then(console.log)
```

### 3. تحقق من النتيجة
```javascript
// كرر الخطوة 1 للتحقق من التحديث
```

## رسائل الخطأ الشائعة

### "سجل الراتب غير موجود"
- تأكد من صحة ID الراتب
- تحقق من وجود الراتب في قاعدة البيانات

### "خطأ في دفع الراتب"
- تحقق من سجلات الخادم للحصول على تفاصيل الخطأ
- تأكد من صحة البيانات المرسلة

### "تم دفع هذا الراتب مسبقاً"
- هذا الخطأ تم إصلاحه في التحديث الجديد
- الآن يمكن إعادة الدفع بعد الإلغاء

## نصائح إضافية

1. **استخدم Developer Tools** في المتصفح لمراقبة الطلبات
2. **تحقق من Network tab** لرؤية الطلبات والاستجابات
3. **استخدم Console** لاختبار API مباشرة
4. **راقب سجلات الخادم** للحصول على تفاصيل الأخطاء

## الاتصال بالدعم

إذا استمرت المشكلة:
1. جمع سجلات الخادم
2. جمع تفاصيل الطلب والاستجابة
3. تحديد الخطوات التي تؤدي إلى المشكلة
4. إرسال المعلومات للدعم الفني 