// src/app/api/fresh-today/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { and, eq, gte, or } from "drizzle-orm";

export async function GET() {
  try {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const list = await db.query.products.findMany({
      where: and(
        eq(products.archived, false),
        or(
          eq(products.isNewArrival, true),
          gte(products.createdAt, twoDaysAgo)
        )
      ),
      with: {
        category: true,
        images: true,
        variants: true,
        reviews: true,
      },
      orderBy: (products, { desc }) => [desc(products.createdAt)],
    });

    return NextResponse.json({ products: list, total: list.length });
  } catch (error) {
    console.error("Fresh today error:", error);
    return NextResponse.json({ error: "Server xətası" }, { status: 500 });
  }
}