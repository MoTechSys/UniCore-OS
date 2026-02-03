# تقرير نظام المصادقة - UniCore-OS

## نظرة عامة

تم بناء نظام مصادقة متكامل باستخدام **NextAuth v5** مع **Credentials Provider** يتبع معايير MAX الصارمة للجودة والأمان.

## المكونات المُنشأة

### 1. ملفات المصادقة الأساسية

| الملف | الوصف |
|-------|-------|
| `src/lib/auth.ts` | إعداد NextAuth الرئيسي مع Credentials Provider |
| `src/proxy.ts` | حماية المسارات (Next.js 16 convention) |
| `src/types/auth.ts` | تعريفات TypeScript للمصادقة |
| `src/app/api/auth/[...nextauth]/route.ts` | API Route handlers |

### 2. صفحات المصادقة

| الصفحة | المسار | الوصف |
|--------|--------|-------|
| تسجيل الدخول | `/login` | نموذج تسجيل الدخول بتصميم Omnitrix |
| غير مصرح | `/unauthorized` | صفحة عدم الصلاحية |

### 3. مكونات المصادقة

| المكون | الموقع | الوصف |
|--------|--------|-------|
| `LoginForm` | `features/auth/components` | نموذج تسجيل الدخول |
| `UserMenu` | `features/auth/components` | قائمة المستخدم مع تسجيل الخروج |
| `PermissionGate` | `components/auth` | عرض مشروط حسب الصلاحيات |
| `SessionProvider` | `components/providers` | مزود الجلسة للعميل |

### 4. أدوات الصلاحيات

#### Client-side (Hook)
```typescript
import { usePermissions } from '@/hooks'

const { hasPermission, hasAnyPermission, hasAllPermissions } = usePermissions()

if (hasPermission('user.create')) {
  // عرض زر إنشاء مستخدم
}
```

#### Server-side (Functions)
```typescript
import { requirePermission, hasPermission } from '@/lib/auth'

// في Server Component أو Server Action
await requirePermission('course.edit')

// أو للتحقق فقط
const canEdit = await hasPermission('course.edit')
```

### 5. Server Actions

| Action | الوصف |
|--------|-------|
| `loginAction` | تسجيل الدخول مع التحقق من Zod |
| `logoutAction` | تسجيل الخروج |
| `logout` | تسجيل الخروج مع إعادة التوجيه |

## الميزات المُنفذة

### ✅ التحقق من الحالة
- **ACTIVE**: السماح بتسجيل الدخول
- **PENDING**: رفض مع رسالة "حسابك في انتظار التفعيل"
- **FROZEN**: رفض مع رسالة "حسابك مجمد"

### ✅ حقن الصلاحيات في الجلسة
```typescript
session.user = {
  id: "...",
  email: "admin@unicore.edu.sa",
  name: "مدير النظام",
  academicId: "ADMIN001",
  permissions: ["user.view", "user.create", ...], // 52 صلاحية
  isSystemRole: true
}
```

### ✅ حماية المسارات (Proxy)
- جميع المسارات محمية افتراضياً
- `/login` و `/api/auth/*` عامة
- إعادة توجيه تلقائية لصفحة تسجيل الدخول
- حفظ `callbackUrl` للعودة بعد تسجيل الدخول

### ✅ Type Safety
- لا يوجد `any` في الكود
- تعريفات TypeScript كاملة
- توسيع أنواع NextAuth

## هيكل الملفات

```
src/
├── app/
│   ├── (auth)/
│   │   ├── layout.tsx
│   │   └── login/
│   │       └── page.tsx
│   ├── api/
│   │   └── auth/
│   │       └── [...nextauth]/
│   │           └── route.ts
│   └── unauthorized/
│       └── page.tsx
├── components/
│   ├── auth/
│   │   ├── PermissionGate.tsx
│   │   └── index.ts
│   └── providers/
│       ├── SessionProvider.tsx
│       └── index.ts
├── features/
│   └── auth/
│       ├── actions/
│       │   ├── index.ts
│       │   └── logout.ts
│       ├── components/
│       │   ├── LoginForm.tsx
│       │   ├── UserMenu.tsx
│       │   └── index.ts
│       └── index.ts
├── hooks/
│   ├── index.ts
│   └── use-permissions.ts
├── lib/
│   ├── auth.ts
│   └── auth/
│       ├── index.ts
│       └── permissions.ts
├── server/
│   └── actions/
│       └── auth.ts
├── types/
│   └── auth.ts
└── proxy.ts
```

## الاختبار

### بيانات تسجيل الدخول للاختبار
- **البريد**: admin@unicore.edu.sa
- **كلمة المرور**: Admin@123456

### نتائج الاختبار
| الاختبار | النتيجة |
|----------|---------|
| تسجيل الدخول بحساب صحيح | ✅ نجح |
| حماية المسارات | ✅ يعمل |
| callbackUrl | ✅ يعمل |
| الصلاحيات في الجلسة | ✅ 52 صلاحية |
| رفض PENDING/FROZEN | ✅ يعمل |

## الخطوات التالية

1. **إضافة تسجيل الخروج في الـ Header**
2. **بناء صفحة الملف الشخصي**
3. **إضافة نسيت كلمة المرور**
4. **تفعيل الحساب للمستخدمين الجدد**
5. **Two-Factor Authentication (اختياري)**

## الملاحظات التقنية

### Next.js 16 Changes
- تم استخدام `proxy.ts` بدلاً من `middleware.ts` (deprecated)
- الوظائف متطابقة، فقط تغيير الاسم

### أمان الجلسة
- JWT Strategy مع انتهاء 24 ساعة
- الصلاحيات مُحدثة عند كل تسجيل دخول
- لا يتم تخزين كلمة المرور في الجلسة

---

**تاريخ الإنشاء**: 2026-02-03
**الإصدار**: 1.0.0
**المطور**: MAX AI System
