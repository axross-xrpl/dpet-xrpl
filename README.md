# Product
AI画像解析とXRPLのDynamic NFTを利用したヘルスケアアプリ「D-Pet-chi」

   - 開発中バージョンであり、XRP LedgerのDevnetを利用します。

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
  frontend/    # Reactフロントエンドアプリ(オーナー機能)
  frontend-dpet/    # Reactフロントエンドアプリ(ペット機能)
  backend/     # ExpressバックエンドAPI
packages/
  ui/                # 共通React UIコンポーネント
  eslint-config/     # 共通ESLint設定
  typescript-config/ # 共通TypeScript設定
jupyter notebook/    # AI APIサーバーの処理用 jpynbファイルを格納
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

5. **AI APIサーバーの起動:**

   - Food Classification.jpynb を[Colab](https://colab.research.google.com/)にインポートして、ランタイムのタイプに T4 GPUを指定して実行する
   - 注意事項：[Hugging Face](https://huggingface.co/) と [ngrok](https://ngrok.com/)のアカウントが必要になります。


## デモサイト
   - フロントエンド: [http://localhost:5173](http://localhost:5173)



## スクリプト

- `npm run dev` — 全アプリを開発モードで起動
- `npm run build` — 全アプリとパッケージをビルド
