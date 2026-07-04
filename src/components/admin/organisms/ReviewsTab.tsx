// src/components/admin/organisms/ReviewsTab.tsx
'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star,
  Clock,
  Check,
  Trash2,
  Filter,
  X,
  AlertCircle,
  CheckCircle2,
  User,
  MessageSquare,
} from 'lucide-react';
import { Product, ID, Review } from '@/types/products';
import {
  Input,
  Button,
  Tooltip,
  Select,
  Switch,
} from '@/components/atoms';

interface ReviewsTabProps {
  product: Product;
  approveReview: (productId: ID, reviewId: ID) => void;
  deleteReview: (productId: ID, reviewId: ID) => void;
}

type ReviewFilter = 'all' | 'pending' | 'approved';

export function ReviewsTab({
  product,
  approveReview,
  deleteReview,
}: ReviewsTabProps) {
  const [filter, setFilter] = useState<ReviewFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);

  const reviews = product.reviews || [];

  const filteredReviews = useMemo(() => {
    let filtered = reviews;

    // Filter by status
    if (filter === 'pending') {
      filtered = filtered.filter((r) => !r.approved);
    } else if (filter === 'approved') {
      filtered = filtered.filter((r) => r.approved);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(
        (r) =>
          r.name.toLowerCase().includes(term) ||
          r.text.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [reviews, filter, searchTerm]);

  const pendingCount = reviews.filter((r) => !r.approved).length;
  const approvedCount = reviews.filter((r) => r.approved).length;

  const handleApprove = useCallback(
    (reviewId: ID) => {
      approveReview(product.id, reviewId);
      setSelectedReview(null);
    },
    [approveReview, product.id]
  );

  const handleDelete = useCallback(
    (reviewId: ID) => {
      if (confirm('Bu rəyi silmək istədiyinizə əminsiniz?')) {
        deleteReview(product.id, reviewId);
        setSelectedReview(null);
      }
    },
    [deleteReview, product.id]
  );

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-3.5 w-3.5 ${
              s <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-slate-200 text-slate-200'
            }`}
          />
        ))}
      </div>
    );
  };

  const filterOptions = [
    { value: 'all', label: `Hamısı (${reviews.length})` },
    { value: 'pending', label: `Gözləyən (${pendingCount})` },
    { value: 'approved', label: `Təsdiqlənmiş (${approvedCount})` },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-amber-500" />
          <h3 className="text-lg font-bold text-slate-800">
            Rəylər ({reviews.length})
          </h3>
          {pendingCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">
              <AlertCircle className="h-3 w-3" />
              {pendingCount} gözləyir
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={filter}
            onChange={(value) => setFilter(value as ReviewFilter)}
            options={filterOptions}
            containerClassName="w-48"
            className="border-2"
          />
        </div>
      </div>

      {/* Search */}
      <div className="max-w-sm">
        <Input
          name="review-search"
          value={searchTerm}
          onChange={(val) => setSearchTerm(val)}
          placeholder="Rəylərdə axtar..."
          icon={<Filter className="h-4 w-4" />}
          className="border-2"
        />
      </div>

      {/* No reviews */}
      {reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <MessageSquare className="h-12 w-12 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">Bu məhsul üçün hələ rəy yoxdur.</p>
        </div>
      )}

      {/* Reviews list */}
      {filteredReviews.length > 0 && (
        <div className="space-y-3">
          <AnimatePresence>
            {filteredReviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`rounded-2xl border p-4 shadow-sm transition-all ${
                  review.approved
                    ? 'border-slate-200 bg-white hover:border-emerald-200'
                    : 'border-amber-200 bg-amber-50/50 hover:border-amber-300'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  {/* Left: User info & review */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 font-bold text-emerald-700">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-slate-800">
                            {review.name}
                          </p>
                          {review.approved ? (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                              <CheckCircle2 className="h-3 w-3" />
                              Təsdiqlənib
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                              <Clock className="h-3 w-3" />
                              Gözləyir
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {renderStars(review.rating)}
                          <span className="text-xs text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString('az-AZ')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                      {review.text}
                    </p>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex flex-shrink-0 items-center gap-1">
                    {!review.approved && (
                      <Tooltip content="Rəyi təsdiqlə">
                        <button
                          type="button"
                          onClick={() => handleApprove(review.id)}
                          className="rounded-xl bg-emerald-600 p-2 text-white hover:bg-emerald-700 transition-colors"
                          aria-label="Təsdiqlə"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                      </Tooltip>
                    )}
                    <Tooltip content="Rəyi sil">
                      <button
                        type="button"
                        onClick={() => handleDelete(review.id)}
                        className="rounded-xl bg-red-50 p-2 text-red-600 hover:bg-red-100 transition-colors"
                        aria-label="Sil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </Tooltip>
                  </div>
                </div>

                {/* Review details (expandable) */}
                {selectedReview?.id === review.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-3 border-t border-slate-200 pt-3"
                  >
                    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
                      <div>
                        <span className="font-medium text-slate-500">ID:</span>
                        <span className="ml-2 font-mono text-slate-700">
                          {review.id}
                        </span>
                      </div>
                      <div>
                        <span className="font-medium text-slate-500">Reytinq:</span>
                        <span className="ml-2 font-semibold text-slate-700">
                          {review.rating}/5
                        </span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="font-medium text-slate-500">Tam mətn:</span>
                        <p className="mt-1 whitespace-pre-wrap text-slate-700">
                          {review.text}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Filtered no results */}
      {reviews.length > 0 && filteredReviews.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <Filter className="h-12 w-12 text-slate-300" />
          <p className="mt-2 text-sm text-slate-500">
            {filter === 'pending'
              ? 'Gözləyən rəy yoxdur'
              : filter === 'approved'
              ? 'Təsdiqlənmiş rəy yoxdur'
              : 'Axtarışa uyğun rəy tapılmadı'}
          </p>
        </div>
      )}

      {/* Summary */}
      {reviews.length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span className="font-semibold">Cəmi:</span>
              <span>{reviews.length}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-600">
              <Clock className="h-4 w-4" />
              <span className="font-semibold">Gözləyən:</span>
              <span>{pendingCount}</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
              <span className="font-semibold">Təsdiqlənmiş:</span>
              <span>{approvedCount}</span>
            </div>
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="h-4 w-4 fill-amber-400" />
              <span className="font-semibold">Orta reytinq:</span>
              <span>
                {reviews.length > 0
                  ? (
                      reviews.reduce((sum, r) => sum + (r.rating || 0), 0) /
                      reviews.length
                    ).toFixed(1)
                  : '0.0'}
                /5
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewsTab;