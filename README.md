# 3Search

Saring ratusan produk TikTok Shop menjadi **3 kandidat terkuat**, lengkap dengan alasan, risiko, peta toko, saturasi pasar, dan simulasi profit — plus hit rate yang dipublikasikan terbuka.

> Prinsip utama: **tidak jual mimpi**. Semua angka berasal dari data yang benar-benar tersedia, dan aplikasi tetap bisa dipakai dalam mode demo ketika scraper belum dikonfigurasi.

---

## Fitur

- **Funnel transparan** — setiap tahap (kandidat awal → lolos filter → skor kuat → top 3) ditampilkan jumlahnya, bukan angka hiasan.
- **Skor sinyal 0–100** — volume penjualan, rating, kedalaman ulasan, kesesuaian harga, dan kelengkapan data. Rincian poin bisa dibuka di setiap kartu.
- **Insight pasar** — peta toko/merek, saturasi berbasis jumlah penjual dan dominasi, serta action playbook.
- **Harga Rupiah end-to-end** — kartu, insight, daftar pantau, dan ekspor memakai IDR; harga US/MY dikonversi dengan kurs estimasi yang bisa dioverride di server.
- **Simulasi profit Rupiah** — ubah harga jual, COGS, fee platform, ongkir, dan biaya lain; lihat profit bersih, margin, ROI, modal, dan titik impas dalam IDR.
- **Feedback loop** — validasi “beneran laku / meleset” per rekomendasi, lalu tampil sebagai hit rate publik di `/stats`.
- **Pencarian multi-wilayah** — Indonesia, Amerika Serikat, Malaysia; format mata uang mengikuti wilayah.
- **Riwayat & daftar pantau** — tersimpan di perangkat (localStorage), tanpa akun.
- **Bagikan & ekspor** — tautan analisis (`/?q=...&region=ID`), ekspor CSV dan JSON.
- **Mode demo** — tanpa API key, seluruh alur tetap bisa dicoba dengan dataset simulasi yang deterministik dan ditandai jelas.
- **Tahan gagal** — scraper error/timeout tidak mematikan aplikasi; hasil fallback diberi peringatan eksplisit.
- **API aman** — endpoint debug yang membocorkan token dihapus, rate limit in-memory, dan database memakai service role di server.

---

## Cara kerja

```
Kata kunci + wilayah
        │
        ▼
[1] Ambil kandidat        Apify actor (atau dataset demo)
        │
        ▼
[2] Normalisasi           toleran terhadap berbagai skema actor + dedupe
        │
        ▼
[3] Filter kualitas        stok tersedia, ada sinyal permintaan, rating ≥ 4.0
        │
        ▼
[4] Skor sinyal           penjualan 35 · rating 25 · ulasan 15 · harga 15 · data 10
        │
        ▼
[5] Insight + top 3        saturasi, peta toko, playbook, simulasi profit
        │
        ▼
[6] Simpan (live saja)     Supabase: searches → recommendations → feedback
```

### Model skor

| Sinyal | Bobot | Dasar perhitungan |
| --- | --- | --- |
| Volume penjualan | 35 | log10 unit terjual (skala 25.000) |
| Rating | 25 | rating 3,5–5,0, dibobot kedalaman ulasan |
| Kedalaman ulasan | 15 | log10 jumlah ulasan (skala 3.000) |
| Kesesuaian harga | 15 | jarak harga terhadap zona impulse buy wilayah |
| Kelengkapan data | 10 | toko, kategori, gambar, stok, tautan, gratis ongkir |

Confidence (`tinggi/sedang/rendah`) diturunkan dari kombinasi ulasan, rating, dan volume — bukan angka acak.

### Harga & simulasi profit (Rupiah)

Semua harga yang ditampilkan adalah Rupiah. Untuk region US/MY, harga asli dikonversi memakai kurs estimasi:

```
harga_IDR = harga_asli × kurs
profit_bersih = harga_jual − COGS − fee_platform − ongkir − biaya_lain
margin = profit_bersih / harga_jual
ROI = profit_bersih / (COGS + ongkir + biaya_lain)
titik_impas = (ongkir + biaya_lain) / (1 − (COGS% + fee%))
```

Kurs default: `1 USD = Rp16.500`, `1 MYR = Rp3.700`. Override lewat `IDR_RATE_USD` / `IDR_RATE_MYR` di server; nilai yang dipakai ikut dikirim di `idrRates` pada respons analisis. Harga asli tetap ditampilkan kecil di kartu produk. Kurs adalah estimasi, bukan kurs transaksi bank/payment gateway.

---

## Menjalankan lokal

```bash
npm ci
cp .env.example .env.local   # opsional
npm run dev                  # http://localhost:3000
```

Perintah lain:

```bash
npm run typecheck   # TypeScript strict
npm run build       # build produksi
npm start           # jalankan hasil build
```

Catatan Next 16: skrip `dev`/`build` memakai `--webpack` karena build Turbopack pada kombinasi Next 16 + React 18 tidak menghasilkan route App Router di proyek ini. Saat membuka dev server lewat hostname tunnel/preview, set `NEXT_DEV_ORIGIN=<hostname>` (tanpa skema) agar Next mengizinkan resource dev cross-origin; tanpa itu halaman tampil tetapi tidak ter-hidrasi.

### Tanpa konfigurasi apa pun

Aplikasi langsung berjalan dalam **mode demo**: dataset simulasi dibuat deterministik dari kata kunci + wilayah, lalu melewati pipeline yang sama (normalisasi, filter, skor, insight). Mode demo ditandai di navigasi, header hasil, dan daftar peringatan. Feedback disimpan di perangkat, bukan database.

### Konfigurasi scraper (data live)

| Variabel | Wajib | Keterangan |
| --- | --- | --- |
| `APIFY_TOKEN` | tidak | Tanpa token → mode demo |
| `APIFY_ACTOR` | tidak | Default `herus13/tiktok-shop-scraper` |
| `APIFY_TIMEOUT_SECONDS` | tidak | Default 45 detik (10–50, mengikuti batas route 60 detik) |
| `APIFY_ACTOR_INPUT` | tidak | JSON tambahan/override input actor, mis. `{"scrape_product_details":false}` |
| `IDR_RATE_USD` | tidak | Kurs USD→IDR, default `16500` |
| `IDR_RATE_MYR` | tidak | Kurs MYR→IDR, default `3700` |

Aktor default menerima `search_terms` (array), `region`, dan `max_results`; kode mengirim ketiganya. `APIFY_ACTOR_INPUT` di-merge terakhir bila perlu menimpa input. Untuk region `ID`, aktor membaca TikTok Shop via Tokopedia.

Aktor harus mengembalikan item dengan field seperti `title`, `price`, `sold_count`, `rating`, `review_count`, `seller_name`, `product_url`, `main_image`, dan opsional `category_path`/`stock_total`. Normalizer menerima beberapa alias umum, sehingga pergantian aktor tidak langsung merusak mapping; baris gagal dari aktor (hanya `_meta`) otomatis dilewati dan dihitung di peringatan.

### Cache (opsional)

Tanpa Upstash, cache memakai memori proses (hilang saat server restart) — cukup untuk pengembangan. Isi `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` untuk cache bersama dengan TTL `CACHE_TTL_MINUTES` (default 360 menit). Hanya hasil live yang di-cache; hasil dari cache ditandai di UI.

### Database feedback & statistik (opsional)

1. Buat project Supabase.
2. Jalankan `supabase/schema.sql` di SQL Editor.
3. Set `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` (server-only).

RLS tetap aktif dan **tidak ada policy untuk anon** — hanya service role yang dipakai server. Tanpa database, `/stats` menampilkan status “database belum terhubung” dan panel validasi lokal perangkat.

### Checklist jalur live (Apify + Supabase)

1. Buat token di console Apify, lalu isi `APIFY_TOKEN` di `.env.local` (jangan commit) atau di project secrets. Jangan pernah menempelkan token ke chat.
2. Default actor menerima `search_terms`, `region`, dan `max_results` (sudah dikirim otomatis). Tambahan input bisa lewat `APIFY_ACTOR_INPUT`. Timeout dijaga 10–50 detik.
3. Untuk feedback publik: buat project Supabase, jalankan `supabase/schema.sql`, lalu set `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`.
4. Restart server, lalu cek `curl -s localhost:3000/api/health`. Target: `dataSource: "live"`, `scraper.configured: true`, `database: true`.
5. Analisis sekali lewat UI/`curl`. Respons sukses berisi `mode: "live"`, `idrRates`, dan setiap produk punya `priceIDR`. Jika scraper gagal, respons tetap 200 dengan `mode: "demo"` dan `warnings` yang menyebut kode error — aplikasi tidak ikut mati.
6. Setelah analisis live, tombol validasi mengirim `rec_id` ke database. Cek `/stats` untuk memastikan hit rate bertambah.

Rate limit otomatis turun ke 20 analisis/10 menit saat mode live untuk menjaga kuota scraper.

---

## API

| Endpoint | Metode | Keterangan |
| --- | --- | --- |
| `/api/analyze` | `POST` | `{ query, region }` → `FunnelResult`. Validasi, rate limit, cache, fallback demo. |
| `/api/analyze/feedback` | `POST` | `{ rec_id, status: "success" \| "failed" }`. Idempoten (unique constraint). |
| `/api/stats` | `GET` | Agregat hit rate, tren 30 hari, top query. Aman saat DB kosong. |
| `/api/health` | `GET` | Status konfigurasi aman: `dataSource`, `database`, `cache`, `version`, `scraper`, `idrRates`. |

Contoh:

```bash
curl -s http://localhost:3000/api/analyze \
  -H 'content-type: application/json' \
  -d '{"query":"serum niacinamide","region":"ID"}' | head -c 600
```

Kode error analisis: `invalid_body`, `invalid_query`, `rate_limited` (dengan `Retry-After`), `analyze_failed`.

---

## Struktur proyek

```
app/
  page.tsx                    landing + alur analisis + hasil
  stats/page.tsx              dashboard hit rate
  api/analyze/route.ts        analisis (cache, demo fallback, persist)
  api/analyze/feedback/       validasi rekomendasi
  api/stats/route.ts          agregat publik
  api/health/route.ts         status konfigurasi aman
components/                   SearchBar, ProductCard, WarRoom, Funnel, dll.
lib/
  normalize.ts                mapping toleran berbagai skema actor
  scoring.ts                  model skor + alasan/risiko
  insights.ts                 saturasi, peta toko, playbook
  pipeline.ts                 orkestrasi funnel
  demo.ts                     generator dataset demo deterministik
  apify.ts                    klien scraper + error terketik
  cache.ts / rate-limit.ts    cache & pembatas permintaan
  currency.ts                 konversi & format Rupiah
  supabase.ts                 klien server-only
  local-store.ts              riwayat, shortlist, feedback lokal
supabase/schema.sql           skema + constraint
```

---

## Batasan & transparansi

- Hit rate adalah **persentase rekomendasi yang divalidasi pengguna sebagai “laku”**, bukan prediksi. Sample size kecil membuat angka fluktuatif.
- Data marketplace berubah cepat; hasil bisa berbeda beberapa jam kemudian.
- Rate limit in-memory bersifat best effort per instance. Untuk trafik tinggi, pindahkan ke Redis/edge limiter.
- Normalizer menebak format harga Indonesia/Inggris. Selalu cek harga di halaman produk sebelum mengambil keputusan.
- Mode demo adalah simulasi — jangan dipakai untuk keputusan bisnis.
- Kurs IDR adalah estimasi statis yang bisa dioverride; selisih kurs, biaya payment gateway, dan pajak tidak dihitung otomatis.
- Next.js dipin ke `16.4.5` dan `npm audit --omit=dev` bersih. Skrip dev/build memakai `--webpack` karena build Turbopack pada kombinasi Next 16 + React 18 tidak menghasilkan route App Router di proyek ini.
- React 18 masih didukung Next 16 tetapi sudah deprecated. Rencanakan upgrade ke React 19 (sekalian framer-motion) sebelum Next 17.

---

## Deploy

Project ini adalah aplikasi Next.js standar dan dapat dideploy ke Vercel, VPS, atau platform Node.js lain. Jalankan `npm run build` lebih dulu, set variabel lingkungan di platform (jangan commit `.env.local`), lalu pastikan `APIFY_TOKEN` dan kredensial Supabase hanya tersedia di sisi server.
