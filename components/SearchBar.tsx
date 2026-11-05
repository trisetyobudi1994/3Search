"use client";

import { Search, Sparkles } from "lucide-react";
import { useState } from "react";

interface Props {
  onSearch: (q: string) => void;
  loading?: boolean;
  compact?: boolean;
}

export default function SearchBar({ onSearch, loading }: Props) {
  const [value, setValue] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onSearch(value.trim());
  };

  return (
    <form onSubmit={submit} className="mx-auto w-full max-w-2xl perspective-1200">
      <div className="group relative flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-3d ring-1 ring-zinc-200/70 transition-all duration-300 will-change-transform focus-within:shadow-3d-glow focus-within:ring-2 focus-within:ring-violet-500/40 hover:-translate-y-0.5 hover:shadow-3d-lg">
        <div className="pointer-events-none absolute inset-x-6 top-0 h-px rounded-full bg-gradient-to-r from-transparent via-white to-transparent opacity-90" />
        <Search className="h-5 w-5 shrink-0 text-zinc-400 transition-colors group-focus-within:text-violet-500" />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder='Coba: "skincare lokal", "gadget", "fashion"…'
          className="flex-1 bg-transparent text-[15px] text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
          disabled={loading}
          autoFocus
        />
        <button
          type="submit"
          disabled={loading || !value.trim()}
          className="flex items-center gap-1.5 rounded-full gradient-bg px-4 py-1.5 text-sm font-medium text-white shadow-3d-glow transition-all duration-300 hover:brightness-110 disabled:opacity-40 disabled:shadow-none"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Analisis
        </button>
      </div>
    </form>
  );
}
