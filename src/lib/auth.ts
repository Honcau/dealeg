/**
 * NEXTAUTH CONFIG — nguồn chân lý duy nhất cho auth
 * Route file chỉ re-export handlers từ đây.
 * (NextAuth v5 pattern: config ở lib, không ở route)
 */
import NextAuth          from 'next-auth';
import Google            from 'next-auth/providers/google';
import Facebook          from 'next-auth/providers/facebook';
import GitHub            from 'next-auth/providers/github';
import Credentials       from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import bcrypt            from 'bcryptjs';
import { prisma }        from '@/lib/db';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),

  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID     ?? '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    Facebook({
      clientId:     process.env.FACEBOOK_APP_ID     ?? '',
      clientSecret: process.env.FACEBOOK_APP_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
    GitHub({
      clientId:     process.env.GITHUB_CLIENT_ID     ?? '',
      clientSecret: process.env.GITHUB_CLIENT_SECRET ?? '',
      allowDangerousEmailAccountLinking: true,
    }),
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
        if (!user?.password) return null;
        const isValid = await bcrypt.compare(credentials.password as string, user.password);
        return isValid ? user : null;
      },
    }),
  ],

  pages: {
    signIn:  '/auth/signin',
    signOut: '/auth/signout',
  },

  callbacks: {
    async session({ session, user }) {
      if (session.user && user) {
        session.user.id = user.id;
      }
      return session;
    },
  },

  session: { strategy: 'database' },
});

/** Helper lấy session trong Server Components / API routes */
export async function getSession() {
  return await auth();
}
