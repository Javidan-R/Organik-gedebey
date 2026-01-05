// app/api/products/route.ts  (GET list, POST create)
import { NextResponse } from 'next/server'
export async function GET(){ /* DB-dən getir */ return NextResponse.json({items:[]}) }
export async function POST(req:Request){  /* create */ return NextResponse.json({ok:true,id:'...'}); }
