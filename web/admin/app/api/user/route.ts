import { NextRequest } from "next/server";
import prisma from "@/db";
import { hash } from "bcrypt";
import * as z from "zod";

interface BodyType {
  Name: string;
  username: string;
  password: string;
}

const UserSchema = z.object({
  Name: z.string().min(1, "Required"),
  username: z
    .string()
    .min(1, {
      message: "Email is required",
    })
    .email("Invalid email"),
  password: z
    .string()
    .min(8, { message: "Password must contain at least 8 characters" }),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { Name, username, password }: BodyType = UserSchema.parse(body);

    const existingUser = await prisma.admin.findUnique({
      where: {
        username: username,
      },
    });

    if (existingUser) {
      return Response.json({ error: "User already exists" }, { status: 400 });
    }

    const hashedPassword = await hash(password, 10);

    const newUser = await prisma.admin.create({
      data: {
        Name,
        username,
        password: hashedPassword,
      },
    });

    return Response.json(
      {
        user: newUser,
        message: "Signed up successfully",
        status: 201,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error occurred while creating user:", error);
    return Response.json(
      { error: "An error occurred while creating user" },
      { status: 500 }
    );
  }
}
