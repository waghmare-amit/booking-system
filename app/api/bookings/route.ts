/**
 * GET  /api/bookings   → List bookings (users see their own; admins see all)
 * POST /api/bookings   → Create a booking (users only)
 *
 * DOUBLE-BOOKING PREVENTION:
 * The Prisma schema has @unique on Booking.slotId — meaning the database
 * will REJECT a second booking for the same slot with a unique constraint error.
 * We also check manually first to give a friendly error message.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendBookingConfirmation } from '@/lib/email';

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const bookings = await prisma.booking.findMany({
    where: session.role === 'ADMIN' ? {} : { userId: session.userId },
    include: {
      slot: true,
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ bookings });
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role === 'ADMIN') {
    return NextResponse.json({ error: 'Admins cannot make bookings' }, { status: 403 });
  }

  const { slotId, notes } = await request.json();
  if (!slotId) return NextResponse.json({ error: 'slotId is required' }, { status: 400 });

  // Check slot exists
  const slot = await prisma.slot.findUnique({
    where: { id: slotId },
    include: { booking: true },
  });

  if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 });

  // Check if already booked (friendly check before DB constraint)
  if (slot.booking && slot.booking.status === 'CONFIRMED') {
    return NextResponse.json(
      { error: 'This slot is already booked' },
      { status: 409 }
    );
  }

  // Check user doesn't already have a booking for this same date/time
  const conflicting = await prisma.booking.findFirst({
    where: {
      userId: session.userId,
      status: 'CONFIRMED',
      slot: { date: slot.date, startTime: slot.startTime },
    },
  });
  if (conflicting) {
    return NextResponse.json(
      { error: 'You already have a booking at this time' },
      { status: 409 }
    );
  }

  try {
    // upsert: if a CANCELLED booking already exists for this slot (from a prior
    // cancellation), update it to CONFIRMED rather than creating a new record.
    // This keeps the @unique(slotId) constraint happy while allowing re-booking.
    const booking = await prisma.booking.upsert({
      where: { slotId },
      update: {
        userId: session.userId,
        notes: notes || null,
        status: 'CONFIRMED',
      },
      create: {
        userId: session.userId,
        slotId,
        notes: notes || null,
        status: 'CONFIRMED',
      },
      include: {
        slot: true,
        user: { select: { name: true, email: true } },
      },
    });

    // Send confirmation email (non-blocking — won't crash if email fails)
    sendBookingConfirmation({
      userEmail: booking.user.email,
      userName: booking.user.name,
      slotTitle: booking.slot.title,
      slotDate: booking.slot.date,
      slotStart: booking.slot.startTime,
      slotEnd: booking.slot.endTime,
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (error: unknown) {
    // Handle the database unique constraint violation (P2002)
    if (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      return NextResponse.json(
        { error: 'This slot was just booked by someone else' },
        { status: 409 }
      );
    }
    throw error;
  }
}
