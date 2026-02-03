/**
 * مكون القائمة المضغوطة للموبايل
 * S-ACM Frontend - Mobile App-Like Experience
 * 
 * - يعرض البيانات بشكل مضغوط
 * - قابل للتمرير الأفقي للإجراءات
 * - تصميم يشبه التطبيقات الأصلية
 */

import { cn } from "@/lib/utils";
import { ChevronLeft, MoreVertical } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";

interface MobileListItem {
  id: string | number;
  title: string;
  subtitle?: string;
  badge?: React.ReactNode;
  avatar?: React.ReactNode;
  icon?: React.ReactNode;
  onClick?: () => void;
  actions?: Array<{
    label: string;
    icon?: React.ReactNode;
    onClick: () => void;
    variant?: "default" | "destructive";
  }>;
}

interface MobileListProps {
  items: MobileListItem[];
  emptyMessage?: string;
  className?: string;
}

export function MobileList({ items, emptyMessage = "لا توجد بيانات", className }: MobileListProps) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 text-muted-foreground text-sm">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={cn("divide-y divide-border", className)}>
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            "flex items-center gap-3 py-3 px-1",
            item.onClick && "active:bg-accent/50 transition-colors"
          )}
          onClick={item.onClick}
        >
          {/* الأيقونة أو الصورة */}
          {(item.avatar || item.icon) && (
            <div className="flex-shrink-0">
              {item.avatar || (
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {item.icon}
                </div>
              )}
            </div>
          )}

          {/* المحتوى */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium text-sm truncate">{item.title}</p>
              {item.badge}
            </div>
            {item.subtitle && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {item.subtitle}
              </p>
            )}
          </div>

          {/* الإجراءات */}
          {item.actions && item.actions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {item.actions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      action.onClick();
                    }}
                    className={cn(
                      action.variant === "destructive" && "text-destructive focus:text-destructive"
                    )}
                  >
                    {action.icon && <span className="ml-2">{action.icon}</span>}
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* سهم التنقل */}
          {item.onClick && !item.actions && (
            <ChevronLeft className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          )}
        </div>
      ))}
    </div>
  );
}

// مكون البطاقة المصغرة للموبايل
interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function MobileCard({ children, className, onClick }: MobileCardProps) {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border p-3",
        onClick && "active:scale-98 transition-transform cursor-pointer",
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

// مكون شريط البحث المصغر
interface MobileSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function MobileSearch({ value, onChange, placeholder = "بحث...", className }: MobileSearchProps) {
  return (
    <div className={cn("relative", className)}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-10 px-4 rounded-full bg-muted/50 border border-border text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/50"
      />
    </div>
  );
}

// مكون الفلاتر المصغرة
interface MobileFilterChip {
  id: string;
  label: string;
  active?: boolean;
}

interface MobileFiltersProps {
  filters: MobileFilterChip[];
  onFilterChange: (id: string) => void;
  className?: string;
}

export function MobileFilters({ filters, onFilterChange, className }: MobileFiltersProps) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto scrollbar-hide pb-1", className)}>
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-all",
            filter.active
              ? "bg-primary/10 text-primary font-medium border border-primary/30"
              : "bg-muted/50 text-muted-foreground border border-transparent"
          )}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
