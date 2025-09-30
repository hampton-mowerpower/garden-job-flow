import * as React from "react";
import { Input } from "@/components/ui/input";
import { useLanguage } from "@/contexts/LanguageContext";
import { autoTranslate } from "@/utils/autoTranslate";
import { useToast } from "@/hooks/use-toast";

export interface InputTranslatedProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  autoTranslate?: boolean;
}

const InputTranslated = React.forwardRef<HTMLInputElement, InputTranslatedProps>(
  ({ value, onChange, autoTranslate: enableAutoTranslate = true, onBlur, ...props }, ref) => {
    const { language } = useLanguage();
    const { toast } = useToast();
    const [isTranslating, setIsTranslating] = React.useState(false);

    const handleBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
      if (enableAutoTranslate && value && value.trim()) {
        setIsTranslating(true);
        try {
          const translated = await autoTranslate(value, language);
          if (translated !== value) {
            onChange?.(translated);
          }
        } catch (error) {
          console.error('Translation error:', error);
        } finally {
          setIsTranslating(false);
        }
      }
      onBlur?.(e);
    };

    return (
      <Input
        {...props}
        ref={ref}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        onBlur={handleBlur}
        disabled={isTranslating || props.disabled}
      />
    );
  }
);

InputTranslated.displayName = "InputTranslated";

export { InputTranslated };
