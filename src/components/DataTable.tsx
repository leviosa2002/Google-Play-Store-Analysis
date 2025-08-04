import React, { useState, useMemo, useEffect } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  renderCell?: (rowData: any, rowIndex: number) => React.ReactNode;
  textAlign?: 'left' | 'center' | 'right';
}

interface DataTableProps {
  data: any[];
  columns: Column[];
  title?: string;
  pageSize?: number;
  showPagination?: boolean;
  enableSorting?: boolean;
  initialSortBy?: string;
  initialSortDirection?: 'asc' | 'desc';
  className?: string;
  showRankColumn?: boolean; // Prop to control displaying the rank column
}

const DataTable: React.FC<DataTableProps> = ({
  data,
  columns,
  title,
  pageSize = 10,
  showPagination = true,
  enableSorting = true,
  initialSortBy = '',
  initialSortDirection = 'asc',
  className = '',
  showRankColumn = false // Default to false
}) => {
  const [sortColumn, setSortColumn] = useState<string>(initialSortBy);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(initialSortDirection);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1); // Reset to first page whenever data, sort column, or direction changes
  }, [data, sortColumn, sortDirection]);

  const handleSort = (columnKey: string) => {
    if (!enableSorting) return; // Only sort if sorting is enabled for the table

    if (sortColumn === columnKey) {
      // If clicking on the same column, toggle sort direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // If clicking on a new column, set it as the sort column and default to ascending
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const sortedData = useMemo(() => {
    if (!enableSorting || !sortColumn) return data; // If sorting is disabled or no column selected, return original data

    // Create a shallow copy to avoid mutating the original data array
    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];

      // Handle null/undefined values by treating them as extremely low/high for sorting
      const valA = aValue === null || typeof aValue === 'undefined' ? (sortDirection === 'asc' ? -Infinity : Infinity) : aValue;
      const valB = bValue === null || typeof bValue === 'undefined' ? (sortDirection === 'asc' ? -Infinity : Infinity) : bValue;

      // Attempt numeric comparison first
      const numA = typeof valA === 'number' ? valA : parseFloat(String(valA));
      const numB = typeof valB === 'number' ? valB : parseFloat(String(valB));

      if (!isNaN(numA) && !isNaN(numB)) {
        return sortDirection === 'asc' ? numA - numB : numB - numA;
      }

      // Fallback to string comparison
      const aStr = String(valA).toLowerCase();
      const bStr = String(valB).toLowerCase();

      if (sortDirection === 'asc') {
        return aStr.localeCompare(bStr);
      } else {
        return bStr.localeCompare(aStr);
      }
    });
  }, [data, sortColumn, sortDirection, enableSorting]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedData = showPagination ? sortedData.slice(startIndex, startIndex + pageSize) : sortedData;

  // Dynamically add the rank column if showRankColumn is true
  const columnsToRender = useMemo(() => {
    if (!showRankColumn) {
      return columns;
    }

    // Prepend the rank column definition
    return [
      {
        key: 'rank',
        label: 'Rank',
        sortable: false, // Rank column is not sortable by itself
        textAlign: 'center',
        renderCell: (rowData: any) => { // rowIndex is not needed here as we use globalIndex
          // Find the actual rank within the *full sortedData*
          // This assumes `rowData` objects are unique, or have a unique ID to find them in sortedData
          const globalIndex = sortedData.findIndex(item => item === rowData);
          // Fallback to 0-based index + 1 if the item isn't found (shouldn't happen with correct data)
          const actualRank = globalIndex !== -1 ? globalIndex + 1 : 0; // If -1, then actualRank will be 0, which might need better handling if it can truly be -1. For now, it won't be if `rowData` is from `sortedData`.

          return (
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mx-auto ${
              actualRank === 1 ? 'bg-yellow-400 text-yellow-900' :
              actualRank === 2 ? 'bg-gray-300 text-gray-700' :
              actualRank === 3 ? 'bg-orange-400 text-orange-900' :
              'bg-blue-100 text-blue-600'
            }`}>
              {actualRank > 0 ? actualRank : 'N/A'} {/* Display N/A if rank is somehow 0 */}
            </div>
          );
        }
      },
      ...columns
    ];
  }, [columns, showRankColumn, sortedData]); // Include sortedData in dependencies for accurate rank calculation

  // Helper function for text alignment CSS class
  const getTextAlignClass = (textAlign: 'left' | 'center' | 'right' = 'left') => {
    switch (textAlign) {
      case 'center': return 'text-center';
      case 'right': return 'text-right';
      case 'left': return 'text-left';
      default: return 'text-left';
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-xl overflow-hidden ${className}`}>
      {title && (
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
          <h3 className="text-2xl font-bold">{title}</h3>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-blue-200">
          <thead className="bg-blue-500 text-white">
            <tr>
              {columnsToRender.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider ${
                    column.sortable && enableSorting ? 'cursor-pointer hover:bg-blue-600 transition-colors duration-200' : ''
                  } ${getTextAlignClass(column.textAlign)}`}
                  onClick={() => column.sortable && handleSort(column.key)}
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.label}</span>
                    {column.sortable && enableSorting && sortColumn === column.key && (
                      sortDirection === 'asc' ? (
                        <ChevronUp className="w-4 h-4 text-white" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-white" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-blue-100">
            {paginatedData.map((row, index) => (
              <tr
                key={row.id || index} // Use a unique ID from data if available, otherwise fallback to index
                className={`${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'} hover:bg-blue-100 transition-colors duration-200`}
              >
                {columnsToRender.map((column) => (
                  <td
                    key={column.key}
                    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-800 ${getTextAlignClass(column.textAlign)}`}
                  >
                    {column.renderCell ? column.renderCell(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={columnsToRender.length} className="px-6 py-4 text-center text-gray-500 text-base">
                  No data available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showPagination && totalPages > 1 && (
        <div className="px-6 py-3 border-t border-blue-200 bg-blue-50 flex items-center justify-between">
          <div className="text-sm text-blue-700 font-medium">
            Showing {startIndex + 1} to {Math.min(startIndex + pageSize, sortedData.length)} of {sortedData.length} results
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-200 rounded-md hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm text-blue-800 font-semibold flex items-center justify-center">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-blue-700 bg-blue-200 rounded-md hover:bg-blue-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;