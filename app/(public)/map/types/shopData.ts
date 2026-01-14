/**
 * 店舗データ型定義
 *
 * 【設計方針】
 * 将来的に「出店者自身が店舗情報を編集できる」ことを前提とした構造
 *
 * 【責務の分離】
 * 1. ShopEditableData: 出店者が編集できるデータ
 * 2. ShopSystemData: 運営のみが管理するデータ
 * 3. ShopDisplaySettings: 表示設定（運営承認が必要）
 * 4. Shop: 上記すべてを統合した完全なデータ
 *
 * 【公平性の保証】
 * - 位置情報（position, lat, lng）は運営管理
 * - 表示優先度も運営管理
 * - 出店者が勝手に目立つ設定にできない
 *
 * 【将来の拡張】
 * - 出店者ログイン・編集機能
 * - 承認フロー（編集内容を運営が承認）
 * - API経由でのデータ取得・更新
 */

/**
 * 出店者が編集可能なデータ
 *
 * 【編集権限】
 * - 出店者本人のみ編集可能
 * - 変更内容は運営承認が必要な場合がある
 *
 * 【バリデーション】
 * - 名前: 1-50文字
 * - 説明: 最大500文字
 * - 商品: 最大20個
 * - 画像: URL形式、サイズ制限
 */
export interface ShopEditableData {
  /** 店舗名 */
  name: string;

  /** 店主の名前 */
  ownerName: string;

  /** カテゴリー（選択式、運営が用意した選択肢から選ぶ） */
  category: string;

  /** カテゴリーアイコン（カテゴリーに紐づく） */
  icon: string;

  /** 取扱商品リスト */
  products: string[];

  /** 季節をまたぐ取扱商品（春-夏） */
  seasonalProductsSpringSummer?: string[];

  /** 季節をまたぐ取扱商品（夏-秋） */
  seasonalProductsSummerAutumn?: string[];

  /** 季節をまたぐ取扱商品（秋-冬） */
  seasonalProductsAutumnWinter?: string[];

  /** 季節をまたぐ取扱商品（冬-春） */
  seasonalProductsWinterSpring?: string[];

  /** 店舗の説明文 */
  description: string;

  /** 得意料理（郷土料理名 or なし） */
  specialtyDish?: string;

  /** 出店者について（自由記述） */
  aboutVendor?: string;

  /** 出店スタイル（自由記述） */
  stallStyle?: string;

  /** 出店予定・営業時間 */
  schedule: string;

  /** 出店者からのメッセージ（任意） */
  message?: string;

  /** 来訪者に聞いてほしいトピック */
  topic?: string[];

  /** 店舗画像URL（将来の実装用） */
  images?: {
    /** メイン画像 */
    main?: string;
    /** サムネイル画像 */
    thumbnail?: string;
    /** 追加画像（最大5枚） */
    additional?: string[];
  };

  /** SNSリンク（将来の実装用） */
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };

  /** 最終更新日時（自動設定） */
  lastUpdated?: number;

  /** 更新者ID（将来の実装用） */
  updatedBy?: string;
}

/**
 * 運営のみが管理するシステムデータ
 *
 * 【編集権限】
 * - 運営（管理者）のみ編集可能
 * - 出店者は閲覧のみ可能
 *
 * 【公平性の保証】
 * - position: 道路上の位置（変更不可）
 * - lat/lng: 緯度経度（変更不可）
 * - side: 北側/南側（変更不可）
 * - priority: 表示優先度（運営管理）
 */
export interface ShopSystemData {
  /** 店舗ID（一意、変更不可） */
  id: number;

  /** 道路上の位置（0-149、変更不可） */
  position: number;

  /** 緯度（変更不可） */
  lat: number;

  /** 経度（変更不可） */
  lng: number;

  /** 道路の北側/南側（変更不可） */
  side: 'north' | 'south';

  /** 丁目セクション（日曜市の区画、変更不可） */
  chome?: '一丁目' | '二丁目' | '三丁目' | '四丁目' | '五丁目' | '六丁目' | '七丁目';

  /** 表示優先度（運営管理、将来の実装用） */
  priority?: number;

  /** 承認ステータス（将来の実装用） */
  approvalStatus?: 'pending' | 'approved' | 'rejected';

  /** 作成日時 */
  createdAt?: number;
}

/**
 * 店舗の表示設定
 *
 * 【編集権限】
 * - 基本: 運営承認が必要
 * - visible のみ出店者が変更可能（即時反映）
 *
 * 【制限事項】
 * - イラストサイズは運営承認が必要
 * - カスタムSVGは運営承認が必要
 * - 公平性を損なう設定は不可
 */
export interface ShopDisplaySettings {
  /** 表示ON/OFF（出店者が変更可能、デフォルト: true） */
  visible?: boolean;

  /** イラスト設定（運営承認が必要） */
  illustration?: {
    /** イラストタイプ */
    type?: 'tent' | 'stall' | 'custom';
    /** サイズ（運営承認が必要） */
    size?: 'small' | 'medium' | 'large';
    /** カスタムカラー（運営承認が必要） */
    color?: string;
    /** カスタムSVG（運営承認が必要） */
    customSvg?: string;
  };

  /** 表示設定の承認ステータス（将来の実装用） */
  displayApprovalStatus?: 'pending' | 'approved' | 'rejected';
}

/**
 * 完全な店舗データ
 *
 * 【使用場面】
 * - 地図上での表示
 * - 店舗詳細の表示
 * - データ保存・取得
 *
 * 【データ取得】
 * - getShopData(shopId) で取得
 * - 内部で ShopEditableData + ShopSystemData + ShopDisplaySettings を統合
 *
 * 【後方互換性】
 * - 既存のコードは変更なしで動作
 * - 新しいフィールド（images, socialLinks, visible等）はすべてオプション
 */
export interface Shop
  extends ShopEditableData,
    ShopSystemData,
    ShopDisplaySettings {
  // すべてのフィールドは親インターフェースから継承
  // 後方互換性のため、新しいフィールドはすべてオプション（?付き）
}

/**
 * 承認待ちの編集データ（将来の実装用）
 *
 * 出店者が編集した内容を一時保存し、運営承認後に本データに反映
 */
export interface ShopEditPending {
  /** 店舗ID */
  shopId: number;

  /** 編集データ（変更内容のみ） */
  editedData: Partial<ShopEditableData>;

  /** 表示設定の変更（ある場合） */
  displaySettings?: Partial<ShopDisplaySettings>;

  /** 編集者ID */
  editorId: string;

  /** 編集日時 */
  editedAt: number;

  /** 承認ステータス */
  status: 'pending' | 'approved' | 'rejected';

  /** 運営コメント */
  adminComment?: string;
}

/**
 * 編集可能なフィールドのリスト
 *
 * バリデーション・フォーム生成に使用
 */
export const EDITABLE_FIELDS: (keyof ShopEditableData)[] = [
  'name',
  'ownerName',
  'category',
  'icon',
  'products',
  'seasonalProductsSpringSummer',
  'seasonalProductsSummerAutumn',
  'seasonalProductsAutumnWinter',
  'seasonalProductsWinterSpring',
  'description',
  'specialtyDish',
  'aboutVendor',
  'stallStyle',
  'schedule',
  'message',
  'topic',
  'images',
  'socialLinks',
];

/**
 * 運営専用フィールドのリスト
 *
 * 出店者には編集不可
 */
export const SYSTEM_FIELDS: (keyof ShopSystemData)[] = [
  'id',
  'position',
  'lat',
  'lng',
  'side',
  'chome',
  'priority',
  'approvalStatus',
  'createdAt',
];

/**
 * 表示設定フィールドのリスト
 *
 * visible 以外は運営承認が必要
 */
export const DISPLAY_FIELDS: (keyof ShopDisplaySettings)[] = [
  'visible',
  'illustration',
  'displayApprovalStatus',
];
