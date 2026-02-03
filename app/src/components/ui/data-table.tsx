/**
 * مكون الجدول مع Sticky Header
 * S-ACM Frontend - Clean Tech Dashboard Theme
 */

import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";

interface Column<T> {
  key: string;
  header: string;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  emptyMessage?: string;
  maxHeight?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
  };
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "لا توجد بيانات",
  maxHeight = "500px",
  pagination,
}: DataTableProps<T>) {
  return (
    <div className="space-y-4">
      <div 
        className="rounded-lg border border-border overflow-hidden"
        style={{ maxHeight }}
      >
        <div className="overflow-auto" style={{ maxHeight }}>
          <Table className="table-sticky-header">
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                {columns.map((column) => (
                  <TableHead 
                    key={column.key}
                    className={cn("text-right font-semibold", column.className)}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell 
                    colSpan={columns.length} 
                    className="text-center py-8 text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                data.map((item) => (
                  <TableRow 
                    key={keyExtractor(item)}
                    className="hover:bg-muted/20 transition-colors"
                  >
                    {columns.map((column) => (
                      <TableCell key={column.key} className={column.className}>
                        {column.render 
                          ? column.render(item) 
                          : item[column.key]
                        }
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            صفحة {pagination.currentPage} من {pagination.totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronRight className="h-4 w-4" />
              السابق
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              التالي
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
