// src/app/api/fresh-today/route.ts
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/lib/db/schema";
import { and, eq, gte, or, desc } from "drizzle-orm";

export async function GET() {
  try {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    // ✅ DÜZƏLİŞ: gte üçün Date obyekti göndərilir
    const list = await db
      .select()
      .from(products)
      .where(
        and(
          eq(products.archived, false),
          or(
            eq(products.isNewArrival, true),
            gte(products.createdAt, twoDaysAgo) // ← Date obyekti
          )
        )
      )
      .orderBy(desc(products.createdAt));

    return NextResponse.json({ 
      products: list, 
      total: list.length 
    });
  } catch (error) {
    console.error("Fresh today error:", error);
    return NextResponse.json(
      { error: "Server xətası" },
      { status: 500 }
    );
  }
}