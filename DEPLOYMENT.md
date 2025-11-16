# 🚀 Deployment Guide

## 📦 Complete Package (dist/ folder)

The `dist/` folder contains **everything** - frontend and backend.

### Step 1: Upload to Hostinger

1. Upload **all contents** of `dist/` to `public_html/`
2. Ensure `.htaccess` is uploaded (show hidden files)

### Step 2: Configure Backend

1. Go to `public_html/api/`
2. Create `.env` file:
   ```env
   MONGODB_URI="mongodb://username:password@host:port/database?authSource=admin"
   MONGODB_DB="fynteq_saas"
   PORT=5001
   NODE_ENV=production
   JWT_SECRET="your-strong-secret-key"
   FRONTEND_URL="https://yourdomain.com"
   ```

### Step 3: Install & Start Backend

```bash
cd public_html/api
npm install --production
node server.js
```

Or use PM2:
```bash
pm2 start server.js --name fynteq-api
pm2 save
```

### Step 4: Test

- Frontend: `https://yourdomain.com/`
- API: `https://yourdomain.com/api/health`
- Signup: `https://yourdomain.com/signup`

---

## ⚙️ Configuration

### API URL

The frontend automatically uses:
- **Production**: `/api` (relative path - same domain)
- **Localhost**: `http://localhost:5001/api` (development only)

### CORS

Backend CORS is configured to allow your domain. Update `FRONTEND_URL` in `api/.env`.

---

## 🔒 Security Checklist

- [ ] Change `JWT_SECRET` to strong random string
- [ ] Use HTTPS (SSL certificate)
- [ ] Update `FRONTEND_URL` in backend `.env`
- [ ] Set `NODE_ENV=production`
- [ ] Enable MongoDB authentication
- [ ] Never commit `.env` files

---

## 🐛 Troubleshooting

**404 on page refresh?**
- Ensure `.htaccess` is uploaded
- Check `mod_rewrite` is enabled

**API calls fail?**
- Verify backend is running
- Check `FRONTEND_URL` in backend `.env`
- Verify CORS settings

**Backend not starting?**
- Check Node.js is installed
- Verify MongoDB connection in `.env`
- Check port 5001 is available

---

**Ready to deploy! Upload `dist/` folder to Hostinger. 🚀**

