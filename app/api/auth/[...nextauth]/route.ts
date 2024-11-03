import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { adminDb } from "@/lib/firebase-admin";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const userSnapshot = await adminDb
          .collection("users")
          .where("email", "==", credentials.email.toLowerCase())
          .get();

        if (userSnapshot.empty) {
          throw new Error("No user found");
        }

        const user = userSnapshot.docs[0].data();
        const isValid = await compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: userSnapshot.docs[0].id,
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
        };
      }
    })
  ],
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
})

export { handler as GET, handler as POST }