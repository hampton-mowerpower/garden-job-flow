import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { TrendingUp, Clock, Package, FileText, CheckCircle, Truck, XCircle } from 'lucide-react';
import { JobStats } from '@/hooks/useJobStats';
import { Skeleton } from '@/components/ui/skeleton';

interface JobStatsCardsProps {
  stats: JobStats;
  onFilterClick: (filter: string) => void;
}

export function JobStatsCards({ stats, onFilterClick }: JobStatsCardsProps) {
  if (stats.loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {Array.from({ length: 7 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    { label: 'Today', value: stats.today, icon: TrendingUp, color: 'text-blue-600', filter: 'today' },
    { label: 'This Week', value: stats.thisWeek, icon: TrendingUp, color: 'text-indigo-600', filter: 'week' },
    { label: 'This Month', value: stats.thisMonth, icon: TrendingUp, color: 'text-purple-600', filter: 'month' },
    { label: 'This Year', value: stats.thisYear, icon: TrendingUp, color: 'text-pink-600', filter: 'year' },
    { label: 'Open', value: stats.open, icon: Clock, color: 'text-yellow-600', filter: 'open' },
    { label: 'Parts', value: stats.waitingForParts, icon: Package, color: 'text-orange-600', filter: 'parts' },
    { label: 'Quote', value: stats.waitingForQuote, icon: FileText, color: 'text-cyan-600', filter: 'quote' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.label}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => onFilterClick(stat.filter)}
          >
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Icon className={`h-4 w-4 ${stat.color}`} />
                <span className="text-2xl font-bold">{stat.value}</span>
              </div>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
