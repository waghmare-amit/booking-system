/**
 * DELETE /api/slots/:id — Admin deletes a slot (and its booking if any)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (session.role !== 'ADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { id } = await params;
  const slotId = parseInt(id);

  const slot = await prisma.slot.findUnique({ where: { id: slotId } });
  if (!slot) return NextResponse.json({ error: 'Slot not found' }, { status: 404 });

  await prisma.slot.delete({ where: { id: slotId } });

  return NextResponse.json({ message: 'Slot deleted' });
}
