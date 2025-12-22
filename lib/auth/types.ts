/**
 * 認証・ユーザー関連の型定義
 *
 * このファイルはフロントエンド・バックエンド共通で使用することを想定
 */

/**
 * ユーザーの役割（権限レベル）
 *
 * @description
 * - super_admin: 高知市・高専の管理者。全ての操作が可能
 * - vendor: 出店者。自店舗の情報編集が可能
 * - general_user: 一般利用者。閲覧のみ（将来用）
 */
export type UserRole = 'super_admin' | 'vendor' | 'general_user';

/**
 * ユーザー情報
 *
 * 【現在の実装】
 * - ダミーユーザーとして使用
 * - id, name, email, role のみ
 *
 * 【将来の実装：Firebase Auth移行後】
 * - Firebase User をベースに、カスタムクレームで role を管理
 * - Firestore に追加のプロフィール情報を保存
 *
 * @example
 * ```typescript
 * // Firebase移行後のイメージ
 * type User = {
 *   id: string;              // Firebase UID
 *   email: string;           // Firebase User.email
 *   name: string;            // Firestore: users/{uid}/profile/name
 *   role: UserRole;          // Custom Claims または Firestore
 *   vendorId?: number;       // 出店者の場合、紐づく店舗ID
 *   createdAt: Date;         // アカウント作成日
 *   lastLoginAt: Date;       // 最終ログイン日時
 * };
 * ```
 */
export interface User {
  /** ユーザーID（Firebase UID を想定） */
  id: string;

  /** ユーザー名 */
  name: string;

  /** メールアドレス */
  email: string;

  /** 役割（権限レベル） */
  role: UserRole;

  /**
   * 出店者の場合、紐づく店舗ID
   * vendor role の場合のみ設定
   */
  vendorId?: number;
}

/**
 * 権限チェック用のヘルパー型
 */
export interface PermissionCheck {
  /** スーパー管理者かどうか */
  isSuperAdmin: boolean;

  /** 出店者かどうか */
  isVendor: boolean;

  /** 一般ユーザーかどうか */
  isGeneralUser: boolean;

  /** 特定の店舗の編集権限があるかチェック */
  canEditShop: (shopId: number) => boolean;

  /** 全店舗の管理権限があるかチェック */
  canManageAllShops: boolean;
}
