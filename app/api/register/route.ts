import { NextRequest } from 'next/server';
import { RegisterFormSchema } from '@/lib/auth/authCredentials';
import {
  withErrorHandling,
  sendSuccessResponse,
  ApiError,
} from '@/lib/util/apiHelper';
import { adminDb } from '@/lib/firebase-admin';
import { hashPassword } from '@/lib/util/authHelper';

export const POST = withErrorHandling(async (req: NextRequest) => {
  console.log('Starting registration process...');

  const body = await req.json();
  console.log('Received body:', { ...body, password: '[REDACTED]' });

  const { firstName, lastName, email, password } = body;

  const parsedCredentials = RegisterFormSchema.safeParse(body);
  if (!parsedCredentials.success) {
    console.error('Schema validation failed:', parsedCredentials.error);
    throw new ApiError('Invalid schema', 400);
  }

  try {
    // Check if user already exists
    const existingUser = await adminDb
      .collection('users')
      .where('email', '==', email.toLowerCase())
      .get();

    if (!existingUser.empty) {
      throw new ApiError('User already exists', 400);
    }

    const hashedPassword = await hashPassword(password);

    // Create user document with all information in a single document
    const userRecord = await adminDb.collection('users').add({
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName: `${firstName} ${lastName}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    console.log('User created successfully:', userRecord.id);

    return sendSuccessResponse(
      { message: 'User created successfully', userId: userRecord.id },
      201
    );
  } catch (error: unknown) {
    console.error('Detailed error:', error);
    if (error instanceof Error) {
      console.error('Error properties:', Object.keys(error));
      console.error('Error stack:', error.stack);
    }

    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError('Failed to create user', 500);
  }
});