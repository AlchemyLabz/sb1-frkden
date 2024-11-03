import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const sendSuccessResponse = (data: any, status = 200) => {
  return NextResponse.json(data, { status });
};

type ApiHandler = (req: NextRequest) => Promise<NextResponse>;

export const withErrorHandling = (handler: ApiHandler) => {
  return async (req: NextRequest) => {
    try {
      return await handler(req);
    } catch (error) {
      console.error('API Error:', error);
      
      if (error instanceof ApiError) {
        return NextResponse.json(
          { error: error.message },
          { status: error.statusCode }
        );
      }

      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  };
};