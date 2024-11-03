import NextAuth, { type User, type Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { googleProvider, magicLinkProvider } from '@/lib/auth/authProviders';
import { credentialsProvider } from '@/lib/auth/authCredentials';
import { FirestoreAdapter } from '@auth/firebase-adapter';
import { adminDb } from '@/lib/firebase-admin';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: FirestoreAdapter(adminDb),
  providers: [googleProvider, credentialsProvider, magicLinkProvider],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/',
  },
  callbacks: {
    authorized({ request: { nextUrl }, auth }) {
      const isLoggedIn = !!auth?.user;
      const isApiRoute = nextUrl.pathname.startsWith('/api/');
      const isPublicRoute = ['/', '/login', '/register', '/tos', '/privacy'].some(
        (route) => nextUrl.pathname === route || nextUrl.pathname.startsWith(`${route}/`)
      );
      
      if (!isLoggedIn && !isPublicRoute && !isApiRoute) {
        return Response.redirect(new URL('/', nextUrl));
      }
      if (isApiRoute) return true;
      if (isPublicRoute) return true;
      return isLoggedIn;
    },
    jwt({ token, user, trigger, session }) {
      const addUserInfoToToken = (token: JWT, user?: User) => {
        if (user?.id) {
          token.id = user.id;
        }
        return token;
      };

      const updateTokenWithSession = (token: JWT, session?: Session) => {
        if (session) {
          return { ...token, ...session };
        }
        return token;
      };

      token = addUserInfoToToken(token, user);
      if (trigger === 'update') {
        token = updateTokenWithSession(token, session);
      }
      return token;
    },
    session({ session, token }) {
      try {
        if (session.user) {
          session.user.id = token.id as string;
        }
        return session;
      } catch (error: unknown) {
        console.error('Authentication error:', error);
        if (error instanceof Error) {
          throw new Error('Authentication failed. Please try again.', { cause: error });
        } else {
          throw new Error('Authentication failed. Please try again.');
        }
      }
    },
  },
});