// =================================================================
// GANTI SELURUH ISI SERVER.JS ANDA DENGAN KODE BARU INI
// =================================================================
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const Simulation = require('./models/Simulation');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const JWT_SECRET = 'kunci-rahasia-ini-sangat-aman-dan-harus-diganti';

// --- MIDDLEWARE UNTUK MEMVERIFIKASI TOKEN ---
const authMiddleware = (req, res, next) => {
    // 1. Ambil token dari header request
    const authHeader = req.header('Authorization');

    // 2. Cek jika header Authorization ada atau tidak
    if (!authHeader) {
        return res.status(401).json({ message: 'Akses ditolak. Tidak ada token.' });
    }

    try {
        // Header biasanya formatnya "Bearer <token>", jadi kita ambil tokennya saja
        const token = authHeader.split(' ')[1];

        // 3. Verifikasi token menggunakan JWT_SECRET
        const decoded = jwt.verify(token, JWT_SECRET);

        // 4. Jika token valid, "decoded" akan berisi payload (data user)
        // Kita sisipkan data user ini ke dalam object request agar bisa digunakan oleh rute selanjutnya
        req.user = decoded.user;

        // 5. Lanjutkan ke fungsi rute yang sebenarnya
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token tidak valid.' });
    }
};

const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// CORS middleware untuk mengatasi masalah cross-origin
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json());
app.use(express.static(__dirname)); 

const dataFilePath = path.join(__dirname, 'data.json');

// --- KONEKSI KE DATABASE MONGODB ATLAS ---
// Ganti <password> dengan password yang sudah Anda simpan tadi!
const connectionString = "mongodb+srv://user_lab:user_lab_098@cluster-lab-virtual.chof9bt.mongodb.net/?retryWrites=true&w=majority&appName=cluster-lab-virtual";

mongoose.connect(connectionString)
  .then(() => {
    console.log("Berhasil terhubung ke MongoDB Atlas!");
  })
  .catch((error) => {
    console.error("Koneksi database gagal:", error);
  });
// -----------------------------------------

// Endpoint GET yang sudah diperbaiki
// [GET] /api/history - Mengambil riwayat simulasi pengguna (TERPROTEKSI)
app.get('/api/history', authMiddleware, async (req, res) => {
    try {
        // Cari semua data simulasi di database yang cocok dengan ID pengguna yang login
        // req.user.id disediakan oleh authMiddleware setelah verifikasi token
        const userHistory = await Simulation.find({ user: req.user.id })
            .sort({ timestamp: -1 }) // Urutkan dari yang paling baru
            .limit(10); // Batasi hanya 10 hasil teratas

        res.json(userHistory);
    } catch (error) {
        console.error("ERROR SAAT MENGAMBIL RIWAYAT:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

// [DELETE] /api/history/:id - Menghapus satu entri riwayat (TERPROTEKSI)
app.delete('/api/history/:id', authMiddleware, async (req, res) => {
    try {
        const simulationId = req.params.id;
        const userId = req.user.id;

        // Cari simulasi berdasarkan ID-nya
        const simulation = await Simulation.findById(simulationId);

        // Jika tidak ditemukan, kirim error
        if (!simulation) {
            return res.status(404).json({ message: 'Riwayat tidak ditemukan.' });
        }

        // PENTING: Pastikan pengguna hanya bisa menghapus riwayat miliknya sendiri
        if (simulation.user.toString() !== userId) {
            return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki izin.' });
        }

        // Hapus simulasi dari database
        await Simulation.findByIdAndDelete(simulationId);

        res.json({ message: 'Riwayat berhasil dihapus.' });

    } catch (error) {
        console.error("ERROR SAAT MENGHAPUS RIWAYAT:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// [DELETE] /api/history - Menghapus SEMUA riwayat milik pengguna (TERPROTEKSI)
app.delete('/api/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        // Hapus semua dokumen simulasi yang cocok dengan ID pengguna
        await Simulation.deleteMany({ user: userId });

        res.json({ message: 'Semua riwayat berhasil dihapus.' });

    } catch (error) {
        console.error("ERROR SAAT MENGHAPUS SEMUA RIWAYAT:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

// --- RUTE UNTUK AUTENTIKASI ---

// [POST] /api/auth/register
// Tugas: Menerima username & password, lalu membuat pengguna baru.
app.post('/api/auth/register', async (req, res) => {
    console.log('=== REGISTER REQUEST RECEIVED ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    try {
        // 1. Ambil username dan password dari request body
        const { username, password } = req.body;

        console.log('Extracted username:', username);
        console.log('Extracted password length:', password ? password.length : 'undefined');

        // 2. Cek apakah username sudah ada di database
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            console.log('User already exists:', username);
            // Jika sudah ada, kirim error 400 (Bad Request)
            return res.status(400).json({ message: "Username sudah digunakan." });
        }

        // 3. Buat instance user baru menggunakan User Model
        const newUser = new User({
            username: username,
            password: password // Ingat, password akan di-hash otomatis oleh pre-save hook
        });

        // 4. Simpan user baru ke database
        await newUser.save();
        console.log('New user created successfully:', username);

        // 5. Kirim respons sukses
        res.status(201).json({ message: "Pengguna berhasil terdaftar!" });

    } catch (error) {
        console.error('Registration error:', error);
        // Jika ada error lain, kirim error 500 (Internal Server Error)
        res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error });
    }
});

// [POST] /api/auth/login
// Tugas: Memverifikasi kredensial dan memberikan JWT jika berhasil.
app.post('/api/auth/login', async (req, res) => {
    try {
        // 1. Ambil username dan password dari request body
        const { username, password } = req.body;

        // 2. Cari pengguna berdasarkan username
        const user = await User.findOne({ username: username });
        if (!user) {
            // Jika pengguna tidak ditemukan, kirim error 400
            return res.status(400).json({ message: "Username atau password salah." });
        }

        // 3. Bandingkan password yang diberikan dengan hash di database
        // bcrypt.compare() akan melakukan ini dengan aman
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            // Jika password tidak cocok, kirim error 400
            return res.status(400).json({ message: "Username atau password salah." });
        }

        // 4. Jika password cocok, buat JWT (paspor digital)
        const payload = {
            user: {
                id: user.id, // ID pengguna dari database
                username: user.username
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' }, // Token akan kedaluwarsa dalam 1 jam
            (err, token) => {
                if (err) throw err;
                // 5. Kirim token ke pengguna
                res.json({ token: token });
            }
        );

    } catch (error) {
        console.error("ERROR SAAT LOGIN:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error });
    }
});

// [POST] /api/save - Menyimpan hasil simulasi (TERPROTEKSI)
app.post('/api/save', authMiddleware, async (req, res) => {
    try {
        // Ambil data simulasi dari body request
        const { angle, velocity, distance, height } = req.body;

        // Buat entri simulasi baru di database
        const newSimulation = new Simulation({
            angle,
            velocity,
            distance,
            height,
            user: req.user.id // ID pengguna didapat dari token via authMiddleware
        });

        await newSimulation.save();

        res.status(201).json({ message: "Hasil simulasi berhasil disimpan!" });
    } catch (error) {
        console.error("ERROR SAAT MENYIMPAN SIMULASI:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});