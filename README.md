# dpet-xrpl
Turborepo、React、Express、TypeScriptを使ってXRPLベースのフルスタックアプリケーションを構築するためのモノレポ・ボイラープレートです。

## 特徴

- [Turborepo](https://turbo.build/)によるモノレポ管理
- **フロントエンド:** React + Vite + Tailwind CSS
- **バックエンド:** Express + TypeScript + XRPL.js
- **共通UIコンポーネント:** `@repo/ui`
- **環境変数管理:** `.env`ファイル
- **ESLint & TypeScript** 設定を全パッケージで共有

## プロジェクト構成

```
apps/
  frontend/    # Reactフロントエンドアプリ
  backend/     # ExpressバックエンドAPI
packages/
  ui/                # 共通React UIコンポーネント
  eslint-config/     # 共通ESLint設定
  typescript-config/ # 共通TypeScript設定
```

## はじめに

1. **依存関係のインストール:**

   ```sh
   npm install
   ```

2. **環境変数の設定:**

   - `apps/backend`と`apps/frontend`内で`.env.example`を`.env`にコピーし、値を入力してください。

3. **開発サーバーの起動:**

   ```sh
   npm run dev
   ```

4. **アプリURL:**
   - フロントエンド: [http://localhost:5173](http://localhost:5173)
   - バックエンド: [http://localhost:1000](http://localhost:1000)


## スクリプト

- `npm run dev` — 全アプリを開発モードで起動
- `npm run build` — 全アプリとパッケージをビルド
- `npm run lint` — 全コードをLint
- `npm run check-types` — 全コードの型チェック
- `npm run format` — コードの自動整形を実行

## カスタマイズ

- `packages/ui`に新しいUIコンポーネントを追加
  ```
  turbo gen
  ```
- `apps/backend/src/routes`に新しいAPIルートを追加
- `apps/frontend/src`に新しいページやコンポーネントを追加
