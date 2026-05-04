/**
 * GET  /api/slots          → List all slots (with booking status)
 * POST /api/slots          → Create a new slot (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// GET — anyone logged in can see all slots
export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const slots = await prisma.slot.findMany({
    include: {
      booking: {
        include: {
          user: { select: { id: true, name: true, email: true } },
        },
      },
      admin: { select: { name: true } },
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  return NextResponse.json({ slots });
}

// POST — only admins can create slots
export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (session.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden — admins only' }, { status: 403 });
  }

  const { date, startTime, endTime, title } = await request.json();

  if (!date || !startTime || !endTime) {
    return NextResponse.json(
      { error: 'date, startTime, and endTime are required' },
      { status: 400 }
    );
  }

  // Check for overlapping slots on the same date
  const overlap = await prisma.slot.findFirst({
    where: {
      date,
      OR: [
        { startTime: { gte: startTime, lt: endTime } },
        { endTime: { gt: startTime, lte: endTime } },
        { AND: [{ startTime: { lte: startTime } }, { endTime: { gte: endTime } }] },
      ],
    },
  });

  if (overlap) {
    return NextResponse.json(
      { error: 'This time slot overlaps with an existing slot' },
      { status: 409 }
    );
  }

  const slot = await prisma.slot.create({
    data: {
      date,
      startTime,
      endTime,
      title: title || 'Appointment',
      adminId: session.userId,
    },
  });

  return NextResponse.json({ slot }, { status: 201 });
}
