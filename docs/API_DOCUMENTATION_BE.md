# POS System — Frontend API Documentation

Dokumentasi lengkap REST API untuk integrasi tim Frontend (Web / Mobile POS).

---

## 📌 1. Informasi Umum (General Information)

- **Base URL**: `http://localhost:3000/api/v1`
- **Content-Type**: `application/json`
- **Authentication**: JWT Bearer Token (Kirim di header `Authorization: Bearer <accessToken>`).
  - *Hampir semua endpoint membutuhkan token auth kecuali yang bertanda `[PUBLIC]`.*

### Format Envelope Respons Sukses (Standard Success Response)
Semua respons sukses dari backend dibungkus dalam format:
```json
{
  "success": true,
  "message": "Deskripsi pesan sukses",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 42,
    "totalPages": 5,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```
*(Catatan: Objek `meta` hanya muncul pada endpoint yang memiliki pagination).*

### Format Respons Error (Standard Error Response)
```json
{
  "statusCode": 400,
  "message": "Deskripsi error atau validasi gagal",
  "error": "Bad Request",
  "timestamp": "2026-10-24T15:40:00.000Z",
  "path": "/api/v1/pos/checkout"
}
```

### Parameter Pagination
Semua endpoint list mendukung query parameter berikut:
- `page` (number, default: `1`, min: `1`)
- `limit` (number, default: `10`, min: `1`, max: `100`)

Contoh: `GET /api/v1/pos/orders?page=2&limit=20`

---

## 🔐 2. Authentication Module (`/auth`)

### 2.1. Login Kasir / Admin `[PUBLIC]`
Mengautentikasi pengguna dan mengembalikan JWT access token.

- **Method**: `POST`
- **Endpoint**: `/auth/login`
- **Request Body**:
```json
{
  "email": "cashier@example.com",
  "password": "secretpassword"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsIn...",
    "user": {
      "id": "cuid2_user_id",
      "name": "Jane Cashier",
      "email": "cashier@example.com",
      "role": "CASHIER"
    }
  }
}
```
> Simpan `data.accessToken` ke LocalStorage / SecureStore. Gunakan untuk header `Authorization: Bearer <accessToken>`.

---

### 2.2. Register User `[PUBLIC]`
- **Method**: `POST`
- **Endpoint**: `/auth/register`
- **Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "roleCode": "CASHIER"
}
```
*(Catatan: `roleCode` opsional, default: `"USER"`. Opsi: `"ADMIN"`, `"CASHIER"`, `"USER"`).*

---

### 2.3. Get Profile User Saat Ini
Mengambil profil user yang sedang login berdasarkan Bearer token.

- **Method**: `GET`
- **Endpoint**: `/auth/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Profile retrieved successfully",
  "data": {
    "id": "cuid2_user_id",
    "name": "Jane Cashier",
    "email": "cashier@example.com",
    "role": {
      "id": "role_cuid2_id",
      "name": "Cashier",
      "code": "CASHIER"
    }
  }
}
```

---

## 🛒 3. Point of Sale (POS) Module (`/pos`)

### 3.1. Checkout Order (Pembayaran di Kasir)
Melakukan transaksi penjualan belanjaan kasir. Mendukung pembayaran Tunai (CASH) dan Non-Tunai otomatis via Midtrans (QRIS, DEBIT, TRANSFER).

- **Method**: `POST`
- **Endpoint**: `/pos/checkout`
- **Headers**: `Authorization: Bearer <token>`

#### Kasus A: Pembayaran CASH (Tunai)
- **Request Body**:
```json
{
  "paymentMethod": "CASH",
  "paidAmount": 100000,
  "items": [
    {
      "productId": "cm2prod001",
      "quantity": 2
    }
  ]
}
```
*Catatan: `userId` bersifat opsional. Jika tidak diisi, backend otomatis mengisinya dengan ID kasir dari Bearer token.*

- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "POS transaction completed successfully",
  "data": {
    "order": {
      "id": "cm2ord001",
      "invoiceNumber": "INV-1729745300000-5432",
      "amount": 50000,
      "paidAmount": 100000,
      "changeAmount": 50000,
      "orderStatus": "COMPLETED",
      "paymentMethod": "CASH"
    },
    "items": [
      {
        "productId": "cm2prod001",
        "name": "Iced Caramel Macchiato",
        "quantity": 2,
        "unitPrice": 25000,
        "subtotal": 50000
      }
    ]
  }
}
```

---

#### Kasus B: Pembayaran QRIS (Midtrans Otomatis)
Stok langsung terpotong, status pesanan menjadi `PENDING`, dan sistem mengembalikan link kode QR (`payment.qrUrl`) untuk ditampilkan di layar pelanggan.

- **Request Body**:
```json
{
  "paymentMethod": "QRIS",
  "items": [
    {
      "productId": "cm2prod001",
      "quantity": 2
    }
  ]
}
```

- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "POS order created. Please scan QRIS to complete payment",
  "data": {
    "order": {
      "id": "cm2ord002",
      "invoiceNumber": "INV-1729745300000-7890",
      "amount": 50000,
      "paidAmount": 0,
      "changeAmount": 0,
      "orderStatus": "PENDING",
      "paymentMethod": "QRIS"
    },
    "items": [
      {
        "productId": "cm2prod001",
        "name": "Iced Caramel Macchiato",
        "quantity": 2,
        "unitPrice": 25000,
        "subtotal": 50000
      }
    ],
    "payment": {
      "orderId": "cm2ord002",
      "transactionId": "65b98a12-8765-4321-abcd-1234567890ab",
      "status": "pending",
      "amount": "50000.00",
      "qrUrl": "https://api.sandbox.midtrans.com/v2/qris/65b98a12-8765-4321-abcd-1234567890ab/qr-code"
    }
  }
}
```
> **Alur Frontend untuk QRIS:**
> 1. Render gambar QR dari `data.payment.qrUrl` di layar kasir / customer-facing display.
> 2. Lakukan polling status setiap 3-5 detik ke `GET /pos/orders/:id` sampai `orderStatus === 'PAID'`.

---

### 3.2. Riwayat Pesanan Kasir (Order History)
- **Method**: `GET`
- **Endpoint**: `/pos/orders?page=1&limit=10`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "POS orders retrieved successfully",
  "data": [
    {
      "id": "cm2ord001",
      "invoiceNumber": "INV-1729745300000-5432",
      "amount": 50000,
      "paidAmount": 100000,
      "changeAmount": 50000,
      "orderStatus": "COMPLETED",
      "paymentMethod": "CASH",
      "createdAt": "2026-10-24T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### 3.3. Detail Pesanan & Struk (Order Details)
- **Method**: `GET`
- **Endpoint**: `/pos/orders/:id`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Order details retrieved successfully",
  "data": {
    "order": {
      "id": "cm2ord001",
      "invoiceNumber": "INV-1729745300000-5432",
      "amount": 50000,
      "paidAmount": 100000,
      "changeAmount": 50000,
      "orderStatus": "COMPLETED",
      "paymentMethod": "CASH",
      "createdAt": "2026-10-24T12:00:00.000Z"
    },
    "items": [
      {
        "id": "item001",
        "productId": "cm2prod001",
        "productName": "Iced Caramel Macchiato",
        "sku": "COF-001",
        "quantity": 2,
        "unitPrice": 25000,
        "subtotal": 50000
      }
    ]
  }
}
```

---

## 💳 4. Payments Module (`/payments`)

### 4.1. Buat Pembayaran QRIS Mandiri
Membuat tagihan QRIS terpisah (jika tidak menggunakan POS checkout).

- **Method**: `POST`
- **Endpoint**: `/payments/qris`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "amount": 50000,
  "orderId": "CUSTOM-ORDER-ID" // Opsional, default auto-generated CUID2
}
```
- **Response `200 OK`**:
```json
{
  "orderId": "CUSTOM-ORDER-ID",
  "transactionId": "65b98a12-8765-4321-abcd-1234567890ab",
  "status": "pending",
  "amount": "50000.00",
  "qrUrl": "https://api.sandbox.midtrans.com/v2/qris/.../qr-code"
}
```

---

### 4.2. Buat Pembayaran Virtual Account (Bank Transfer)
Membuat nomor VA Midtrans untuk transfer bank.

- **Method**: `POST`
- **Endpoint**: `/payments/bank-transfer`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "amount": 150000,
  "bank": "bca",
  "orderId": "CUSTOM-ORDER-ID" // Opsional
}
```
*Opsi bank yang didukung*: `"bca"`, `"bni"`, `"bri"`, `"permata"`, `"mandiri"`, `"cimb"`.

- **Response `200 OK`**:
```json
{
  "orderId": "CUSTOM-ORDER-ID",
  "transactionId": "midtrans-tx-id",
  "status": "pending",
  "amount": "150000.00",
  "bank": "bca",
  "vaNumber": "12345000987654",
  "expiryTime": "2026-10-25 15:40:00"
}
```
*(Catatan: Untuk bank `mandiri`, yang dikembalikan adalah `billKey` dan `billerCode`).*

---

### 4.3. Refund Pembayaran (Pengembalian Dana)
Melakukan refund pesanan yang sudah berstatus `PAID` atau `PARTIAL_REFUNDED`.

- **Method**: `POST`
- **Endpoint**: `/payments/refund`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "orderId": "cm2ord001",
  "amount": 25000,
  "reason": "Customer request - item damaged"
}
```
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Refund processed successfully",
  "data": {
    "orderId": "cm2ord001",
    "refundedAmount": 25000,
    "totalRefunded": 25000,
    "remainingBalance": 25000,
    "orderStatus": "PARTIAL_REFUNDED",
    "reason": "Customer request - item damaged"
  }
}
```

---

### 4.4. Midtrans Webhook `[PUBLIC]`
- **Method**: `POST`
- **Endpoint**: `/payments/webhook`
- *Endpoint ini dipanggil otomatis oleh server Midtrans saat status transaksi berubah.*

---

## 📦 5. Products Module (`/products`)

### 5.1. List Semua Produk (Katalog Produk)
- **Method**: `GET`
- **Endpoint**: `/products?page=1&limit=20`
- **Headers**: `Authorization: Bearer <token>`
- **Response `200 OK`**:
```json
{
  "success": true,
  "message": "Products retrieved successfully",
  "data": [
    {
      "id": "cm2prod001",
      "sku": "COF-001",
      "name": "Iced Caramel Macchiato",
      "description": "Espresso with milk and vanilla syrup topped with caramel drizzle",
      "price": 25000,
      "stock": 48,
      "isActive": true,
      "createdAt": "2026-10-24T10:00:00.000Z",
      "updatedAt": "2026-10-24T12:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 1,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

### 5.2. Get Detail Produk
- **Method**: `GET`
- **Endpoint**: `/products/:id/get`
- **Headers**: `Authorization: Bearer <token>`

---

### 5.3. Tambah Produk Baru
- **Method**: `POST`
- **Endpoint**: `/products/create`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "sku": "SNK-001",
  "name": "Croissant Butter",
  "description": "Freshly baked butter croissant",
  "price": 18000,
  "stock": 30,
  "isActive": true
}
```

---

### 5.4. Update Produk
- **Method**: `PUT`
- **Endpoint**: `/products/:id/update`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**: *(Semua field opsional)*
```json
{
  "price": 20000,
  "stock": 35
}
```

---

### 5.5. Hapus Produk (Soft Delete)
Menandai produk nonaktif (`isActive = false`) dan mengisi timestamp `deletedAt`. Produk tidak akan muncul lagi di POS.

- **Method**: `DELETE`
- **Endpoint**: `/products/:id/delete`
- **Headers**: `Authorization: Bearer <token>`

---

## 🚚 6. Purchases / Restock Module (`/purchases`)

Fitur pengadaan barang / kulakan dari supplier. Setiap pembelian yang berhasil akan **meningkatkan stok produk secara otomatis**.

### 6.1. Buat Nota Pembelian Kulakan (Restock)
- **Method**: `POST`
- **Endpoint**: `/purchases`
- **Headers**: `Authorization: Bearer <token>`
- **Request Body**:
```json
{
  "supplierName": "PT Kopi Nusantara",
  "notes": "Pengadaan biji kopi minggu ke-4",
  "items": [
    {
      "productId": "cm2prod001",
      "quantity": 50,
      "unitCost": 15000
    }
  ]
}
```
*Catatan: `userId` opsional. Otomatis menggunakan ID user dari token.*

- **Response `201 Created`**:
```json
{
  "success": true,
  "message": "Purchase completed and inventory restocked successfully",
  "data": {
    "purchase": {
      "id": "cm2pur001",
      "invoiceNumber": "PO-1729745300000-8812",
      "supplierName": "PT Kopi Nusantara",
      "totalAmount": 750000,
      "notes": "Pengadaan biji kopi minggu ke-4",
      "status": "COMPLETED",
      "createdAt": "2026-10-24T14:00:00.000Z"
    },
    "items": [
      {
        "productId": "cm2prod001",
        "name": "Iced Caramel Macchiato",
        "quantity": 50,
        "unitCost": 15000,
        "subtotal": 750000
      }
    ]
  }
}
```

---

### 6.2. Riwayat Kulakan (Purchase History)
- **Method**: `GET`
- **Endpoint**: `/purchases?page=1&limit=10`
- **Headers**: `Authorization: Bearer <token>`

---

### 6.3. Detail Nota Kulakan
- **Method**: `GET`
- **Endpoint**: `/purchases/:id`
- **Headers**: `Authorization: Bearer <token>`

---

## 👥 7. Users Management (`/users`)

Manajemen akun pengguna dan kasir oleh Admin.

- `GET /api/v1/users?page=1&limit=10` : Daftar seluruh pengguna
- `GET /api/v1/users/:id/get` : Detail pengguna
- `POST /api/v1/users/create` : Buat pengguna baru (name, email, password, roleId)
- `PUT /api/v1/users/:id/update` : Update data pengguna
- `DELETE /api/v1/users/:id/delete` : Hapus pengguna

---

## 🏷️ 8. Referensi Enum & Status

### Payment Method (`paymentMethod`)
| Nilai | Keterangan |
|---|---|
| `CASH` | Tunai di meja kasir |
| `QRIS` | QRIS otomatis via Midtrans |
| `DEBIT` | Mesin EDC Kartu Debit Fisik |
| `TRANSFER` | Transfer Bank / Virtual Account |

### Order Status (`orderStatus`)
| Status | Keterangan |
|---|---|
| `PENDING` | Menunggu pembayaran (QRIS / VA) |
| `PAID` | Pembayaran lunas terverifikasi gateway |
| `COMPLETED` | Transaksi tunai atau EDC selesai lunas |
| `CANCELLED` | Pembayaran dibatalkan atau waktu kedaluwarsa |
| `PARTIAL_REFUNDED` | Sebagian saldo belanja dikembalikan |
| `REFUNDED` | Seluruh saldo belanja telah dikembalikan |

### Bank Virtual Account (`bank`)
`"bca"`, `"bni"`, `"bri"`, `"permata"`, `"mandiri"`, `"cimb"`

---

## 💡 9. Tips Integrasi untuk Tim Frontend

1. **Simpan User ID & Role di State**:
   Setelah login di `POST /auth/login`, data kasir dan token langsung tersedia di `data.user` dan `data.accessToken`.
2. **Kalkulasi Kembalian di UI**:
   Untuk pembayaran CASH, hitung kembalian di frontend: `changeAmount = paidAmount - totalAmount`. Pastikan `paidAmount >= totalAmount`.
3. **Polling Status QRIS**:
   Saat kasir checkout dengan `paymentMethod: "QRIS"`, tampilkan modal berisi gambar `data.payment.qrUrl`. Jalankan interval:
   ```ts
   const timer = setInterval(async () => {
     const res = await api.get(`/pos/orders/${orderId}`);
     if (res.data.data.order.orderStatus === 'PAID') {
       clearInterval(timer);
       showSuccessReceipt();
     }
   }, 3000);
   ```
