import { hash, compare } from 'bcryptjs';

export const hashPassword = async (password: string): Promise<string> => {
  return hash(password, 12);
};

export const comparePassword = async (
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> => {
  return compare(plainPassword, hashedPassword);
};