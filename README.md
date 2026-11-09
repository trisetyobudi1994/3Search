# 3Search
Scan potensi pasar TikTok Shop — saring ~100 produk menjadi 3 kandidat terbaik.

## Jalankan lokal
```bash
cp .env.example .env.local   # isi APIFY_TOKEN minimal
npm install
npm run dev
```

## Deploy ke Vercel
1. Import repo di vercel.com → framework Next.js terdeteksi otomatis.
2. Settings → Environment Variables: isi variabel dari `.env.example` (minimal `APIFY_TOKEN`).
3. (Opsional) Jalankan `supabase-schema.sql` di Supabase untuk fitur Hit Rate.
4. Deploy. Route `/api/analyze` butuh waktu hingga 60 detik (`maxDuration = 60`).
5. Cek konfigurasi: set `DEBUG_KEY`, lalu buka `/api/debug?key=<DEBUG_KEY>`.
