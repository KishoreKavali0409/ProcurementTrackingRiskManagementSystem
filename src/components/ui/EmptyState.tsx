'use client';

import React from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
}

export function EmptyState({ 
  title = "No records found", 
  description = "There are no entries in this registry matching your search criteria.", 
  icon: Icon = Inbox 
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-enterprise-200 dark:border-enterprise-800 rounded bg-enterprise-50/50 dark:bg-enterprise-900/10 max-w-md mx-auto my-6">
      <div className="w-10 h-10 rounded-full bg-enterprise-100 dark:bg-enterprise-800 flex items-center justify-center text-text-muted mb-3">
        <Icon size={20} />
      </div>
      <h3 className="text-sm font-semibold text-text-primary mb-1">{title}</h3>
      <p className="text-xs text-text-secondary leading-normal">{description}</p>
    </div>
  );
}
