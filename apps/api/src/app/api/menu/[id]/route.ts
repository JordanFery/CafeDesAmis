import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateMenuItemSchema } from "@/lib/validation";

type Params = { params: { id: string } };

export async function GET(_request: NextRequest, { params }: Params) {
  const item = await prisma.menuItem.findUnique({ where: { id: params.id } });

  if (!item) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const body = await request.json();
  const parsed = updateMenuItemSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const item = await prisma.menuItem.update({
      where: { id: params.id },
      data: parsed.data,
    });
    return NextResponse.json(item);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    await prisma.menuItem.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
