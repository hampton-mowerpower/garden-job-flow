import React, { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface RequestedFinishDatePickerProps {
  date: Date | undefined;
  onChange: (date: Date | undefined) => void;
}

export const RequestedFinishDatePicker: React.FC<RequestedFinishDatePickerProps> = ({
  date,
  onChange
}) => {
  const [open, setOpen] = useState(false);
  const isPastDate = date && date < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <div className="space-y-2">
      <Label htmlFor="requested-finish-date">Requested Finish Date</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id="requested-finish-date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !date && "text-muted-foreground",
              isPastDate && "border-yellow-500 bg-yellow-50"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, 'PPP') : <span>Pick a date</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(newDate) => {
              onChange(newDate);
              setOpen(false);
            }}
            initialFocus
            className="pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
      {isPastDate && (
        <p className="text-sm text-yellow-600">
          ⚠️ Warning: Selected date is in the past
        </p>
      )}
    </div>
  );
};
