"use client";

/**
 * صفحة لوحة التحكم الرئيسية - UniCore-OS
 */

import { useEffect } from "react";
import { DashboardLayout, useTabs } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle
} from "lucide-react";

// ============================================
// STATS DATA (Mock)
// ============================================

const stats = [
  {
    title: "إجمالي المستخدمين",
    value: "2,847",
    change: "+12%",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "المقررات النشطة",
    value: "156",
    change: "+5%",
    changeType: "positive" as const,
    icon: BookOpen,
  },
  {
    title: "الطلاب المسجلين",
    value: "2,341",
    change: "+8%",
    changeType: "positive" as const,
    icon: GraduationCap,
  },
  {
    title: "اختبارات AI",
    value: "89",
    change: "+23%",
    changeType: "positive" as const,
    icon: Sparkles,
  },
];

const recentActivities = [
  { id: 1, action: "تم إنشاء اختبار جديد", user: "د. أحمد محمد", time: "منذ 5 دقائق", status: "success" },
  { id: 2, action: "تسجيل طالب جديد", user: "النظام", time: "منذ 15 دقيقة", status: "success" },
  { id: 3, action: "تحديث بيانات مقرر", user: "د. سارة علي", time: "منذ 30 دقيقة", status: "success" },
  { id: 4, action: "محاولة دخول فاشلة", user: "مجهول", time: "منذ ساعة", status: "warning" },
  { id: 5, action: "رفع ملف جديد", user: "د. محمد خالد", time: "منذ ساعتين", status: "success" },
];

// ============================================
// DASHBOARD CONTENT
// ============================================

function DashboardContent() {
  const { setTabs, setActiveTab } = useTabs();

  useEffect(() => {
    setTabs([
      { id: "overview", label: "نظرة عامة", icon: TrendingUp },
      { id: "recent", label: "النشاط الأخير", icon: Clock },
    ]);
    setActiveTab("overview");
  }, [setTabs, setActiveTab]);

  return (
    <div className="space-y-6">
      {/* بطاقات الإحصائيات */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${
                  stat.changeType === "positive" ? "text-green-500" : "text-red-500"
                }`}>
                  {stat.change} من الشهر الماضي
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* النشاط الأخير */}
      <Card>
        <CardHeader>
          <CardTitle>النشاط الأخير</CardTitle>
          <CardDescription>آخر الأنشطة في النظام</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-center gap-4">
                <div className={`p-2 rounded-full ${
                  activity.status === "success" ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                }`}>
                  {activity.status === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <AlertCircle className="h-4 w-4" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.user}</p>
                </div>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// PAGE EXPORT
// ============================================

export default function DashboardPage() {
  return (
    <DashboardLayout title="لوحة التحكم" subtitle="نظرة عامة على النظام">
      <DashboardContent />
    </DashboardLayout>
  );
}
