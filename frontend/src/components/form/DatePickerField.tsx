import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import { Label } from "@/components/ui/label";
import { FieldError } from "react-hook-form";
import { cn } from "@/lib/utils";

interface DatePickerFieldProps {
  id: string;
  label: string;
  value: Date | null;
  onChange: (date: Date | null) => void;
  error?: FieldError;
  placeholder?: string;
  className?: string;
}

export function DatePickerField({
  id,
  className,
  label,
  value,
  onChange,
  error,
  placeholder = "Chọn ngày sinh",
}: DatePickerFieldProps) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <DatePicker
        id={id}
        selected={value}
        onChange={onChange}
        dateFormat="dd/MM/yyyy"
        showYearDropdown
        showMonthDropdown
        scrollableYearDropdown
        yearDropdownItemNumber={100}
        placeholderText={placeholder}
        className={cn(
          "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
          className
        )}
      />
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
}
