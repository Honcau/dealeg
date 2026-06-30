import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { Category } from '@prisma/client';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const category = searchParams.get('category')?.toUpperCase() as Category | undefined;
  const page     = Math.max(1,  parseInt(searchParams.get('page')  ?? '1'));
  const limit    = Math.min(50, parseInt(searchParams.get('limit') ?? '12'));
  const skip     = (page - 1) * limit;

  const where = {
    isActive: true,
    ...(category && Object.values(Category).includes(category) ? { category } : {}),
  };

  try {
    const [vouchers, total] = await Promise.all([
      prisma.voucher.findMany({
        where,
        orderBy: [{ useCount: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.voucher.count({ where }),
    ]);

    return NextResponse.json({
      data: vouchers,
      total,
      page,
      limit,
      hasMore: skip + vouchers.length < total,
    });
  } catch (error) {
    console.error('[GET /api/vouchers]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
