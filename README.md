# Erasmus CRM Project

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![React](https://img.shields.io/badge/React-19.x-61dafb.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

**Μια σταθερή, ασφαλή και επεκτάσιμη βάση CRM για τη διαχείριση πελατειακών σχέσεων**

</div>

---

## 📋 Περιγραφή

Το Erasmus CRM είναι ένα ολοκληρωμένο σύστημα διαχείρισης πελατειακών σχέσεων (Customer Relationship Management) που αναπτύχθηκε στο πλαίσιο του προγράμματος Erasmus. Σχεδιάστηκε με σύγχρονες τεχνολογίες και βέλτιστες πρακτικές για να παρέχει μια σταθερή βάση για τις επόμενες φάσεις ανάπτυξης.

### Στόχοι Έργου

- ✅ **Σταθερότητα**: Αξιόπιστη αρχιτεκτονική με type-safe κώδικα
- ✅ **Ασφάλεια**: JWT authentication και role-based access control
- ✅ **Επεκτασιμότητα**: Modular design και Docker-ready deployment

---

## 🚀 Features

### Core Modules

| Module | Description |
|--------|-------------|
| **Contact Management** | Πλήρης διαχείριση επαφών με CRUD, αναζήτηση και φιλτράρισμα |
| **Company Management** | Διαχείριση εταιρειών με industry classification |
| **Deals Pipeline** | 6-stage pipeline με value και probability tracking |
| **Activity Tracking** | Καταγραφή κλήσεων, emails, meetings, tasks |
| **Dashboard Analytics** | Real-time στατιστικά και interactive charts |
| **User Management** | Role-based access (admin/user) |

### Technical Highlights

- 🔐 **Authentication**: Manus OAuth + JWT sessions
- 📊 **Type-safe API**: tRPC με end-to-end TypeScript
- 🎨 **Modern UI**: React 19 + TailwindCSS 4 + shadcn/ui
- 🗄️ **Database**: MySQL με Drizzle ORM
- 🧪 **Testing**: Vitest με 13 unit tests
- 🐳 **DevOps**: Docker + GitHub Actions CI/CD

---

## 🛠️ Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 22.x | Runtime environment |
| TypeScript | 5.x | Static typing |
| tRPC | 11.x | Type-safe API |
| Express | 4.x | HTTP server |
| Drizzle ORM | 0.44.x | Database ORM |
| MySQL | 8.x | Database |
| JWT | - | Authentication |
| Zod | 4.x | Validation |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 19.x | UI library |
| Vite | 7.x | Build tool |
| TailwindCSS | 4.x | Styling |
| shadcn/ui | - | UI components |
| Recharts | 2.x | Charts |
| Wouter | 3.x | Routing |

### DevOps

| Technology | Purpose |
|------------|---------|
| Docker | Containerization |
| Docker Compose | Local development |
| GitHub Actions | CI/CD pipeline |
| Vitest | Testing framework |
| pnpm | Package manager |

---

## 📁 Project Structure

```
erasmus-crm-project/
├── client/                 # Frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   │   ├── Home.tsx    # Dashboard
│   │   │   ├── Contacts.tsx
│   │   │   ├── Companies.tsx
│   │   │   ├── Deals.tsx
│   │   │   ├── Activities.tsx
│   │   │   ├── Settings.tsx
│   │   │   └── AdminUsers.tsx
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── lib/            # Utilities
│   │   ├── App.tsx         # Routes
│   │   └── index.css       # Global styles
│   └── public/             # Static assets
├── server/                 # Backend application
│   ├── _core/              # Framework internals
│   ├── db.ts               # Database queries
│   ├── routers.ts          # tRPC procedures
│   ├── storage.ts          # S3 helpers
│   └── *.test.ts           # Unit tests
├── drizzle/                # Database schema
│   └── schema.ts           # Table definitions
├── shared/                 # Shared types/constants
├── .github/workflows/      # CI/CD configuration
├── Dockerfile              # Container definition
├── docker-compose.yml      # Local development
└── package.json            # Dependencies
```

---

## 🗄️ Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `users` | User accounts with roles |
| `contacts` | Customer contacts |
| `companies` | Organizations |
| `deals` | Sales opportunities |
| `activities` | Tasks and interactions |
| `tags` | Contact categorization |
| `contactTags` | Many-to-many relation |

### Entity Relationships

```
Users ─┬─> Contacts ─┬─> Activities
       │             │
       │             └─> ContactTags <── Tags
       │
       └─> Companies ─┬─> Contacts
                      │
                      └─> Deals ──> Activities
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 22.x
- pnpm 10.x
- MySQL 8.x (or use Docker)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd erasmus-crm-project

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Push database schema
pnpm db:push

# Start development server
pnpm dev
```

### Using Docker

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f app
```

---

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm start` | Start production server |
| `pnpm test` | Run unit tests |
| `pnpm check` | TypeScript type check |
| `pnpm format` | Format code with Prettier |
| `pnpm db:push` | Push schema to database |

---

## 🔐 Authentication

The application uses Manus OAuth for authentication:

1. User clicks "Login" button
2. Redirected to Manus OAuth portal
3. After authentication, redirected back with session cookie
4. JWT token stored in HTTP-only cookie
5. Protected routes check `ctx.user` in tRPC procedures

### Roles

| Role | Permissions |
|------|-------------|
| `user` | CRUD on own data |
| `admin` | Full access + user management |

---

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage

# Run specific test file
pnpm test server/crm.test.ts
```

### Test Coverage

- ✅ Authentication procedures
- ✅ Contact CRUD operations
- ✅ Deal management
- ✅ Activity tracking
- ✅ Dashboard statistics
- ✅ Admin procedures

---

## 🐳 Deployment

### Docker Deployment

```bash
# Build image
docker build -t erasmus-crm .

# Run container
docker run -p 3000:3000 \
  -e DATABASE_URL=<your-db-url> \
  -e JWT_SECRET=<your-secret> \
  erasmus-crm
```

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | MySQL connection string | Yes |
| `JWT_SECRET` | Session signing secret | Yes |
| `VITE_APP_ID` | Manus OAuth app ID | Yes |
| `OAUTH_SERVER_URL` | OAuth backend URL | Yes |
| `VITE_OAUTH_PORTAL_URL` | OAuth portal URL | Yes |

---

## 📊 API Reference

### tRPC Procedures

#### Contacts
- `contacts.list` - List all contacts
- `contacts.get` - Get contact by ID
- `contacts.create` - Create new contact
- `contacts.update` - Update contact
- `contacts.delete` - Delete contact
- `contacts.byStatus` - Group by status

#### Companies
- `companies.list` - List all companies
- `companies.get` - Get company by ID
- `companies.create` - Create new company
- `companies.update` - Update company
- `companies.delete` - Delete company

#### Deals
- `deals.list` - List all deals
- `deals.get` - Get deal by ID
- `deals.create` - Create new deal
- `deals.update` - Update deal
- `deals.delete` - Delete deal
- `deals.pipelineStats` - Pipeline statistics

#### Activities
- `activities.list` - List all activities
- `activities.create` - Create new activity
- `activities.update` - Update activity
- `activities.complete` - Mark as complete
- `activities.delete` - Delete activity
- `activities.recent` - Get recent activities

#### Dashboard
- `dashboard.stats` - Get dashboard statistics

#### Users (Admin only)
- `users.list` - List all users
- `users.updateRole` - Update user role

---

## 🔮 Future Phases

### Phase 2 (Planned)
- [ ] Email integration
- [ ] Calendar sync
- [ ] Advanced reporting
- [ ] Data export (CSV/Excel)

### Phase 3 (Planned)
- [ ] Mobile application
- [ ] API integrations
- [ ] Automation workflows
- [ ] Multi-language support

---

## 📄 License

This project is licensed under the MIT License.

---

## 👥 Contributors

Developed as part of the Erasmus Programme.

---

<div align="center">

**Erasmus CRM Project** - Phase 1 Complete ✅

Built with ❤️ using React, tRPC, and MySQL

</div>
