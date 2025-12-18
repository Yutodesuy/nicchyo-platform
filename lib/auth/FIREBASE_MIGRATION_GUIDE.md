# Firebase Authentication 移行ガイド

現在のダミー認証実装を Firebase Authentication に置き換える手順

---

## 📋 目次

1. [準備](#準備)
2. [Firebase プロジェクトのセットアップ](#firebase-プロジェクトのセットアップ)
3. [コード変更](#コード変更)
4. [テスト](#テスト)
5. [デプロイ](#デプロイ)

---

## 準備

### 必要なパッケージのインストール

```bash
npm install firebase
```

---

## Firebase プロジェクトのセットアップ

### 1. Firebase Console でプロジェクト作成

1. [Firebase Console](https://console.firebase.google.com/) にアクセス
2. 「プロジェクトを追加」をクリック
3. プロジェクト名を入力（例: nicchyo-platform）
4. Google Analytics は任意で設定

### 2. Authentication の有効化

1. Firebase Console で「Authentication」を選択
2. 「始める」をクリック
3. 「Sign-in method」タブで以下を有効化:
   - メール/パスワード
   - （オプション）Google、Facebook等のソーシャルログイン

### 3. Web アプリの登録

1. プロジェクト設定から「アプリを追加」
2. Web アプリのアイコン（</>）を選択
3. アプリのニックネームを入力
4. Firebase SDK の設定情報をコピー

### 4. 環境変数の設定

`.env.local` ファイルを作成:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

---

## コード変更

### 1. Firebase 設定ファイルの作成

**新規作成**: `lib/firebase/config.ts`

```typescript
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase（複数回初期化を防ぐ）
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const auth = getAuth(app);

export { app, auth };
```

### 2. AuthContext.tsx の置き換え

**変更**: `lib/auth/AuthContext.tsx`

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';

interface AuthContextType {
  isLoggedIn: boolean;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Firebase 認証状態の監視
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ログイン
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // 新規登録
  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ログアウト
  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const isLoggedIn = !!user;

  return (
    <AuthContext.Provider value={{ isLoggedIn, user, login, signup, logout, isLoading }}>
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
```

### 3. HamburgerMenu.tsx の更新

**変更**: `app/components/HamburgerMenu.tsx`

```typescript
// ダミーログイン処理を削除し、ログインフォームを表示

const [showLoginForm, setShowLoginForm] = useState(false);
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [error, setError] = useState('');

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  try {
    await login(email, password);
    setShowLoginForm(false);
    setEmail('');
    setPassword('');
    closeMenu();
  } catch (err: any) {
    setError('ログインに失敗しました: ' + err.message);
  }
};

// UI部分
{!isLoggedIn && !showLoginForm && (
  <button
    onClick={() => setShowLoginForm(true)}
    className="..."
  >
    ログイン
  </button>
)}

{!isLoggedIn && showLoginForm && (
  <form onSubmit={handleLogin} className="space-y-3">
    <input
      type="email"
      value={email}
      onChange={(e) => setEmail(e.target.value)}
      placeholder="メールアドレス"
      className="w-full rounded-lg border px-3 py-2"
      required
    />
    <input
      type="password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      placeholder="パスワード"
      className="w-full rounded-lg border px-3 py-2"
      required
    />
    {error && <p className="text-xs text-red-600">{error}</p>}
    <button
      type="submit"
      className="w-full rounded-lg bg-amber-500 px-4 py-2 text-white"
    >
      ログイン
    </button>
    <button
      type="button"
      onClick={() => setShowLoginForm(false)}
      className="w-full text-sm text-gray-600"
    >
      キャンセル
    </button>
  </form>
)}
```

### 4. ユーザー情報の取得

Firebase User オブジェクトからユーザー情報を取得:

```typescript
const { user } = useAuth();

// ユーザー名
user?.displayName || user?.email || 'ユーザー';

// メールアドレス
user?.email;

// UID（店舗との紐付けに使用）
user?.uid;
```

---

## テスト

### 1. ローカル環境でのテスト

```bash
npm run dev
```

1. ハンバーガーメニューを開く
2. ログインフォームにメール/パスワードを入力
3. ログインが成功することを確認
4. ログアウトが機能することを確認

### 2. Firebase Console で確認

1. Firebase Console の「Authentication」タブ
2. 「Users」でユーザーが登録されているか確認

---

## デプロイ

### 1. 環境変数の設定（Vercel の場合）

Vercel Dashboard で環境変数を設定:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

### 2. デプロイ

```bash
git push origin add-user
```

Vercel で自動的にビルド・デプロイされます。

---

## 🔐 セキュリティ強化（オプション）

### メールアドレスの確認

```typescript
import { sendEmailVerification } from 'firebase/auth';

const signup = async (email: string, password: string) => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await sendEmailVerification(credential.user);
};
```

### パスワードリセット

```typescript
import { sendPasswordResetEmail } from 'firebase/auth';

const resetPassword = async (email: string) => {
  await sendPasswordResetEmail(auth, email);
};
```

### ソーシャルログイン（Google）

```typescript
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';

const loginWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  await signInWithPopup(auth, provider);
};
```

---

## 📊 データベース連携（Firestore）

ユーザーと店舗を紐付ける場合:

```typescript
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const db = getFirestore(app);

// ユーザー登録時に店舗情報を作成
const createUserShop = async (userId: string, shopData: any) => {
  await setDoc(doc(db, 'users', userId), {
    shopId: shopData.shopId,
    role: 'owner',
    createdAt: new Date(),
  });
};
```

---

## ⚠️ 注意事項

1. **環境変数の管理**: `.env.local` は `.gitignore` に追加すること
2. **Firebase ルール**: Firestore や Storage のセキュリティルールを適切に設定
3. **エラーハンドリング**: Firebase のエラーをユーザーフレンドリーに表示
4. **ローディング状態**: `isLoading` を使ってローディング UI を表示

---

## 📚 参考リンク

- [Firebase Authentication ドキュメント](https://firebase.google.com/docs/auth)
- [Next.js with Firebase](https://firebase.google.com/docs/web/setup#from-the-cdn_(alternative))
- [Firebase セキュリティルール](https://firebase.google.com/docs/rules)
