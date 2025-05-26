import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InputHTMLAttributes } from "react";
import { FieldError } from "react-hook-form";

interface InputFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  type?: string;
  error?: FieldError;
  register?: any;
  name?: string; // dùng nếu không muốn `id` là name
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
}

export const InputField = ({
  id,
  label,
  placeholder,
  type = "text",
  error,
  register,
  name,
  inputProps = {},
}: InputFieldProps) => {
  return (
    <div className="space-y-1">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        {...(register ? register(name || id) : {})}
        {...inputProps}
      />
      {error && <p className="text-sm text-red-500">{error.message}</p>}
    </div>
  );
};
