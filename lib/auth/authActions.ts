'use server';

import { signIn, signOut } from '@/auth';
import { revalidatePath } from 'next/cache';
import { collection, query, where, getDocs } from '@firebase/firestore';
import { User } from 'next-auth';
import { adminDb } from '@/lib/firebase-admin';

export const loginWithProvider = async (provider: string): Promise<void> => {
  await signIn(provider.toLowerCase(), { redirectTo: '/' });
  revalidatePath('/');
};

export const loginWithCredentials = async ({
  email,
  password,
}: {
  email: string;
  password: string;
}) => {
  await signIn('credentials', { email, password, redirectTo: '/' });
  revalidatePath('/');
};

export const sendMagicLink = async (email: string) => {
  await signIn('http-email', { email, redirectTo: '/' });
  revalidatePath('/');
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
  const usersRef = collection(adminDb as any, 'users');
  const q = query(usersRef, where('email', '==', email));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return null;
  }

  const userDoc = querySnapshot.docs[0];
  return userDoc.data() as User;
};

export const logout = async () => {
  await signOut({ redirectTo: '/' });
  revalidatePath('/');
};