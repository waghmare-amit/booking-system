/**
 * DELETE /api/bookings/:id — Cancel a booking
 * Users can cancel their own; admins can cancel any.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { sendBookingCancellation } from '@/lib/email';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const bookingId = parseInt(id);

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      slot: true,
      user: { select: { name: true, email: true } },
    },
  });

  if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

  // Users can only cancel their own bookings
  if (session.role !== 'ADMIN' && booking.userId !== session.userId) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED' },
  });

  // Send cancellation email
  sendBookingCancellation({
    userEmail: booking.user.email,
    userName: booking.user.name,
    slotTitle: booking.slot.title,
    slotDate: booking.slot.date,
    slotStart: booking.slot.startTime,
    slotEnd: booking.slot.endTime,
  });

  return NextResponse.json({ message: 'Booking cancelled' });
}
