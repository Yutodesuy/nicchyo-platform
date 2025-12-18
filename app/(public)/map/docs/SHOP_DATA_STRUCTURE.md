# 店舗データ構造ガイド

将来の出店者編集機能を前提とした新しいデータ構造の使用方法

## 📋 概要

### 責務の3層分離

```
┌─────────────────────────────────────────┐
│  ShopEditableData                       │
│  出店者が編集できるデータ                │
│  - 店舗名、説明、カテゴリ、商品、画像    │
├─────────────────────────────────────────┤
│  ShopSystemData                         │
│  運営のみ管理するデータ                  │
│  - ID、位置、座標、表示優先度            │
├─────────────────────────────────────────┤
│  ShopDisplaySettings                    │
│  表示設定データ                          │
│  - visible（出店者変更可）               │
│  - イラストサイズ（運営承認必要）        │
└─────────────────────────────────────────┘
```

### 公平性の保証

- **位置情報は運営管理**: 出店者が勝手に位置を変更できない
- **表示優先度は運営管理**: 特定の店舗だけ目立つ設定にできない
- **サイズ変更は承認制**: large サイズは運営承認が必要

---

## 🔧 使用方法

### 1. マップコンポーネントでの使用

```typescript
import { getAllShops } from '../services/shopDataService';

async function MapComponent() {
  // データアクセス層を経由
  const shops = await getAllShops();

  // 表示ロジックは変更なし
  return shops.map((shop) => {
    // shop は Shop 型
    // - shop.id, shop.name などアクセス可能
    // - 新しいフィールド (shop.visible など) もオプションで利用可能
  });
}
```

### 2. 店舗詳細表示

```typescript
import { getShopById } from '../services/shopDataService';

async function ShopDetail({ shopId }: { shopId: number }) {
  const shop = await getShopById(shopId);

  if (!shop) return null;

  // 既存のフィールドはそのまま使える
  return {
    name: shop.name,
    description: shop.description,
    products: shop.products,
    // ...
  };
}
```

### 3. 出店者編集フォーム（将来の実装）

```typescript
import { getShopEditableData, updateShopEditableData } from '../services/shopDataService';
import { validateShopEditableData } from '../utils/shopValidation';

async function ShopEditForm({ shopId, userId }) {
  // 編集可能なデータのみ取得
  const editableData = await getShopEditableData(shopId);

  const handleSubmit = async (formData) => {
    // バリデーション
    const validation = validateShopEditableData(formData);
    if (!validation.valid) {
      console.error(validation.errors);
      return;
    }

    // データ更新（承認待ちとして送信）
    const result = await updateShopEditableData(shopId, formData, userId);
    console.log(result.message);
  };
}
```

### 4. 表示ON/OFF切り替え（将来の実装）

```typescript
import { toggleShopVisibility } from '../services/shopDataService';

async function VisibilityToggle({ shopId, userId, currentVisible }) {
  const result = await toggleShopVisibility(shopId, !currentVisible, userId);
  // visible フィールドのみ即時反映（運営承認不要）
}
```

---

## 📦 型定義

### ShopEditableData

出店者が編集可能なフィールド

```typescript
{
  name: string;              // 店舗名（必須、1-50文字）
  ownerName: string;         // 店主名（必須、1-30文字）
  category: string;          // カテゴリー（選択式）
  icon: string;              // カテゴリーアイコン
  products: string[];        // 商品リスト（1-20個）
  description: string;       // 説明文（必須、最大500文字）
  schedule: string;          // 出店予定（必須、最大100文字）
  message?: string;          // メッセージ（任意、最大300文字）
  images?: {                 // 画像（将来の実装用）
    main?: string;
    thumbnail?: string;
    additional?: string[];
  };
  socialLinks?: {            // SNSリンク（将来の実装用）
    instagram?: string;
    facebook?: string;
    twitter?: string;
    website?: string;
  };
}
```

### ShopSystemData

運営のみが管理するフィールド（出店者は閲覧のみ）

```typescript
{
  id: number;                // 店舗ID（一意、変更不可）
  position: number;          // 位置（0-149、変更不可）
  lat: number;               // 緯度（変更不可）
  lng: number;               // 経度（変更不可）
  side: 'north' | 'south';   // 北側/南側（変更不可）
  priority?: number;         // 表示優先度（運営管理）
  approvalStatus?: string;   // 承認ステータス
  createdAt?: number;        // 作成日時
}
```

### ShopDisplaySettings

表示設定（visible 以外は運営承認が必要）

```typescript
{
  visible?: boolean;         // 表示ON/OFF（出店者が変更可能）
  illustration?: {
    type?: 'tent' | 'stall' | 'custom';
    size?: 'small' | 'medium' | 'large';  // large は運営承認必要
    color?: string;          // 運営承認必要
    customSvg?: string;      // 運営承認必要
  };
}
```

---

## 🔐 バリデーション

```typescript
import { validateShopEditableData } from '../utils/shopValidation';

const validation = validateShopEditableData({
  name: '新しい店舗名',
  description: '...',
  products: ['商品1', '商品2'],
});

if (!validation.valid) {
  validation.errors.forEach((error) => {
    console.error(`${error.field}: ${error.message}`);
  });
}
```

### バリデーションルール

| フィールド | ルール |
|-----------|--------|
| name | 必須、1-50文字 |
| ownerName | 必須、1-30文字 |
| description | 必須、最大500文字 |
| products | 1-20個、各商品名は最大30文字 |
| schedule | 必須、最大100文字 |
| message | 任意、最大300文字 |
| images.additional | 最大5枚 |

---

## 🚀 将来の拡張

### 承認フロー

1. 出店者が編集内容を送信
2. `ShopEditPending` として保存
3. 運営が承認/却下
4. 承認されたら本データに反映

```typescript
// 承認待ちデータの取得
const pendingEdits = await getPendingEdits(shopId);

// 承認/却下
await approveEdit(pendingId, approved, adminComment);
```

### API実装例

```typescript
// GET /api/shops/:id
export async function GET(request, { params }) {
  const shop = await getShopById(parseInt(params.id));
  return NextResponse.json(shop);
}

// PATCH /api/shops/:id
export async function PATCH(request, { params }) {
  const editableData = await request.json();

  // バリデーション
  const validation = validateShopEditableData(editableData);
  if (!validation.valid) {
    return NextResponse.json({ errors: validation.errors }, { status: 400 });
  }

  // 権限チェック
  const canEdit = await canEditShop(session.user.id, shopId);
  if (!canEdit) {
    return NextResponse.json({ error: '権限がありません' }, { status: 403 });
  }

  // 承認待ちとして保存
  await createPendingEdit(shopId, editableData, session.user.id);

  return NextResponse.json({
    message: '変更を送信しました。運営の承認をお待ちください。'
  });
}
```

### データベーススキーマ例（Prisma）

```prisma
model Shop {
  id          Int      @id @default(autoincrement())
  position    Int
  lat         Float
  lng         Float
  side        String
  priority    Int      @default(0)

  name        String
  ownerName   String
  category    String
  products    String[]
  description String
  schedule    String
  message     String?

  visible     Boolean  @default(true)

  ownerId     String?
  owner       User?    @relation(fields: [ownerId], references: [id])

  pendingEdits ShopEditPending[]
}

model ShopEditPending {
  id          String   @id @default(cuid())
  shopId      Int
  shop        Shop     @relation(fields: [shopId], references: [id])
  editedData  Json
  editorId    String
  status      String   // "pending", "approved", "rejected"
  adminComment String?
  createdAt   DateTime @default(now())
}

model User {
  id    String @id @default(cuid())
  email String @unique
  name  String
  role  String // "owner", "admin"
  shops Shop[]
}
```

---

## 📚 ファイル一覧

| ファイル | 役割 |
|---------|------|
| `types/shopData.ts` | 型定義（ShopEditableData, ShopSystemData, Shop等） |
| `services/shopDataService.ts` | データアクセス層（API抽象化） |
| `utils/shopValidation.ts` | バリデーション・権限チェック |
| `data/shops.ts` | 静的データ（将来はDBに移行） |

---

## ⚠️ 注意事項

### 後方互換性

- 既存のコードは変更なしで動作
- 新しいフィールド（`images`, `socialLinks`, `visible`等）はすべてオプション
- `Shop` 型は以前と同じ構造で使用可能

### データ取得方法の変更

**変更前:**
```typescript
import { shops } from '../data/shops';
```

**変更後:**
```typescript
import { getAllShops } from '../services/shopDataService';
const shops = await getAllShops();
```

データアクセス層を経由することで、将来のAPI化に対応

---

## 🎯 まとめ

この構造により以下が実現できます:

✅ 出店者が自分の店舗情報を編集可能
✅ 運営が承認するまで変更は反映されない
✅ 位置情報や優先度は運営のみ管理
✅ 公平性が保たれる
✅ 将来のAPI化・DB化に対応
✅ 既存コードとの互換性を保持
