// src/components/admin/orders/OrdersPagination.tsx
"use client";

import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export type OrdersPaginationProps = {
  totalItems: number;
  page: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  pageSize: number;
  setPageSize: React.Dispatch<React.SetStateAction<number>>;
};

export const OrdersPagination: React.FC<OrdersPaginationProps> = ({
  totalItems,
  page,
  setPage,
  pageSize,
  setPageSize,
}) => {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentStart = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const currentEnd = Math.min(totalItems, page * pageSize);

  const handlePrev = () => {
    setPage((prev) => Math.max(1, prev - 1));
  };

  const handleNext = () => {
    setPage((prev) => Math.min(totalPages, prev + 1));
  };

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setPage(1);
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-3 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-slate-700">Səhifə ölçüsü:</span>
        <select
          value={pageSize}
          onChange={(e) => handlePageSizeChange(Number(e.target.value))}
          className="border rounded-lg px-2 py-1 text-sm bg-white shadow-sm"
        >
          <option value={10}>10</option>
          <option value={20}>20</option>
          <option value={50}>50</option>
        </select>
        <span className="text-slate-500">
          Göstərilir:{" "}
          <strong className="text-slate-800">
            {currentStart}-{currentEnd}
          </strong>{" "}
          / {totalItems}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <button
          disabled={page === 1}
          onClick={handlePrev}
          className="p-2 rounded-lg bg-slate-100 disabled:opacity-40 hover:bg-slate-200 transition"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="text-sm text-slate-700">
          Səhifə{" "}
          <strong>
            {page} / {totalPages}
          </strong>
        </span>

        <button
          disabled={page === totalPages}
          onClick={handleNext}
          className="p-2 rounded-lg bg-slate-100 disabled:opacity-40 hover:bg-slate-200 transition"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default OrdersPagination;
