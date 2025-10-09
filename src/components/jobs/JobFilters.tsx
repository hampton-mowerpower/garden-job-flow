import React from 'react';
import { Badge } from '@/components/ui/badge';

interface JobFiltersProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
}

export function JobFilters({ activeFilter, onFilterChange }: JobFiltersProps) {
  const filters = [
    { id: 'all', label: 'All Jobs', color: 'bg-gray-100 text-gray-800 hover:bg-gray-200' },
    { id: 'in-progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800 hover:bg-blue-200' },
    { id: 'parts', label: 'Waiting for Parts', color: 'bg-orange-100 text-orange-800 hover:bg-orange-200' },
    { id: 'quote', label: 'Waiting for Quote', color: 'bg-cyan-100 text-cyan-800 hover:bg-cyan-200' },
    { id: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800 hover:bg-green-200' },
    { id: 'delivered', label: 'Delivered', color: 'bg-purple-100 text-purple-800 hover:bg-purple-200' },
    { id: 'write_off', label: 'Write Off', color: 'bg-red-100 text-red-800 hover:bg-red-200' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => (
        <Badge
          key={filter.id}
          variant={activeFilter === filter.id ? 'default' : 'outline'}
          className={`cursor-pointer ${activeFilter === filter.id ? '' : filter.color}`}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label}
        </Badge>
      ))}
    </div>
  );
}
