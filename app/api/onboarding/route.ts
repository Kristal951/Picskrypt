import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { SELF_SELECT, toSelfDto } from "@/lib/user-dto";
import { normalizeStep, validateName } from "@/lib/onboarding";
import { validateUsername } from "@/lib/username";

export async function PATCH(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const step: unknown = body?.step;
  if (step !== 1 && step !== 2 && step !== 3) {
    return NextResponse.json({ error: "Invalid step." }, { status: 400 });
  }

  const current = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { onboarded: true, onboardingStep: true },
  });
  if (!current) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (current.onboarded === true) {
    return NextResponse.json(
      { error: "User has already onboarded." },
      { status: 400 },
    );
  }

  const currentStep = normalizeStep(current.onboardingStep);
  if (step > currentStep) {
    return NextResponse.json(
      { error: "Please finish the previous step first." },
      { status: 400 },
    );
  }

  const data: Prisma.UserUpdateInput = {};

  if (step === 1) {
    const { name, error } = validateName(
      typeof body.name === "string" ? body.name : "",
    );
    if (error) return NextResponse.json({ error }, { status: 400 });
    data.name = name;
  } else if (step === 2) {
    const { username, error } = validateUsername(
      typeof body.username === "string" ? body.username : "",
    );
    if (error) return NextResponse.json({ error }, { status: 400 });
    data.username = username;
  } else {
    data.onboarded = true;
    data.onboardingStep = 3;
  }

  if (step < 3 && step === currentStep) {
    data.onboardingStep = step + 1;
  }

  try {
    const user = await prisma.user.update({
      where: { id: session.userId },
      data,
      select: SELF_SELECT,
    });
    return NextResponse.json({ user: toSelfDto(user) });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "That username is taken." },
        { status: 409 },
      );
    }
    console.error("PATCH /api/onboarding failed:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
