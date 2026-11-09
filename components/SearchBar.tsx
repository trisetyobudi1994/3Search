"use client";

import { Search, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { REGIONS } from "@/lib/regions";
import type { RegionCode } from "@/lib/types";

interface Props {
  onSearch: (query: string, region: RegionCode) => void;
  loading?: boolean;
  defaultRegion?: RegionCode;
  initialQuery?: string;
}

export default function SearchBar({
  onSearch,
  loading = false,
  defaultRegion = "ID",
  initialQuery = "",
}: Props) {
  const [value, setValue] = useState(initialQuery);
  const [region, setRegion] = useState<RegionCode>(defaultRegion);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setValue(initialQuery), [initialQuery]);
  useEffect(() => setRegion(defaultRegion), [defaultRegion]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement;
      const typing =
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement;

      if (event.key === "/" && !typing && !event.metaKey && !event.ctrlKey) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const query = value.replace(/\s+/g, " ").trim();
    if (query.length >= 2 && !loading) onSearch(query, region);
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-2xl" role="search">
      <div className="group relative rounded-3xl bg-white p-2 shadow-3d ring-1 ring-zinc-200/70 transition-all duration-300 focus-within:shadow-3d-glow focus-within:ring-2 focus-within:ring-violet-500/40">
        <div className="pointer-events-none absolute inset-x-8 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white to-transparent" />
        <div className="flex items-center gap-2 px-2 py-1">
          <Search className="h-5 w-5 shrink-0 text-zinc-400 transition-colors group-focus-within:text-violet-500" />
          <input
            ref={inputRef}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder='Coba: "serum niacinamide", "TWS bluetooth"…'
            aria-label="Kata kunci produk"
            maxLength={80}
            className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
            disabled={loading}
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || value.trim().length < 2}
            className="flex shrink-0 items-center gap-1.5 rounded-full gradient-bg px-4 py-2 text-sm font-medium text-white shadow-3d-glow transition-all duration-300 hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Analisis</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-zinc-100 px-2 pb-1 pt-2">
          <div className="flex items-center gap-1" role="group" aria-label="Pilih wilayah">
            <span className="mr-1 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
              Wilayah
            </span>
            {REGIONS.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setRegion(item.code)}
                aria-pressed={region === item.code}
                title={item.label}
                className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  region === item.code
                    ? "bg-zinc-900 text-white"
                    : "text-zinc-500 hover:bg-zinc-100"
                }`}
              >
                <span className="mr-1">{item.flag}</span>
                {item.short}
              </button>
            ))}
          </div>
          <span className="hidden text-[10px] text-zinc-400 sm:inline">
            Tekan{" "}
            <kbd className="rounded border border-zinc-200 bg-zinc-50 px-1 font-sans">/</kbd>{" "}
            untuk fokus cepat
          </span>
        </div>
      </div>
    </form>
  );
}
