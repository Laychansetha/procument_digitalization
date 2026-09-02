import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Username/Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
        selectedRole: { label: 'Selected Role', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Username and password are required.');
        }

        const usernameOrEmail = credentials.email.toLowerCase().trim();
        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: usernameOrEmail },
              { name: usernameOrEmail },
            ],
          },
        });

        if (!user) {
          throw new Error('Invalid username or password.');
        }

        if (user.status !== 'ACTIVE') {
          throw new Error('Account has been deactivated. Please contact System Admin.');
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error('Invalid username or password.');
        }

        // Update lastLogin timestamp in database
        try {
          await db.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
          });
        } catch (e) {
          console.error('Failed to update lastLogin:', e);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          assignedProvinces: user.assignedProvinces || (user.role === 'FIELD' ? 'Preah Vihear' : 'na'),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
        token.assignedProvinces = (user as unknown as { assignedProvinces?: string }).assignedProvinces;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as unknown as { id: string; role: string; assignedProvinces?: string }).id = token.id as string;
        (session.user as unknown as { id: string; role: string; assignedProvinces?: string }).role = token.role as string;
        (session.user as unknown as { id: string; role: string; assignedProvinces?: string }).assignedProvinces = token.assignedProvinces as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET || 'ibis-rice-secret-key-2026-production-super-secure',
};
