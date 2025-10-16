const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Ini adalah "blueprint" untuk setiap pengguna
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true, // Wajib diisi
        unique: true,   // Tidak boleh ada username yang sama
        trim: true      // Menghapus spasi di awal/akhir
    },
    password: {
        type: String,
        required: true // Wajib diisi
    }
});

// --- FITUR HASHING PASSWORD OTOMATIS ---
// "Middleware" ini akan berjalan SECARA OTOMATIS setiap kali
// sebuah dokumen pengguna baru akan di-save.
UserSchema.pre('save', async function(next) {
    // Hanya hash password jika field password diubah (atau baru)
    if (!this.isModified('password')) {
        return next();
    }

    try {
        // "Salt" adalah string acak untuk membuat hash lebih aman
        const salt = await bcrypt.genSalt(10);
        // Ganti password asli dengan password yang sudah di-hash
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// "Mongoose.model" akan membuat sebuah koleksi (tabel) bernama 'users'
// di database MongoDB Anda, berdasarkan blueprint UserSchema.
module.exports = mongoose.model('User', UserSchema);