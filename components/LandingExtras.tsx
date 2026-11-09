"use client";

import { Bookmark, Clock, Trash2 } from "lucide-react";
import { getRegion } from "@/lib/regions";
import { formatIDR, toIDR } from "@/lib/currency";
import type { Product, RecentSearch, RegionCode } from "@/lib/types";

interface Props {
  recent: RecentSearch[];
  saved: Product[];
  onRun: (query: string, region: RegionCode) => void;
  onToggleSave: (product: Product) => void;
  onClearRecent: () => void;
}

export default function LandingExtras({
  recent,
  saved,
  onRun,
  onToggleSave,
  onClearRecent,
}: Props) {
  if (recent.length === 0 && saved.length === 0) return null;

  return (
    <div className="mx-auto mt-8 w-full max-w-2xl space-y-4 text-left">
      {recent.length > 0 && (
        <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-3d-sm backdrop-blur-xl">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              <Clock className="h-3.5 w-3.5" />
              Pencarian terakhir
            </div>
            <button
              type="button"
              onClick={onClearRecent}
              className="inline-flex items-center gap-1 text-[10px] text-zinc-400 transition-colors hover:text-rose-600"
            >
              <Trash2 className="h-3 w-3" />
              Bersihkan
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {recent.map((item) => {
              const meta = getRegion(item.region);
              return (
                <button
                  key={`${item.query}-${item.region}-${item.at}`}
                  type="button"
                  onClick={() => onRun(item.query, item.region)}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs text-zinc-600 shadow-3d-sm transition-all hover:-translate-y-0.5 hover:text-violet-700 hover:shadow-3d"
                >
                  <span className="mr-1">{meta.flag}</span>
                  {item.query}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {saved.length > 0 && (
        <div className="rounded-2xl border border-white/70 bg-white/70 p-4 shadow-3d-sm backdrop-blur-xl">
          <div className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            <Bookmark className="h-3.5 w-3.5" />
            Daftar pantau ({saved.length})
          </div>
          <ul className="divide-y divide-zinc-100">
            {saved.map((product) => (
              <li key={product.id} className="flex items-center gap-3 py-2">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-zinc-50 text-lg ring-1 ring-zinc-200/70">
                  {product.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.image}
                      alt=""
                      className="h-full w-full object-cover"
                      loading="lazy"
                    />
                  ) : (
                    product.emoji ?? "📦"
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-zinc-800">
                    {product.name}
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    {formatIDR(product.priceIDR ?? toIDR(product.price, product.currency))}
                    {product.shop ? ` · ${product.shop}` : ""}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onToggleSave(product)}
                  aria-label={`Hapus ${product.name} dari daftar pantau`}
                  className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-rose-600"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
