// =================================================================
// GANTI SELURUH ISI SERVER.JS ANDA DENGAN KODE BARU INI
// =================================================================
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const Simulation = require('./models/Simulation');
const Score = require('./models/Score');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
// JWT Secret dari environment variable atau fallback
const JWT_SECRET = process.env.JWT_SECRET || 'kunci-rahasia-ini-sangat-aman-dan-harus-diganti';

// AWAL Gemini AI
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

const systemInstruction = `
Anda adalah tutor fisika yang ramah untuk sebuah web pembelajaran.
Topik keahlian Anda hanya dan secara eksklusif adalah gerak parabola.
Jangan pernah menjawab pertanyaan tentang subjek lain, termasuk topik fisika lainnya, sejarah, biologi, atau pertanyaan umum.
Jika pengguna bertanya di luar topik, Anda wajib menolak dengan sopan dan mengarahkan kembali percakapan ke gerak parabola.

ATURAN FORMAT JAWABAN YANG WAJIB DIIKUTI:
1. Gunakan paragraf pendek dan jelas (maksimal 2-3 kalimat per paragraf)
2. Pisahkan setiap poin dengan bullet points menggunakan tanda • (bukan *)
3. Gunakan **teks tebal** untuk konsep penting (gunakan ** bukan *)
4. Untuk rumus matematika, gunakan format: v₀ (bukan v_0), θ (bukan \\theta), g = 9.8 m/s²
5. Jangan gunakan tanda * berlebihan atau formatting LaTeX yang rumit
6. Berikan contoh nyata yang mudah dipahami
7. Hindari penggunaan tanda bintang (*) kecuali untuk membuat teks tebal dengan **

Format yang DILARANG:
- Jangan pakai tanda *** atau **** 
- Jangan pakai format seperti "Gerak Horizontal (Sumbu-X):*"
- Jangan pakai \\frac, \\sin, \\cos - gunakan sin, cos biasa
- Jangan pakai terlalu banyak rumus LaTeX yang rumit

Contoh format jawaban yang BENAR:
**Gerak parabola** adalah gerakan benda yang dilempar dengan sudut tertentu.

Karakteristik utama:
• Lintasan berbentuk melengkung seperti busur
• Dipengaruhi oleh gravitasi g = 9.8 m/s²
• Memiliki komponen horizontal dan vertikal

**Rumus dasar:**
• Kecepatan horizontal: vₓ = v₀ cos θ
• Kecepatan vertikal: vᵧ = v₀ sin θ - gt

Contoh nyata: bola basket yang dilempar ke ring.
`;

function formatGeminiResponse(text) {
    let formatted = text.trim();
    
    formatted = formatted.replace(/\*{3,}/g, ''); 
    formatted = formatted.replace(/([^:]+):\*+/g, '<strong>$1:</strong>'); 
    
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'); 
    formatted = formatted.replace(/\*([^*]+)\*(?!\*)/g, '<strong>$1</strong>'); 
    
    formatted = formatted.replace(/\*(?![a-zA-Z0-9])/g, '');
    
    formatted = formatted.replace(/\\theta/g, 'θ');
    formatted = formatted.replace(/\\sin/g, 'sin');
    formatted = formatted.replace(/\\cos/g, 'cos');
    formatted = formatted.replace(/\\tan/g, 'tan');
    formatted = formatted.replace(/\\cdot/g, '·');
    
    formatted = formatted.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="formula">($1)/($2)</span>');
    
    formatted = formatted.replace(/([a-zA-Z])_\{([^}]+)\}/g, '$1<sub>$2</sub>');
    formatted = formatted.replace(/([a-zA-Z])_([a-zA-Z0-9])/g, '$1<sub>$2</sub>');
    formatted = formatted.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
    formatted = formatted.replace(/\^([0-9]+)/g, '<sup>$1</sup>');
    
    formatted = formatted.replace(/\$([^$]+)\$/g, '<span class="formula">$1</span>');
    
    formatted = formatted.replace(/•\s*/g, '<br>• ');
    formatted = formatted.replace(/\n•/g, '<br>•');
    
    formatted = formatted.replace(/(\d+)\.\s*/g, '<br>$1. ');
    
    formatted = formatted.replace(/\n([A-Za-z\s]+):/g, '<br><strong>$1:</strong>');
    formatted = formatted.replace(/^([A-Za-z\s]+):/g, '<strong>$1:</strong>');
    
    formatted = formatted.replace(/\n\n/g, '<br><br>'); 
    formatted = formatted.replace(/\n/g, '<br>'); 
    
    formatted = formatted.replace(/(<br>){3,}/g, '<br><br>');
    
    formatted = formatted.replace(/^(<br>)+/, '');
    formatted = formatted.replace(/(<br>)+$/, '');
    
    formatted = formatted.replace(/\s*<span class="formula">/g, ' <span class="formula">');
    formatted = formatted.replace(/<\/span>\s*/g, '</span> ');
    
    return formatted.trim();
}

// Inisialisasi model Gemini
let genAI, model;
if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
    try {
        console.log("Mencoba inisialisasi Gemini AI dengan API key...");
        genAI = new GoogleGenerativeAI(GEMINI_API_KEY.trim());
        model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash"
        });
        console.log("Gemini AI berhasil diinisialisasi!");
    } catch (error) {
        console.error("Error inisialisasi Gemini AI:", error);
    }
} else {
    console.log("API key Gemini belum diset atau tidak valid:", GEMINI_API_KEY);
}
const authMiddleware = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        return res.status(401).json({ message: 'Akses ditolak. Tidak ada token.' });
    }

    try {
        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, JWT_SECRET);

        req.user = decoded.user;

        next();
    } catch (error) {
        res.status(401).json({ message: 'Token tidak valid.' });
    }
};

const fs = require('fs');
const path = require('path');

const app = express();
// Port configuration untuk deployment
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    
    if (req.method === 'OPTIONS') {
        res.sendStatus(200);
    } else {
        next();
    }
});

app.use(express.json());
app.use(express.static(__dirname)); 

const dataFilePath = path.join(__dirname, 'data.json');

// MongoDB Connection String dari environment variable atau fallback ke local
const connectionString = process.env.MONGODB_URI || "mongodb+srv://user_lab:user_lab_098@cluster-lab-virtual.chof9bt.mongodb.net/?retryWrites=true&w=majority&appName=cluster-lab-virtual";

mongoose.connect(connectionString)
  .then(() => {
    console.log("Berhasil terhubung ke MongoDB Atlas!");
  })
  .catch((error) => {
    console.error("Koneksi database gagal:", error);
  });
app.get('/api/history', authMiddleware, async (req, res) => {
    try {
        const userHistory = await Simulation.find({ user: req.user.id })
            .sort({ timestamp: -1 }) 
            .limit(10); 

        res.json(userHistory);
    } catch (error) {
        console.error("ERROR SAAT MENGAMBIL RIWAYAT:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

app.delete('/api/history/:id', authMiddleware, async (req, res) => {
    try {
        const simulationId = req.params.id;
        const userId = req.user.id;

        const simulation = await Simulation.findById(simulationId);

        if (!simulation) {
            return res.status(404).json({ message: 'Riwayat tidak ditemukan.' });
        }

        if (simulation.user.toString() !== userId) {
            return res.status(403).json({ message: 'Akses ditolak. Anda tidak memiliki izin.' });
        }

        await Simulation.findByIdAndDelete(simulationId);

        res.json({ message: 'Riwayat berhasil dihapus.' });

    } catch (error) {
        console.error("ERROR SAAT MENGHAPUS RIWAYAT:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

app.delete('/api/history', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.id;

        await Simulation.deleteMany({ user: userId });

        res.json({ message: 'Semua riwayat berhasil dihapus.' });

    } catch (error) {
        console.error("ERROR SAAT MENGHAPUS SEMUA RIWAYAT:", error);
        res.status(500).json({ message: 'Terjadi kesalahan pada server.' });
    }
});

app.post('/api/chatbot', authMiddleware, async (req, res) => {
    try {
        const { message } = req.body;
        
        console.log('=== CHATBOT REQUEST RECEIVED ===');
        console.log('User:', req.user.username);
        console.log('Message:', message);
        
        if (!message || message.trim().length === 0) {
            return res.status(400).json({ error: 'Pesan tidak boleh kosong.' });
        }

        if (!model) {
            console.log('Model not initialized');
            return res.json({ 
                response: 'Maaf, chatbot belum dikonfigurasi dengan benar. Silakan hubungi administrator untuk mengatur API key Gemini.' 
            });
        }

        console.log('Sending to Gemini AI...');

        const fullPrompt = `${systemInstruction}\n\nPertanyaan pengguna: ${message}\n\nJawaban:`;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const rawText = response.text();

        const formattedText = formatGeminiResponse(rawText);

        console.log('Gemini response received:', rawText.substring(0, 100) + '...');
        console.log('Formatted response:', formattedText.substring(0, 100) + '...');

        res.json({ response: formattedText });

    } catch (error) {
        console.error('=== CHATBOT ERROR ===');
        console.error('Error:', error.message);
        console.error('Stack:', error.stack);
        
        res.status(500).json({ 
            error: 'Terjadi kesalahan pada chatbot.',
            response: 'Maaf, saya mengalami gangguan teknis. Silakan coba lagi dalam beberapa saat.'
        });
    }
});

app.post('/api/auth/register', async (req, res) => {
    console.log('=== REGISTER REQUEST RECEIVED ===');
    console.log('Request body:', req.body);
    console.log('Request headers:', req.headers);
    
    try {
        const { username, password } = req.body;

        console.log('Extracted username:', username);
        console.log('Extracted password length:', password ? password.length : 'undefined');

        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            console.log('User already exists:', username);
            return res.status(400).json({ message: "Username sudah digunakan." });
        }

        const newUser = new User({
            username: username,
            password: password 
        });
        await newUser.save();
        console.log('New user created successfully:', username);

        res.status(201).json({ message: "Pengguna berhasil terdaftar!" });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error });
    }
});

// [POST] /api/auth/login
// Tugas: Memverifikasi kredensial dan memberikan JWT jika berhasil.
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        const user = await User.findOne({ username: username });
        if (!user) {
            return res.status(400).json({ message: "Username atau password salah." });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Username atau password salah." });
        }

        const payload = {
            user: {
                id: user.id, 
                username: user.username
            }
        };

        jwt.sign(
            payload,
            JWT_SECRET,
            { expiresIn: '1h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token: token });
            }
        );

    } catch (error) {
        console.error("ERROR SAAT LOGIN:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server.", error: error });
    }
});

app.post('/api/save', authMiddleware, async (req, res) => {
    try {
        const { angle, velocity, distance, height } = req.body;

        const newSimulation = new Simulation({
            angle,
            velocity,
            distance,
            height,
            user: req.user.id 
        });

        await newSimulation.save();

        res.status(201).json({ message: "Hasil simulasi berhasil disimpan!" });
    } catch (error) {
        console.error("ERROR SAAT MENYIMPAN SIMULASI:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server berjalan di port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});