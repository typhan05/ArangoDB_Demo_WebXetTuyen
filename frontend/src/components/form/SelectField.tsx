import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { FieldError } from "react-hook-form";

interface Option {
  label: string;
  value: string;
}

interface SelectFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  options: Option[];
  value: string | undefined;
  onChange: (val: string) => void;
  error?: FieldError;
}

export const SelectField = ({
  id,
  label,
  placeholder,
  options,
  value,
  onChange,
  error,
}: SelectFieldProps) => {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
};
