import { NextResponse } from "next/server";
import { trainingModules } from "@/lib/catalog";

export async function GET() {
  return NextResponse.json({ modules: trainingModules });
}
