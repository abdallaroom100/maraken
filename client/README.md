# Flower Management System - Frontend

## إعدادات الـ Proxy

تم إعداد الـ proxy في `vite.config.ts` لربط الـ frontend مع الـ backend تلقائياً.

### إعدادات الـ Proxy:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.replace(/^\/api/, '/api')
    }
  }
}
```

## كيفية التشغيل

### 1. تشغيل الـ Backend أولاً:
```bash
cd ../server
npm start
```

### 2. تشغيل الـ Frontend:
```bash
npm run dev
```

الـ frontend سيعمل على `http://localhost:5173` وستتم توجيه جميع الـ API calls تلقائياً إلى `http://localhost:8000`.

## الملفات المحدثة

تم تحديث جميع الـ API calls في الملفات التالية لاستخدام الـ proxy:

- `src/hooks/useAuth.js`
- `src/hooks/useDashboard.ts`
- `src/hooks/useExpenses.ts`
- `src/hooks/useRevenues.ts`
- `src/pages/Login.tsx`
- `src/pages/Signup.tsx`

## ملاحظات مهمة

1. تأكد من أن الـ backend يعمل على المنفذ 8000
2. جميع الـ API calls تستخدم الآن `/api/` بدلاً من `http://localhost:8000/api/`
3. الـ proxy يعمل فقط في وضع التطوير (development)
4. في الإنتاج، ستحتاج إلى إعداد الـ proxy على مستوى الخادم

## البناء للإنتاج

```bash
npm run build
```

سيتم إنشاء الملفات في مجلد `dist/` جاهزة للنشر.
