import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { requireAdmin } from '@/lib/auth'
import { createPayPalPayout } from '@/lib/paypal'
import { User } from '@/lib/types'


async function calculateSalary(user: User) {
  if(user?.talent) {
    // Get talent's previous month income
    const monthsIncome = await prisma.income.findMany({
      where: {
        talentId: user.id,
        accountingMonth: {
          gte: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth() - 1, 1)),
          lte: new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 0)),
        },
      },
    })

    const totalIncome = monthsIncome.reduce((acc, income) => acc + income.actualValueUSD, 0);
    // If income is >= $1000 we get a 25% cut, if less we get a 45% cut
    if(totalIncome > 1000) {
      return Math.max(0, user.salary - totalIncome * 0.2);
    }

    return user.salary - totalIncome * 0.45;
  }

  return user?.salary || 0;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { talent: true },
    })

    if(!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if(!user.paypalEmail) {
      return NextResponse.json({ error: 'User does not have a PayPal email configured' }, { status: 400 })
    }

    const finalSalary = await calculateSalary(user as unknown as User);
    
    if(finalSalary <= 0) {
      return NextResponse.json({ error: 'Calculated salary is zero or negative; no payment to send' }, { status: 400 })
    }

    let payoutBatchId: string | null = null
    let payoutItemId: string | null = null

    try {
      const result = await createPayPalPayout(
        user.paypalEmail,
        finalSalary,
        'USD',
        `Salary payment - ${user.talent?.name || user.username}`
      )
      payoutBatchId = result.batchId
      payoutItemId = result.payoutItemId
    } catch (paypalError) {
      console.error('PayPal payout error:', paypalError)
      return NextResponse.json(
        {
          error:
            paypalError instanceof Error
              ? `PayPal payment failed: ${paypalError.message}`
              : 'PayPal payment failed',
        },
        { status: 502 }
      )
    }

    const payment = await prisma.payment.create({
      data: {
        type: 'SALARY',
        userId,
        amount: finalSalary,
        description: `Salary payment - ${user.talent?.name || user.username}`,
        date: new Date(),
        paypalEmail: user.paypalEmail,
        paypalTransactionId: payoutBatchId || payoutItemId || null,
      },
      include: {
        user: { select: { id: true, username: true, types: true } },
      },
    })

    return NextResponse.json(
      {
        payment,
        payoutBatchId,
        payoutItemId,
        paymentId: payment.id,
        success: true,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Create PayPal payment error:', error)
    if (error instanceof Error && error.message === 'Forbidden') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? `Failed to process PayPal payment: ${error.message}`
            : 'Failed to process PayPal payment',
      },
      { status: 500 }
    )
  }
}
