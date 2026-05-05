// src/types/index.ts
import { DefaultSession, DefaultUser } from "next-auth";
import { DefaultJWT } from "next-auth/jwt";
import { Role, tbl_desil, tbl_foto, tbl_penerima, tbl_sanggahan } from "@prisma/client"; // Import Prisma Role enum

export interface DecryptedFoto extends Omit<tbl_foto, "url_foto"> {
  url_foto: string;
}

export interface DecryptedPenerima extends Omit<tbl_penerima, "nik"> {
  nik: string;
}

export interface DecryptedPenerimaWithRelations extends DecryptedPenerima {
  fotos: DecryptedFoto[];
  desil_data: tbl_desil[];
  sanggahan: tbl_sanggahan[];
}

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }

  interface User extends DefaultUser {
    id: string;
    role: Role;
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: Role;
  }
}
