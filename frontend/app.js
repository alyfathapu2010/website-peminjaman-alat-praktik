// URL Backend
const API_URL = "http://localhost:5000";

// Mengubah format tanggal
function formatTanggal(tanggal) {
    if (!tanggal) return "-";

    return new Date(tanggal).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta"
    });
}

// Menampilkan daftar alat
async function tampilkanAlat() {
    try {
        const response = await fetch(`${API_URL}/api/alat`);
        const data = await response.json();

        const container = document.getElementById("alat-container");
        const pilihanAlat = document.getElementById("id-alat");

        container.innerHTML = "";
        pilihanAlat.innerHTML = '<option value="">Pilih alat</option>';

        data.forEach((alat, index) => {
            // Menampilkan data alat ke tabel
            container.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${alat.nama_alat}</td>
                    <td>${alat.kondisi}</td>
                    <td>${alat.stok}</td>
                    <td>${alat.lokasi}</td>
                </tr>
            `;

            // Memasukkan alat ke pilihan form
            pilihanAlat.innerHTML += `
                <option value="${alat.id_alat}">
                    ${alat.nama_alat} (Stok: ${alat.stok})
                </option>
            `;
        });

    } catch (error) {
        console.error("Gagal menampilkan alat:", error);
    }
}

// Menampilkan data peminjaman
async function tampilkanPeminjaman() {
    try {
        const response = await fetch(`${API_URL}/api/peminjaman`);
        const data = await response.json();

        const container = document.getElementById("peminjaman-container");

        container.innerHTML = "";

        data.forEach((pinjam, index) => {

            let tombol;

            if (pinjam.status === "Dipinjam") {
                tombol = `
                    <button onclick="kembalikanAlat(${pinjam.id_peminjaman})">
                        Kembalikan
                    </button>
                `;
            } else {
                tombol = "Selesai";
            }

            container.innerHTML += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${pinjam.nama_peminjam}</td>
                    <td>${pinjam.kelas}</td>
                    <td>${pinjam.nama_alat}</td>
                    <td>${pinjam.jumlah}</td>
                    <td>${formatTanggal(pinjam.tanggal_pinjam)}</td>
                    <td>${formatTanggal(pinjam.tanggal_kembali)}</td>
                    <td>${pinjam.status}</td>
                    <td>${tombol}</td>
                </tr>
            `;
        });

    } catch (error) {
        console.error("Gagal menampilkan peminjaman:", error);
    }
}

// Menambahkan peminjaman
document.getElementById("form-peminjaman")
    .addEventListener("submit", async function (event) {

        event.preventDefault();

        const data = {
            id_alat: document.getElementById("id-alat").value,
            nama_peminjam: document.getElementById("nama-peminjam").value,
            kelas: document.getElementById("kelas").value,
            tanggal_pinjam: document.getElementById("tanggal-pinjam").value,
            tanggal_kembali: document.getElementById("tanggal-kembali").value,
            jumlah: document.getElementById("jumlah").value
        };

        try {
            const response = await fetch(`${API_URL}/api/peminjaman`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(data)
            });

            const hasil = await response.json();

            if (!response.ok) {
                alert(hasil.error || "Peminjaman gagal");
                return;
            }

            alert("Peminjaman berhasil!");

            document.getElementById("form-peminjaman").reset();

            tampilkanAlat();
            tampilkanPeminjaman();

        } catch (error) {
            alert("Tidak dapat terhubung ke server");
            console.error(error);
        }
    });

// Mengembalikan alat
async function kembalikanAlat(id) {

    const konfirmasi = confirm("Apakah alat ini akan dikembalikan?");

    if (!konfirmasi) {
        return;
    }

    try {
        const response = await fetch(
            `${API_URL}/api/peminjaman/${id}`,
            {
                method: "PUT"
            }
        );

        const hasil = await response.json();

        if (!response.ok) {
            alert(hasil.error || "Gagal mengembalikan alat");
            return;
        }

        alert("Alat berhasil dikembalikan!");

        tampilkanAlat();
        tampilkanPeminjaman();

    } catch (error) {
        alert("Tidak dapat terhubung ke server");
        console.error(error);
    }
}

// Menjalankan fungsi saat halaman dibuka
tampilkanAlat();
tampilkanPeminjaman();