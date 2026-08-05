export { redirectIfAuthenticated, requireUser } from './guards';
export { hashPassword, verifyPassword } from './password';
export { authenticateUser, registerUser } from './service';
export {
  createSession,
  destroySession,
  getCurrentSession,
  getCurrentUser,
  SESSION_COOKIE_NAME,
  type ActiveSession,
  type AuthenticatedUser,
} from './session';
export {
  displayNameSchema,
  emailSchema,
  passwordSchema,
  signInSchema,
  signUpSchema,
  type SignInInput,
  type SignUpInput,
} from './validation';
