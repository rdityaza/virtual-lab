# 🚀 Vercel Deployment Guide

Panduan lengkap untuk deploy Virtual Physics Lab ke Vercel sebagai serverless application.

## 📁 Struktur Project

```
virtual-lab/
├── api/
│   └── server.js         # Serverless API functions
├── public/               # Static files (auto-served)
│   ├── index.html       # Landing page
│   ├── login.html       # Login page
│   ├── register.html    # Register page  
│   ├── materi.html      # Learning materials + AI chatbot
│   ├── kuis.html        # Quiz page
│   ├── *.css           # Stylesheets
│   ├── *.js            # Client-side JavaScript
│   └── assets/         # Images, icons, etc.
├── models/              # MongoDB schemas
├── vercel.json          # Vercel configuration
├── package.json         # Dependencies
└── .env                # Environment variables (local)
```

## ⚙️ Vercel Configuration

### vercel.json
```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/server.js",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/server.js"
    },
    {
      "src": "/(.*)",
      "dest": "/public/$1"
    }
  ],
  "functions": {
    "api/server.js": {
      "maxDuration": 30
    }
  }
}
```

## 🚀 Deployment Steps

### 1. Persiapan Repository

```bash
# Commit semua perubahan
git add .
git commit -m "Configure for Vercel deployment"
git push origin main
```

### 2. Deploy ke Vercel

1. **Buka [vercel.com](https://vercel.com)**
2. **Login/Register** dengan GitHub
3. **Import Project:**
   - Klik "New Project"
   - Pilih repository `virtual-lab`
   - Klik "Import"

### 3. Environment Variables

Di Vercel dashboard, tambahkan environment variables:

```env
GEMINI_API_KEY=AIzaSyAeZC82iHdMuaFTfyOUTSDWeUR3yPGU3sY
MONGODB_URI=mongodb+srv://user_lab:user_lab_098@cluster-lab-virtual.chof9bt.mongodb.net/?retryWrites=true&w=majority&appName=cluster-lab-virtual
JWT_SECRET=kunci-rahasia-virtual-lab-physics-2024-super-secure-production
NODE_ENV=production
```

### 4. MongoDB Atlas Setup

**Pastikan MongoDB Atlas dikonfigurasi untuk production:**

1. **Network Access:**
   - Login MongoDB Atlas
   - Network Access → Add IP Address
   - Select "Allow access from anywhere" (0.0.0.0/0)

2. **Database User:**
   - Pastikan user `user_lab` memiliki read/write permissions

## 🌐 URL Structure

Setelah deployment, aplikasi akan tersedia di:

```
https://your-app-name.vercel.app/
├── /                    # Landing page (public/index.html)
├── /login.html         # Login page
├── /register.html      # Register page
├── /materi.html        # Learning materials + AI chatbot
├── /kuis.html          # Quiz page
└── /api/               # Serverless API endpoints
    ├── /api/auth/register
    ├── /api/auth/login
    ├── /api/history
    ├── /api/simulation
    ├── /api/scores/best
    ├── /api/scores
    └── /api/chatbot
```

## 🔧 Key Features

### Serverless Architecture
- **API routes**: Handled by `/api/server.js` serverless function
- **Static files**: Auto-served from `/public/` directory
- **Database**: MongoDB Atlas (persistent connection handling)
- **AI**: Google Gemini Pro API integration

### Performance Optimizations
- **Cold start mitigation**: Mongoose connection caching
- **Function timeout**: 30 seconds max duration
- **Auto-scaling**: Vercel handles traffic spikes
- **Global CDN**: Static files served from edge locations

## 🐛 Troubleshooting

### Common Issues

#### 1. Function Timeout
```
Error: Function execution timed out
```
**Solution**: Optimize database queries, implement connection pooling

#### 2. Environment Variables
```
Error: GEMINI_API_KEY is not defined
```
**Solution**: Check environment variables in Vercel dashboard

#### 3. MongoDB Connection
```
MongooseServerSelectionError: connection timed out
```
**Solution**: 
- Verify MongoDB Atlas IP whitelist (0.0.0.0/0)
- Check MONGODB_URI format
- Ensure database user permissions

#### 4. CORS Issues
```
Access blocked by CORS policy
```
**Solution**: CORS middleware already configured in API handler

### Debug Tips

#### Check Function Logs
- Go to Vercel dashboard
- Navigate to "Functions" tab
- Click on function execution to see logs

#### Test Endpoints
```bash
# Test API health
curl https://your-app.vercel.app/api

# Test authentication
curl -X POST https://your-app.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

## 📊 Monitoring

### Performance Metrics
- **Function execution time**: Monitor in Vercel dashboard
- **Database connections**: Check MongoDB Atlas metrics
- **Error rates**: Review function logs

### Analytics
- **Page views**: Vercel Analytics (optional)
- **API usage**: Function invocation metrics
- **User activity**: Custom logging in application

## 🔒 Security

### Production Checklist
- [x] Environment variables secured
- [x] JWT secret strong and unique
- [x] MongoDB Atlas IP whitelist configured
- [x] CORS properly configured
- [x] API rate limiting (implement if needed)

### Best Practices
- **Secrets rotation**: Regularly update JWT_SECRET
- **API monitoring**: Set up alerts for unusual activity
- **Database backup**: Regular MongoDB Atlas backups
- **HTTPS only**: Vercel enforces HTTPS by default

## 📈 Scaling

### Automatic Scaling
- **Serverless functions**: Auto-scale based on demand
- **Static files**: Global CDN distribution
- **Database**: MongoDB Atlas handles scaling

### Cost Optimization
- **Vercel Free Tier**: 
  - 100GB bandwidth/month
  - 100,000 function executions/month
  - Unlimited static files
- **MongoDB Atlas Free Tier**: 512MB storage

## 🆘 Support

- **Vercel Documentation**: https://vercel.com/docs
- **MongoDB Atlas**: https://docs.atlas.mongodb.com/
- **Troubleshooting**: Check function logs in Vercel dashboard

---

✅ **Deployment Complete!**

Your Virtual Physics Lab is now running serverless on Vercel! 🎉