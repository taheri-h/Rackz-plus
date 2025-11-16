# MongoDB Connection Setup

## ⚠️ Authentication Required

Your MongoDB server requires authentication. You need to provide a connection string with username and password.

## Connection String Format

The connection string should look like one of these:

### Option 1: Standard Format
```
mongodb://username:password@api.waybanq.com:27017/fynteq_saas?authSource=admin
```

### Option 2: If no auth database specified
```
mongodb://username:password@api.waybanq.com:27017/fynteq_saas
```

## How to Get Your Credentials

1. **If you created the database in MongoDB Compass:**
   - Check your connection settings in Compass
   - Look for the connection string with credentials

2. **If you have MongoDB Atlas:**
   - Go to Database Access → Create Database User
   - Copy the connection string from "Connect" → "Connect your application"

3. **If you're using a self-hosted MongoDB:**
   - Ask your database administrator for the username and password
   - Or create a user in MongoDB:
     ```javascript
     use admin
     db.createUser({
       user: "fynteq_user",
       pwd: "your_secure_password",
       roles: [{ role: "readWrite", db: "fynteq_saas" }]
     })
     ```

## Update Your .env File

Once you have the full connection string, update `backend/.env`:

```env
MONGODB_URI="mongodb://username:password@api.waybanq.com:27017/fynteq_saas?authSource=admin"
MONGODB_DB="fynteq_saas"
```

**OR** if your connection string already includes the database name:

```env
MONGODB_URI="mongodb://username:password@api.waybanq.com:27017/fynteq_saas"
MONGODB_DB="fynteq_saas"
```

## Test Connection

After updating, test the connection:
```bash
cd backend
node -e "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI, {dbName: process.env.MONGODB_DB}).then(() => {console.log('✅ Connected!'); process.exit(0);}).catch(err => {console.error('❌ Error:', err.message); process.exit(1);});"
```

## Security Note

⚠️ **Never commit your `.env` file to Git!** It contains sensitive credentials.
The `.env` file is already in `.gitignore` for safety.

