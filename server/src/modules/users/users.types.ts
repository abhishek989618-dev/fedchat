export interface UpdateProfileInput {
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  avatar?: string | null;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}