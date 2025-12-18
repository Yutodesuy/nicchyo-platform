/**
 * 店舗データのバリデーション・権限チェック
 *
 * 【目的】
 * - 出店者の編集内容を検証
 * - 不正なデータ・悪意ある変更を防ぐ
 * - 公平性を保証
 *
 * 【検証項目】
 * - 文字数制限
 * - 必須フィールド
 * - フォーマット検証
 * - 禁止ワード
 * - 画像サイズ・形式
 */

import type {
  ShopEditableData,
  ShopDisplaySettings,
  EDITABLE_FIELDS,
} from '../types/shopData';

/**
 * バリデーションエラー
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * バリデーション結果
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * 編集可能データのバリデーション
 *
 * @param data 編集データ
 * @returns バリデーション結果
 */
export function validateShopEditableData(
  data: Partial<ShopEditableData>
): ValidationResult {
  const errors: ValidationError[] = [];

  // 店舗名
  if (data.name !== undefined) {
    if (!data.name || data.name.trim().length === 0) {
      errors.push({ field: 'name', message: '店舗名は必須です' });
    } else if (data.name.length > 50) {
      errors.push({
        field: 'name',
        message: '店舗名は50文字以内で入力してください',
      });
    }
  }

  // 店主名
  if (data.ownerName !== undefined) {
    if (!data.ownerName || data.ownerName.trim().length === 0) {
      errors.push({ field: 'ownerName', message: '店主名は必須です' });
    } else if (data.ownerName.length > 30) {
      errors.push({
        field: 'ownerName',
        message: '店主名は30文字以内で入力してください',
      });
    }
  }

  // 説明文
  if (data.description !== undefined) {
    if (!data.description || data.description.trim().length === 0) {
      errors.push({ field: 'description', message: '説明文は必須です' });
    } else if (data.description.length > 500) {
      errors.push({
        field: 'description',
        message: '説明文は500文字以内で入力してください',
      });
    }
  }

  // 商品リスト
  if (data.products !== undefined) {
    if (!Array.isArray(data.products)) {
      errors.push({
        field: 'products',
        message: '商品リストの形式が不正です',
      });
    } else if (data.products.length === 0) {
      errors.push({
        field: 'products',
        message: '商品を最低1つ登録してください',
      });
    } else if (data.products.length > 20) {
      errors.push({
        field: 'products',
        message: '商品は20個まで登録できます',
      });
    } else {
      // 各商品名の長さチェック
      data.products.forEach((product, index) => {
        if (product.length > 30) {
          errors.push({
            field: `products[${index}]`,
            message: '商品名は30文字以内で入力してください',
          });
        }
      });
    }
  }

  // スケジュール
  if (data.schedule !== undefined) {
    if (!data.schedule || data.schedule.trim().length === 0) {
      errors.push({ field: 'schedule', message: '出店予定は必須です' });
    } else if (data.schedule.length > 100) {
      errors.push({
        field: 'schedule',
        message: '出店予定は100文字以内で入力してください',
      });
    }
  }

  // メッセージ（任意）
  if (data.message !== undefined && data.message.length > 300) {
    errors.push({
      field: 'message',
      message: 'メッセージは300文字以内で入力してください',
    });
  }

  // 画像URL（将来の実装用）
  if (data.images !== undefined) {
    const { main, thumbnail, additional } = data.images;

    if (main && !isValidImageUrl(main)) {
      errors.push({
        field: 'images.main',
        message: '画像URLの形式が不正です',
      });
    }

    if (thumbnail && !isValidImageUrl(thumbnail)) {
      errors.push({
        field: 'images.thumbnail',
        message: 'サムネイルURLの形式が不正です',
      });
    }

    if (additional && additional.length > 5) {
      errors.push({
        field: 'images.additional',
        message: '追加画像は5枚まで登録できます',
      });
    }
  }

  // SNSリンク（将来の実装用）
  if (data.socialLinks !== undefined) {
    const { instagram, facebook, twitter, website } = data.socialLinks;

    if (instagram && !isValidUrl(instagram)) {
      errors.push({
        field: 'socialLinks.instagram',
        message: 'InstagramのURLが不正です',
      });
    }

    if (facebook && !isValidUrl(facebook)) {
      errors.push({
        field: 'socialLinks.facebook',
        message: 'FacebookのURLが不正です',
      });
    }

    if (twitter && !isValidUrl(twitter)) {
      errors.push({
        field: 'socialLinks.twitter',
        message: 'TwitterのURLが不正です',
      });
    }

    if (website && !isValidUrl(website)) {
      errors.push({
        field: 'socialLinks.website',
        message: 'WebサイトのURLが不正です',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 表示設定のバリデーション
 *
 * 【制限】
 * - size: 運営承認が必要（large は不可）
 * - customSvg: 運営承認が必要
 * - color: 運営承認が必要
 *
 * @param settings 表示設定
 * @param requiresApproval 承認が必要な設定かチェック
 * @returns バリデーション結果
 */
export function validateShopDisplaySettings(
  settings: Partial<ShopDisplaySettings>,
  requiresApproval: boolean = true
): ValidationResult {
  const errors: ValidationError[] = [];

  // visible は常に変更可能
  if (settings.visible !== undefined && typeof settings.visible !== 'boolean') {
    errors.push({
      field: 'visible',
      message: '表示設定の値が不正です',
    });
  }

  // イラスト設定は承認が必要
  if (settings.illustration !== undefined) {
    const { size, color, customSvg } = settings.illustration;

    // サイズ変更は制限
    if (size !== undefined && requiresApproval) {
      if (size === 'large') {
        errors.push({
          field: 'illustration.size',
          message:
            '大サイズのイラストは運営承認が必要です。申請してください。',
        });
      }
    }

    // カスタムカラーは承認が必要
    if (color !== undefined && requiresApproval) {
      if (!isValidHexColor(color)) {
        errors.push({
          field: 'illustration.color',
          message: 'カラーコードの形式が不正です（#RRGGBB形式）',
        });
      }
    }

    // カスタムSVGは承認が必要
    if (customSvg !== undefined && requiresApproval) {
      errors.push({
        field: 'illustration.customSvg',
        message:
          'カスタムイラストは運営承認が必要です。申請してください。',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * 権限チェック: 指定ユーザーが指定店舗を編集できるか（将来の実装用）
 *
 * @param userId ユーザーID
 * @param shopId 店舗ID
 * @returns 編集可能か
 */
export async function canEditShop(
  userId: string,
  shopId: number
): Promise<boolean> {
  // 現在: 未実装（常にfalse）
  return false;

  // 将来: DBやAPIで権限確認
  // - 店舗の所有者か確認
  // - 管理者権限を持っているか確認
  // const response = await fetch(`/api/auth/can-edit-shop?userId=${userId}&shopId=${shopId}`);
  // const result = await response.json();
  // return result.canEdit;
}

/**
 * 権限チェック: 管理者権限を持っているか（将来の実装用）
 *
 * @param userId ユーザーID
 * @returns 管理者か
 */
export async function isAdmin(userId: string): Promise<boolean> {
  // 現在: 未実装（常にfalse）
  return false;

  // 将来: DBやAPIで権限確認
  // const response = await fetch(`/api/auth/is-admin?userId=${userId}`);
  // const result = await response.json();
  // return result.isAdmin;
}

// ===== ヘルパー関数 =====

/**
 * 画像URLの形式チェック
 */
function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    // https のみ許可
    if (parsed.protocol !== 'https:') return false;
    // 画像拡張子チェック
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    return validExtensions.some((ext) =>
      parsed.pathname.toLowerCase().endsWith(ext)
    );
  } catch {
    return false;
  }
}

/**
 * URLの形式チェック
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * HEXカラーコードの形式チェック
 */
function isValidHexColor(color: string): boolean {
  return /^#[0-9A-Fa-f]{6}$/.test(color);
}

/**
 * 禁止ワードチェック（将来の実装用）
 */
export function containsForbiddenWords(text: string): boolean {
  // 現在: 簡易実装
  const forbiddenWords = ['spam', 'test123']; // 実際はもっと多くの単語
  const lowerText = text.toLowerCase();
  return forbiddenWords.some((word) => lowerText.includes(word));
}
