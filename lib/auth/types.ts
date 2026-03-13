/**
 * 認証・ユーザー関連の型定義
 */

export type UserRole = "super_admin" | "moderator" | "vendor" | "general_user";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  vendorId?: number;
  /** 認証プロバイダー。"email" = メール/パスワード、"google" = Googleログイン */
  provider: "email" | "google" | string;
}

export interface PermissionCheck {
  isSuperAdmin: boolean;
  isModerator: boolean;
  isVendor: boolean;
  isGeneralUser: boolean;
  canEditShop: (shopId: number) => boolean;
  canManageAllShops: boolean;
  canModerateContent: boolean;
}
