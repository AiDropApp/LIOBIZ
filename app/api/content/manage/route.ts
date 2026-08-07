import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Legacy portfolio/backstage API — removed. Use Media Center + /api/content/cms instead. */
export async function POST() {
  return NextResponse.json(
    {
      message:
        "این API منسوخ شده است. نمونه‌کار و بک‌استیج را از تب «رسانه» و متن لندینگ را از «محتوا و ظاهر» مدیریت کنید.",
    },
    { status: 410 },
  );
}

export async function PUT() {
  return POST();
}

export async function DELETE() {
  return POST();
}
