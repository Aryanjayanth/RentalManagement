import { ReactNode } from 'react';

interface SearchResultsProps<T> {
  items: T[];
  renderItem: (item: T) => ReactNode;
  emptyMessage?: string;
  className?: string;
  gridClassName?: string;
}

export function SearchResults<T>({
  items,
  renderItem,
  emptyMessage = 'No items found',
  className = '',
  gridClassName = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6',
}: SearchResultsProps<T>) {
  if (items.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return <div className={`${gridClassName} ${className}`}>{items.map(renderItem)}</div>;
}
