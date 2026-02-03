/**
 * مكون الجدول المحسن للموبايل
 * S-ACM Frontend - Mobile Optimized Tables
 * 
 * - يعرض البيانات كقوائم مضغوطة على الموبايل
 * - يدعم التمرير الأفقي للجداول الكبيرة
 * - تصميم مضغوط بدون تمرير عمودي زائد
 */

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronRight, ChevronLeft, MoreVertical } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface MobileColumn<T> {
  key: string;
  header: string;
  // للعرض في القائمة
  primary?: boolean; // العنصر الرئيسي (العنوان)
  secondary?: boolean; // العنصر الثانوي (الوصف)
  badge?: boolean; // يظهر كـ badge
  icon?: boolean; // يظهر كأيقونة
  action?: boolean; // زر إجراء
  hide?: boolean; // إخفاء على الموبايل
  render?: (item: T) => React.ReactNode;
}

interface MobileAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (item: T) => void;
  variant?: "default" | "destructive";
}

interface MobileDataTableProps<T> {
  columns: MobileColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  actions?: MobileAction<T>[];
  onItemClick?: (item: T) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function MobileDataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "لا توجد بيانات",
  actions,
  onItemClick,
  pagination,
}: MobileDataTableProps<T>) {
  // استخراج الأعمدة حسب النوع
  const primaryCol = columns.find(c => c.primary);
  const secondaryCol = columns.find(c => c.secondary);
  const badgeCols = columns.filter(c => c.badge);
  const iconCol = columns.find(c => c.icon);
  const visibleCols = columns.filter(c => !c.hide && !c.primary && !c.secondary && !c.badge && !c.icon && !c.action);

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* قائمة العناصر */}
      <div className="rounded-lg border border-border overflow-hidden bg-card/50">
        {data.map((item, index) => (
          <div
            key={keyExtractor(item)}
            className={cn(
              "mobile-list-item",
              onItemClick && "cursor-pointer active:bg-muted/50",
              index !== data.length - 1 && "border-b border-border"
            )}
            onClick={() => onItemClick?.(item)}
          >
            {/* الأيقونة */}
            {iconCol && (
              <div className="item-icon bg-primary/10">
                {iconCol.render ? iconCol.render(item) : item[iconCol.key]}
              </div>
            )}

            {/* المحتوى الرئيسي */}
            <div className="item-content">
              {/* العنوان */}
              {primaryCol && (
                <div className="item-title">
                  {primaryCol.render ? primaryCol.render(item) : item[primaryCol.key]}
                </div>
              )}
              
              {/* الوصف */}
              {secondaryCol && (
                <div className="item-subtitle">
                  {secondaryCol.render ? secondaryCol.render(item) : item[secondaryCol.key]}
                </div>
              )}

              {/* معلومات إضافية */}
              {visibleCols.length > 0 && (
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  {visibleCols.slice(0, 2).map(col => (
                    <span key={col.key} className="text-[10px] text-muted-foreground">
                      {col.render ? col.render(item) : item[col.key]}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Badges */}
            {badgeCols.length > 0 && (
              <div className="flex flex-col gap-1">
                {badgeCols.map(col => (
                  <div key={col.key} className="mobile-badge">
                    {col.render ? col.render(item) : (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        {item[col.key]}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* الإجراءات */}
            {actions && actions.length > 0 && (
              <div className="item-actions">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {actions.map((action, i) => (
                      <DropdownMenuItem
                        key={i}
                        onClick={(e) => {
                          e.stopPropagation();
                          action.onClick(item);
                        }}
                        className={cn(
                          action.variant === "destructive" && "text-destructive"
                        )}
                      >
                        {action.icon}
                        <span className="mr-2">{action.label}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">
            {pagination.currentPage} / {pagination.totalPages}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronRight className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronLeft className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * مكون لعرض الجدول بتمرير أفقي على الموبايل
 */
interface ScrollableTableProps {
  children: React.ReactNode;
  className?: string;
}

export function ScrollableTable({ children, className }: ScrollableTableProps) {
  return (
    <div className={cn("mobile-table-wrapper lg:mx-0", className)}>
      {children}
    </div>
  );
}
