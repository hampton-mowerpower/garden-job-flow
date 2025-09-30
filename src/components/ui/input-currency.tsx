import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export interface InputCurrencyProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value?: number;
  onChange?: (value: number) => void;
}

const InputCurrency = React.forwardRef<HTMLInputElement, InputCurrencyProps>(
  ({ className, value = 0, onChange, ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState(
      value !== undefined && value !== null ? (value === 0 ? "" : value.toFixed(2)) : ""
    );
    const [isTyping, setIsTyping] = React.useState(false);

    // Only update display value from prop when not actively typing
    React.useEffect(() => {
      if (!isTyping) {
        setDisplayValue(value !== undefined && value !== null ? (value === 0 ? "" : value.toFixed(2)) : "");
      }
    }, [value, isTyping]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      
      // Allow empty string or valid decimal numbers
      if (inputValue === "" || /^\d*\.?\d*$/.test(inputValue)) {
        setIsTyping(true);
        setDisplayValue(inputValue);
        
        const numericValue = parseFloat(inputValue) || 0;
        onChange?.(numericValue);
      }
    };

    const handleBlur = () => {
      setIsTyping(false);
      const numericValue = parseFloat(displayValue) || 0;
      setDisplayValue(numericValue > 0 ? numericValue.toFixed(2) : "");
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">$</span>
        <Input
          {...props}
          ref={ref}
          type="text"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={cn("pl-8", className)}
          placeholder="0.00"
        />
      </div>
    );
  }
);

InputCurrency.displayName = "InputCurrency";

export { InputCurrency };