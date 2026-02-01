import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Expense } from '@prisma/client'

export async function GET() {
  try {
    const expenses = await prisma.expense.findMany()
    const total = expenses.reduce((sum: number, expense: Expense) => sum + expense.amount, 0)
    
    return NextResponse.json({
      total,
      count: expenses.length,
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
  }
}
