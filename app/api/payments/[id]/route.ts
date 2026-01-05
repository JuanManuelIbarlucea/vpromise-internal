import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()
    const { id } = await params

    const payment = await prisma.payment.findUnique({
      where: { id },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
    }

    await prisma.$transaction(async (tx) => {
      if (payment.expenseId) {
        await tx.expense.update({
          where: { id: payment.expenseId },
          data: { status: 'PENDING' },
        })
      }
      await tx.payment.delete({ where: { id } })
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete payment error:', error)
    return NextResponse.json({ error: 'Failed to delete payment' }, { status: 500 })
  }
}

