// Vercel Serverless Function Handler
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

// Import models
const User = require('../models/User');
const Simulation = require('../models/Simulation');
const Score = require('../models/Score');

const app = express();

// Environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY?.trim();
const JWT_SECRET = process.env.JWT_SECRET || 'kunci-rahasia-ini-sangat-aman-dan-harus-diganti';

// System instruction untuk AI
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

// Function untuk memformat response agar lebih rapi
function formatGeminiResponse(text) {
    // Mulai dengan membersihkan teks secara umum
    let formatted = text.trim();
    
    // 1. Bersihkan tanda bintang berlebihan dan malformed headers
    formatted = formatted.replace(/\*{3,}/g, ''); // Hapus triple atau lebih asterisk
    formatted = formatted.replace(/([^:]+):\*+/g, '<strong>$1:</strong>'); // Header dengan asterisk berlebih
    
    // 2. Format bold text dengan asterisk
    formatted = formatted.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>'); // Double asterisk
    formatted = formatted.replace(/\*([^*]+)\*(?!\*)/g, '<strong>$1</strong>'); // Single asterisk
    
    // 3. Bersihkan asterisk yang tersisa
    formatted = formatted.replace(/\*(?![a-zA-Z0-9])/g, ''); // Asterisk yang tidak diikuti huruf/angka
    
    // 4. Format mathematical expressions
    // LaTeX commands ke Unicode/HTML
    formatted = formatted.replace(/\\theta/g, 'θ');
    formatted = formatted.replace(/\\sin/g, 'sin');
    formatted = formatted.replace(/\\cos/g, 'cos');
    formatted = formatted.replace(/\\tan/g, 'tan');
    formatted = formatted.replace(/\\cdot/g, '·');
    
    // Format fractions
    formatted = formatted.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<span class="formula">($1)/($2)</span>');
    
    // Format subscripts dan superscripts
    formatted = formatted.replace(/([a-zA-Z])_\{([^}]+)\}/g, '$1<sub>$2</sub>');
    formatted = formatted.replace(/([a-zA-Z])_([a-zA-Z0-9])/g, '$1<sub>$2</sub>');
    formatted = formatted.replace(/\^\{([^}]+)\}/g, '<sup>$1</sup>');
    formatted = formatted.replace(/\^([0-9]+)/g, '<sup>$1</sup>');
    
    // Format expressions dalam $ $
    formatted = formatted.replace(/\$([^$]+)\$/g, '<span class="formula">$1</span>');
    
    // 5. Format struktur teks
    // Bullet points
    formatted = formatted.replace(/•\s*/g, '<br>• ');
    formatted = formatted.replace(/\n•/g, '<br>•');
    
    // Numbered lists
    formatted = formatted.replace(/(\d+)\.\s*/g, '<br>$1. ');
    
    // Headers dan sections (kata diikuti titik dua)
    formatted = formatted.replace(/\n([A-Za-z\s]+):/g, '<br><strong>$1:</strong>');
    formatted = formatted.replace(/^([A-Za-z\s]+):/g, '<strong>$1:</strong>');
    
    // 6. Format line breaks
    formatted = formatted.replace(/\n\n/g, '<br><br>'); // Double newline
    formatted = formatted.replace(/\n/g, '<br>'); // Single newline
    
    // 7. Pembersihan akhir
    // Hapus multiple <br> berlebihan
    formatted = formatted.replace(/(<br>){3,}/g, '<br><br>');
    
    // Bersihkan awal dan akhir
    formatted = formatted.replace(/^(<br>)+/, '');
    formatted = formatted.replace(/(<br>)+$/, '');
    
    // Fix spacing around formulas
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
    console.warn("GEMINI_API_KEY tidak ditemukan atau tidak valid. Chatbot tidak akan berfungsi.");
}

// Middleware
app.use(express.json());

// CORS Middleware untuk Vercel
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

// MongoDB Connection
const connectionString = process.env.MONGODB_URI || "mongodb+srv://user_lab:user_lab_098@cluster-lab-virtual.chof9bt.mongodb.net/?retryWrites=true&w=majority&appName=cluster-lab-virtual";

let isConnected = false;

const connectToDatabase = async () => {
    if (isConnected) {
        return;
    }
    
    try {
        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        isConnected = true;
        console.log("Berhasil terhubung ke MongoDB Atlas!");
    } catch (error) {
        console.error("Koneksi database gagal:", error);
        throw error;
    }
};

// Auth Middleware
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Token tidak ditemukan atau format salah.' });
        }

        const token = authHeader.substring(7); // Hapus "Bearer " dari awal
        
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Simpan data user dari token ke req.user
        next();
    } catch (error) {
        console.error('ERROR AUTH MIDDLEWARE:', error);
        return res.status(401).json({ message: 'Token tidak valid atau telah kedaluwarsa.' });
    }
};

// Routes
app.get('/api', (req, res) => {
    res.json({ message: 'Virtual Lab API is running on Vercel!' });
});

// Auth Routes
app.post('/api/auth/register', async (req, res) => {
    try {
        await connectToDatabase();
        
        const { username, password } = req.body;
        
        const existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ message: 'Username sudah digunakan.' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        
        const newUser = new User({
            username,
            password: hashedPassword
        });

        await newUser.save();
        
        const token = jwt.sign(
            { id: newUser._id, username: newUser.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Registrasi berhasil!',
            token,
            user: {
                id: newUser._id,
                username: newUser.username
            }
        });

    } catch (error) {
        console.error("ERROR REGISTRASI:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        await connectToDatabase();
        
        const { username, password } = req.body;

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(400).json({ message: 'Username atau password salah.' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(400).json({ message: 'Username atau password salah.' });
        }

        const token = jwt.sign(
            { id: user._id, username: user.username },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login berhasil!',
            token,
            user: {
                id: user._id,
                username: user.username
            }
        });

    } catch (error) {
        console.error("ERROR LOGIN:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

// History Routes
app.get('/api/history', authMiddleware, async (req, res) => {
    try {
        await connectToDatabase();
        
        const userHistory = await Simulation.find({ user: req.user.id })
            .sort({ timestamp: -1 })
            .limit(10);

        res.json(userHistory);
    } catch (error) {
        console.error("ERROR SAAT MENGAMBIL RIWAYAT:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

app.post('/api/simulation', authMiddleware, async (req, res) => {
    try {
        await connectToDatabase();
        
        const { velocity, angle, height, range, time } = req.body;
        
        const newSimulation = new Simulation({
            user: req.user.id,
            velocity,
            angle,
            height,
            range,
            time
        });

        await newSimulation.save();
        
        res.status(201).json({
            message: 'Simulasi berhasil disimpan!',
            simulation: newSimulation
        });

    } catch (error) {
        console.error("ERROR SAAT MENYIMPAN SIMULASI:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

// Score Routes
app.get('/api/scores/best', authMiddleware, async (req, res) => {
    try {
        await connectToDatabase();
        
        const bestScore = await Score.findOne({ user: req.user.id });
        
        if (!bestScore) {
            return res.json({ bestScore: 0 });
        }
        
        res.json({ bestScore: bestScore.bestScore });
    } catch (error) {
        console.error("ERROR SAAT MENGAMBIL BEST SCORE:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

app.post('/api/scores', authMiddleware, async (req, res) => {
    try {
        await connectToDatabase();
        
        const { score } = req.body;
        
        let userScore = await Score.findOne({ user: req.user.id });
        
        if (!userScore) {
            userScore = new Score({
                user: req.user.id,
                bestScore: score
            });
        } else if (score > userScore.bestScore) {
            userScore.bestScore = score;
        }
        
        await userScore.save();
        
        res.json({
            message: 'Skor berhasil disimpan!',
            bestScore: userScore.bestScore,
            isNewRecord: !userScore || score > userScore.bestScore
        });
    } catch (error) {
        console.error("ERROR SAAT MENYIMPAN SCORE:", error);
        res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
});

// Chatbot Route
app.post('/api/chatbot', authMiddleware, async (req, res) => {
    try {
        await connectToDatabase();
        
        if (!model) {
            return res.status(503).json({ 
                error: 'Chatbot tidak tersedia',
                response: 'Maaf, layanan chatbot sedang tidak tersedia. Silakan coba lagi nanti.'
            });
        }

        const { message } = req.body;
        
        if (!message || message.trim() === '') {
            return res.status(400).json({ 
                error: 'Pesan tidak boleh kosong',
                response: 'Silakan masukkan pertanyaan Anda.'
            });
        }

        const fullPrompt = `${systemInstruction}\n\nPertanyaan pengguna: ${message}\n\nJawaban:`;

        const result = await model.generateContent(fullPrompt);
        const rawText = result.response.text();
        
        const formattedText = formatGeminiResponse(rawText);
        
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

// Export untuk Vercel
module.exports = app;