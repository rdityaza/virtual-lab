# Virtual Physics Lab - Projectile Motion Simulator

Sebuah aplikasi web pembelajaran fisika interaktif dengan fokus pada gerak parabola, dilengkapi dengan AI chatbot tutor.

## Fitur Utama

- 🔐 **Sistem Autentikasi** - Login/Register dengan JWT
- 🎯 **Simulasi Gerak Parabola** - Visualisasi interaktif dengan Canvas
- 📊 **Sistem Kuis** - Quiz interaktif dengan tracking skor terbaik
- 🤖 **AI Chatbot Tutor** - Powered by Google Gemini AI (khusus topik gerak parabola)
- 📚 **Materi Pembelajaran** - Konten edukatif dengan MathJax equations
- 💾 **Database Integration** - MongoDB untuk user data dan history

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB Atlas
- **AI**: Google Gemini Pro API
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Authentication**: JWT (JSON Web Tokens)
- **Math Rendering**: MathJax

## Environment Variables

Buat file `.env` dengan variabel berikut:

```env
GEMINI_API_KEY=your_gemini_api_key_here
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
NODE_ENV=production
```

## Local Development

1. Clone repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Setup environment variables dalam file `.env`
4. Jalankan server:
   ```bash
   npm start
   ```
5. Buka `http://localhost:3000`

## Deployment ke Vercel (Serverless)

### Persiapan:
1. Push kode ke GitHub repository
2. Pastikan file `vercel.json` sudah ada
3. Environment variables sudah di-setup

### Step-by-step Deployment:

1. **Buat account di Vercel.com**
2. **Import GitHub repository:**
   - Klik "New Project"
   - Import dari GitHub
   - Pilih repository `virtual-lab`

3. **Configure environment variables di Vercel dashboard:**
   - `GEMINI_API_KEY`: API key dari Google AI Studio
   - `MONGODB_URI`: Connection string MongoDB Atlas
   - `JWT_SECRET`: Secret key untuk JWT (generate random string)
   - `NODE_ENV`: `production`

4. **Deploy otomatis** akan dimulai setelah setup

### Environment Variables yang Diperlukan di Vercel:

```
GEMINI_API_KEY=AIzaSy...
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-key-here
NODE_ENV=production
```

### Struktur Project untuk Vercel:

```
virtual-lab/
├── api/
│   └── server.js         # Serverless function
├── public/               # Static files
│   ├── index.html
│   ├── login.html
│   ├── register.html
│   ├── materi.html
│   ├── kuis.html
│   ├── *.css
│   ├── *.js
│   └── assets/
├── models/              # MongoDB models
├── vercel.json          # Vercel config
├── package.json
└── .env
```

## Struktur Project

```
virtual-lab/
├── server.js              # Main server file
├── package.json           # Dependencies
├── render.yaml           # Render deployment config
├── .env                  # Environment variables (local)
├── .gitignore           # Git ignore rules
├── index.html           # Landing page
├── login.html           # Login page
├── register.html        # Register page
├── materi.html          # Learning materials + chatbot
├── kuis.html            # Quiz page
├── models/              # MongoDB models
│   ├── User.js
│   ├── Simulation.js
│   └── Score.js
└── assets/              # Static assets
```

## API Endpoints

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/history` - Get simulation history
- `POST /api/simulation` - Save simulation data
- `POST /api/chatbot` - AI chatbot interaction
- `GET /api/scores/best` - Get user's best score
- `POST /api/scores` - Save quiz score

## Troubleshooting

### Common Issues:
1. **CORS Error**: Sudah di-handle dengan middleware
2. **Database Connection**: Pastikan MongoDB Atlas whitelist IP 0.0.0.0/0
3. **API Key Issues**: Pastikan Gemini API key valid dan quotes/spaces ter-trim
4. **Port Issues**: Menggunakan `process.env.PORT` untuk deployment

### Logs:
Server dilengkapi dengan comprehensive logging untuk debugging.

## License

ISC