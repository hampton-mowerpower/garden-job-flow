import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { InputCurrency } from '@/components/ui/input-currency';

interface EditableCellProps {
  value: any;
  type: 'text' | 'number' | 'currency' | 'select' | 'boolean';
  options?: string[];
  isEditing: boolean;
  isDisabled?: boolean;
  isPending?: boolean;
  onEdit: () => void;
  onSave: (value: any) => void;
  onCancel: () => void;
  onNavigate?: (direction: 'next' | 'prev') => void;
  validation?: (value: any) => string | null;
  className?: string;
}

export function EditableCell({
  value,
  type,
  options,
  isEditing,
  isDisabled = false,
  isPending = false,
  onEdit,
  onSave,
  onCancel,
  onNavigate,
  validation,
  className
}: EditableCellProps) {
  const [editValue, setEditValue] = useState(value);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    if (validation) {
      const validationError = validation(editValue);
      if (validationError) {
        setError(validationError);
        return;
      }
    }
    setError(null);
    onSave(editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setError(null);
      setEditValue(value);
      onCancel();
    } else if (e.key === 'Tab' && onNavigate) {
      e.preventDefault();
      handleSave();
      onNavigate(e.shiftKey ? 'prev' : 'next');
    }
  };

  if (!isEditing) {
    return (
      <div
        className={cn(
          "cursor-pointer hover:bg-muted/50 px-2 py-1 rounded transition-colors min-h-[2rem] flex items-center",
          isDisabled && "cursor-not-allowed opacity-50",
          isPending && "opacity-60 animate-pulse",
          className
        )}
        onClick={() => !isDisabled && onEdit()}
        title={isDisabled ? "You don't have permission to edit this field" : "Click to edit (or press E)"}
      >
        {type === 'boolean' ? (
          <span>{value ? '✓ Yes' : '✗ No'}</span>
        ) : type === 'currency' ? (
          <span>${Number(value).toFixed(2)}</span>
        ) : (
          <span>{value}</span>
        )}
        {isPending && <span className="ml-2 text-xs text-muted-foreground">saving...</span>}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {type === 'select' && options ? (
        <Select value={String(editValue)} onValueChange={setEditValue}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option} value={option}>{option}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : type === 'boolean' ? (
        <div className="flex items-center space-x-2">
          <Switch
            checked={editValue}
            onCheckedChange={setEditValue}
            onKeyDown={handleKeyDown}
          />
          <span className="text-sm">{editValue ? 'Yes' : 'No'}</span>
        </div>
      ) : type === 'currency' ? (
        <InputCurrency
          ref={inputRef}
          value={Number(editValue)}
          onChange={setEditValue}
          onKeyDown={handleKeyDown}
          className="h-8"
        />
      ) : (
        <Input
          ref={inputRef}
          type={type === 'number' ? 'number' : 'text'}
          value={editValue}
          onChange={(e) => setEditValue(type === 'number' ? Number(e.target.value) : e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleSave}
          className="h-8"
        />
      )}
      {error && (
        <p className="text-xs text-destructive">{error}</p>
      )}
      <p className="text-xs text-muted-foreground">
        Enter to save, Esc to cancel
      </p>
    </div>
  );
}
