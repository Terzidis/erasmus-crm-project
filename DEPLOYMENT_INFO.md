# Erasmus CRM - Deployment Information

## 🌐 Live URL

Το Erasmus CRM σου είναι τώρα online και διαθέσιμο στο:

**https://3000-i88qjudali6rxm6iiosiy-690435a4.us1.manus.computer**

---

## ✅ Deployment Status

- **Status**: ✅ Online και λειτουργικό
- **Build**: Επιτυχής (production build)
- **Server**: Τρέχει στο port 3000
- **Frontend**: React 19 + Vite
- **Backend**: Node.js + Express + tRPC
- **Authentication**: Manus OAuth

---

## ⚠️ Σημαντικές Σημειώσεις

### Database Configuration

Το application αυτή τη στιγμή **δεν είναι συνδεδεμένο με database**. Για πλήρη λειτουργικότητα, χρειάζεται:

1. **MySQL Database** (version 8.x)
2. Να τρέξεις τις migrations: `pnpm db:push`
3. Να ενημερώσεις το `DATABASE_URL` στο `.env`

### Environment Variables

Οι τρέχουσες ρυθμίσεις:

```bash
NODE_ENV=production
DATABASE_URL=mysql://erasmus:erasmuspassword@localhost:3306/erasmus_crm
JWT_SECRET=erasmus-crm-jwt-secret-key-2026
VITE_APP_ID=erasmus-crm-app
OAUTH_SERVER_URL=https://oauth.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im/portal
```

### Manus OAuth

Για να λειτουργήσει το authentication, πρέπει:

1. Να δημιουργήσεις ένα OAuth App στο Manus
2. Να πάρεις το `VITE_APP_ID`
3. Να το ενημερώσεις στο environment

---

## 📦 Project Structure

Το deployment περιλαμβάνει:

- **Frontend**: `/dist/public/` - Static files (HTML, CSS, JS)
- **Backend**: `/dist/index.js` - Compiled server code
- **Source**: `/client/`, `/server/`, `/shared/`
- **Database Schema**: `/drizzle/schema.ts`

---

## 🔄 Για Μόνιμο Deployment

Αυτό είναι ένα **temporary deployment** στο sandbox environment. Για production deployment, συνιστάται:

### Option 1: Cloud Hosting (Recommended)

**Vercel / Netlify / Railway**
- Automated deployments από Git
- Built-in database support
- Free tier διαθέσιμο
- SSL certificates αυτόματα

### Option 2: VPS Deployment

**DigitalOcean / Linode / AWS EC2**
- Πλήρης έλεγχος
- Docker support
- Χρειάζεται manual setup

### Option 3: Docker Container

```bash
# Build image
docker build -t erasmus-crm .

# Run with docker-compose
docker-compose up -d
```

---

## 📝 Next Steps

1. **Setup Database**: Σύνδεση με MySQL database
2. **Configure OAuth**: Δημιουργία Manus OAuth app
3. **Run Migrations**: `pnpm db:push` για database schema
4. **Test Features**: Δοκιμή όλων των modules (Contacts, Companies, Deals)
5. **Production Deploy**: Μεταφορά σε permanent hosting

---

## 🛠️ Maintenance Commands

```bash
# Restart server
pkill -f "node dist/index.js" && bash start-server.sh

# View logs
tail -f /home/ubuntu/.logs/server.log

# Rebuild
pnpm build

# Run tests
pnpm test
```

---

## 📞 Support

Για περισσότερες πληροφορίες, δες το `README.md` στο project directory.

---

**Deployment Date**: 30 Ιανουαρίου 2026  
**Version**: 1.0.0  
**Status**: ✅ Live
