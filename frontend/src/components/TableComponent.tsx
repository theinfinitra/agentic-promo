import React from 'react';
import { StructuredData, TableColumn, ComponentAction } from '../types';

interface TableComponentProps {
  data: StructuredData;
  onAction?: (action: string, item: any) => void;
}

export const TableComponent: React.FC<TableComponentProps> = ({ data, onAction }) => {
  if (data.type !== 'table' || !data.data || !data.columns) {
    return <div className="text-red-500">Invalid table data</div>;
  }

  const handleAction = (action: string, item: any) => {
    if (onAction) {
      onAction(action, item);
    }
  };

  const renderCell = (item: any, column: TableColumn) => {
    const value = item[column.key];
    
    switch (column.type) {
      case 'email':
        return (
          <a 
            href={`mailto:${value}`}
            className="text-trust hover:underline font-medium transition-all duration-200 hover:text-blue-700"
          >
            {value}
          </a>
        );
      
      case 'badge':
        const badgeClass = value === 'VIP' ? 'badge-vip' : 
                          value === 'Premium' ? 'badge-premium' : 
                          value === 'Regular' ? 'badge-regular' :
                          value === 'active' ? 'badge-active' : 'badge-inactive';
        return (
          <span className={`badge ${badgeClass} transition-all duration-200`}>
            {value}
          </span>
        );
      
      case 'number':
        return (
          <span className="font-mono font-semibold text-success tabular-nums">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </span>
        );
      
      case 'date':
        return (
          <span className="font-medium text-gray-700">
            {new Date(value).toLocaleDateString()}
          </span>
        );
      
      default:
        return <span className="font-medium">{value}</span>;
    }
  };

  const actions = data.config?.actions || [];

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {data.title && (
        <h2 className="text-xl font-bold mb-4 text-gray-900">{data.title}</h2>
      )}
      
      <div className="overflow-x-auto">
        <table className="table-component">
          <thead>
            <tr>
              {data.columns.map((column) => (
                <th key={column.key} className="table-header table-cell">
                  {column.label}
                </th>
              ))}
              {actions.length > 0 && (
                <th className="table-header table-cell">Actions</th>
              )}
            </tr>
          </thead>
          <tbody>
            {data.data.map((item, index) => (
              <tr key={item.id || index}>
                {data.columns!.map((column) => (
                  <td key={column.key} className="table-cell">
                    {renderCell(item, column)}
                  </td>
                ))}
                {actions.length > 0 && (
                  <td className="table-cell">
                    <div className="flex space-x-2">
                      {actions.map((action) => (
                        <button
                          key={action.action}
                          onClick={() => handleAction(action.action, item)}
                          className={`action-btn ${
                            action.variant === 'danger' ? 'action-btn-danger' : ''
                          }`}
                        >
                          {action.action === 'edit' ? '✏️' : action.action === 'delete' ? '🗑️' : action.action === 'email' ? '📧' : action.label}
                        </button>
                      ))}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {data.config?.pagination?.enabled && (
        <div className="mt-6 flex justify-between items-center text-sm text-secondary">
          <span className="font-medium">
            Showing <span className="text-trust">{data.data.length}</span> of{' '}
            <span className="text-trust">{data.config.pagination.total || data.data.length}</span> results
          </span>
          <div className="flex space-x-2">
            <button className="btn-secondary text-sm">Previous</button>
            <button className="btn-secondary text-sm">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};
