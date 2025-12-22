# ユーザー役割（Role）機能 実装概要

このドキュメントは、スーパーユーザー（管理者）権限を含む、役割ベースのアクセス制御（RBAC）の実装概要を説明します。

## 実装日時

- **実装日**: 2025年12月22日
- **ブランチ**: `add-user`
- **実装方針**: ダミー実装（将来のFirebase Auth移行を想定した設計）

---

## 役割（Role）の定義

### UserRole 型

| Role | 日本語名 | 権限 | 対象ユーザー |
|------|---------|------|-------------|
| `super_admin` | スーパー管理者 | 全権限（全店舗管理、ユーザー管理、投稿モデレーション） | 高知市、高専 |
| `vendor` | 出店者 | 自店舗の情報編集のみ | 日曜市の出店者 |
| `general_user` | 一般ユーザー | 閲覧のみ（将来用） | 観光客、一般利用者 |

---

## 追加・変更したファイル

### 1. 型定義

**`lib/auth/types.ts`** （新規作成）

- `UserRole` 型: `'super_admin' | 'vendor' | 'general_user'`
- `User` インターフェース: ユーザー情報（id, name, email, role, vendorId）
- `PermissionCheck` インターフェース: 権限チェック用ヘルパー

**主要な型:**

```typescript
export type UserRole = 'super_admin' | 'vendor' | 'general_user';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  vendorId?: number;  // vendor の場合のみ
}

export interface PermissionCheck {
  isSuperAdmin: boolean;
  isVendor: boolean;
  isGeneralUser: boolean;
  canEditShop: (shopId: number) => boolean;
  canManageAllShops: boolean;
}
```

### 2. 認証コンテキスト

**`lib/auth/AuthContext.tsx`** （大幅修正）

**変更内容:**

1. **ダミーアカウントの定義**:
   - `DUMMY_ACCOUNTS`: 各roleに対応するダミーユーザー
   - `super_admin`: 高知市管理者
   - `vendor`: 山田商店（vendorId: 1）
   - `general_user`: 観光客太郎

2. **login関数の変更**:
   - 引数: `userName` → `role: UserRole`
   - 選択されたroleに応じてログイン

3. **permissions の追加**:
   - `isSuperAdmin`, `isVendor`, `isGeneralUser`
   - `canEditShop(shopId)`: 特定店舗の編集権限チェック
   - `canManageAllShops`: 全店舗管理権限チェック

**コード例:**

```typescript
export const DUMMY_ACCOUNTS: Record<UserRole, User> = {
  super_admin: {
    id: 'dummy-super-admin',
    name: '高知市管理者',
    email: 'admin@kochi-city.jp',
    role: 'super_admin',
  },
  vendor: {
    id: 'dummy-vendor-001',
    name: '山田商店',
    email: 'yamada@nicchyo-vendor.jp',
    role: 'vendor',
    vendorId: 1,
  },
  general_user: {
    id: 'dummy-user-001',
    name: '観光客太郎',
    email: 'user@example.com',
    role: 'general_user',
  },
};

const login = (role: UserRole) => {
  const selectedUser = DUMMY_ACCOUNTS[role];
  setUser(selectedUser);
  setIsLoggedIn(true);
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: selectedUser }));
};
```

### 3. ハンバーガーメニュー

**`app/components/HamburgerMenu.tsx`** （大幅修正）

**変更内容:**

1. **Role選択UI**（未ログイン時）:
   - 管理者、出店者、一般ユーザーの3つのボタン
   - 各roleの説明を表示

2. **管理者専用メニュー**（`super_admin` のみ表示）:
   - 🏪 店舗管理（全店舗の閲覧・編集）
   - 👥 ユーザー管理（出店者アカウント管理）
   - 🛡️ 投稿モデレーション（不適切な投稿の管理）

3. **出店者メニュー**（`vendor` のみ表示）:
   - 🏪 マイ店舗管理（自店舗の編集）

4. **ログイン状態表示**:
   - roleに応じたバッジ表示（管理者: 赤、出店者: 青）

**UI例:**

```
┌─────────────────────────────────┐
│ [高] 高知市管理者               │
│     ログイン中 [管理者]         │
└─────────────────────────────────┘

🔐 管理者メニュー
🏪 店舗管理（全店舗の閲覧・編集）
👥 ユーザー管理（出店者アカウント管理）
🛡️ 投稿モデレーション

👤 プロフィール
🚪 ログアウト
```

---

## 権限チェックの使い方

### コンポーネント内での使用例

```typescript
import { useAuth } from '@/lib/auth/AuthContext';

function MyComponent() {
  const { user, permissions } = useAuth();

  // スーパー管理者のみ表示
  if (permissions.isSuperAdmin) {
    return <AdminPanel />;
  }

  // 特定店舗の編集権限チェック
  const shopId = 1;
  if (permissions.canEditShop(shopId)) {
    return <EditShopForm shopId={shopId} />;
  }

  // vendorの場合のみ表示
  if (permissions.isVendor && user?.vendorId) {
    return <MyShopDashboard vendorId={user.vendorId} />;
  }

  return <div>権限がありません</div>;
}
```

---

## 将来の拡張

### Firebase Authentication への移行

**移行時の変更箇所:**

1. **`lib/auth/AuthContext.tsx`**:
   - `login()` を `async` 関数に変更
   - Firebase の `signInWithEmailAndPassword()` を使用
   - `onAuthStateChanged()` で自動的にユーザー状態を監視

2. **Custom Claims で Role 管理**:
   - Firebase Admin SDK でユーザーに `role` を付与
   - `getIdTokenResult()` で Custom Claims を取得

3. **Firestore でユーザープロフィールを管理**:
   - `users/{uid}` コレクションにユーザー情報を保存
   - `vendorId` などの追加情報を保存

詳細は [`docs/FIREBASE_AUTH_MIGRATION.md`](./FIREBASE_AUTH_MIGRATION.md) を参照してください。

---

## テスト方法

### 1. 管理者でログイン

1. ハンバーガーメニューを開く
2. 「管理者でログイン」ボタンをクリック
3. メニューに「管理者メニュー」が表示されることを確認
4. ログイン状態表示に「管理者」バッジが表示されることを確認

### 2. 出店者でログイン

1. ハンバーガーメニューを開く
2. 「出店者でログイン」ボタンをクリック
3. メニューに「マイ店舗管理」が表示されることを確認
4. ログイン状態表示に「出店者」バッジが表示されることを確認

### 3. 一般ユーザーでログイン

1. ハンバーガーメニューを開く
2. 「一般ユーザーでログイン」ボタンをクリック
3. 管理者メニューや出店者メニューが表示されないことを確認

### 4. ログアウト

1. ログアウトボタンをクリック
2. ログイン状態がリセットされることを確認
3. ローカルストレージから認証情報が削除されることを確認

---

## セキュリティ上の注意点

### 現在の実装（ダミー）

- **フロントエンドのみで権限チェック**: 実際のセキュリティ保護はない
- **改ざん可能**: ローカルストレージを直接編集すれば権限を変更可能
- **本番運用には不適**: あくまでUI開発用のモック実装

### Firebase Auth 移行後

- **サーバーサイドで権限検証**: Firebase Functions や API で検証
- **Custom Claims**: 改ざん不可能な権限情報
- **Firestore セキュリティルール**: データベースレベルでアクセス制御

---

## 今後の開発タスク

### 短期（～1ヶ月）

- [ ] 管理者用の店舗管理画面の実装
- [ ] 出店者用のマイ店舗編集画面の実装
- [ ] Firebase プロジェクトのセットアップ

### 中期（～3ヶ月）

- [ ] Firebase Authentication への移行
- [ ] Custom Claims の実装
- [ ] Firestore セキュリティルールの設定
- [ ] ユーザー管理画面の実装

### 長期（～6ヶ月）

- [ ] 投稿モデレーション機能の実装
- [ ] 出店者向けダッシュボードの実装
- [ ] アクセスログ・監査ログの実装

---

## 関連ドキュメント

- [Firebase Auth 移行ガイド](./FIREBASE_AUTH_MIGRATION.md)
- [型定義](../lib/auth/types.ts)
- [認証コンテキスト](../lib/auth/AuthContext.tsx)
- [ハンバーガーメニュー](../app/components/HamburgerMenu.tsx)
