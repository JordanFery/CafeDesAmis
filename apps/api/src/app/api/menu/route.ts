import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createMenuItemSchema } from "@/lib/validation";

export async function GET(request: NextRequest) {
  const category = request.nextUrl.searchParams.get("category");

  const items = await prisma.menuItem.findMany({
    where: category ? { category: category as any } : undefined,
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const parsed = createMenuItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const item = await prisma.menuItem.create({ data: parsed.data });
  return NextResponse.json(item, { status: 201 });
}
