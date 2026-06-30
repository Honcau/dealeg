import NextAuth          from 'next-auth';
import Google            from 'next-auth/providers/google';
import Facebook          from 'next-auth/providers/facebook';
import GitHub            from 'next-auth/providers/github';
import Credentials       from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt            from 'bcryptjs';
import { prisma }        from '@/lib/db';

export const { handlers, auth, signIn: serverSignIn } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    // ── Google ──────────────────────────────────────────────────────────────
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),

    // ── Facebook ─────────────────────────────────────────────────────────────
    Facebook({
      clientId:     process.env.FACEBOOK_APP_ID     ?? '',
      clientSecret: process.env.FACEBOOK_APP_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),

    // ── GitHub ───────────────────────────────────────────────────────────────
    GitHub({
      clientId:     process.env.GITHUB_CLIENT_ID     ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),

    // ── Email + Password ─────────────────────────────────────────────────────
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (!user?.password) return null; // user dùng OAuth, không có password

        const isValid = await bcrypt.compare(
          credentials.password as string,
          user.password,
        );

        return isValid ? user : null;
      },
    }),
  ],

  pages: {
    signIn:  '/auth/signin',
    signOut: '/auth/signout',
    error:   '/auth/error',
  },

  callbacks: {
    // Thêm user.id vào session để dùng trong app
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },

  session: { strategy: 'database' },
});

export const { GET, POST } = handlers;
