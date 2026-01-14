/**
 * 認証・ユーザー関連の型定義
 */

export type UserRole = "super_admin" | "moderator" | "vendor" | "general_user";

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  role: UserRole;
  vendorId?: number;
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
