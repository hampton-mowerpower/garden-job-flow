import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";
import { autoTranslate } from "@/utils/autoTranslate";

export interface TextareaTranslatedProps
  extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
  value?: string;
  onChange?: (value: string) => void;
  autoTranslate?: boolean;
}

const TextareaTranslated = React.forwardRef<HTMLTextAreaElement, TextareaTranslatedProps>(
  ({ value, onChange, autoTranslate: enableAutoTranslate = true, onBlur, ...props }, ref) => {
    const { language } = useLanguage();
    const [isTranslating, setIsTranslating] = React.useState(false);

    const handleBlur = async (e: React.FocusEvent<HTMLTextAreaElement>) => {
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
      <Textarea
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

TextareaTranslated.displayName = "TextareaTranslated";

export { TextareaTranslated };
