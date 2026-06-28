# Organik Gədəbəy

🌿 **Təbii kənd məhsulları platforması** - Gədəbəy dağlarından birbaşa süfrənizə: bal, qaymaq, pendir, quru meyvələr. 100% təbii, əl istehsalı.

## 📋 Məzmun

- [Xüsusiyyətlər](#xüsusiyyətlər)
- [Texnologiyalar](#texnologiyalar)
- [Quraşdırma](#qurşdırma)
- [Mühit Dəyişənləri](#mhit-dyişənləri)
- [Verilənlər Bazası](#verilənlər-bazası)
- [Layihə Strukturu](#layih-strukturu)
- [API](#api)
- [Deployment](#deployment)
- [İştirak](#itirak)
- [Lisenziya](#lisenziya)

## ✨ Xüsusiyyətlər

### 🛒 E-ticarət
- Məhsul kataloqu və kateqoriyalar
- Səbət və sifariş sistemi
- Çatdırılma izləməsi
- Çoxlu ödəniş üsulları (Kart, Nağd, Online)
- İstifadəçi hesabı və profili

### 👨‍💼 Admin Panel
- Məhsul idarəetməsi
- Sifariş idarəetməsi
- Müştəri idarəetməsi
- Maliyyə hesabatları
- Təchizatçı idarəetməsi
- Real-time bildirişlər (SSE)

### 📱 Real-time
- Server-Sent Events (SSE) üçün canlı bildirişlər
- WhatsApp inteqrasiyası
- Chat sistemi
- Pusher ilə real-time yeniləmələr

### 🔒 Təhlükəsizlik
- JWT autentifikasiyası
- Rate limiting (Upstash Redis ilə)
- CORS və CSP başlıqları
- Environment variable validation
- Şifrə hashing (bcrypt)

### 🚀 Performance
- Database connection pooling
- Multi-layer caching (Memory + Redis)
- Image optimization (Cloudinary)
- API response caching
- Performance monitoring

## 🛠️ Texnologiyalar

### Frontend
- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **Zustand** - State management
- **React Query** - Data fetching

### Backend
- **Next.js API Routes** - Serverless API
- **Drizzle ORM** - Database ORM
- **PostgreSQL** - Database
- **Postgres.js** - Database client

### Services
- **Cloudinary** - Image storage
- **AWS S3** - File storage
- **Twilio** - WhatsApp/SMS
- **Pusher** - Real-time
- **Upstash Redis** - Caching & Rate limiting
- **Stripe** - Payments

### Monitoring
- **Sentry** - Error tracking
- Custom logging system
- Performance monitoring
- Health checks

## 📦 Quraşdırma

### Tələblər
- Node.js 20+
- PostgreSQL 14+
- npm veya yarn

### Addımlar

1. **Repo-nu klonlayın**
```bash
git clone https://github.com/your-username/organik-gedebey.git
cd organik-gedebey
```

2. **Asılılıqları qurun**
```bash
npm install
```

3. **Environment variables təyin edin**
```bash
cp .env.local.example .env.local
```

`.env.local` faylında bütün tələb olunan dəyişənləri doldurun.

4. **Verilənlər bazasını qurun**
```bash
npm run db:push
# və ya
npm run db:migrate
```

5. **Seed data əlavə edin**
```bash
npm run seed
```

6. **Development server-i başladın**
```bash
npm run dev
```

Browser-da [http://localhost:3000](http://localhost:3000) açın.

## 🔐 Mühit Dəyişənləri

### Zəruri
```bash
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-min-32-characters

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

### İxtiyari
```bash
# AWS S3
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_S3_BUCKET=your-bucket-name

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Twilio
TWILIO_ACCOUNT_SID=your-account-sid
TWILIO_AUTH_TOKEN=your-auth-token
TWILIO_PHONE_NUMBER=+1234567890
TWILIO_WHATSAPP_NUMBER=+1234567890

# Pusher
PUSHER_APP_ID=your-app-id
PUSHER_KEY=your-key
PUSHER_SECRET=your-secret
PUSHER_CLUSTER=eu

# Upstash Redis
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Sentry
NEXT_PUBLIC_SENTRY_DSN=your-sentry-dsn
SENTRY_AUTH_TOKEN=your-sentry-auth-token
```

## 🗄️ Verilənlər Bazası

### Schema
- **users** - İstifadəçilər
- **products** - Məhsullar
- **categories** - Kateqoriyalar
- **orders** - Sifarişlər
- **baskets** - Səbətlər
- **finance_suppliers** - Təchizatçılar
- **finance_accounts** - Maliyyə hesabları
- **finance_purchases** - Satınalmalar
- **finance_payments** - Ödənişlər
- **finance_ledger** - Maliyyə əməliyyatları
- **whatsapp_messages** - WhatsApp mesajları

### Migration
```bash
# Yeni migration yaratmaq
npm run db:generate

# Migration-i tətbiq etmək
npm run db:push

# Drizzle Studio açmaq
npm run db:studio
```

## 📁 Layihə Strukturu

```
organik-gedebey/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (storefront)/       # Storefront pages
│   │   ├── admin/              # Admin panel
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   ├── admin/              # Admin components
│   │   ├── shared/             # Shared components
│   │   └── ui/                 # UI components
│   ├── lib/                    # Utilities
│   │   ├── auth/               # Authentication
│   │   ├── config/             # Configuration
│   │   ├── db/                 # Database
│   │   ├── storage/            # Storage (S3, Cloudinary)
│   │   └── whatsapp/           # WhatsApp
│   ├── types/                  # TypeScript types
│   └── middleware.ts           # Next.js middleware
├── drizzle/                    # Drizzle migrations
├── public/                     # Static files
└── tests/                      # Test files
```

## 🔌 API

### Authentication
- `POST /api/auth/signup` - Qeydiyyat
- `POST /api/auth/login` - Giriş
- `POST /api/auth/logout` - Çıxış
- `GET /api/auth/session` - Session

### Products
- `GET /api/products` - Məhsulları gətir
- `GET /api/products/[id]` - Tək məhsul
- `POST /api/products` - Məhsul yarat (Admin)
- `PUT /api/products/[id]` - Məhsul yenilə (Admin)
- `DELETE /api/products/[id]` - Məhsul sil (Admin)

### Orders
- `GET /api/orders` - Sifarişləri gətir
- `GET /api/orders/[id]` - Tək sifariş
- `POST /api/orders` - Sifariş yarat
- `PUT /api/orders/[id]` - Sifariş yenilə (Admin)

### Categories
- `GET /api/categories` - Kateqoriyaları gətir
- `POST /api/categories` - Kateqoriya yarat (Admin)

### Upload
- `POST /api/upload` - Fayl yüklə
- `DELETE /api/upload` - Fayl sil

### SSE
- `GET /api/sse` - Server-Sent Events

## 🚀 Deployment

### Vercel
```bash
# Vercel CLI ilə deploy
npm install -g vercel
vercel

# Production-a deploy
vercel --prod
```

### Environment Variables
Vercel dashboard-da environment variables təyin edin:
- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- Və s.

### GitHub Actions
`.github/workflows/deploy.yml` faylı avtomatik deployment üçün konfiqurasiya edilmişdir.

## 🧪 Testing

```bash
# Bütün testləri işə salın
npm test

# Watch mode
npm run test:watch

# Coverage
npm run test:coverage
```

## 📊 Monitoring

### Health Check
```bash
GET /api/health
```

### Metrics
```bash
GET /api/metrics
GET /api/performance
```

## 🤝 İştirak

İştirak etmək üçün:

1. Fork edin
2. Feature branch yaradın (`git checkout -b feature/amazing-feature`)
3. Dəyişiklikləri commit edin (`git commit -m 'Add amazing feature'`)
4. Branch-ə push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 Development Guidelines

- TypeScript istifadə edin
- Component-lər üçün proper types təyin edin
- Error handling üçün custom error class-lar istifadə edin
- Logging üçün logger utility istifadə edin
- Environment variables üçün `getEnv()` istifadə edin
- Rate limiting üçün `withRateLimit()` wrapper istifadə edin
- Performance üçün `trackPerformance()` istifadə edin

## 📄 Lisenziya

Bu layihə MIT lisenziyası altında lisenziyalanmışdır.

## 📞 Əlaqə

- **Email:** info@organikgedebey.az
- **WhatsApp:** +994 47 758 78 588
- **Website:** https://organikgedebey.az

---

🌿 **Organik Gədəbəy** - Təbii məhsullar, təbii həyat
