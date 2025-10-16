// File: models/Simulation.js

const mongoose = require('mongoose');

const SimulationSchema = new mongoose.Schema({
    // Data simulasi
    angle: { type: Number, required: true },
    velocity: { type: Number, required: true },
    distance: { type: Number, required: true },
    height: { type: Number, required: true },

    // Tautan ke pengguna yang melakukan simulasi ini
    user: {
        type: mongoose.Schema.Types.ObjectId, // Menyimpan ID unik pengguna
        ref: 'User', // Merujuk ke model 'User'
        required: true
    },

    // Waktu saat simulasi disimpan
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Simulation', SimulationSchema);