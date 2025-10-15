import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { supabase } from "@/lib/supabaseClient";
import bcrypt from "bcryptjs";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Vui lòng nhập email và mật khẩu");
        }

        const { data, error } = await supabase
          .from("users")
          .select("id, email, name, password, role")
          .eq("email", credentials.email)
          .single();

        if (error || !data) throw new Error("Tài khoản không tồn tại");

        const isValid = await bcrypt.compare(
          credentials.password,
          data.password
        );

        if (!isValid) throw new Error("Mật khẩu không đúng");

        return {
          id: data.id.toString(),
          email: data.email,
          name: data.name,
          role: data.role,
        };
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.email = token.email;
        session.user.role = token.role;
        session.user.name = token.name;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
