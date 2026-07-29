declare global {
  namespace Express {
    interface User {
      id: string;
      email: string;
      role: 'admin';
    }

    interface Request {
      user?: User;
    }
  }
}
export {};
