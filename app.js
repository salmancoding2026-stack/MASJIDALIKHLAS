// 1. IMPORT SEMUA MODUL FIREBASE
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, doc,  onSnapshot, updateDoc, collection, 
    addDoc, getDocs, query, orderBy, limit, serverTimestamp, setDoc, deleteDoc,
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { 
    getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// 2. KONFIGURASI FIREBASE (Gunakan milik Anda)
const firebaseConfig = {
    apiKey: "AIzaSyCwmfUYlpyYTey_bQ2u3xLKt7MeBZOlxlQ",
    authDomain: "web-masjid-keren.firebaseapp.com",
    projectId: "web-masjid-keren",
    storageBucket: "web-masjid-keren.firebasestorage.app",
    messagingSenderId: "368885484667",
    appId: "1:368885484667:web:1f00d20ae541f02e0426de",
    measurementId: "G-YG7K2VYVGQ"
};

// 3. INISIALISASI
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Referensi Dokumen
const kasRef = doc(db, "keuangan", "kas");
const pengumumanRef = doc(db, "keuangan", "pengumuman");

// --- 4. LOGIKA AUTH (LOGIN/LOGOUT) ---
const loginSection = document.getElementById("login-section");
const adminContent = document.getElementById("admin-content");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");

if (btnLogin) {
    btnLogin.onclick = async () => {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
        if (!email || !password) return alert("Isi email & password!");
        
        btnLogin.innerText = "Loading...";
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert("Login Gagal: " + error.message);
        } finally {
            btnLogin.innerText = "Masuk ke Panel";
        }
    };
}

onAuthStateChanged(auth, (user) => {
    if (user) {
        if(loginSection) loginSection.style.display = "none";
        if(adminContent) adminContent.style.display = "block";
    } else {
        if(loginSection) loginSection.style.display = "block";
        if(adminContent) adminContent.style.display = "none";
    }
});

if (btnLogout) btnLogout.onclick = () => signOut(auth);

// --- 5. SALDO & RUNNING TEXT (REAL-TIME) ---
const saldoDisplay = document.getElementById("saldo-display");
const runningTextDisplay = document.getElementById("running-text-display");

if (saldoDisplay) {
    onSnapshot(kasRef, (docSnap) => {
        if (docSnap.exists()) {
            saldoDisplay.innerText = "Rp " + docSnap.data().total.toLocaleString('id-ID');
        }
    });
}

if (runningTextDisplay) {
    onSnapshot(pengumumanRef, (docSnap) => {
        if (docSnap.exists()) runningTextDisplay.innerText = docSnap.data().pesan;
    });
}

// --- 6. UPDATE DATA (ADMIN) ---
const btnUpdateSaldo = document.getElementById("btn-update");
const btnUpdatePesan = document.getElementById("btn-update-pengumuman");

if (btnUpdateSaldo) {
    btnUpdateSaldo.onclick = async () => {
        const nilai = parseInt(document.getElementById("input-saldo").value);
        if (!isNaN(nilai)) {
            await updateDoc(kasRef, { total: nilai });
            alert("Saldo diperbarui!");
        }
    };
}

if (btnUpdatePesan) {
    btnUpdatePesan.onclick = async () => {
        const pesan = document.getElementById("input-pengumuman").value;
        if (pesan) {
            await updateDoc(pengumumanRef, { pesan: pesan });
            alert("Pengumuman diperbarui!");
        }
    };
}

// --- 7. JADWAL SHALAT (API) ---
async function getJadwalShalat() {
    const list = document.getElementById("jadwal-shalat-list");
    if (!list) return;
    try {
        const res = await fetch(`https://api.aladhan.com/v1/timingsByCity?city=Jakarta&country=Indonesia&method=11`);
        const json = await res.json();
        const t = json.data.timings;
        document.getElementById("subuh").innerText = t.Fajr;
        document.getElementById("dzuhur").innerText = t.Dhuhr;
        document.getElementById("ashar").innerText = t.Asr;
        document.getElementById("maghrib").innerText = t.Maghrib;
        document.getElementById("isya").innerText = t.Isha;
        document.getElementById("loading-shalat").style.display = "none";
        list.style.display = "block";
    } catch (e) { console.error(e); }
}
getJadwalShalat();

// --- 8. FASILITAS ---
const fasilitasDiv = document.getElementById("fasilitas-list");
async function loadFasilitas() {
    if (!fasilitasDiv) return;
    const snap = await getDocs(collection(db, "fasilitas"));
    fasilitasDiv.innerHTML = "";
    snap.forEach((d) => {
        fasilitasDiv.innerHTML += `<div class="shalat-item"><span>${d.id}</span><strong>${d.data().status}</strong></div>`;
    });
}
loadFasilitas();

const btnAddFasilitas = document.getElementById("btn-add-fasilitas");
if (btnAddFasilitas) {
    btnAddFasilitas.onclick = async () => {
        const nama = document.getElementById("nama-fasilitas").value;
        const status = document.getElementById("status-fasilitas").value;
        if(nama) {
            await setDoc(doc(db, "fasilitas", nama), { status: status });
            alert("Fasilitas Update!");
            location.reload();
        }
    };
}

// --- 9. INFAQ/DONATUR ---
const donaturDiv = document.getElementById("donatur-list");
async function loadDonatur() {
    if (!donaturDiv) return;
    const q = query(collection(db, "infaq"), orderBy("tanggal", "desc"), limit(5));
    try {
        const snap = await getDocs(q);
        donaturDiv.innerHTML = "";
        snap.forEach((d) => {
            donaturDiv.innerHTML += `<div class="shalat-item"><span>${d.data().nama}</span><strong>Rp ${d.data().jumlah.toLocaleString('id-ID')}</strong></div>`;
        });
    } catch (e) { console.log("Tips: Buat Index di Console Firebase jika error orderBy"); }
}
loadDonatur();

const btnAddInfaq = document.getElementById("btn-add-infaq");
if (btnAddInfaq) {
    btnAddInfaq.onclick = async () => {
        const nama = document.getElementById("nama-donatur").value || "Hamba Allah";
        const jumlah = parseInt(document.getElementById("jumlah-infaq").value);
        if (jumlah > 0) {
            await addDoc(collection(db, "infaq"), { nama, jumlah, tanggal: serverTimestamp() });
            alert("Infaq Dicatat!");
            location.reload();
        }
    };
}

// --- 10. LOGIKA LAPORAN BULANAN ---
const totalBulananDisplay = document.getElementById("total-bulanan");
const listLaporanDiv = document.getElementById("list-laporan");

async function hitungLaporanBulanan() {
    if (!totalBulananDisplay) return;

    const sekarang = new Date();
    const awalBulan = new Date(sekarang.getFullYear(), sekarang.getMonth(), 1);
    
    // Ambil semua data infaq bulan ini
    const q = query(
        collection(db, "infaq"),
        orderBy("tanggal", "desc")
    );

    try {
        const querySnapshot = await getDocs(q);
        let total = 0;
        let htmlContent = "";

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const tglDonasi = data.tanggal?.toDate();

            // Filter hanya bulan dan tahun yang sama dengan sekarang
            if (tglDonasi && tglDonasi >= awalBulan) {
                total += data.jumlah;
                const formatTgl = tglDonasi.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                
                htmlContent += `
                    <div class="shalat-item">
                        <span>${formatTgl} - ${data.nama}</span>
                        <strong>Rp ${data.jumlah.toLocaleString('id-ID')}</strong>
                    </div>`;
            }
        });

        totalBulananDisplay.innerText = "Rp " + total.toLocaleString('id-ID');
        listLaporanDiv.innerHTML = htmlContent || "<p style='text-align:center;'>Belum ada data bulan ini.</p>";
    } catch (e) {
        console.error("Gagal memuat laporan:", e);
    }
}

// Panggil fungsi laporan
hitungLaporanBulanan();

// --- 11. LOGIKA ARTIKEL (TAMPIL DI BERANDA) ---
const artikelDiv = document.getElementById("artikel-list");

async function loadArtikel() {
    if (!artikelDiv) return;
    // Ambil 3 artikel terbaru
    const q = query(collection(db, "artikel"), orderBy("tanggal", "desc"), limit(3));
    
    try {
        const querySnapshot = await getDocs(q);
        artikelDiv.innerHTML = "";
        
        if (querySnapshot.empty) {
            artikelDiv.innerHTML = "<p style='text-align:center; color:#999;'>Belum ada berita.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const data = doc.data();
            const tgl = data.tanggal?.toDate().toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' });
            
            artikelDiv.innerHTML += `
                <div style="margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                    <h4 style="margin: 0; color: #2e7d32;">${data.judul}</h4>
                    <small style="color: #999;">${tgl}</small>
                    <p style="font-size: 0.9rem; color: #555; line-height: 1.4; margin-top: 5px;">
                        ${data.isi.substring(0, 100)}...
                    </p>
                </div>
            `;
        });
    } catch (e) {
        console.log("Error artikel: ", e);
    }
}
loadArtikel();

// --- 12. LOGIKA ADMIN POSTING ARTIKEL ---
const btnAddArtikel = document.getElementById("btn-add-artikel");
if (btnAddArtikel) {
    btnAddArtikel.onclick = async () => {
        const judul = document.getElementById("judul-artikel").value;
        const isi = document.getElementById("isi-artikel").value;
        
        if (judul && isi) {
            try {
                await addDoc(collection(db, "artikel"), {
                    judul: judul,
                    isi: isi,
                    tanggal: serverTimestamp()
                });
                alert("Berita berhasil diposting!");
                location.reload();
            } catch (e) {
                alert("Gagal posting: " + e.message);
            }
        } else {
            alert("Judul dan Isi tidak boleh kosong!");
        }
    };
}

// --- 13. LOGIKA AGENDA & COUNTDOWN ---
const agendaRef = doc(db, "keuangan", "agenda");

// Tampilkan Countdown di Halaman Depan
function startCountdown(targetDate) {
    const timerElement = document.getElementById("countdown-timer");
    if (!timerElement) return;

    setInterval(() => {
        const sekarang = new Date().getTime();
        const selisih = targetDate - sekarang;

        if (selisih > 0) {
            const hari = Math.floor(selisih / (1000 * 60 * 60 * 24));
            const jam = Math.floor((selisih % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const menit = Math.floor((selisih % (1000 * 60 * 60)) / (1000 * 60));
            timerElement.innerText = `${hari} Hari : ${jam} Jam : ${menit} Menit`;
        } else {
            timerElement.innerText = "Acara Sedang Berlangsung!";
        }
    }, 1000);
}

// Ambil data agenda dari Firebase
if (document.getElementById("agenda-section")) {
    onSnapshot(agendaRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const target = new Date(data.tanggal).getTime();
            
            // Hanya munculkan jika acara belum lewat (atau baru lewat sedikit)
            if (target > new Date().getTime() - 86400000) {
                document.getElementById("agenda-section").style.display = "block";
                document.getElementById("nama-acara").innerText = data.nama;
                document.getElementById("tgl-acara").innerText = new Date(data.tanggal).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' });
                startCountdown(target);
            }
        }
    });
}

// Update Agenda oleh Admin
const btnUpdateAgenda = document.getElementById("btn-update-agenda");
if (btnUpdateAgenda) {
    btnUpdateAgenda.onclick = async () => {
        const nama = document.getElementById("input-nama-acara").value;
        const tanggal = document.getElementById("input-tgl-acara").value;
        if (nama && tanggal) {
            await setDoc(agendaRef, { nama, tanggal });
            alert("Agenda diperbarui!");
        }
    };
}

// --- 14. LOGIKA GALERI ---
const galeriDiv = document.getElementById("galeri-container");

async function loadGaleri() {
    if (!galeriDiv) return;
    const q = query(collection(db, "galeri"), orderBy("tanggal", "desc"), limit(6));
    
    try {
        const snap = await getDocs(q);
        if (!snap.empty) galeriDiv.innerHTML = "";
        
        snap.forEach((d) => {
            const data = d.data();
            galeriDiv.innerHTML += `
                <div style="flex: 0 0 250px; scroll-snap-align: start;">
                    <img src="${data.url}" style="width: 100%; height: 150px; object-fit: cover; border-radius: 10px; border: 2px solid #eee;">
                    <p style="font-size: 0.75rem; color: #666; margin-top: 5px;">${data.ket}</p>
                </div>
            `;
        });
    } catch (e) { console.log(e); }
}
loadGaleri();

const btnAddGaleri = document.getElementById("btn-add-galeri");
if (btnAddGaleri) {
    btnAddGaleri.onclick = async () => {
        const url = document.getElementById("url-foto").value;
        const ket = document.getElementById("ket-foto").value;
        if (url) {
            await addDoc(collection(db, "galeri"), { url, ket, tanggal: serverTimestamp() });
            alert("Foto ditambahkan!");
            location.reload();
        }
    };
}

// --- 15. LOGIKA RESET DATA (ZONA BAHAYA) ---

async function resetCollection(collectionName) {
    const konfirmasi = confirm(`Apakah Anda yakin ingin MENGHAPUS SEMUA DATA di ${collectionName}? Data yang hilang tidak bisa dikembalikan!`);
    
    if (konfirmasi) {
        const password = prompt("Masukkan kata sandi konfirmasi (ketik: 'HAPUS'):");
        if (password !== "HAPUS") {
            alert("Reset dibatalkan. Kata sandi salah.");
            return;
        }

        try {
            const q = query(collection(db, collectionName));
            const snapshot = await getDocs(q);
            
            const deletePromises = snapshot.docs.map(document => deleteDoc(doc(db, collectionName, document.id)));
            await Promise.all(deletePromises);
            
            alert(`Semua data di ${collectionName} berhasil dihapus!`);
            location.reload();
        } catch (e) {
            alert("Gagal menghapus data: " + e.message);
        }
    }
}

// Hubungkan ke tombol-tombol di Admin
if (document.getElementById("btn-reset-infaq")) {
    document.getElementById("btn-reset-infaq").onclick = () => resetCollection("infaq");
    document.getElementById("btn-reset-artikel").onclick = () => resetCollection("artikel");
    document.getElementById("btn-reset-galeri").onclick = () => resetCollection("galeri");
    document.getElementById("btn-reset-agenda").onclick = async () => {
        if(confirm("Hapus agenda saat ini?")) {
            await deleteDoc(doc(db, "keuangan", "agenda"));
            alert("Agenda berhasil direset!");
            location.reload();
        }
    };
}

// --- 16. LOGIKA QRIS ---
const qrisRef = doc(db, "keuangan", "qris_data");
const qrisContainer = document.getElementById("qris-container");

// Tampilkan QRIS di Halaman Depan
if (qrisContainer) {
    onSnapshot(qrisRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().url) {
            qrisContainer.innerHTML = `
                <img src="${docSnap.data().url}" alt="QRIS Masjid" style="width: 200px; height: auto; border: 5px solid #fff; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
            `;
        }
    });
}

// Update QRIS oleh Admin
const btnUpdateQris = document.getElementById("btn-update-qris");
if (btnUpdateQris) {
    btnUpdateQris.onclick = async () => {
        const url = document.getElementById("url-qris").value;
        if (url) {
            try {
                await setDoc(qrisRef, { url: url });
                alert("Gambar QRIS berhasil diperbarui!");
            } catch (e) {
                alert("Gagal: " + e.message);
            }
        }
    };
}
