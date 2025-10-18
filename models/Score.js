// File: models/Score.js

const mongoose = require('mongoose');

const ScoreSchema = new mongoose.Schema({
    // Skor terbaik user
    bestScore: { type: Number, required: true, default: 0 },

    // Tautan ke pengguna yang memiliki skor ini
    user: {
        type: mongoose.Schema.Types.ObjectId, // Menyimpan ID unik pengguna
        ref: 'User', // Merujuk ke model 'User'
        required: true,
        unique: true // Setiap user hanya punya 1 record score
    },

    // Waktu saat skor terakhir diupdate
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Score', ScoreSchema);