import { readCollection } from '../storage/jsonStorage.js';
import { AppError } from '../utils/AppError.js';

/** Demo users are for role switching only. There are no passwords in this prototype. */
export async function listUsers() {
  return readCollection('users');
}

export async function getUserForRole(role) {
  const users = await readCollection('users');
  const user = users.find((u) => u.role === role);
  if (!user) throw new AppError(404, `No demo user for role ${role}`);
  return user;
}
