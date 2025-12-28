# Firebase Authentication 移行ガイド

このドキュメントは、現在のダミー認証実装から Firebase Authentication への移行手順を説明します。

## 目次

1. [現在の実装](#現在の実装)
2. [Firebase プロジェクトのセットアップ](#firebase-プロジェクトのセットアップ)
3. [役割（Role）管理の実装](#役割role管理の実装)
4. [コード移行手順](#コード移行手順)
5. [テスト計画](#テスト計画)

---

## 現在の実装

### ダミー認証の構造

- **認証状態**: localStorage で管理
- **ユーザー情報**: ハードコードされたダミーアカウント（`lib/auth/AuthContext.tsx` の `DUMMY_ACCOUNTS`）
- **役割管理**: フロントエンドのみで完結（`UserRole` 型）

### 主要ファイル

| ファイル | 説明 |
|---------|------|
| `lib/auth/types.ts` | User, UserRole, PermissionCheck の型定義 |
| `lib/auth/AuthContext.tsx` | 認証コンテキスト（ダミー実装） |
| `app/components/HamburgerMenu.tsx` | ログインUI |

---

## Firebase プロジェクトのセットアップ

### 1. Firebase プロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 新しいプロジェクトを作成（例: `nicchyo-platform`）
3. Google Analytics は任意で有効化

### 2. Authentication を有効化

1. Firebase Console > Authentication > Sign-in method
2. 以下の認証方法を有効化:
   - **Email/Password**: 必須
   - **Google**: 推奨（一般ユーザー向け）
   - その他の方法は任意

### 3. Firebase SDK をインストール

```bash
npm install firebase
```

### 4. Firebase 設定ファイルを作成

**`lib/firebase/config.ts`**

```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

**`.env.local`** （Git管理外）

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

---

## 役割（Role）管理の実装

### Custom Claims を使った Role 管理

Firebase Authentication では、**Custom Claims** を使ってユーザーに役割を付与します。

#### 1. Admin SDK で Custom Claims を設定

**Firebase Functions または Admin SDK**

```typescript
import * as admin from 'firebase-admin';

// ユーザーに role を付与
async function setUserRole(uid: string, role: 'super_admin' | 'vendor' | 'general_user') {
  await admin.auth().setCustomUserClaims(uid, { role });
  console.log(`User ${uid} assigned role: ${role}`);
}

// 例: 高知市管理者に super_admin を付与
await setUserRole('firebase-uid-here', 'super_admin');
```

#### 2. Firestore にユーザープロフィールを保存

**Firestore スキーマ**

```
users/{uid}/
  - name: string
  - email: string
  - role: 'super_admin' | 'vendor' | 'general_user'
  - vendorId?: number  // vendor role の場合のみ
  - createdAt: timestamp
  - updatedAt: timestamp
```

**セキュリティルール例**

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      // 自分のプロフィールは読み取り可能
      allow read: if request.auth != null && request.auth.uid == uid;

      // super_admin のみ全ユーザーの読み取り・更新が可能
      allow read, write: if request.auth != null &&
                             request.auth.token.role == 'super_admin';

      // vendor は自分の vendorId に紐づく店舗のみ編集可能
      allow update: if request.auth != null &&
                       request.auth.uid == uid &&
                       request.auth.token.role == 'vendor';
    }
  }
}
```

---

## コード移行手順

### ステップ 1: AuthContext を Firebase に対応

**`lib/auth/AuthContext.tsx` の変更**

```typescript
{% raw %}
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase/config';
import type { User, UserRole, PermissionCheck } from './types';

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  permissions: PermissionCheck;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Firebase Authentication 状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Custom Claims から role を取得
        const idTokenResult = await firebaseUser.getIdTokenResult();
        const role = idTokenResult.claims.role as UserRole;

        // Firestore からユーザープロフィールを取得
        const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
        const userData = userDoc.data();

        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: userData?.name || 'ユーザー',
          role: role || 'general_user',
          vendorId: userData?.vendorId,
        });
        setIsLoggedIn(true);
      } else {
        setUser(null);
        setIsLoggedIn(false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 権限チェック用ヘルパー
  const permissions: PermissionCheck = {
    isSuperAdmin: user?.role === 'super_admin',
    isVendor: user?.role === 'vendor',
    isGeneralUser: user?.role === 'general_user',
    canEditShop: (shopId: number) => {
      if (user?.role === 'super_admin') return true;
      if (user?.role === 'vendor' && user.vendorId === shopId) return true;
      return false;
    },
    canManageAllShops: user?.role === 'super_admin',
  };

  // ログイン処理
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged で自動的に user が更新される
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ログアウト処理
  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
      // onAuthStateChanged で自動的に user が null になる
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, logout, isLoading, permissions }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
{% endraw %}
```

### ステップ 2: HamburgerMenu をログインフォームに対応

**`app/components/HamburgerMenu.tsx` の変更**

```typescript
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [loginError, setLoginError] = useState('');

const handleLogin = async () => {
  try {
    setLoginError('');
    await login(email, password);
    closeMenu();
  } catch (error) {
    setLoginError('ログインに失敗しました。メールアドレスとパスワードを確認してください。');
  }
};

// UI部分
<input
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  placeholder="メールアドレス"
  className="..."
/>
<input
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  placeholder="パスワード"
  className="..."
/>
{loginError && <p className="text-red-600 text-xs">{loginError}</p>}
<button onClick={handleLogin}>ログイン</button>
```

### ステップ 3: 初期ユーザーの作成

**Firebase Console または Admin SDK で初期アカウントを作成**

1. **高知市管理者アカウント**
   - Email: `admin@kochi-city.jp`
   - Role: `super_admin`

2. **テスト出店者アカウント**
   - Email: `vendor@example.com`
   - Role: `vendor`
   - vendorId: `1`

---

## テスト計画

### 1. 役割ベースのアクセス制御テスト

| 役割 | テスト内容 | 期待結果 |
|------|-----------|---------|
| super_admin | 管理者メニューが表示される | ✅ 表示される |
| super_admin | 全店舗の編集が可能 | ✅ 可能 |
| vendor | 自分の店舗のみ編集可能 | ✅ 可能 |
| vendor | 他の店舗は編集不可 | ❌ 不可 |
| general_user | 管理者メニューが表示されない | ❌ 表示されない |

### 2. セキュリティテスト

- [ ] Firestore セキュリティルールのテスト
- [ ] Custom Claims の改ざん防止確認
- [ ] 認証トークンの有効期限確認

### 3. パフォーマンステスト

- [ ] ログイン速度測定
- [ ] Firestore 読み取り回数の最適化

---

## チェックリスト

移行前に以下を確認してください:

- [ ] Firebase プロジェクト作成完了
- [ ] Authentication 有効化完了
- [ ] Firestore セットアップ完了
- [ ] 環境変数（`.env.local`）設定完了
- [ ] 初期管理者アカウント作成完了
- [ ] Custom Claims 設定用の Admin SDK 準備完了
- [ ] セキュリティルール設定完了
- [ ] テストアカウントでの動作確認完了

---

## トラブルシューティング

### ログインに失敗する

- Firebase Console > Authentication でユーザーが作成されているか確認
- Custom Claims が正しく設定されているか確認
- ブラウザのコンソールでエラーメッセージを確認

### Role が取得できない

- `getIdTokenResult()` で Custom Claims を確認
- Firebase Functions でのカスタムクレーム設定を再確認

### Firestore の読み取りエラー

- Firestore セキュリティルールを確認
- ユーザードキュメントが正しく作成されているか確認

---

## 参考資料

- [Firebase Authentication ドキュメント](https://firebase.google.com/docs/auth)
- [Custom Claims ガイド](https://firebase.google.com/docs/auth/admin/custom-claims)
- [Firestore セキュリティルール](https://firebase.google.com/docs/firestore/security/get-started)
