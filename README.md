# Fynteq - SaaS Payment Monitoring Platform

## 🚀 Quick Start

### Development
```bash
# Frontend
npm install
npm start

# Backend
cd backend
npm install
npm run dev
```

### Production Build
```bash
npm run build
# Output: build/ folder (frontend only)
# Or: dist/ folder (frontend + backend)
```

---

## 📦 Deployment

### Complete Package (Frontend + Backend)

The `dist/` folder contains everything:
- Frontend (React build)
- Backend (Node.js/Express)
- Ready to upload to Hostinger

**Steps:**
1. Upload `dist/` contents to `public_html/`
2. Configure `api/.env` with MongoDB connection
3. Run `npm install` in `api/` folder
4. Start backend: `node api/server.js`

---

## 📚 Documentation

- **Backend API**: `backend/README.md`

---

## 🔒 Security

- ✅ Passwords hashed with bcrypt
- ✅ JWT authentication
- ✅ Input validation & sanitization
- ✅ CORS configured
- ✅ Security headers enabled

**Never commit `.env` files or credentials!**

---

## 📝 License

ISC

