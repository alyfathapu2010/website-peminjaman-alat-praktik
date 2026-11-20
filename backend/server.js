const express = require("express");
const cors = require("cors");
const app = express();
const pool = require("./db");

app.use(cors());
app.use(express.json());

// Rute utama
app.get("/", (req, res) => {
    res.send("Backend Sistem Peminjaman Alat Berhasil Berjalan!");
});

// Menampilkan data kategori
app.get("/api/kategori", async (req, res) => {
    try {
        const query = `
            SELECT * FROM kategori_alat
            ORDER BY id_kategori ASC
        `;

        const result = await pool.query(query);
        res.json(result.rows);

    } catch (err) {
        console.error("API KATEGORI ERROR:", err.message);

        res.status(500).json({
            error: err.message
        });
    }
});

// Menampilkan data alat
app.get("/api/alat", async (req, res) => {
    try {
        const query = "SELECT * FROM public.alat";

        const result = await pool.query(query);
        res.json(result.rows);

    } catch (err) {
        console.error("ERROR API ALAT:", err.message);

        res.status(500).json({
            error: err.message
        });
    }
});

// Menampilkan data peminjaman
app.get("/api/peminjaman", async (req, res) => {
    try {
        const query = `
            SELECT
                p.*,
                a.nama_alat
            FROM peminjaman p
            LEFT JOIN alat a
                ON p.id_alat = a.id_alat
            ORDER BY p.id_peminjaman DESC
        `;

        const result = await pool.query(query);
        res.json(result.rows);

    } catch (err) {
        console.error("ERROR PEMINJAMAN:", err.message);

        res.status(500).json({
            error: err.message
        });
    }
});

// Menambahkan peminjaman
app.post("/api/peminjaman", async (req, res) => {
    try {
        const {
            id_alat,
            nama_peminjam,
            kelas,
            tanggal_pinjam,
            tanggal_kembali,
            jumlah
        } = req.body;

        const query = `
            INSERT INTO peminjaman (
                id_alat,
                nama_peminjam,
                kelas,
                tanggal_pinjam,
                tanggal_kembali,
                jumlah
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *
        `;

        const values = [
            id_alat,
            nama_peminjam,
            kelas,
            tanggal_pinjam,
            tanggal_kembali,
            jumlah
        ];

        const result = await pool.query(query, values);

        res.status(201).json({
            message: "Peminjaman berhasil ditambahkan",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("ERROR TAMBAH PEMINJAMAN:", err.message);

        res.status(500).json({
            error: err.message
        });
    }
});

// Mengembalikan alat
app.put("/api/peminjaman/:id", async (req, res) => {
    try {
        const id = req.params.id;

        const query = `
            UPDATE peminjaman
            SET status = 'Dikembalikan'
            WHERE id_peminjaman = $1
            RETURNING *
        `;

        const result = await pool.query(query, [id]);

        // Jika data tidak ditemukan
        if (result.rows.length === 0) {
            return res.status(404).json({
                message: "Data peminjaman tidak ditemukan"
            });
        }

        res.json({
            message: "Alat berhasil dikembalikan",
            data: result.rows[0]
        });

    } catch (err) {
        console.error("PENGEMBALIAN ERROR:", err.message);

        res.status(500).json({
            error: err.message
        });
    }
});

// Menghapus data peminjaman
app.delete("/api/peminjaman/:id", async (req, res) => {
    let client;

    try {
        client = await pool.connect();

        const id = req.params.id;

        // Memulai transaksi
        await client.query("BEGIN");

        // Mencari data peminjaman
        const cek = await client.query(
            "SELECT * FROM peminjaman WHERE id_peminjaman = $1",
            [id]
        );

        // Jika data tidak ditemukan
        if (cek.rows.length === 0) {
            await client.query("ROLLBACK");

            return res.status(404).json({
                message: "Data peminjaman tidak ditemukan"
            });
        }

        const data = cek.rows[0];

        // Jika alat masih dipinjam, stok dikembalikan
        if (data.status === "Dipinjam") {
            await client.query(
                `UPDATE alat
                SET stok = stok + $1
                WHERE id_alat = $2`,
                [data.jumlah, data.id_alat]
            );
        }

        // Menghapus data peminjaman
        await client.query(
            "DELETE FROM peminjaman WHERE id_peminjaman = $1",
            [id]
        );

        // Menyimpan perubahan
        await client.query("COMMIT");

        res.json({
            message: "Data peminjaman berhasil dihapus"
        });

    } catch (error) {
        if (client) {
            await client.query("ROLLBACK");
        }

        console.error("ERROR HAPUS:", error.message);

        res.status(500).json({
            message: "Gagal menghapus data",
            error: error.message
        });

    } finally {
        if (client) {
            client.release();
        }
    }
});

// Menjalankan server
const PORT = 5000;

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});