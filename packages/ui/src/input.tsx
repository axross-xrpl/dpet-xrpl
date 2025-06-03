import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={`border rounded px-2 py-1 ${className ?? ""}`}
    {...props}
  />
));
Input.displayName = "Input";
