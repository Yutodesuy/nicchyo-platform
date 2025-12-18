/**
 * 店舗データアクセス層
 *
 * 【目的】
 * - データの取得・更新を抽象化
 * - 将来のAPI化・DB化に対応
 * - UI側がデータソースに依存しない
 *
 * 【現在の実装】
 * - 静的データ（shops.ts）から取得
 *
 * 【将来の実装】
 * - API経由でデータ取得: GET /api/shops/:id
 * - データ更新: PATCH /api/shops/:id
 * - 承認フロー: POST /api/shops/:id/submit-edit
 *
 * 【移行方法】
 * この層を変更するだけで、UI側のコード変更は不要
 */

import { shops as staticShops } from '../data/shops';
import type {
  Shop,
  ShopEditableData,
  ShopDisplaySettings,
  ShopEditPending,
} from '../types/shopData';

/**
 * 全店舗データを取得
 *
 * 【現在】静的データを返す
 * 【将来】GET /api/shops から取得
 *
 * @returns 全店舗データ
 */
export async function getAllShops(): Promise<Shop[]> {
  // 現在: 静的データを返す
  return staticShops;

  // 将来: API呼び出し
  // const response = await fetch('/api/shops');
  // if (!response.ok) throw new Error('Failed to fetch shops');
  // return response.json();
}

/**
 * 特定の店舗データを取得
 *
 * 【現在】静的データから検索
 * 【将来】GET /api/shops/:id から取得
 *
 * @param shopId 店舗ID
 * @returns 店舗データ（見つからない場合はnull）
 */
export async function getShopById(shopId: number): Promise<Shop | null> {
  // 現在: 静的データから検索
  const shop = staticShops.find((s) => s.id === shopId);
  return shop ?? null;

  // 将来: API呼び出し
  // const response = await fetch(`/api/shops/${shopId}`);
  // if (!response.ok) return null;
  // return response.json();
}

/**
 * 店舗の編集可能データを取得
 *
 * 出店者が編集フォームで使用
 *
 * @param shopId 店舗ID
 * @returns 編集可能なデータのみ
 */
export async function getShopEditableData(
  shopId: number
): Promise<ShopEditableData | null> {
  const shop = await getShopById(shopId);
  if (!shop) return null;

  // 編集可能なフィールドのみ抽出
  return {
    name: shop.name,
    ownerName: shop.ownerName,
    category: shop.category,
    icon: shop.icon,
    products: shop.products,
    description: shop.description,
    schedule: shop.schedule,
    message: shop.message,
    images: shop.images,
    socialLinks: shop.socialLinks,
    lastUpdated: shop.lastUpdated,
    updatedBy: shop.updatedBy,
  };
}

/**
 * 店舗データを更新（将来の実装用）
 *
 * 【承認フロー】
 * 1. 出店者が編集内容を送信
 * 2. ShopEditPending として保存
 * 3. 運営が承認
 * 4. 承認されたら本データに反映
 *
 * @param shopId 店舗ID
 * @param editableData 更新する編集可能データ
 * @param userId 更新者のID
 * @returns 成功/失敗
 */
export async function updateShopEditableData(
  shopId: number,
  editableData: Partial<ShopEditableData>,
  userId: string
): Promise<{ success: boolean; message: string; pendingId?: string }> {
  // 現在: 未実装（静的データのため）
  console.warn('updateShopEditableData is not implemented yet');
  return {
    success: false,
    message: '現在、編集機能は実装されていません',
  };

  // 将来: API呼び出し
  // try {
  //   const response = await fetch(`/api/shops/${shopId}/submit-edit`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ editableData, userId }),
  //   });
  //
  //   if (!response.ok) {
  //     const error = await response.json();
  //     return { success: false, message: error.message };
  //   }
  //
  //   const result = await response.json();
  //   return {
  //     success: true,
  //     message: '変更を送信しました。運営の承認をお待ちください。',
  //     pendingId: result.pendingId,
  //   };
  // } catch (error) {
  //   return {
  //     success: false,
  //     message: 'エラーが発生しました',
  //   };
  // }
}

/**
 * 店舗の表示ON/OFFを切り替え（将来の実装用）
 *
 * visible フィールドのみ即時反映可能
 * （運営承認不要）
 *
 * @param shopId 店舗ID
 * @param visible 表示するか
 * @param userId 更新者のID
 * @returns 成功/失敗
 */
export async function toggleShopVisibility(
  shopId: number,
  visible: boolean,
  userId: string
): Promise<{ success: boolean; message: string }> {
  // 現在: 未実装（静的データのため）
  console.warn('toggleShopVisibility is not implemented yet');
  return {
    success: false,
    message: '現在、表示切替機能は実装されていません',
  };

  // 将来: API呼び出し
  // try {
  //   const response = await fetch(`/api/shops/${shopId}/visibility`, {
  //     method: 'PATCH',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ visible, userId }),
  //   });
  //
  //   if (!response.ok) {
  //     const error = await response.json();
  //     return { success: false, message: error.message };
  //   }
  //
  //   return {
  //     success: true,
  //     message: visible ? '店舗を表示しました' : '店舗を非表示にしました',
  //   };
  // } catch (error) {
  //   return {
  //     success: false,
  //     message: 'エラーが発生しました',
  //   };
  // }
}

/**
 * 承認待ちの編集データを取得（将来の実装用）
 *
 * 出店者: 自分の店舗の承認待ちデータを確認
 * 運営: すべての承認待ちデータを確認
 *
 * @param shopId 店舗ID（省略すると全店舗）
 * @returns 承認待ちデータリスト
 */
export async function getPendingEdits(
  shopId?: number
): Promise<ShopEditPending[]> {
  // 現在: 未実装
  return [];

  // 将来: API呼び出し
  // const url = shopId
  //   ? `/api/shops/${shopId}/pending-edits`
  //   : '/api/shops/pending-edits';
  // const response = await fetch(url);
  // if (!response.ok) return [];
  // return response.json();
}

/**
 * 編集内容を承認（運営専用、将来の実装用）
 *
 * @param pendingId 承認待ちデータのID
 * @param approved 承認するか
 * @param adminComment 運営コメント
 * @returns 成功/失敗
 */
export async function approveEdit(
  pendingId: string,
  approved: boolean,
  adminComment?: string
): Promise<{ success: boolean; message: string }> {
  // 現在: 未実装
  console.warn('approveEdit is not implemented yet');
  return {
    success: false,
    message: '現在、承認機能は実装されていません',
  };

  // 将来: API呼び出し
  // try {
  //   const response = await fetch(`/api/admin/pending-edits/${pendingId}`, {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({ approved, adminComment }),
  //   });
  //
  //   if (!response.ok) {
  //     const error = await response.json();
  //     return { success: false, message: error.message };
  //   }
  //
  //   return {
  //     success: true,
  //     message: approved ? '承認しました' : '却下しました',
  //   };
  // } catch (error) {
  //   return {
  //     success: false,
  //     message: 'エラーが発生しました',
  //   };
  // }
}
