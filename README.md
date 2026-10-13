# PWEB TypeScript P01 2026 — Bagian Orang 1

Bagian ini berisi login, autentikasi, dashboard admin, CRUD jenis layanan, dan penerbitan tiket manual.

## Prasyarat
- Node.js dan npm
- VS Code
- Ekstensi Live Server (disarankan)
- Internet untuk API login DummyJSON

## Menjalankan
1. Buka folder ini di VS Code.
2. Buka Terminal > New Terminal.
3. Jalankan `npm install`.
4. Jalankan `npm run build` untuk kompilasi sekali.
5. Jalankan `npm run watch` saat mengembangkan kode; biarkan terminal terbuka.
6. Buka `login.html` menggunakan Live Server.

## Catatan integrasi dengan Orang 2
Key Local Storage yang digunakan:
- `authSession`
- `queueTypes`
- `queueTickets`
- `queueCounters`

Format tiket:
`{ id, number, queueCode, priority, status, createdAt }`

Nilai status:
`Menunggu`, `Dipanggil`, `Selesai`, `Dilewati`

Prioritas:
`Normal`, `Lansia`, `Disabilitas`, `VIP`

`src/queue.ts` menggunakan fungsi `createQueueTicket()` bersama dengan penyimpanan yang didefinisikan di `src/storage.ts`. Koordinasikan agar Orang 2 menggunakan kontrak dan penghitung tiket yang sama. Karena TypeScript dikompilasi dengan `module: "none"`, fungsi yang dipakai lintas file tersedia sebagai fungsi global pada script yang dimuat berurutan; pastikan HTML memuat `storage.js` sebelum `queue.js`, lalu halaman sebelum fungsi queue dipakai.

## Batasan penting
Role dari API digunakan sesuai respons server. API DummyJSON tidak menjamin setiap akun uji mempunyai role `admin`, `moderator`, atau `user` sesuai kebutuhan tugas. Uji respons akun dan diskusikan mekanisme role yang diperbolehkan dengan asisten praktikum. Jangan menganggap role dari input pengguna sebagai autentikasi yang sah.
