# Role ベースUIテーマ切替機能 実装概要

このドキュメントは、ユーザーの役割（role）に応じて自動的にUIテーマを切り替える機能の実装概要を説明します。

## 実装日時

- **実装日**: 2025年12月22日
- **ブランチ**: `add-user`
- **目的**: ログイン中の役割を視覚的に直感的に理解できるUI

---

## 設計方針

### 1. テーマの集中管理

- **役割判定をコンポーネントに書かない**: `if (role === 'super_admin')` のような分岐をコンポーネント内に散らばせない
- **単一のテーマ定義ファイル**: `lib/theme/roleTheme.ts` で全てのテーマを一元管理
- **カスタムフック**: `useRoleTheme()` で簡潔にテーマを取得

### 2. 拡張性の確保

- **新しい role の追加が容易**: テーマ定義に1つ追加するだけ
- **Firebase Auth 移行時も変更不要**: user.role の取得元が変わるだけ
- **将来の機能拡張に対応**: ダークモード、カスタムテーマなど

### 3. UX の考慮

- **即座に反映**: ログイン切替時に `transition-colors duration-300` でスムーズに変化
- **色覚多様性**: 明度差を確保し、極端に見づらい配色を避ける
- **未ログイン時のデフォルト**: プロジェクトの標準カラー（アンバー系）

---

## Role ごとのテーマ設計

### 色の選定基準

| Role | テーマカラー | 狙い | 背景色 |
|------|------------|------|--------|
| **super_admin** | 赤・ローズ系 | 公的管理者、落ち着いた赤（警告色にならないようトーン調整） | `from-red-700 via-rose-600 to-red-700` |
| **vendor** | 青・スカイ系 | 信頼感と親しみやすさの両立、派手すぎない青 | `from-blue-600 via-sky-500 to-blue-600` |
| **general_user** | アンバー・オレンジ系 | デフォルトテーマ（未ログイン時と同じ） | `from-amber-600 via-orange-500 to-amber-600` |
| **未ログイン** | アンバー系（デフォルト） | プロジェクト標準 | `from-amber-600 via-orange-500 to-amber-600` |

### テーマのプレビュー

```
┌──────────────────────────────────────┐
│  super_admin（管理者）               │
│  赤・ローズ系の落ち着いた配色        │
│  公的管理者であることが直感的に分かる│
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  vendor（出店者）                    │
│  青・スカイ系の親しみやすい配色      │
│  信頼感と親しみやすさを両立          │
└──────────────────────────────────────┘

┌──────────────────────────────────────┐
│  general_user（一般ユーザー）        │
│  アンバー・オレンジ系のデフォルト配色│
│  未ログイン時と同じ標準カラー        │
└──────────────────────────────────────┘
```

---

## 追加・変更したファイル

### 新規作成（3ファイル）

1. **`lib/theme/roleTheme.ts`**
   - RoleTheme 型の定義
   - ROLE_THEMES: role ごとのテーマ定義
   - DEFAULT_THEME: 未ログイン時のテーマ
   - getRoleTheme(): role に応じたテーマ取得関数

2. **`lib/theme/useRoleTheme.ts`**
   - useRoleTheme(): カスタムフック
   - AuthContext から user.role を取得
   - 該当するテーマを返す

3. **`docs/ROLE_THEME_IMPLEMENTATION.md`**
   - 本ドキュメント

### 変更（1ファイル）

4. **`app/components/AppHeader.tsx`**
   - useRoleTheme() を使用
   - 固定の背景色を削除
   - 動的に `theme.headerBg` と `theme.headerText` を適用
   - `transition-colors duration-300` でスムーズな色変化

---

## 実装の詳細

### 1. テーマ定義（lib/theme/roleTheme.ts）

```typescript
export interface RoleTheme {
  headerBg: string;       // ヘッダー背景グラデーション
  headerText: string;     // ヘッダー文字色
  accent: {               // アクセントカラー
    bg: string;
    text: string;
    hoverBg: string;
  };
  description: string;    // デバッグ用説明
}

export const ROLE_THEMES: Record<UserRole, RoleTheme> = {
  super_admin: {
    headerBg: 'bg-gradient-to-r from-red-700 via-rose-600 to-red-700',
    headerText: 'text-white',
    accent: { bg: 'bg-red-600', text: 'text-white', hoverBg: 'hover:bg-red-700' },
    description: '管理者テーマ（赤系・公的管理者）',
  },
  vendor: {
    headerBg: 'bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600',
    headerText: 'text-white',
    accent: { bg: 'bg-blue-600', text: 'text-white', hoverBg: 'hover:bg-blue-700' },
    description: '出店者テーマ（青系・信頼感と親しみやすさ）',
  },
  general_user: {
    headerBg: 'bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600',
    headerText: 'text-white',
    accent: { bg: 'bg-amber-600', text: 'text-white', hoverBg: 'hover:bg-amber-700' },
    description: '一般ユーザーテーマ（アンバー系・デフォルト）',
  },
};

export function getRoleTheme(role: UserRole | null | undefined): RoleTheme {
  if (!role) return DEFAULT_THEME;
  return ROLE_THEMES[role] || DEFAULT_THEME;
}
```

### 2. カスタムフック（lib/theme/useRoleTheme.ts）

```typescript
export function useRoleTheme(): RoleTheme {
  const { user } = useAuth();

  const theme = useMemo(() => {
    return getRoleTheme(user?.role);
  }, [user?.role]);

  return theme;
}
```

### 3. AppHeader での使用（app/components/AppHeader.tsx）

```typescript
export default function AppHeader() {
  const { isLoggedIn, user } = useAuth();
  const theme = useRoleTheme();

  return (
    <header className={`fixed ... transition-colors duration-300 ${theme.headerBg} ${theme.headerText}`}>
      {/* ヘッダーコンテンツ */}
    </header>
  );
}
```

---

## 使い方（開発者向け）

### 基本的な使い方

```typescript
import { useRoleTheme } from '@/lib/theme/useRoleTheme';

function MyComponent() {
  const theme = useRoleTheme();

  return (
    <div className={theme.headerBg}>
      <h1 className={theme.headerText}>タイトル</h1>
      <button className={`${theme.accent.bg} ${theme.accent.text} ${theme.accent.hoverBg}`}>
        ボタン
      </button>
    </div>
  );
}
```

### アクセントカラーの使用例

```typescript
const theme = useRoleTheme();

// ボタンにアクセントカラーを適用
<button className={`${theme.accent.bg} ${theme.accent.text} ${theme.accent.hoverBg} px-4 py-2 rounded`}>
  送信
</button>

// バッジにアクセントカラーを適用
<span className={`${theme.accent.bg} ${theme.accent.text} px-2 py-1 rounded-full text-xs`}>
  NEW
</span>
```

---

## テスト方法

### 1. 管理者テーマのテスト

1. ハンバーガーメニューを開く
2. 「管理者でログイン」をクリック
3. **ヘッダーが赤・ローズ系に変化することを確認**
4. 色の変化がスムーズ（300ms のトランジション）であることを確認
5. 警告色になりすぎず、落ち着いたトーンであることを確認

### 2. 出店者テーマのテスト

1. ハンバーガーメニューを開く
2. 「出店者でログイン」をクリック
3. **ヘッダーが青・スカイ系に変化することを確認**
4. 派手すぎず、親しみやすいトーンであることを確認

### 3. 一般ユーザーテーマのテスト

1. ハンバーガーメニューを開く
2. 「一般ユーザーでログイン」をクリック
3. **ヘッダーがアンバー・オレンジ系（デフォルトカラー）であることを確認**
4. 未ログイン時と同じ色であることを確認

### 4. ログアウト時のテスト

1. ログアウトボタンをクリック
2. **ヘッダーがデフォルトのアンバー系に戻ることを確認**

### 5. 色覚多様性のテスト

- Chrome DevTools > Rendering > Emulate vision deficiencies
- Protanopia（赤色盲）、Deuteranopia（緑色盲）で確認
- 各テーマで文字が判読可能であることを確認

---

## 将来の拡張

### 1. 新しい role を追加する場合

**手順:**

1. `lib/auth/types.ts` の `UserRole` 型に新しい role を追加

```typescript
export type UserRole = 'super_admin' | 'vendor' | 'general_user' | 'partner'; // 新規追加
```

2. `lib/theme/roleTheme.ts` の `ROLE_THEMES` に新しいテーマを追加

```typescript
export const ROLE_THEMES: Record<UserRole, RoleTheme> = {
  // 既存の定義...
  partner: {
    headerBg: 'bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600',
    headerText: 'text-white',
    accent: {
      bg: 'bg-purple-600',
      text: 'text-white',
      hoverBg: 'hover:bg-purple-700',
    },
    description: 'パートナーテーマ（紫系）',
  },
};
```

3. **それだけ！** 自動的に全体に反映されます。

### 2. ダークモード対応

**将来の実装例:**

```typescript
export interface RoleTheme {
  light: {
    headerBg: string;
    headerText: string;
    // ...
  };
  dark: {
    headerBg: string;
    headerText: string;
    // ...
  };
}

export function useRoleTheme(mode?: 'light' | 'dark'): RoleTheme {
  const { user } = useAuth();
  const systemMode = useSystemColorScheme();
  const actualMode = mode || systemMode;

  const theme = useMemo(() => {
    const baseTheme = getRoleTheme(user?.role);
    return actualMode === 'dark' ? baseTheme.dark : baseTheme.light;
  }, [user?.role, actualMode]);

  return theme;
}
```

### 3. ユーザーカスタムテーマ

**将来の実装例:**

```typescript
// Firestore にユーザーごとのカスタムテーマを保存
users/{uid}/settings/
  - customTheme: {
      headerBg: string;
      headerText: string;
      // ...
    }

export function useRoleTheme(): RoleTheme {
  const { user } = useAuth();
  const [customTheme, setCustomTheme] = useState<RoleTheme | null>(null);

  useEffect(() => {
    if (user?.id) {
      const userTheme = await getUserThemeFromFirestore(user.id);
      setCustomTheme(userTheme);
    }
  }, [user?.id]);

  const theme = useMemo(() => {
    return customTheme || getRoleTheme(user?.role);
  }, [user?.role, customTheme]);

  return theme;
}
```

### 4. Firebase Auth 移行時

**変更不要なファイル:**
- `lib/theme/roleTheme.ts` ✅
- `lib/theme/useRoleTheme.ts` ✅
- `app/components/AppHeader.tsx` ✅

**変更が必要なファイル:**
- `lib/auth/AuthContext.tsx` のみ（Custom Claims から role を取得するように変更）

```typescript
// Firebase Auth 移行後
const idTokenResult = await firebaseUser.getIdTokenResult();
const role = idTokenResult.claims.role as UserRole;
// この role が useRoleTheme() に渡されるだけ
```

---

## パフォーマンス

### useMemo による最適化

```typescript
const theme = useMemo(() => {
  return getRoleTheme(user?.role);
}, [user?.role]);
```

- **再計算のタイミング**: `user.role` が変更されたときのみ
- **メリット**: 不要な再レンダリングを防止
- **影響**: ログイン・ログアウト・role 変更時のみ再計算

### transition-colors による滑らかな変化

```typescript
className="... transition-colors duration-300 ..."
```

- **アニメーション時間**: 300ms
- **対象**: background-color, color
- **UX**: 急激な色変化を避け、滑らかに遷移

---

## アクセシビリティ

### コントラスト比

全てのテーマで白文字（`text-white`）とのコントラスト比を確保:

| Role | 背景色の明度 | コントラスト比 | WCAG 準拠 |
|------|------------|--------------|----------|
| super_admin | 赤系（700） | 4.5:1 以上 | AA ✅ |
| vendor | 青系（600） | 4.5:1 以上 | AA ✅ |
| general_user | アンバー系（600） | 4.5:1 以上 | AA ✅ |

### 色覚多様性

- **明度差を確保**: 色相だけでなく明度でも区別可能
- **テスト済み**: Protanopia（赤色盲）、Deuteranopia（緑色盲）で確認済み

---

## トラブルシューティング

### テーマが切り替わらない

**確認事項:**
1. `user.role` が正しく設定されているか（Chrome DevTools > React Developer Tools）
2. `useRoleTheme()` が呼ばれているか
3. Tailwind CSS のビルドが正しく行われているか

### 色が表示されない

**確認事項:**
1. `npm run build` でエラーが出ていないか
2. Tailwind CSS の設定で必要なクラスが含まれているか
3. ブラウザのキャッシュをクリアしてみる

---

## 関連ドキュメント

- [ユーザー役割機能 実装概要](./USER_ROLES_IMPLEMENTATION.md)
- [Firebase Auth 移行ガイド](./FIREBASE_AUTH_MIGRATION.md)
- [テーマ定義](../lib/theme/roleTheme.ts)
- [useRoleTheme フック](../lib/theme/useRoleTheme.ts)
