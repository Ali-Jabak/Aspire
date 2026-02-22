"use client";

import { useState, useEffect, useCallback } from "react";
import {
  X,
  Star,
  BookOpen,
  Calendar,
  Clock,
  MapPin,
  Users,
  Hash,
  Globe,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
  RotateCcw,
} from "lucide-react";

interface Review {
  id: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  user: { id: string; name?: string | null; image?: string | null };
}

interface CheckoutRecord {
  id: string;
  userId: string;
  checkedOutAt: string;
  dueDate: string;
  returnedAt?: string | null;
  status: string;
}

interface BookDetail {
  id: string;
  title: string;
  author: string;
  isbn?: string | null;
  description?: string | null;
  coverUrl?: string | null;
  genre?: string | null;
  publisher?: string | null;
  publishedYear?: number | null;
  language?: string | null;
  pageCount?: number | null;
  tags: string[];
  totalCopies: number;
  availableCopies: number;
  status: "AVAILABLE" | "CHECKED_OUT" | "RESERVED" | "MAINTENANCE";
  location?: string | null;
  avgRating?: number | null;
  reviews: Review[];
  userCheckout?: CheckoutRecord | null;
  addedBy?: { id: string; name?: string | null };
}

interface Props {
  bookId: string;
  userRole: string;
  userId: string;
  onClose: () => void;
  onEdit?: (book: BookDetail) => void;
  onDeleted?: () => void;
  onCheckoutChange?: () => void;
}

function StarRating({ value, onChange }: { value: number; onChange?: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          onMouseEnter={() => onChange && setHover(star)}
          onMouseLeave={() => onChange && setHover(0)}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          disabled={!onChange}
        >
          <Star
            size={16}
            className={
              star <= (hover || value)
                ? "fill-amber-400 text-amber-400"
                : "text-slate-300"
            }
          />
        </button>
      ))}
    </div>
  );
}

export function BookDetailModal({
  bookId,
  userRole,
  userId,
  onClose,
  onEdit,
  onDeleted,
  onCheckoutChange,
}: Props) {
  const [book, setBook] = useState<BookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Review state
  const [myRating, setMyRating] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const isStaff = userRole === "ADMIN" || userRole === "LIBRARIAN";

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchBook = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/library/books/${bookId}`);
    const data = await res.json();
    setBook(data);
    // Pre-fill user's existing review
    const existing = data.reviews?.find((r: Review) => r.user.id === userId);
    if (existing) {
      setMyRating(existing.rating);
      setMyComment(existing.comment ?? "");
    }
    setLoading(false);
  }, [bookId, userId]);

  useEffect(() => {
    fetchBook();
  }, [fetchBook]);

  const handleCheckout = async () => {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/library/books/${bookId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ dueDays: 14 }),
      });
      const data = await res.json().catch(() => ({ error: res.statusText || "Checkout failed" }));
      if (!res.ok) throw new Error(data.error || "Checkout failed");
      showToast("Book checked out! Due in 14 days.");
      fetchBook();
      onCheckoutChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to checkout");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReturn = async () => {
    setActionLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/library/books/${bookId}/return`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({ error: res.statusText || "Return failed" }));
      if (!res.ok) throw new Error(data.error);
      showToast("Book returned successfully!");
      fetchBook();
      onCheckoutChange?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to return");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Delete "${book?.title}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/library/books/${bookId}`, { method: "DELETE" });
    if (res.ok) {
      onDeleted?.();
      onClose();
    }
  };

  const handleReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myRating) return;
    setReviewLoading(true);
    try {
      const res = await fetch(`/api/library/books/${bookId}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating: myRating, comment: myComment }),
      });
      if (!res.ok) throw new Error("Failed to submit review");
      showToast("Review submitted!");
      setShowReviewForm(false);
      fetchBook();
    } catch {
      setError("Failed to submit review");
    } finally {
      setReviewLoading(false);
    }
  };

  const statusConfig = {
    AVAILABLE: { color: "text-green-600 bg-green-50", icon: CheckCircle, label: "Available" },
    CHECKED_OUT: { color: "text-red-600 bg-red-50", icon: AlertCircle, label: "Checked Out" },
    RESERVED: { color: "text-yellow-600 bg-yellow-50", icon: Clock, label: "Reserved" },
    MAINTENANCE: { color: "text-slate-500 bg-slate-100", icon: AlertCircle, label: "Maintenance" },
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Toast */}
        {toast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-green-600 text-white px-5 py-2.5 rounded-full text-sm font-medium shadow-lg z-50 flex items-center gap-2">
            <CheckCircle size={14} /> {toast}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-indigo-500" size={32} />
          </div>
        ) : !book ? (
          <div className="p-8 text-center text-slate-500">Book not found.</div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-slate-900 truncate pr-4">{book.title}</h2>
              <div className="flex items-center gap-2 flex-shrink-0">
                {isStaff && onEdit && (
                  <button
                    onClick={() => { onEdit(book); onClose(); }}
                    className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                    title="Edit book"
                  >
                    <Edit size={16} />
                  </button>
                )}
                {userRole === "ADMIN" && (
                  <button
                    onClick={handleDelete}
                    className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                    title="Delete book"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Body */}
            <div className="p-6">
              <div className="flex gap-5">
                {/* Cover */}
                <div className="flex-shrink-0 w-28 h-40 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center">
                  {book.coverUrl ? (
                    <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {book.title.charAt(0)}
                    </span>
                  )}
                </div>

                {/* Main info */}
                <div className="flex-1 min-w-0">
                  <p className="text-slate-600 font-medium">{book.author}</p>
                  {book.publisher && (
                    <p className="text-sm text-slate-400">{book.publisher}</p>
                  )}

                  {/* Status + copies */}
                  {(() => {
                    const cfg = statusConfig[book.status] ?? statusConfig.AVAILABLE;
                    const Icon = cfg.icon;
                    return (
                      <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-sm font-medium ${cfg.color}`}>
                        <Icon size={14} />
                        {cfg.label} · {book.availableCopies}/{book.totalCopies} copies
                      </div>
                    );
                  })()}

                  {/* Metadata pills */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    {book.genre && (
                      <span className="bg-indigo-50 text-indigo-700 text-xs px-2.5 py-1 rounded-full font-medium">
                        {book.genre}
                      </span>
                    )}
                    {book.publishedYear && (
                      <span className="flex items-center gap-1 bg-slate-50 text-slate-600 text-xs px-2.5 py-1 rounded-full">
                        <Calendar size={10} /> {book.publishedYear}
                      </span>
                    )}
                    {book.pageCount && (
                      <span className="flex items-center gap-1 bg-slate-50 text-slate-600 text-xs px-2.5 py-1 rounded-full">
                        <FileText size={10} /> {book.pageCount} pages
                      </span>
                    )}
                    {book.language && (
                      <span className="flex items-center gap-1 bg-slate-50 text-slate-600 text-xs px-2.5 py-1 rounded-full">
                        <Globe size={10} /> {book.language}
                      </span>
                    )}
                    {book.location && (
                      <span className="flex items-center gap-1 bg-slate-50 text-slate-600 text-xs px-2.5 py-1 rounded-full">
                        <MapPin size={10} /> {book.location}
                      </span>
                    )}
                    {book.isbn && (
                      <span className="flex items-center gap-1 bg-slate-50 text-slate-500 text-xs px-2.5 py-1 rounded-full font-mono">
                        <Hash size={10} /> {book.isbn}
                      </span>
                    )}
                  </div>

                  {/* Avg Rating */}
                  {book.avgRating != null && (
                    <div className="flex items-center gap-2 mt-3">
                      <StarRating value={Math.round(book.avgRating)} />
                      <span className="text-sm text-slate-600 font-medium">
                        {book.avgRating.toFixed(1)}
                      </span>
                      <span className="text-xs text-slate-400">
                        ({book.reviews.length} review{book.reviews.length !== 1 ? "s" : ""})
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              {book.description && (
                <div className="mt-5">
                  <p className="text-sm font-semibold text-slate-700 mb-1.5">About</p>
                  <p className="text-sm text-slate-600 leading-relaxed">{book.description}</p>
                </div>
              )}

              {/* Tags */}
              {book.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {book.tags.map((tag) => (
                    <span key={tag} className="text-xs bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              <div className="mt-6 flex flex-wrap gap-3">
                {book.userCheckout ? (
                  <div className="flex items-center gap-3 w-full">
                    <div className="flex-1 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                      <p className="text-xs text-amber-700 font-medium">Currently checked out by you</p>
                      <p className="text-xs text-amber-600 mt-0.5">
                        Due: {new Date(book.userCheckout.dueDate).toLocaleDateString()}
                        {new Date(book.userCheckout.dueDate) < new Date() && (
                          <span className="ml-2 text-red-600 font-semibold">OVERDUE</span>
                        )}
                      </p>
                    </div>
                    <button
                      onClick={handleReturn}
                      disabled={actionLoading}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    >
                      {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                      Return Book
                    </button>
                  </div>
                ) : book.availableCopies > 0 ? (
                  <button
                    onClick={handleCheckout}
                    disabled={actionLoading}
                    className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />}
                    Check Out (14 days)
                  </button>
                ) : isStaff ? (
                  <button
                    onClick={handleReturn}
                    disabled={actionLoading}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                    title="Return on behalf of borrower"
                  >
                    {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <RotateCcw size={14} />}
                    Process Return
                  </button>
                ) : null}

                {book.reviews.find((r) => r.user.id === userId) ? (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="flex items-center gap-2 border border-slate-300 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Star size={14} />
                    {showReviewForm ? "Cancel" : "Edit Review"}
                  </button>
                ) : (
                  <button
                    onClick={() => setShowReviewForm(!showReviewForm)}
                    className="flex items-center gap-2 border border-slate-300 text-slate-600 hover:bg-slate-50 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Star size={14} />
                    {showReviewForm ? "Cancel" : "Write Review"}
                  </button>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-3 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">
                  {error}
                </div>
              )}

              {/* Review Form */}
              {showReviewForm && (
                <form onSubmit={handleReview} className="mt-5 border border-slate-200 rounded-xl p-4 space-y-3">
                  <p className="text-sm font-semibold text-slate-700">Your Review</p>
                  <div>
                    <label className="text-xs text-slate-500 mb-1 block">Rating</label>
                    <StarRating value={myRating} onChange={setMyRating} />
                  </div>
                  <textarea
                    value={myComment}
                    onChange={(e) => setMyComment(e.target.value)}
                    placeholder="Share your thoughts about this book..."
                    rows={3}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  />
                  <button
                    type="submit"
                    disabled={!myRating || reviewLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {reviewLoading && <Loader2 size={12} className="animate-spin" />}
                    Submit Review
                  </button>
                </form>
              )}

              {/* Reviews */}
              {book.reviews.length > 0 && (
                <div className="mt-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Users size={14} className="text-slate-400" />
                    <span className="text-sm font-semibold text-slate-700">
                      Reviews ({book.reviews.length})
                    </span>
                  </div>
                  <div className="space-y-3">
                    {book.reviews.map((review) => (
                      <div
                        key={review.id}
                        className={`p-3 rounded-xl ${review.user.id === userId ? "bg-indigo-50 border border-indigo-100" : "bg-slate-50"}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-6 h-6 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 text-xs font-bold">
                            {review.user.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </div>
                          <span className="text-xs font-medium text-slate-700">
                            {review.user.id === userId ? "You" : review.user.name ?? "Anonymous"}
                          </span>
                          <StarRating value={review.rating} />
                          <span className="ml-auto text-[10px] text-slate-400">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {review.comment && (
                          <p className="text-xs text-slate-600 ml-8 leading-relaxed">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
