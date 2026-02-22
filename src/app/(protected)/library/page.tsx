"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import {
  Search,
  Plus,
  Filter,
  Grid3X3,
  List,
  SortAsc,
  X,
  BookOpen,
  CheckCircle,
  AlertTriangle,
  Library,
} from "lucide-react";
import { BookCard, BookCardSkeleton, EmptyLibrary, type BookSummary } from "@/components/library/BookCard";
import { BookDetailModal } from "@/components/library/BookDetailModal";
import { BookFormModal } from "@/components/library/BookFormModal";

const GENRES = [
  "Fiction", "Non-Fiction", "Science Fiction", "Mystery", "Biography",
  "History", "Science", "Technology", "Self-Help", "Business", "Romance",
  "Fantasy", "Horror", "Children's", "Young Adult", "Philosophy", "Psychology",
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Date Added" },
  { value: "title", label: "Title A–Z" },
  { value: "author", label: "Author A–Z" },
  { value: "publishedYear", label: "Year" },
];

interface Stats {
  total: number;
  available: number;
  checkedOut: number;
}

export default function LibraryPage() {
  const { data: session } = useSession();
  const userRole = session?.user?.role ?? "USER";
  const userId = session?.user?.id ?? "";
  const isStaff = userRole === "ADMIN" || userRole === "LIBRARIAN";

  const [books, setBooks] = useState<BookSummary[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, available: 0, checkedOut: 0 });
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const [search, setSearch] = useState("");
  const [genre, setGenre] = useState("");
  const [status, setStatus] = useState("");
  const [sort, setSort] = useState("createdAt");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const [detailBookId, setDetailBookId] = useState<string | null>(null);
  const [editBook, setEditBook] = useState<BookSummary | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const PAGE_SIZE = 12;

  const fetchBooks = useCallback(async (pg: number, append = false) => {
    if (pg === 1) setLoading(true);
    else setLoadingMore(true);

    const params = new URLSearchParams({
      ...(search && { search }),
      ...(genre && { genre }),
      ...(status && { status }),
      sort,
      page: pg.toString(),
      limit: PAGE_SIZE.toString(),
    });

    try {
      const res = await fetch(`/api/library/books?${params}`);
      const data = await res.json();

      setBooks(prev => append ? [...prev, ...data.books] : data.books);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      setStats(data.stats);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [search, genre, status, sort]);

  // Reset to page 1 on filter changes
  useEffect(() => {
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setPage(1);
      fetchBooks(1, false);
    }, search ? 350 : 0);
    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [search, genre, status, sort, fetchBooks]);

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchBooks(next, true);
  };

  const handleRefresh = () => {
    setPage(1);
    fetchBooks(1, false);
  };

  const clearFilters = () => {
    setSearch("");
    setGenre("");
    setStatus("");
    setSort("createdAt");
  };

  const hasFilters = search || genre || status || sort !== "createdAt";

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Library size={24} className="text-indigo-600" />
            Library Catalog
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {total > 0 ? `${total} book${total !== 1 ? "s" : ""} in the collection` : "Browse the library collection"}
          </p>
        </div>
        {isStaff && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors shadow-sm"
          >
            <Plus size={16} />
            Add Book
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: "Total Books", value: stats.total, icon: BookOpen, color: "text-indigo-600", bg: "bg-indigo-50" },
          { label: "Available", value: stats.available, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Checked Out", value: stats.checkedOut, icon: AlertTriangle, color: "text-orange-600", bg: "bg-orange-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-3 shadow-sm">
            <div className={`p-2 rounded-lg ${bg}`}>
              <Icon size={16} className={color} />
            </div>
            <div>
              <p className="text-lg font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="flex-1 min-w-60 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, author, genre, ISBN..."
              className="w-full border border-slate-200 rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-slate-50"
            />
            {search && (
              <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                <X size={14} />
              </button>
            )}
          </div>

          {/* Genre */}
          <div className="relative">
            <Filter size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value)}
              className="border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none cursor-pointer"
            >
              <option value="">All Genres</option>
              {GENRES.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {/* Status */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
          >
            <option value="">All Status</option>
            <option value="AVAILABLE">Available</option>
            <option value="CHECKED_OUT">Checked Out</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>

          {/* Sort */}
          <div className="relative">
            <SortAsc size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-slate-200 rounded-xl pl-8 pr-3 py-2.5 text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 appearance-none cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* View toggle */}
          <div className="flex border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
            <button
              onClick={() => setViewMode("grid")}
              className={`px-3 py-2.5 ${viewMode === "grid" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-700"} transition-colors`}
            >
              <Grid3X3 size={15} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-2.5 ${viewMode === "list" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-700"} transition-colors`}
            >
              <List size={15} />
            </button>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-red-600 px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 hover:border-red-200 transition-colors"
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>
      </div>

      {/* Book Grid/List */}
      {loading ? (
        <div className={viewMode === "grid"
          ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4"
          : "flex flex-col gap-3"
        }>
          {Array.from({ length: 10 }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      ) : books.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <EmptyLibrary />
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {books.map((book) => (
            <BookCard key={book.id} book={book} onClick={() => setDetailBookId(book.id)} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {books.map((book) => (
            <button
              key={book.id}
              onClick={() => setDetailBookId(book.id)}
              className="group flex items-center gap-4 bg-white rounded-xl border border-slate-200 px-5 py-4 hover:border-indigo-300 hover:shadow-sm transition-all text-left"
            >
              <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-700 font-bold text-sm">{book.title.charAt(0)}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-900 text-sm group-hover:text-indigo-700 truncate">{book.title}</p>
                <p className="text-xs text-slate-500 truncate">{book.author}</p>
              </div>
              {book.genre && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full flex-shrink-0">{book.genre}</span>
              )}
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                book.status === "AVAILABLE" ? "bg-green-100 text-green-700" :
                book.status === "CHECKED_OUT" ? "bg-red-100 text-red-700" :
                "bg-slate-100 text-slate-600"
              }`}>
                {book.availableCopies}/{book.totalCopies} available
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Load more */}
      {!loading && page < totalPages && (
        <div className="mt-8 text-center">
          <button
            onClick={handleLoadMore}
            disabled={loadingMore}
            className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {loadingMore ? "Loading..." : `Load more (${total - books.length} remaining)`}
          </button>
        </div>
      )}

      {/* Modals */}
      {detailBookId && (
        <BookDetailModal
          bookId={detailBookId}
          userRole={userRole}
          userId={userId}
          onClose={() => setDetailBookId(null)}
          onEdit={(book) => {
            setEditBook(book as BookSummary);
            setDetailBookId(null);
          }}
          onDeleted={handleRefresh}
          onCheckoutChange={handleRefresh}
        />
      )}

      {showAddModal && (
        <BookFormModal
          onClose={() => setShowAddModal(false)}
          onSaved={handleRefresh}
        />
      )}

      {editBook && (
        <BookFormModal
          initial={editBook}
          onClose={() => setEditBook(null)}
          onSaved={handleRefresh}
        />
      )}
    </div>
  );
}
