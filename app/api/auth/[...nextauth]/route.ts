
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // Mock Auth for Demo - In production compare hash
        if (!credentials?.email) return null;
        
        // Upsert user for demo convenience so sign up works automatically
        const user = await prisma.user.upsert({
          where: { email: credentials.email },
          update: {},
          create: {
            email: credentials.email,
            passwordHash: 'hashed_mock', 
            name: 'Demo User'
          }
        });
        
        return { id: user.id, email: user.email, name: user.name };
      }
    })
  ],
  pages: {
    signIn: '/auth/login',
  },
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user) {
        // Fetch workspace logic here if needed
      }
      return session;
    }
  }
});

export { handler as GET, handler as POST };
