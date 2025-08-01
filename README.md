# نظام إدارة الأعمال - نظام تسجيل الدخول

## المميزات

### 🔐 نظام تسجيل الدخول المتكامل
- **تسجيل دخول آمن**: مع validation كامل للبيانات
- **إنشاء حساب جديد**: مع اختيار الدور الوظيفي (مشرف/مدير)
- **حماية الـ routes**: باستخدام JWT tokens
- **واجهة مستخدم جميلة**: تصميم عصري ومتجاوب

### 🛡️ الأمان
- تشفير كلمات المرور باستخدام bcrypt
- JWT tokens للتحقق من الهوية
- Middleware لحماية الـ routes
- Validation شامل للبيانات المدخلة

### 🎨 التصميم
- واجهة مستخدم عربية بالكامل
- تصميم متجاوب لجميع الأجهزة
- رسائل خطأ واضحة ومفيدة
- تأثيرات بصرية جميلة

## التثبيت والتشغيل

### المتطلبات
- Node.js (v14 أو أحدث)
- MongoDB
- npm أو yarn

### خطوات التثبيت

1. **تثبيت dependencies للخادم:**
```bash
cd server
npm install
```

2. **تثبيت dependencies للعميل:**
```bash
cd client
npm install
```

3. **إعداد ملف البيئة:**
```bash
# في مجلد server، أنشئ ملف .env
JWT_SECRET=your_jwt_secret_here
MONGODB_URI=your_mongodb_connection_string
NODE_ENV=development
```

4. **تشغيل الخادم:**
```bash
cd server
npm start
```

5. **تشغيل العميل:**
```bash
cd client
npm run dev
```

## الاستخدام

### تسجيل الدخول
1. انتقل إلى `/login`
2. أدخل البريد الإلكتروني وكلمة المرور
3. اضغط على "تسجيل الدخول"

### إنشاء حساب جديد
1. انتقل إلى `/signup`
2. املأ جميع الحقول المطلوبة:
   - الاسم الكامل
   - البريد الإلكتروني
   - الدور الوظيفي (مشرف/مدير)
   - كلمة المرور
   - تأكيد كلمة المرور
3. اضغط على "إنشاء الحساب"

### الأدوار الوظيفية
- **مشرف (Moderator)**: صلاحيات محدودة
- **مدير (Manager)**: صلاحيات كاملة

## API Endpoints

### Public Routes
- `POST /api/admin/login` - تسجيل الدخول
- `POST /api/admin/signup` - إنشاء حساب جديد

### Protected Routes
- `GET /api/admin/me` - الحصول على معلومات المدير الحالي

## الملفات الرئيسية

### Frontend
- `client/src/pages/Login.tsx` - صفحة تسجيل الدخول
- `client/src/pages/Signup.tsx` - صفحة إنشاء الحساب
- `client/src/hooks/useAuth.js` - Hook لإدارة حالة تسجيل الدخول
- `client/src/components/ProtectedRoute.tsx` - مكون حماية الـ routes

### Backend
- `server/controllers/admin.controller.js` - منطق تسجيل الدخول والتسجيل
- `server/middleware/auth.middleware.js` - middleware للتحقق من الـ tokens
- `server/models/admin.model.js` - نموذج بيانات المدير
- `server/routers/admin.router.js` - routes الـ admin

## الأمان

### تشفير كلمات المرور
- استخدام bcrypt مع salt rounds = 12
- تشفير آمن ومقاوم للهجمات

### JWT Tokens
- مدة صلاحية 7 أيام
- تشفير آمن باستخدام JWT_SECRET
- التحقق من صحة الـ token مع كل طلب محمي

### Validation
- التحقق من صحة البريد الإلكتروني
- التحقق من طول كلمة المرور (6 أحرف على الأقل)
- التحقق من عدم تكرار البريد الإلكتروني
- التحقق من صحة الدور الوظيفي

## المساهمة

1. Fork المشروع
2. أنشئ branch جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى الـ branch (`git push origin feature/AmazingFeature`)
5. افتح Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT - انظر ملف [LICENSE](LICENSE) للتفاصيل. 