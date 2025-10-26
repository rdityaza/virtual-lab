# 🚀 Deployment Guide - Render.com

Panduan lengkap untuk deploy Virtual Physics Lab ke Render.com

## 📋 Checklist Persiapan

### ✅ Files yang Sudah Disiapkan:
- [x] `package.json` - Updated dengan script start dan engines
- [x] `render.yaml` - Konfigurasi deployment Render
- [x] `.gitignore` - Melindungi file sensitif  
- [x] `README.md` - Dokumentasi lengkap
- [x] `server.js` - Updated dengan environment variables

### ✅ Environment Variables yang Diperlukan:
- [x] `GEMINI_API_KEY` - API key Google Gemini
- [x] `MONGODB_URI` - Connection string MongoDB Atlas
- [x] `JWT_SECRET` - Secret key untuk JWT
- [x] `NODE_ENV` - Set ke 'production'

## 🔧 Step-by-Step Deployment

### 1. Persiapan Repository

```bash
# Pastikan semua perubahan sudah di-commit
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

### 2. Setup di Render.com

1. **Buat Account** di [render.com](https://render.com)

2. **Connect GitHub Repository:**
   - Klik "New +" → "Web Service"  
   - Connect GitHub account
   - Pilih repository `virtual-lab`

3. **Configure Service:**
   - **Name**: `virtual-lab-physics`
   - **Environment**: `Node`
   - **Region**: `Singapore` (atau sesuai preferensi)
   - **Branch**: `main`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`

### 3. Environment Variables Setup

Di Render Dashboard, tambahkan environment variables berikut:

```env
GEMINI_API_KEY=AIzaSyAeZC82iHdMuaFTfyOUTSDWeUR3yPGU3sY
MONGODB_URI=mongodb+srv://user_lab:user_lab_098@cluster-lab-virtual.chof9bt.mongodb.net/?retryWrites=true&w=majority&appName=cluster-lab-virtual  
JWT_SECRET=kunci-rahasia-virtual-lab-physics-2024-super-secure-production
NODE_ENV=production
```

⚠️ **PENTING**: Ganti `JWT_SECRET` dengan string random yang lebih aman untuk production!

### 4. MongoDB Atlas Configuration

Pastikan MongoDB Atlas di-configure untuk production:

1. **Whitelist IP Address:**
   - Login ke MongoDB Atlas
   - Network Access → Add IP Address
   - Pilih "Allow access from anywhere" (0.0.0.0/0)
   - Atau tambahkan IP Render secara spesifik

2. **Database User:**
   - Pastikan user `user_lab` memiliki permissions yang tepat
   - Read and write access ke database

### 5. Deploy!

1. **Klik "Create Web Service"** di Render
2. **Wait for Build** - Proses akan memakan waktu 2-5 menit
3. **Check Logs** untuk memastikan tidak ada error
4. **Access Application** melalui URL yang diberikan Render

## 🔍 Verification

### Testing URL Structure:
```
https://virtual-lab-physics.onrender.com/
├── /                     # Landing page
├── /login.html          # Login page  
├── /register.html       # Register page
├── /materi.html         # Learning materials + AI chatbot
├── /kuis.html           # Quiz page
└── /api/...             # API endpoints
```

### Health Check Endpoints:
- `GET /` - Should return landing page
- `POST /api/auth/login` - Should accept login requests
- `POST /api/chatbot` - Should respond to AI queries

## 🐛 Troubleshooting

### Common Issues:

#### 1. Build Failures
```bash
# Check logs for missing dependencies
npm ERR! Missing script: "start"
```
**Solution**: Pastikan `package.json` memiliki script start

#### 2. Environment Variable Issues
```bash
# Error accessing undefined environment variables
Error: Cannot read property 'GEMINI_API_KEY' of undefined
```
**Solution**: Double-check environment variables di Render dashboard

#### 3. Database Connection Errors
```bash
# MongoDB connection timeout
MongooseServerSelectionError: connection timed out
```
**Solution**: 
- Periksa MongoDB Atlas IP whitelist
- Pastikan MONGODB_URI benar
- Check MongoDB Atlas cluster status

#### 4. CORS Issues in Production
```bash
# Browser console errors
Access to XMLHttpRequest blocked by CORS policy
```
**Solution**: Server sudah di-configure dengan CORS middleware

### 🔍 Debug Commands:

```bash
# Check environment variables (di Render logs)
console.log('Environment variables loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET',
  MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'NOT SET',
  JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
});
```

## 📈 Post-Deployment

### Performance Optimization:
1. **Monitor Resource Usage** di Render dashboard
2. **Check Response Times** untuk API endpoints
3. **Monitor Database Connections** di MongoDB Atlas

### Security:
1. **Generate Strong JWT Secret** untuk production
2. **Monitor Access Logs** untuk unusual activity
3. **Regular Security Updates** untuk dependencies

### Maintenance:
1. **Auto-Deploy** setup untuk future updates
2. **Backup Strategy** untuk MongoDB data
3. **Monitoring** setup untuk uptime

## 🆘 Support Resources

- **Render Documentation**: https://render.com/docs
- **MongoDB Atlas Docs**: https://docs.atlas.mongodb.com/
- **Express.js Deployment**: https://expressjs.com/en/advanced/best-practice-performance.html

---

✅ **Deployment Complete!** 

Your Virtual Physics Lab is now live at: `https://your-app-name.onrender.com`