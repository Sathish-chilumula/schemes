import React from 'react';

type StatusBadgeProps = {
  status: 'draft' | 'published' | 'scheduled';
};

export default function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    published: 'bg-green-100 text-green-800 border-green-200',
    draft: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
  };

  const labels = {
    published: 'Published',
    draft: 'Draft',
    scheduled: 'Scheduled',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
        styles[status] || styles.draft
      }`}
    >
      {labels[status] || 'Draft'}
    </span>
  );
}
