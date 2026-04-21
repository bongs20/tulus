// src/lib/auth.ts
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          return null
        }

        const user = await prisma.tbl_pengguna.findUnique({
          where: { username: credentials.username }
        })

        if (!user) {
          // User not found
          return null
        }

        // Check for locked account
        if (user.status_akun === 'TERKUNCI' && user.locked_until && user.locked_until > new Date()) {
          // Account is locked, do not allow login
          throw new Error("Akun Anda terkunci. Silakan coba lagi nanti.")
        }

        const isPasswordValid = await compare(credentials.password, user.password_hash)

        if (!isPasswordValid) {
          // Password is not valid
          // Increment login attempts and potentially lock account
          const updatedUser = await prisma.tbl_pengguna.update({
            where: { id: user.id },
            data: {
              login_attempts: {
                increment: 1,
              },
            },
          });

          // Lock account after 5 failed attempts for 15 minutes
          if (updatedUser.login_attempts >= 5) {
            await prisma.tbl_pengguna.update({
              where: { id: user.id },
              data: {
                status_akun: 'TERKUNCI',
                locked_until: new Date(Date.now() + 15 * 60 * 1000), // Lock for 15 minutes
                login_attempts: 0, // Reset attempts after locking
              },
            });
            throw new Error("Terlalu banyak percobaan login gagal. Akun Anda terkunci selama 15 menit.")
          }

          throw new Error("Username atau password salah.")
        }

        // If password is valid, reset login attempts and unlock if it was locked (but not by time limit)
        if (user.login_attempts > 0 || user.status_akun === 'TERKUNCI') {
          await prisma.tbl_pengguna.update({
            where: { id: user.id },
            data: {
              login_attempts: 0,
              status_akun: 'AKTIF', // Unlock account if successfully logged in
              locked_until: null,
            },
          });
        }

        // Return user object if authentication is successful
        return {
          id: user.id,
          name: user.nama_lengkap,
          username: user.username,
          role: user.role,
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = user.role
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id
        session.user.role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 60, // 30 minutes for session inactivity
  },
  secret: process.env.NEXTAUTH_SECRET,
}
