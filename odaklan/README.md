# Odaklan · YKS Çalışma Takibi

React + TypeScript + Vite + Tailwind + Supabase ile yapılmış çalışma takip uygulaması.

## Kurulum

```bash
npm install
cp .env.example .env   # içine kendi Supabase bilgilerini yaz
npm run dev
```

## Veritabanı

`supabase/migrations/` içindeki SQL dosyalarını tarih sırasına göre Supabase SQL Editor'de çalıştır.

## Build

```bash
npm run build
```

`.env` dosyası GitHub'a yüklenmez (`.gitignore` içinde).
