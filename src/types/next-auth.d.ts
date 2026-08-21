import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "ADMIN" | "WORKER";
    } & DefaultSession["user"];
  }

  interface User {
    role: "ADMIN" | "WORKER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ADMIN" | "WORKER";
  }
}
