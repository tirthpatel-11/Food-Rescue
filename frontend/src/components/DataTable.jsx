import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, Inbox } from 'lucide-react';

export default function DataTable({
  columns,
  data = [],
  loading = false,
  searchPlaceholder = 'Search...',
  onSearch,
  searchValue = '',
  filters,
  actions,
  itemsPerPage = 10,
  emptyMessage = 'No records found in database.'
}) {
  const [currentPage, setCurrentPage] = useState(1);

  // Pagination calculation
  const totalItems = data.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Search & Actions Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-50/50">
        <div className="flex flex-1 items-center gap-3">
          {onSearch && (
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => {
                  onSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800 placeholder-slate-400 shadow-sm transition-all"
              />
            </div>
          )}
          {filters}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>

      {/* Table Area */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 text-xs uppercase tracking-wider font-semibold">
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-5 py-3.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-slate-400">
                  <div className="inline-block w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin mb-2" />
                  <p className="text-xs font-medium">Executing SQL query & fetching data...</p>
                </td>
              </tr>
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-14 text-center">
                  <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                  <p className="text-slate-500 font-medium text-sm">{emptyMessage}</p>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className={`px-5 py-3.5 text-slate-700 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'} ${col.className || ''}`}
                    >
                      {col.render ? col.render(row) : row[col.accessor]}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && totalItems > 0 && (
        <div className="px-5 py-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/30">
          <div>
            Showing <span className="font-semibold text-slate-700">{startIndex + 1}</span> to{' '}
            <span className="font-semibold text-slate-700">
              {Math.min(startIndex + itemsPerPage, totalItems)}
            </span>{' '}
            of <span className="font-semibold text-slate-700">{totalItems}</span> records
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
