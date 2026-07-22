import { AppLayout } from "@/components/AppLayout";
import { Construction } from "lucide-react";

export function PlaceholderPage({ title, description }: { title: string; description?: string }) {
  return (
    <AppLayout>
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold mb-1">{title}</h1>
        {description && <p className="text-sm text-muted-foreground mb-6">{description}</p>}
        <div className="border border-dashed border-border rounded-md p-12 flex flex-col items-center justify-center text-center gap-3">
          <Construction className="h-8 w-8 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Sắp ra mắt</p>
            <p className="text-xs text-muted-foreground mt-1">
              Phân hệ này sẽ được triển khai ở giai đoạn tiếp theo.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
