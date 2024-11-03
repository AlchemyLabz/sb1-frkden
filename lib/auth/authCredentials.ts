import { collection, query, where, getDocs } from '@firebase/firestore';
import { comparePassword } from '../util/authHelper';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';
import { db } from '@/lib/firebase';

export const SignInFormSchema = z.object({
  email: z
    .string()
    .min(1, {
      message: 'Please input email address.',
    })
    .email({
      message: 'Please input valid email address.',
    }),
  password: z.string().min(1, {
    message: 'Please input password',
  }),
});

export const MagicLinkFormSchema = z.object({
  email: z
    .string()
    .min(1, {
      message: 'Please input email address.',
    })
    .email({
      message: 'Please input valid email address.',
    }),
});

export const RegisterFormSchema = z.object({
  firstName: z.string().min(1, {
    message: 'Please input first name.',
  }),
  lastName: z.string().min(1, {
    message: 'Please input last name.',
  }),
  email: z
    .string()
    .min(1, {
      message: 'Please input email address.',
    })
    .email({
      message: 'Please input valid email address.',
    }),
  password: z.string().min(1, {
    message: 'Please input password',
  }),
});

export const credentialsProvider = CredentialsProvider({
  credentials: {
    email: { label: 'Email' },
    password: { label: 'Password', type: 'password' },
  },
  async authorize(credentials) {
    const parsedCredentials = SignInFormSchema.safeParse(credentials);
    if (!parsedCredentials.success) {
      throw new Error('Invalid Credentials' + parsedCredentials.error.errors.join(', '));
    }
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', credentials.email));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const dbUser = querySnapshot.docs[0].data();
      if (dbUser && dbUser.password) {
        const isPasswordMatch = await comparePassword(
          credentials.password! as string,
          dbUser.password
        );
        if (isPasswordMatch) {
          return dbUser;
        }
      }
    }
    return null;
  },
});