# Wallet REST API

REST API dompet sederhana untuk register, login, top up, payment, transfer asynchronous, laporan transaksi, dan update profile. Proyek menggunakan Express, Sequelize, SQLite, JWT, dan background worker terpisah.

## Persyaratan

- Node.js 20 atau lebih baru
- npm

## Instalasi

```powershell
npm install
Copy-Item .env.example .env
npm run migrate
```

Ganti kedua JWT secret di `.env` dengan nilai acak yang berbeda. Database SQLite dibuat otomatis di `data/wallet.sqlite`.

## Menjalankan

Terminal pertama untuk API:

```powershell
npm start
```

Terminal kedua untuk background transfer:

```powershell
npm run worker
```

API tersedia di `http://localhost:3000`. Health check:

```powershell
curl.exe http://localhost:3000/health
```

## Endpoint

| Method | URL | Autentikasi | Fungsi |
| --- | --- | --- | --- |
| POST | `/register` | Tidak | Mendaftarkan user |
| POST | `/login` | Tidak | Mendapatkan access dan refresh token |
| POST | `/refresh` | Tidak | Memperbarui access token |
| POST | `/topup` | Bearer | Menambah saldo |
| POST | `/pay` | Bearer | Melakukan pembayaran |
| POST | `/transfer` | Bearer | Memasukkan transfer ke background queue |
| GET | `/transfers/:transfer_id` | Bearer | Memeriksa status transfer |
| GET | `/transactions` | Bearer | Menampilkan riwayat user |
| PUT | `/profile` | Bearer | Mengubah nama dan alamat |

Semua nilai uang menggunakan integer, bukan angka desimal.

## Contoh Alur

### Register

```powershell
curl.exe -X POST http://localhost:3000/register -H "Content-Type: application/json" -d '{"first_name":"Guntur","last_name":"Saputro","phone_number":"0811255501","address":"Jl. Kebon Sirih No. 1","pin":"123456"}'
```

### Login

```powershell
curl.exe -X POST http://localhost:3000/login -H "Content-Type: application/json" -d '{"phone_number":"0811255501","pin":"123456"}'
```

Salin `access_token` dari respons dan gunakan sebagai pengganti `<TOKEN>`.

### Top Up

```powershell
curl.exe -X POST http://localhost:3000/topup -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"amount":500000}'
```

### Payment

```powershell
curl.exe -X POST http://localhost:3000/pay -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"amount":100000,"remarks":"Pulsa Telkomsel 100k"}'
```

### Transfer

```powershell
curl.exe -X POST http://localhost:3000/transfer -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"target_user":"<TARGET_USER_ID>","amount":30000,"remarks":"Hadiah Ultah"}'
```

API mengembalikan HTTP 202 dan status `PENDING`. Worker memproses transfer di luar request HTTP. Periksa hasil memakai `transfer_id`:

```powershell
curl.exe http://localhost:3000/transfers/<TRANSFER_ID> -H "Authorization: Bearer <TOKEN>"
```

### Report Transactions

```powershell
curl.exe http://localhost:3000/transactions -H "Authorization: Bearer <TOKEN>"
```

### Update Profile

```powershell
curl.exe -X PUT http://localhost:3000/profile -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" -d '{"first_name":"Tom","last_name":"Araya","address":"Jl. Diponegoro No. 215"}'
```

## Test

```powershell
npm test
```

Integration test memakai file SQLite sementara dan tidak mengubah database development.

## Background Worker

Antrean disimpan di tabel `transfer_jobs`, sehingga pekerjaan tidak hilang ketika API restart. Worker mengubah kedua saldo dan membuat dua riwayat dalam satu database transaction. Pekerjaan `PROCESSING` dikembalikan menjadi `PENDING` ketika worker restart.

SQLite dipilih agar submission mudah dijalankan. Jalankan hanya satu worker. Deployment multi-worker sebaiknya memakai PostgreSQL dan Redis/BullMQ atau pg-boss.

## Struktur

```text
src/
  controllers/   HTTP request dan response
  middleware/    autentikasi dan error handling
  models/        model Sequelize
  routes/        definisi endpoint
  services/      aturan bisnis
  workers/       background transfer
migrations/      definisi schema
scripts/         migration runner
tests/           integration test
```
