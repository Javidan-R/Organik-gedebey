// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { AuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { logger } from '@sentry/nextjs';

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Şifrə', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const normalizedEmail = credentials.email.toLowerCase().trim();

        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1);

          if (!user || !user.passwordHash) {
            // Timing attack qarşısını almaq üçün fake hash yoxlaması
            await bcrypt.compare(
              credentials.password,
              '$2a$12$invalidhashtopreventtimingattack00000000000'
            );
            return null;
          }

          const isValid = await bcrypt.compare(credentials.password, user.passwordHash);
          if (!isValid) return null;

          // Yalnız admin roluna icazə
          if (!['ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF'].includes(user.role)) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
          };
        } catch (error) {
          // 'error' dəyişəni unknown tipdədir, birbaşa logger-ə ötürmək olmur.
          // Ona görə string-ə çeviririk.
          logger.error(
            '[nextauth] authorize error:',
            error instanceof Error ? { message: error.message } : { message: String(error) }
          );
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 saat
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/admin/login',
    error: '/admin/login',
  },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, metadata) {
      // NextAuth logger-i `metadata` parametrini `Error` və ya `Record<string, unknown>` kimi qəbul edir.
      // Burada `metadata`-ni təhlükəsiz formata salırıq.
      const safeMeta =
        metadata instanceof Error
          ? { message: metadata.message, stack: metadata.stack }
          : metadata !== undefined
          ? { ...metadata }
          : {};
      logger.error(`[nextauth] ${code}`, safeMeta);
    },
    warn(code) {
      logger.warn(`[nextauth] ${code}`);
    },
    debug(code, metadata) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[nextauth] ${code}`, metadata);
      }
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };