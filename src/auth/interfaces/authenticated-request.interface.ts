export interface AuthenticatedRequest {
  user: {
    userId: string;
    email: string;
  };
}
