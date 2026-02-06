# Content Management System - フロントエンドアーキテクチャ設計書

## 目次

1. [システム概要](#システム概要)
2. [技術スタック](#技術スタック)
3. [プロジェクト構造（Monorepo）](#プロジェクト構造monorepo)
4. [ディレクトリ構造](#ディレクトリ構造)
5. [機能モジュール設計](#機能モジュール設計)
6. [データフロー設計](#データフロー設計)
7. [API 統合設計](#api-統合設計)
8. [ファイルアップロード設計](#ファイルアップロード設計)
9. [状態管理設計](#状態管理設計)
10. [セキュリティ設計](#セキュリティ設計)
11. [ルーティング設計](#ルーティング設計)
12. [デプロイメント設計](#デプロイメント設計)
13. [パフォーマンス最適化](#パフォーマンス最適化)
14. [コーディング規約](#コーディング規約)

---

## システム概要

### プロジェクト情報

- **プロジェクト名**: JUXYI Content Management System - Web 管理画面
- **フレームワーク**: React 18 + TypeScript
- **ビルドツール**: Vite 5
- **UI フレームワーク**: Ant Design 5
- **デプロイ先**: Azure Static Web Apps
- **目的**: アプリケーション端末向けコンテンツの管理・配信

### 主要機能

1. **認証機能** - JWT ベースのログイン認証
2. **ダッシュボード** - 統計情報・最近のアクティビティ表示
3. **コンテンツ管理** - ドキュメント・ビデオ・URL リンクの統合管理
4. **ドキュメント管理** - PDF・Word ファイルのアップロード・プレビュー
5. **ビデオ管理** - ビデオファイルの直接アップロード（Azure Blob）・プレビュー
6. **URL リンク管理** - 外部リンクの作成・管理
7. **プッシュ通知管理** - Azure Notification Hubs 経由のモバイル通知送信
8. **システム設定** - メンテナンスモード設定

---

## 技術スタック

### コア技術

| カテゴリ           | 技術              | バージョン | 用途                               |
| ------------------ | ----------------- | ---------- | ---------------------------------- |
| **言語**           | TypeScript        | 5.3+       | 型安全な開発                       |
| **フレームワーク** | React             | 18.2+      | UI コンポーネント構築              |
| **ビルドツール**   | Vite              | 5.1+       | 高速ビルド・HMR                    |
| **UI ライブラリ**  | Ant Design        | 5.14+      | エンタープライズ UI コンポーネント |
| **アイコン**       | @ant-design/icons | 5.3+       | Ant Design アイコンセット          |
| **CSS**            | Tailwind CSS      | 3.4+       | ユーティリティファースト CSS       |
| **ルーティング**   | React Router      | 6.22+      | SPA ルーティング                   |

### 状態管理・データ取得

| カテゴリ              | 技術                         | 用途                                 |
| --------------------- | ---------------------------- | ------------------------------------ |
| **サーバー状態**      | TanStack Query (React Query) | API データキャッシュ・同期           |
| **クライアント状態**  | Zustand                      | 軽量グローバル状態管理（認証状態等） |
| **HTTP クライアント** | Axios                        | API 通信                             |

### フォーム・バリデーション

| カテゴリ           | 技術            | 用途                           |
| ------------------ | --------------- | ------------------------------ |
| **フォーム管理**   | React Hook Form | 高性能フォーム処理             |
| **バリデーション** | Zod             | スキーマベースのバリデーション |

### ファイル処理

| カテゴリ                 | 技術           | 用途                               |
| ------------------------ | -------------- | ---------------------------------- |
| **ファイルアップロード** | react-dropzone | ドラッグ&ドロップアップロード      |
| **PDF プレビュー**       | react-pdf      | PDF ファイル表示                   |
| **ビデオプレイヤー**     | video-react    | ビデオ再生                         |
| **テキストエディター**   | react-quill    | リッチテキスト編集（基本機能のみ） |

### ユーティリティ

| カテゴリ         | 技術  | 用途                   |
| ---------------- | ----- | ---------------------- |
| **日付処理**     | dayjs | 日付フォーマット・操作 |
| **クラス名管理** | clsx  | 条件付きクラス名結合   |

### 開発ツール

| カテゴリ           | 技術                | 用途                   |
| ------------------ | ------------------- | ---------------------- |
| **リンター**       | ESLint              | コード品質チェック     |
| **フォーマッター** | Prettier            | コードフォーマット統一 |
| **型チェック**     | TypeScript Compiler | 型安全性保証           |

---

## プロジェクト構造（Monorepo）

### リポジトリ全体構造

```
juxyi-cms/                                   # Monorepo ルート
│
├── backend/                                  # Spring Boot バックエンド
│   ├── src/
│   ├── build.gradle
│   └── README.md
│
├── frontend/                                 # React フロントエンド
│   ├── src/
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
│
├── docs/                                     # 共有ドキュメント
│   ├── ARCHITECTURE.md                       # バックエンドアーキテクチャ
│   ├── FRONTEND_ARCHITECTURE.md              # フロントエンドアーキテクチャ（本文書）
│   ├── API.md                                # API 仕様書
│   └── DEPLOYMENT.md                         # デプロイ手順書
│
├── .github/                                  # GitHub Actions（オプション）
│   └── workflows/
│       ├── backend-ci.yml
│       └── frontend-ci.yml
│
├── .azure/                                   # Azure DevOps Pipelines
│   └── pipelines/
│       ├── backend-pipeline.yml
│       └── frontend-pipeline.yml
│
├── .gitignore                                # Git 除外設定
└── README.md                                 # プロジェクト全体の README
```

---

## ディレクトリ構造

### フロントエンド完全ディレクトリ構造

```
frontend/
│
├── .azure/                                    # Azure Static Web Apps 設定
│   └── staticwebapp.config.json              # ルーティング・プロキシ設定
│
├── public/                                    # 静的リソース（ビルド時コピー）
│   ├── index.html                             # HTML テンプレート
│   ├── favicon.ico                            # ファビコン
│   ├── logo.png                               # ロゴ画像
│   └── robots.txt                             # SEO 設定
│
├── src/                                       # ソースコードルート
│   │
│   ├── main.tsx                               # アプリケーションエントリーポイント
│   │                                          # - React DOM レンダリング
│   │                                          # - グローバルプロバイダー設定
│   │                                          # - CSS インポート
│   │
│   ├── App.tsx                                # ルートコンポーネント
│   │                                          # - ルーター設定
│   │                                          # - グローバルエラーバウンダリー
│   │                                          # - レイアウト統合
│   │
│   ├── vite-env.d.ts                          # Vite 環境変数型定義
│   │
│   ├── assets/                                # 静的アセット
│   │   ├── images/                            # 画像ファイル
│   │   │   ├── logo.svg                       # ロゴ SVG
│   │   │   ├── empty-state.svg                # 空状態イラスト
│   │   │   └── placeholder.png                # プレースホルダー画像
│   │   │
│   │   └── styles/                            # グローバルスタイル
│   │       ├── index.css                      # Tailwind ベースインポート
│   │       │                                  # - @tailwind base, components, utilities
│   │       │                                  # - グローバル CSS 変数定義
│   │       │
│   │       └── antd-override.css              # Ant Design カスタマイズ
│   │                                          # - プライマリカラー上書き
│   │                                          # - コンポーネント個別スタイル調整
│   │
│   ├── components/                            # 共通コンポーネント（複数 feature で使用）
│   │   │
│   │   ├── layout/                            # レイアウトコンポーネント
│   │   │   │
│   │   │   ├── AppLayout.tsx                  # メインレイアウト
│   │   │   │                                  # - Ant Design Layout 使用
│   │   │   │                                  # - Sider（サイドバー）+ Header + Content 構成
│   │   │   │                                  # - レスポンシブ対応
│   │   │   │
│   │   │   ├── Header.tsx                     # ヘッダーコンポーネント
│   │   │   │                                  # - ユーザー情報表示
│   │   │   │                                  # - ログアウトメニュー
│   │   │   │                                  # - 通知アイコン（将来拡張用）
│   │   │   │
│   │   │   ├── Sidebar.tsx                    # サイドバーナビゲーション
│   │   │   │                                  # - メニューアイテム定義
│   │   │   │                                  # - アクティブルートハイライト
│   │   │   │                                  # - 折りたたみ対応
│   │   │   │
│   │   │   └── Breadcrumb.tsx                 # パンくずリスト
│   │   │                                      # - 現在のルートから自動生成
│   │   │                                      # - クリック可能なリンク
│   │   │
│   │   ├── common/                            # 汎用コンポーネント
│   │   │   │
│   │   │   ├── LoadingSpinner.tsx             # ローディングスピナー
│   │   │   │                                  # - Ant Design Spin ラッパー
│   │   │   │                                  # - フルページ・インライン両対応
│   │   │   │
│   │   │   ├── ErrorBoundary.tsx              # エラーバウンダリー
│   │   │   │                                  # - 予期しないエラーキャッチ
│   │   │   │                                  # - エラー情報表示
│   │   │   │                                  # - リロードボタン提供
│   │   │   │
│   │   │   ├── EmptyState.tsx                 # 空状態表示
│   │   │   │                                  # - データなし時の表示
│   │   │   │                                  # - カスタムメッセージ・アクション対応
│   │   │   │
│   │   │   ├── ConfirmModal.tsx               # 確認モーダル
│   │   │   │                                  # - 削除前確認等で使用
│   │   │   │                                  # - Promise ベース API
│   │   │   │
│   │   │   └── PageHeader.tsx                 # ページヘッダー
│   │   │                                      # - ページタイトル
│   │   │                                      # - アクションボタン配置エリア
│   │   │                                      # - パンくずリスト統合
│   │   │
│   │   ├── upload/                            # アップロード関連コンポーネント
│   │   │   │
│   │   │   ├── FileUploader.tsx               # 汎用ファイルアップローダー
│   │   │   │                                  # - react-dropzone 使用
│   │   │   │                                  # - ドラッグ&ドロップ対応
│   │   │   │                                  # - ファイルサイズ・拡張子バリデーション
│   │   │   │
│   │   │   ├── VideoUploader.tsx              # ビデオ専用アップローダー
│   │   │   │                                  # - SAS Token 取得
│   │   │   │                                  # - Azure Blob 直接アップロード
│   │   │   │                                  # - 進捗バー表示
│   │   │   │                                  # - 最大 100MB 対応
│   │   │   │
│   │   │   ├── UploadProgress.tsx             # アップロード進捗バー
│   │   │   │                                  # - Ant Design Progress 使用
│   │   │   │                                  # - パーセンテージ・速度表示
│   │   │   │                                  # - キャンセルボタン
│   │   │   │
│   │   │   └── ThumbnailUploader.tsx          # サムネイルアップローダー
│   │   │                                      # - 画像ファイル専用（JPEG/PNG）
│   │   │                                      # - プレビュー機能
│   │   │                                      # - クロップ機能（オプション）
│   │   │
│   │   ├── preview/                           # プレビューコンポーネント
│   │   │   │
│   │   │   ├── PdfViewer.tsx                  # PDF プレビュー
│   │   │   │                                  # - react-pdf 使用
│   │   │   │                                  # - ページナビゲーション
│   │   │   │                                  # - ズーム機能
│   │   │   │
│   │   │   ├── VideoPlayer.tsx                # ビデオプレイヤー
│   │   │   │                                  # - video-react 使用
│   │   │   │                                  # - 再生・一時停止・音量調整
│   │   │   │                                  # - フルスクリーン対応
│   │   │   │
│   │   │   └── ImagePreview.tsx               # 画像プレビュー
│   │   │                                      # - Ant Design Image 使用
│   │   │                                      # - 拡大・縮小機能
│   │   │
│   │   ├── editor/                            # エディター
│   │   │   │
│   │   │   └── RichTextEditor.tsx             # リッチテキストエディター
│   │   │                                      # - react-quill 使用
│   │   │                                      # - 基本フォーマット機能（太字・斜体等）
│   │   │                                      # - 画像挿入は非対応（純テキスト）
│   │   │
│   │   └── table/                             # テーブル関連
│   │       │
│   │       ├── DataTable.tsx                  # データテーブル
│   │       │                                  # - Ant Design Table ラッパー
│   │       │                                  # - ページネーション対応
│   │       │                                  # - ソート・フィルター対応
│   │       │                                  # - ローディング状態表示
│   │       │
│   │       └── TableActions.tsx               # テーブルアクション
│   │                                          # - 編集・削除ボタン
│   │                                          # - アクションメニュー（ドロップダウン）
│   │
│   ├── features/                              # 機能別モジュール（Feature-based Architecture）
│   │   │                                      # 各 feature は独立したミニアプリとして構成
│   │   │
│   │   ├── auth/                              # 認証機能モジュール
│   │   │   │
│   │   │   ├── components/                    # 認証関連コンポーネント
│   │   │   │   ├── LoginForm.tsx              # ログインフォーム
│   │   │   │   │                              # - React Hook Form 使用
│   │   │   │   │                              # - Zod バリデーション
│   │   │   │   │                              # - エラーメッセージ表示
│   │   │   │   │
│   │   │   │   └── PrivateRoute.tsx           # 認証必須ルート
│   │   │   │                                  # - 未認証時ログインページへリダイレクト
│   │   │   │                                  # - 認証状態チェック
│   │   │   │
│   │   │   ├── hooks/                         # 認証関連フック
│   │   │   │   ├── useAuth.ts                 # 認証状態管理フック
│   │   │   │   │                              # - Zustand ストア連携
│   │   │   │   │                              # - ログイン・ログアウト処理
│   │   │   │   │                              # - トークン管理
│   │   │   │   │
│   │   │   │   └── useLogin.ts                # ログインロジック
│   │   │   │                                  # - TanStack Query Mutation 使用
│   │   │   │                                  # - API 呼び出し
│   │   │   │                                  # - エラーハンドリング
│   │   │   │
│   │   │   ├── services/                      # 認証 API サービス
│   │   │   │   └── authService.ts             # 認証 API 呼び出し
│   │   │   │                                  # - POST /api/auth/login
│   │   │   │                                  # - POST /api/auth/logout
│   │   │   │
│   │   │   ├── stores/                        # 認証状態ストア
│   │   │   │   └── authStore.ts               # Zustand 認証ストア
│   │   │   │                                  # - user: User | null
│   │   │   │                                  # - isAuthenticated: boolean
│   │   │   │                                  # - setUser / logout アクション
│   │   │   │
│   │   │   ├── types/                         # 認証型定義
│   │   │   │   └── auth.types.ts              # User, LoginRequest, JwtResponse 型
│   │   │   │
│   │   │   └── pages/                         # 認証ページ
│   │   │       ├── LoginPage.tsx              # ログインページ
│   │   │       │                              # - LoginForm 統合
│   │   │       │                              # - ログイン成功時ダッシュボードへ遷移
│   │   │       │
│   │   │       └── LogoutPage.tsx             # ログアウトページ
│   │   │                                      # - ログアウト処理
│   │   │                                      # - トークン削除
│   │   │                                      # - ログインページへリダイレクト
│   │   │
│   │   ├── dashboard/                         # ダッシュボードモジュール
│   │   │   │
│   │   │   ├── components/                    # ダッシュボード用コンポーネント
│   │   │   │   ├── StatCard.tsx               # 統計カード
│   │   │   │   │                              # - Ant Design Card 使用
│   │   │   │   │                              # - 数値・ラベル・アイコン表示
│   │   │   │   │                              # - 前月比表示（オプション）
│   │   │   │   │
│   │   │   │   ├── ActivityChart.tsx          # アクティビティチャート
│   │   │   │   │                              # - 過去30日のコンテンツ作成推移
│   │   │   │   │                              # - 折れ線グラフ（Chart.js またはシンプルな棒グラフ）
│   │   │   │   │
│   │   │   │   └── RecentContent.tsx          # 最近のコンテンツ
│   │   │   │                                  # - 最新5件のコンテンツ表示
│   │   │   │                                  # - クリックで詳細ページへ遷移
│   │   │   │
│   │   │   ├── hooks/                         # ダッシュボード用フック
│   │   │   │   └── useDashboardStats.ts       # 統計データ取得
│   │   │   │                                  # - TanStack Query 使用
│   │   │   │                                  # - GET /api/dashboard/stats
│   │   │   │
│   │   │   └── pages/                         # ダッシュボードページ
│   │   │       └── DashboardPage.tsx          # ダッシュボードメインページ
│   │   │                                      # - StatCard × 4（総コンテンツ数、ドキュメント数等）
│   │   │                                      # - ActivityChart 表示
│   │   │                                      # - RecentContent 表示
│   │   │
│   │   ├── contents/                          # コンテンツ管理モジュール
│   │   │   │                                  # ドキュメント・ビデオ・URL の統合管理
│   │   │   │
│   │   │   ├── components/                    # コンテンツ用コンポーネント
│   │   │   │   ├── ContentList.tsx            # コンテンツ一覧テーブル
│   │   │   │   │                              # - DataTable 使用
│   │   │   │   │                              # - タイプ・ステータス・作成日表示
│   │   │   │   │                              # - 編集・削除アクション
│   │   │   │   │
│   │   │   │   ├── ContentCard.tsx            # コンテンツカード（グリッド表示用）
│   │   │   │   │                              # - Ant Design Card
│   │   │   │   │                              # - サムネイル・タイトル・説明表示
│   │   │   │   │
│   │   │   │   ├── ContentFilter.tsx          # フィルターコンポーネント
│   │   │   │   │                              # - タイプ選択（Document/Video/URL）
│   │   │   │   │                              # - ステータス選択（Draft/Published/Archived）
│   │   │   │   │                              # - 検索ボックス
│   │   │   │   │
│   │   │   │   ├── ContentForm.tsx            # コンテンツ作成・編集フォーム
│   │   │   │   │                              # - React Hook Form 使用
│   │   │   │   │                              # - タイトル・説明・ステータス入力
│   │   │   │   │                              # - RichTextEditor（説明文用）
│   │   │   │   │
│   │   │   │   └── ContentDetailModal.tsx     # コンテンツ詳細モーダル
│   │   │   │                                  # - 詳細情報表示
│   │   │   │                                  # - ファイルプレビュー統合
│   │   │   │
│   │   │   ├── hooks/                         # コンテンツ用フック
│   │   │   │   ├── useContents.ts             # コンテンツ一覧取得
│   │   │   │   │                              # - TanStack Query useQuery
│   │   │   │   │                              # - ページネーション対応
│   │   │   │   │                              # - フィルター・検索パラメータ
│   │   │   │   │
│   │   │   │   ├── useContentMutation.ts      # コンテンツ作成・更新・削除
│   │   │   │   │                              # - TanStack Query useMutation
│   │   │   │   │                              # - 楽観的更新（Optimistic Update）
│   │   │   │   │                              # - キャッシュ無効化
│   │   │   │   │
│   │   │   │   └── useContentSearch.ts        # コンテンツ検索
│   │   │   │                                  # - デバウンス検索
│   │   │   │                                  # - GET /api/contents/search
│   │   │   │
│   │   │   ├── services/                      # コンテンツ API サービス
│   │   │   │   └── contentService.ts          # コンテンツ API 呼び出し
│   │   │   │                                  # - GET /api/contents
│   │   │   │                                  # - POST /api/contents
│   │   │   │                                  # - PUT /api/contents/:id
│   │   │   │                                  # - DELETE /api/contents/:id
│   │   │   │
│   │   │   ├── types/                         # コンテンツ型定義
│   │   │   │   └── content.types.ts           # Content, ContentType, ContentStatus 型
│   │   │   │
│   │   │   └── pages/                         # コンテンツページ
│   │   │       ├── ContentListPage.tsx        # コンテンツ一覧ページ
│   │   │       │                              # - ContentList 表示
│   │   │       │                              # - ContentFilter 統合
│   │   │       │                              # - 新規作成ボタン
│   │   │       │
│   │   │       ├── ContentCreatePage.tsx      # コンテンツ作成ページ
│   │   │       │                              # - ContentForm 表示
│   │   │       │                              # - 作成成功時一覧ページへ遷移
│   │   │       │
│   │   │       └── ContentEditPage.tsx        # コンテンツ編集ページ
│   │   │                                      # - ContentForm 表示（編集モード）
│   │   │                                      # - 更新成功時一覧��ージへ遷移
│   │   │
│   │   ├── documents/                         # ドキュメント管理モジュール
│   │   │   │
│   │   │   ├── components/                    # ドキュメント用コンポーネント
│   │   │   │   ├── DocumentList.tsx           # ドキュメント一覧
│   │   │   │   │                              # - テーブル形式表示
│   │   │   │   │                              # - ファイル名・サイズ・アップロード日時表示
│   │   │   │   │
│   │   │   │   ├── DocumentUploadForm.tsx     # ドキュメントアップロードフォーム
│   │   │   │   │                              # - FileUploader 使用
│   │   │   │   │                              # - タイトル・説明入力
│   │   │   │   │                              # - PDF/Word ファイル対応
│   │   │   │   │
│   │   │   │   └── DocumentPreview.tsx        # ドキュメントプレビューモーダル
│   │   │   │                                  # - PdfViewer 統合
│   │   │   │                                  # - ダウンロードボタン
│   │   │   │
│   │   │   ├── hooks/                         # ドキュメント用フック
│   │   │   │   ├── useDocuments.ts            # ド��ュメント一覧取得
│   │   │   │   │                              # - GET /api/documents
│   │   │   │   │
│   │   │   │   └── useDocumentUpload.ts       # ドキュメントアップロード
│   │   │   │                                  # - SAS Token 取得
│   │   │   │                                  # - Azure Blob アップロード
│   │   │   │                                  # - POST /api/documents（メタデータ保存）
│   │   │   │
│   │   │   ├── services/                      # ドキュメント API サービス
│   │   │   │   └── documentService.ts         # ドキュメント API 呼び出し
│   │   │   │
│   │   │   ├── types/                         # ドキュメント型定義
│   │   │   │   └── document.types.ts          # Document, DocumentCreateRequest 型
│   │   │   │
│   │   │   └── pages/                         # ドキュメントページ
│   │   │       ├── DocumentListPage.tsx       # ドキュメント一覧ページ
│   │   │       │                              # - DocumentList 表示
│   │   │       │                              # - アップロードボタン
│   │   │       │
│   │   │       └── DocumentUploadPage.tsx     # ドキュメントアップロードページ
│   │   │                                      # - DocumentUploadForm 表示
│   │   │                                      # - アップロード成功時一覧へ遷移
│   │   │
│   │   ├── videos/                            # ビデオ管理モジュール
│   │   │   │
│   │   │   ├── components/                    # ビデオ用コンポーネント
│   │   │   │   ├── VideoList.tsx              # ビデオ一覧
│   │   │   │   │                              # - サムネイル付きカード表示
│   │   │   │   │                              # - 再生時間・ファイルサイズ表示
│   │   │   │   │
│   │   │   │   ├── VideoUploadForm.tsx        # ビデオアップロードフォーム
│   │   │   │   │                              # - VideoUploader 使用
│   │   │   │   │                              # - サムネイル選択・アップロード
│   │   │   │   │                              # - タイトル・説明入力
│   │   │   │   │
│   │   │   │   ├── VideoPlayer.tsx            # ビデオプレイヤー
│   │   │   │   │                              # - video-react 使用
│   │   │   │   │                              # - Azure Blob URL 再生
│   │   │   │   │
│   │   │   │   ├── VideoUploader.tsx          # ビデオアップローダー（Azure Blob 直接）
│   │   │   │   │                              # - SAS Token 取得
│   │   │   │   │                              # - Axios で PUT リクエスト
│   │   │   │   │                              # - 進捗バー表示（onUploadProgress）
│   │   │   │   │                              # - 最大 100MB 対応
│   │   │   │   │
│   │   │   │   └── ThumbnailSelector.tsx      # サムネイル選択
│   │   │   │                                  # - 手動アップロード
│   │   │   │                                  # - プレビュー表示
│   │   │   │
│   │   │   ├── hooks/                         # ビデオ用フック
│   │   │   │   ├── useVideos.ts               # ビデオ一覧取得
│   │   │   │   │                              # - GET /api/videos
│   │   │   │   │
│   │   │   │   ├── useVideoUpload.ts          # ビデオアップロード
│   │   │   │   │                              # - SAS Token 取得: POST /api/files/sas-token
│   │   │   │   │                              # - Azure Blob 直接アップロード
│   │   │   │   │                              # - メタデータ保存: POST /api/videos
│   │   │   │   │
│   │   │   │   └── useVideoProcessing.ts      # アップロード後処理
│   │   │   │                                  # - ビデオ時長取得（File API）
│   │   │   │                                  # - メタデータ抽出
│   │   │   │
│   │   │   ├── services/                      # ビデオ API サービス
│   │   │   │   └── videoService.ts            # ビデオ API 呼び出し
│   │   │   │                                  # - POST /api/files/sas-token
│   │   │   │                                  # - POST /api/videos
│   │   │   │                                  # - DELETE /api/videos/:id
│   │   │   │
│   │   │   ├── types/                         # ビデオ型定義
│   │   │   │   └── video.types.ts             # Video, VideoCreateRequest, SasTokenResponse 型
│   │   │   │
│   │   │   └── pages/                         # ビデオページ
│   │   │       ├── VideoListPage.tsx          # ビデオ一覧ページ
│   │   │       │                              # - VideoList 表示
│   │   │       │                              # - アップロードボタン
│   │   │       │
│   │   │       └── VideoUploadPage.tsx        # ビデオアップロードページ
│   │   │                                      # - VideoUploadForm 表示
│   │   │                                      # - 進捗表示
│   │   │                                      # - アップロード成功時一覧へ遷移
│   │   │
│   │   ├── url-links/                         # URLリンク管理モジュール
│   │   │   │
│   │   │   ├── components/                    # URLリンク用コンポーネント
│   │   │   │   ├── UrlLinkList.tsx            # URLリンク一覧
│   │   │   │   │                              # - テーブル表示
│   │   │   │   │                              # - URL・表示テキスト・作成日表示
│   │   │   │   │
│   │   │   │   └── UrlLinkForm.tsx            # URLリンクフォーム
│   │   │   │                                  # - URL 入力（バリデーション付き）
│   │   │   │                                  # - 表示テキスト入力
│   │   │   │                                  # - タイトル・説明入力
│   │   │   │
│   │   │   ├── hooks/                         # URLリンク用フック
│   │   │   │   └── useUrlLinks.ts             # URLリンク取得・操作
│   │   │   │                                  # - GET /api/url-links
│   │   │   │                                  # - POST /api/url-links
│   │   │   │                                  # - DELETE /api/url-links/:id
│   │   │   │
│   │   │   ├── services/                      # URLリンク API サービス
│   │   │   │   └── urlLinkService.ts          # URLリンク API 呼び出し
│   │   │   │
│   │   │   ├── types/                         # URLリンク型定義
│   │   │   │   └── urlLink.types.ts           # UrlLink, UrlLinkCreateRequest 型
│   │   │   │
│   │   │   └── pages/                         # URLリンクページ
│   │   │       ├── UrlLinkListPage.tsx        # URLリンク一覧ページ
│   │   │       │                              # - UrlLinkList 表示
│   │   │       │                              # - 新規作成ボタン
│   │   │       │
│   │   │       └── UrlLinkCreatePage.tsx      # URLリンク作成ページ
│   │   │                                      # - UrlLinkForm 表示
│   │   │                                      # - 作成成功時一覧へ遷移
│   │   │
│   │   ├── notifications/                     # プッシュ通知管理モジュール
│   │   │   │                                  # Azure Notification Hubs 統合
│   │   │   │
│   │   │   ├── components/                    # 通知用コンポーネント
│   │   │   │   ├── NotificationList.tsx       # 通知履歴一覧
│   │   │   │   │                              # - 過去の送信履歴表示
│   │   │   │   │                              # - タイトル・メッセージ・送信日時・対象プラットフォーム表示
│   │   │   │   │
│   │   │   │   ├── NotificationForm.tsx       # 通知作成フォーム
│   │   │   │   │                              # - タイトル入力（必須）
│   │   │   │   │                              # - メッセージ入力（必須）
│   │   │   │   │                              # - プラットフォーム選択（iOS/Android チェックボックス）
│   │   │   │   │                              # - 送信対象選択（全ユーザー/iOS のみ/Android のみ）
│   │   │   │   │                              # - 送信方式選択（即時送信/スケジュール送信）
│   │   │   │   │                              # - スケジュール日時選択（DatePicker）
│   │   │   │   │
│   │   │   │   ├── PlatformSelector.tsx       # プラットフォーム選択
│   │   │   │   │                              # - iOS/Android チェックボックス
│   │   │   │   │                              # - アイコン表示
│   │   │   │   │
│   │   │   │   ├── AudienceSelector.tsx       # 送信対象選択
│   │   │   │   │                              # - ラジオボタン選択
│   │   │   │   │                              # - 全ユーザー/プラットフォーム別/カスタムタグ
│   │   │   │   │
│   ���   │   │   ├── NotificationPreview.tsx    # 通知プレビュー
│   │   │   │   │                              # - モバイル通知の表示イメージ
│   │   │   │   │                              # - iOS/Android スタイル切り替え
│   │   │   │   │
│   │   │   │   └── TestDeviceSelector.tsx     # テストデバイス選択
│   │   │   │                                  # - 登録済みテストデバイス一覧
│   │   │   │                                  # - デバイス ID 入力
│   │   │   │                                  # - テスト送信ボタン
│   │   │   │
│   │   │   ├── hooks/                         # 通知用フック
│   │   │   │   ├── useNotifications.ts        # 通知履歴取得
│   │   │   │   │                              # - GET /api/notifications
│   │   │   │   │                              # - ページネーション対応
│   │   │   │   │
│   │   │   │   ├── useSendNotification.ts     # 通知送信
│   │   │   │   │                              # - POST /api/notifications/send（即時送信）
│   │   │   │   │                              # - POST /api/notifications/schedule（スケジュール送信）
│   │   │   │   │                              # - 成功時確認メッセージ表示
│   │   │   │   │
│   │   │   │   └── useTestNotification.ts     # テスト通知送信
│   │   │   │                                  # - POST /api/notifications/test
│   │   │   │                                  # - 特定デバイスへ送信
│   │   │   │
│   │   │   ├── services/                      # 通知 API サービス
│   │   │   │   └── notificationService.ts     # 通知 API 呼び出し
│   │   │   │                                  # - Azure Notification Hubs API ラッパー
│   │   │   │
│   │   │   ├── types/                         # 通知型定義
│   │   │   │   └── notification.types.ts      # Notification, SendNotificationRequest 型
│   │   │   │                                  # - platforms: ('ios' | 'android')[]
│   │   │   │                                  # - targetAudience: 'all' | 'ios' | 'android' | 'custom'
│   │   │   │                                  # - scheduleTime?: Date
│   │   │   │
│   │   │   └── pages/                         # 通知ページ
│   │   │       ├── NotificationListPage.tsx   # 通知一覧ページ
│   │   │       │                              # - NotificationList 表示
│   │   │       │                              # - 新規通知作成ボタン
│   │   │       │
│   │   │       └── NotificationCreatePage.tsx # 通知作成ページ
│   │   │                                      # - NotificationForm 表示
│   │   │                                      # - NotificationPreview 表示
│   │   │                                      # - TestDeviceSelector 表示
│   │   │                                      # - 送信成功時一覧へ遷移
│   │   │
│   │   └── system/                            # システム設定モジュール
│   │       │
│   │       ├── components/                    # システム設定用コンポーネント
│   │       │   ├── MaintenanceModeToggle.tsx  # メンテナンスモード切り替え
│   │       │   │                              # - Ant Design Switch 使用
│   │       │   │                              # - ON/OFF 状態表示
│   │       │   │                              # - 切り替え時確認モーダル
│   │       │   │
│   │       │   ├── MaintenanceMessageEditor.tsx # メンテナンスメッセージ編集
│   │       │   │                                # - TextArea 入力
│   │       │   │                                # - App 端末に表示されるメッセージ
│   │       │   │                                # - プレビュー機能
│   │       │   │
│   │       │   └── SystemSettingsForm.tsx     # システム設定フォーム
│   │       │                                  # - メンテナンスモード設定
│   │       │                                  # - その他システム設定（将来拡張用）
│   │       │
│   │       ├── hooks/                         # システム設定用フック
│   │       │   ├── useMaintenanceMode.ts      # メンテナンスモード状態管理
│   │       │   │                              # - GET /api/system/maintenance
│   │       │   │                              # - PUT /api/system/maintenance
│   │       │   │                              # - リアルタイム状態更新
│   │       │   │
│   │       │   └── useSystemSettings.ts       # システム設定取得
│   │       │                                  # - GET /api/system/settings
│   │       │
│   │       ├── services/                      # システム設定 API サービス
│   │       │   └── systemService.ts           # システム設定 API 呼び出し
│   │       │
│   │       ├── types/                         # システム設定型定義
│   │       │   └── system.types.ts            # MaintenanceMode, SystemSettings 型
│   │       │
│   │       └── pages/                         # システム設定ページ
│   │           └── SystemSettingsPage.tsx     # システム設定ページ
│   │                                          # - MaintenanceModeToggle 表示
│   │                                          # - MaintenanceMessageEditor 表示
│   │                                          # - 保存ボタン
│   │
│   ├── lib/                                   # ライブラリ・ユーティリティ
│   │   │
│   │   ├── api/                               # API 関連設定
│   │   │   ├── axios.ts                       # Axios インスタンス設定
│   │   │   │                                  # - ベース URL 設定（環境変数から取得）
│   │   │   │                                  # - タイムアウト設定（30秒）
│   │   │   │                                  # - リクエストインターセプター（JWT 自動付与）
│   │   │   │                                  # - レスポンスインターセプター（エラーハンドリング）
│   │   │   │
│   │   │   ├── interceptors.ts                # インターセプター定義
│   │   │   │                                  # - 401 エラー時ログアウト処理
│   │   │   │                                  # - 500 エラー時通知表示
│   │   │   │                                  # - リトライロジック（オプション）
│   │   │   │
│   │   │   └── queryClient.ts                 # TanStack Query 設定
│   │   │                                      # - デフォルトオプション設定
│   │   │                                      # - staleTime: 5分
│   │   │                                      # - retry: 1回
│   │   │                                      # - refetchOnWindowFocus: false
│   │   │
│   │   ├── utils/                             # ユーティリティ関数
│   │   │   ├── formatters.ts                  # フォーマット関数
│   │   │   │                                  # - formatDate: 日付フォーマット（dayjs 使用）
│   │   │   │                                  # - formatFileSize: ファイルサイズ変換（bytes → MB）
│   │   │   │                                  # - formatDuration: 秒 → HH:MM:SS 変換
│   │   │   │
│   │   │   ├── validators.ts                  # バリデーション関数
│   │   │   │                                  # - isValidUrl: URL 形式チェック
│   │   │   │                                  # - isValidEmail: メールアドレスチェック
│   │   │   │                                  # - isValidFileType: ファイル拡張子チェック
│   │   │   │
│   │   │   ├── fileUtils.ts                   # ファイル操作ユーティリティ
│   │   │   │                                  # - getFileExtension: 拡張子取得
│   │   │   │                                  # - getFileSizeInMB: ファイルサイズ取得（MB）
│   │   │   │                                  # - extractVideoMetadata: ビデオメタデータ抽出（File API）
│   │   │   │
│   │   │   ├── tokenUtils.ts                  # トークン管理ユーティリティ
│   │   │   │                                  # - getAccessToken: localStorage からトークン取得
│   │   │   │                                  # - setAccessToken: トークン保存
│   │   │   │                                  # - removeTokens: トークン削除
│   │   │   │                                  # - isTokenExpired: トークン有効期限チェック
│   │   │   │
│   │   │   └── errorHandler.ts                # エラーハンドリングユーティリティ
│   │   │                                      # - getErrorMessage: エラーメッセージ抽出
│   │   │                                      # - logError: エラーログ記録（Console + Application Insights）
│   │   │
│   │   └── constants/                         # 定数定義
│   │       ├── api.constants.ts               # API エンドポイント定数
│   │       │                                  # - AUTH_ENDPOINTS: { LOGIN, LOGOUT, ... }
│   │       │                                  # - CONTENT_ENDPOINTS: { LIST, CREATE, ... }
│   │       │                                  # - FILE_ENDPOINTS: { UPLOAD, SAS_TOKEN, ... }
│   │       │
│   │       ├── app.constants.ts               # アプリケーション定数
│   │       │                                  # - DEFAULT_PAGE_SIZE: 20
│   │       │                                  # - MAX_FILE_SIZE: 100MB
│   │       │                                  # - ALLOWED_VIDEO_EXTENSIONS: ['.mp4', '.mov', ...]
│   │       │                                  # - CONTENT_TYPES: { DOCUMENT, VIDEO, URL_LINK }
│   │       │
│   │       └── validation.constants.ts        # バリデーションルール定数
│   │                                          # - MIN_PASSWORD_LENGTH: 6
│   │                                          # - MAX_TITLE_LENGTH: 200
│   │                                          # - MAX_DESCRIPTION_LENGTH: 5000
│   │
│   ├── hooks/                                 # グローバルカスタムフック
│   │   ├── useDebounce.ts                     # デバウンスフック
│   │   │                                      # - 検索入力等の遅延処理
│   │   │                                      # - デフォルト遅延: 500ms
│   │   │
│   │   ├── useLocalStorage.ts                 # LocalStorage フック
│   │   │                                      # - useState と同期した LocalStorage 操作
│   │   │                                      # - JSON シリアライズ対応
│   │   │
│   │   └── useNotification.ts                 # 通知フック
│   │                                          # - Ant Design message/notification ラッパー
│   │                                          # - success, error, warning, info メソッド提供
│   │
│   ├── routes/                                # ルーティング設定
│   │   ├── index.tsx                          # メインルート定義
│   │   │                                      # - React Router createBrowserRouter 使用
│   │   │                                      # - 全ページルート定義
│   │   │                                      # - Lazy Loading 設定（React.lazy）
│   │   │
│   │   ├── PrivateRoute.tsx                   # 認証必須ルートラッパー
│   │   │                                      # - 未認証時 /login へリダイレクト
│   │   │                                      # - 認証チェック（useAuth フック使用）
│   │   │
│   │   └── RouteConfig.tsx                    # ルート設定定義
│   │                                          # - パス・コンポーネント・メタ情報定義
│   │                                          # - パンくずリスト生成用情報
│   │
│   ├── types/                                 # グローバル型定義
│   │   ├── api.types.ts                       # API レスポンス共通型
│   │   │                                      # - ApiResponse<T>: { success, message, data, timestamp }
│   │   │                                      # - PageResponse<T>: ページネーション型
│   │   │                                      # - ErrorResponse: エラーレスポンス型
│   │   │
│   │   ├── common.types.ts                    # 共通型定義
│   │   │                                      # - ID: number | string
│   │   │                                      # - Timestamp: string（ISO 8601）
│   │   │                                      # - Status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
│   │   │
│   │   └── index.ts                           # 型エクスポート集約
│   │                                          # - すべての型を export
│   │
│   └── config/                                # 設定ファイル
│       ├── env.ts                             # 環境変数管理
│       │                                      # - import.meta.env のラッパー
│       │                                      # - 型安全な環境変数アクセス
│       │                                      # - API_BASE_URL, APP_VERSION 等
│       │
│       └── routes.config.ts                   # ルート設定
│                                              # - ルートパス定数定義
│                                              # - ROUTES.DASHBOARD, ROUTES.CONTENTS 等
│
├── .env                                       # 環境変数（ローカル開発用・Git 除外）
│                                              # VITE_API_BASE_URL=http://localhost:8080/api
│
├── .env.development                           # 開発環境変数
│                                              # VITE_API_BASE_URL=http://localhost:8080/api
│                                              # VITE_APP_INSIGHTS_KEY=dev-key
│
├── .env.staging                               # ステージング環境変数
│                                              # VITE_API_BASE_URL=https://juxyi-cms-staging.azurewebsites.net/api
│                                              # VITE_APP_INSIGHTS_KEY=staging-key
│
├── .env.production                            # 本番環境変数
│                                              # VITE_API_BASE_URL=https://juxyi-cms-prod.azurewebsites.net/api
│                                              # VITE_APP_INSIGHTS_KEY=prod-key
│
├── .eslintrc.cjs                              # ESLint 設定
│                                              # - TypeScript + React ルール
│                                              # - Prettier 統合
│
├── .prettierrc                                # Prettier 設定
│                                              # - セミコロン: あり
│                                              # - シングルクォート: あり
│                                              # - タブ幅: 2
│
├── tailwind.config.js                         # Tailwind CSS 設定
│                                              # - Ant Design カラー統合
│                                              # - カスタムブレークポイント
│
├── tsconfig.json                              # TypeScript 設定
│                                              # - strict: true
│                                              # - target: ES2020
│                                              # - パスエイリアス: @/* → src/*
│
├── tsconfig.node.json                         # Node.js 用 TypeScript 設定
│                                              # - Vite 設定ファイル用
│
├── vite.config.ts                             # Vite 設定
│                                              # - React プラグイン
│                                              # - パスエイリアス設定
│                                              # - ビルド最適化
│                                              # - プロキシ設定（開発時）
│
├── package.json                               # 依存関係・スクリプト定義
│                                              # - scripts: dev, build, preview, lint, format
│                                              # - dependencies: React, Ant Design, Axios 等
│
└── README.md                                  # プロジェクト説明
                                               # - セットアップ手順
                                               # - 開発ガイド
                                               # - ビルド・デプロイ手順
```

---

## 機能モジュール設計

### Feature-based Architecture の利点

本プロジェクトでは **Feature-based Architecture（機能モジュール設計）** を採用しています。

#### 採用理由

1. **高凝集性**: �� 機能の関連コードが一箇所に集約され、理解・修正が容易
2. **低結合性**: モジュール間の依存関係が明確で、独立して開発可能
3. **スケーラビリティ**: 新機能追加時、新しい feature フォルダを作成するだけ
4. **チーム協業**: 異なるメンバーが異なる feature を並行開発可能
5. **コード削除容易**: 不要な機能は feature フォルダごと削除

#### 各 Feature の構成

すべての feature は以下の共通構造を持ちます：

```
feature-name/
├── components/        # feature 専用コンポーネント
├── hooks/             # feature 専用カスタムフック
├── services/          # feature 専用 API サービス
├── stores/            # feature 専用状態管理（必要な場合）
├── types/             # feature 専用型定義
└── pages/             # feature のページコンポーネント
```

### 主要機能モジュール一覧

| Feature           | 主要機能           | ページ数 | API エンドポイント                   |
| ----------------- | ------------------ | -------- | ------------------------------------ |
| **auth**          | JWT 認証           | 1        | POST /api/auth/login                 |
| **dashboard**     | 統計情報表示       | 1        | GET /api/dashboard/stats             |
| **contents**      | コンテンツ統合管理 | 3        | /api/contents/\*                     |
| **documents**     | ドキュメント管理   | 2        | /api/documents/\*                    |
| **videos**        | ビデオ管理         | 2        | /api/videos/\*, /api/files/sas-token |
| **url-links**     | URL リンク管理     | 2        | /api/url-links/\*                    |
| **notifications** | プッシュ通知       | 2        | /api/notifications/\*                |
| **system**        | システム設定       | 1        | /api/system/\*                       |

---

## データフロー設計

### クライアント・サーバーデータフロー

```
┌─────────────────────────────────────────────────────────────────┐
│                    React コンポーネント                          │
│                                                                 │
│  ┌──────────────┐         ┌──────────────┐                    │
│  │  Pages       │         │  Components  │                    │
│  │  - ユーザー  │◄────────┤  - UI 表示   │                    │
│  │    インタラクション │        │  - イベント  │                    │
│  └──────┬───────┘         │    ハンドリング │                    │
│         │                 └──────────────┘                    │
│         │ イベント発火                                          │
│         │                                                     │
└─────────┼─────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│              Custom Hooks（ビジネスロジック層）                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  TanStack Query (React Query)                            │  │
│  │  - useQuery: データ取得・キャッシュ管理                   │  │
│  │  - useMutation: データ変更（作成・更新・削除）            │  │
│  │  - キャッシュ無効化・楽観的更新                           │  │
│  └────────────────────┬─────────────────────────────────────┘  │
│                       │                                         │
│  ┌────────────────────▼─────────────────────────────────────┐  │
│  │  Zustand（クライアント状態管理）                          │  │
│  │  - 認証状態（user, isAuthenticated）                      │  │
│  │  - UI 状態（サイドバー開閉等）                            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────┬───────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  API Services 層                                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Axios インスタンス                                       │  │
│  │  - baseURL: VITE_API_BASE_URL                            │  │
│  │  - リクエストインターセプター（JWT 自動付与）             │  │
│  │  - レスポンスインターセプター（エラーハンドリング）       │  │
│  └────────────────────┬─────────────────────────────────────┘  │
└───────────────────────┼─────────────────────────────────────────┘
                        │ HTTP Request
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Azure Front Door Premium                        │
│                 - WAF（SQL Injection / XSS 防御）               │
│                 - DDoS 保護                                     │
│                 - 負荷分散                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              Spring Boot Backend (App Service)                  │
│              - REST API エンドポイント                           │
│              - JWT 認証検証                                      │
│              - ビジネスロジック処理                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Azure SQL   │  │  Azure Blob  │  │ Azure Redis  │
│  Database    │  │  Storage     │  │  Cache       │
└──────────────┘  └──────────────┘  └──────────────┘
```

### ファイルアップロードフロー（Azure Blob 直接アップロード）

```
┌────────────┐                           ┌──────────────┐
│  React     │                           │   Backend    │
│  Frontend  │                           │  (App Service)│
└─────┬──────┘                           └───────┬──────┘
      │                                          │
      │ 1. ファイル選択（100MB ビデオ）           │
      │                                          │
      │ 2. SAS Token リクエスト                  │
      │    POST /api/files/sas-token             │
      ├─────────────────────────────────────────>│
      │                                          │
      │                                          │ 3. SAS Token 生成
      │                                          │    - 有効期限: 1時間
      │                                          │    - Write 権限のみ
      │                                          │
      │ 4. SAS Token レスポンス                  │
      │    { sasToken, blobUrl, expiresAt }     │
      │<─────────────────────────────────────────┤
      │                                          │
      │                                          │
      │ 5. Azure Blob Storage へ直接アップロード  │
      │    PUT https://{storage}.blob.core.windows.net/{container}/{filename}?{sasToken}
      ├──────────────────────────────────────────────────────────┐
      │                                                           │
      │ 6. 進捗バー更新（Axios onUploadProgress）                │
      │    - 0% → 25% → 50% → 75% → 100%                        │
      │                                                           │
      │ 7. アップロード完了レスポンス                             │
      │<──────────────────────────────────────────────────────────┤
      │                                                           │
      │                                          ┌────────────────▼─────┐
      │                                          │  Azure Blob Storage  │
      │                                          │  - ビデオファイル保存 │
      │                                          └──────────────���───────┘
      │
      │ 8. メタデータ保存リクエスト
      │    POST /api/videos
      │    { title, description, videoUrl, duration, fileSize }
      ├─────────────────────────────────────────>│
      │                                          │
      │                                          │ 9. DB にメタデータ保存
      │                                          │    INSERT INTO videos
      │                                          │
      │ 10. 成功レスポンス                        │
      │    { id, videoUrl, ... }                 │
      │<─────────────────────────────────────────┤
      │                                          │
      │ 11. 成功メッセージ表示                    │
      │     "ビデオアップロード完了！"             │
      │                                          │
```

---

## API 統合設計

### Axios 設定

```typescript name=src/lib/api/axios.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import { getAccessToken, removeTokens } from '@/lib/utils/tokenUtils';

// 環境変数から API ベース URL を取得
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Axios インスタンス作成
 * すべての API リクエストでこのインスタンスを使用
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30秒タイムアウト
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * リクエストインターセプター
 * すべてのリクエスト送信前に実行
 * - JWT トークンを自動的に Authorization ヘッダーに付与
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

/**
 * レスポンスインターセプター
 * すべてのレスポンス受信後に実行
 * - 共通エラーハンドリング
 * - ApiResponse<T> の data を直接返す
 */
apiClient.interceptors.response.use(
  response => {
    // ApiResponse<T> の data を直接返す
    return response.data;
  },
  (error: AxiosError<{ success: boolean; message: string }>) => {
    // 401 Unauthorized - トークン無効または期限切れ
    if (error.response?.status === 401) {
      message.error('認証が切れました。再ログインしてください。');
      removeTokens(); // トークン削除
      window.location.href = '/login'; // ログインページへリダイレクト
    }

    // 403 Forbidden - 権限不足
    if (error.response?.status === 403) {
      message.error('この操作を実行する権限がありません。');
    }

    // 500 Internal Server Error
    if (error.response?.status === 500) {
      message.error(
        'サーバーエラーが発生しました。後でもう一度お試しください。',
      );
    }

    // その他のエラー
    const errorMessage =
      error.response?.data?.message || 'エラーが発生しました';
    message.error(errorMessage);

    return Promise.reject(error);
  },
);
```

### TanStack Query 設定

```typescript name=src/lib/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

/**
 * TanStack Query クライアント設定
 * - サーバー状態管理（API データのキャッシュ・同期）
 * - 自動バックグラウンド更新
 * - 楽観的更新（Optimistic Update）
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // 失敗時1回のみリトライ（0 = リトライなし）
      refetchOnWindowFocus: false, // ウィンドウフォーカス時の自動再取得無効
      staleTime: 5 * 60 * 1000, // 5分間はキャッシュを有効とみなす
      gcTime: 10 * 60 * 1000, // 10分間キャッシュを保持（旧 cacheTime）
    },
    mutations: {
      retry: 0, // ミューテーション（作成・更新・削除）はリトライしない
    },
  },
});
```

### API Service 例（Content Service）

```typescript name=src/features/contents/services/contentService.ts
import { apiClient } from '@/lib/api/axios';
import type {
  Content,
  ContentCreateRequest,
  ContentUpdateRequest,
  PageResponse,
} from '../types/content.types';

/**
 * コンテンツ API サービス
 * バックエンド API とのすべての通信を担当
 */
export const contentService = {
  /**
   * コンテンツ一覧取得
   * @param page ページ番号（0始まり）
   * @param size ページサイズ
   * @param contentType フィルター: コンテンツタイプ（オプション）
   * @param status フィルター: ステータス（オプション）
   */
  getContents: async (params: {
    page: number;
    size: number;
    contentType?: string;
    status?: string;
  }): Promise<PageResponse<Content>> => {
    const response = await apiClient.get('/contents', { params });
    return response.data;
  },

  /**
   * コンテンツ詳細取得
   * @param id コンテンツ ID
   */
  getContentById: async (id: number): Promise<Content> => {
    const response = await apiClient.get(`/contents/${id}`);
    return response.data;
  },

  /**
   * コンテンツ作成
   * @param data コンテンツ作成データ
   */
  createContent: async (data: ContentCreateRequest): Promise<Content> => {
    const response = await apiClient.post('/contents', data);
    return response.data;
  },

  /**
   * コンテンツ更新
   * @param id コンテンツ ID
   * @param data 更新データ
   */
  updateContent: async (
    id: number,
    data: ContentUpdateRequest,
  ): Promise<Content> => {
    const response = await apiClient.put(`/contents/${id}`, data);
    return response.data;
  },

  /**
   * コンテンツ削除
   * @param id コンテンツ ID
   */
  deleteContent: async (id: number): Promise<void> => {
    await apiClient.delete(`/contents/${id}`);
  },

  /**
   * コンテンツ検索
   * @param keyword 検索キーワード
   * @param page ページ番号
   * @param size ページサイズ
   */
  searchContents: async (params: {
    keyword: string;
    page: number;
    size: number;
  }): Promise<PageResponse<Content>> => {
    const response = await apiClient.get('/contents/search', { params });
    return response.data;
  },
};
```

---

## ファイルアップロード設計

### Azure Blob Storage 直接アップロード実装

#### 1. SAS Token 取得サービス

```typescript name=src/features/videos/services/videoService.ts
import { apiClient } from '@/lib/api/axios';
import axios from 'axios';

export interface SasTokenResponse {
  sasToken: string; // SAS トークン（クエリパラメータ）
  blobUrl: string; // アップロード先 Blob URL
  expiresAt: string; // 有効期限（ISO 8601）
}

/**
 * ビデオアップロード用 SAS Token 取得
 * @param fileName ファイル名
 * @param fileSize ファイルサイズ（bytes）
 */
export const getSasToken = async (
  fileName: string,
  fileSize: number,
): Promise<SasTokenResponse> => {
  const response = await apiClient.post('/files/sas-token', {
    fileName,
    fileSize,
    contentType: 'video/*',
    folder: 'videos', // Azure Blob Storage のフォルダ
  });
  return response.data;
};

/**
 * Azure Blob Storage へ直接ファイルアップロード
 * @param file アップロードするファイル
 * @param sasToken SAS トークン
 * @param blobUrl Blob URL
 * @param onProgress 進捗コールバック
 */
export const uploadToBlob = async (
  file: File,
  sasToken: string,
  blobUrl: string,
  onProgress?: (progress: number) => void,
): Promise<void> => {
  // SAS Token を含む完全な URL を構築
  const uploadUrl = `${blobUrl}?${sasToken}`;

  // Axios で PUT リクエスト（Azure Blob Storage API）
  await axios.put(uploadUrl, file, {
    headers: {
      'x-ms-blob-type': 'BlockBlob', // Block Blob として保存
      'Content-Type': file.type, // ビデオの MIME タイプ
    },
    onUploadProgress: progressEvent => {
      if (progressEvent.total && onProgress) {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress(progress);
      }
    },
  });
};

/**
 * ビデオメタデータ保存（アップロード完了後）
 * @param data ビデオメタデータ
 */
export const saveVideoMetadata = async (data: {
  title: string;
  description?: string;
  videoUrl: string;
  thumbnailUrl?: string;
  duration?: number;
  fileSize: number;
}): Promise<void> => {
  await apiClient.post('/videos', data);
};
```

#### 2. ビデオアップロードコンポーネント

```typescript name=src/features/videos/components/VideoUploader.tsx
import React, { useState } from 'react';
import { Upload, Progress, message, Button } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { getSasToken, uploadToBlob } from '../services/videoService';

const { Dragger } = Upload;

interface VideoUploaderProps {
  onUploadComplete: (videoUrl: string) => void; // アップロード完了コールバック
}

/**
 * ビデオアップローダーコンポーネント
 * - Azure Blob Storage へ直接アップロード
 * - 進捗バー表示
 * - 最大 100MB 対応
 */
export const VideoUploader: React.FC<VideoUploaderProps> = ({
  onUploadComplete,
}) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  /**
   * ファイル選択時の処理
   * @param file 選択されたファイル
   */
  const handleUpload = async (file: File) => {
    // ファイルサイズチェック（100MB = 104857600 bytes）
    if (file.size > 100 * 1024 * 1024) {
      message.error('ファイルサイズは 100MB 以下にしてください');
      return false;
    }

    // ファイルタイプチェック
    const allowedTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (!allowedTypes.includes(file.type)) {
      message.error(
        'サポートされていないファイル形式です（MP4, MOV, AVI のみ）',
      );
      return false;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 1. バックエンドから SAS Token 取得
      const { sasToken, blobUrl } = await getSasToken(file.name, file.size);

      // 2. Azure Blob Storage へ直接アップロード
      await uploadToBlob(file, sasToken, blobUrl, progress => {
        setUploadProgress(progress);
      });

      // 3. アップロード完了
      message.success('アップロード完了！');
      onUploadComplete(blobUrl); // 親コンポーネントへ URL を渡す
    } catch (error) {
      console.error('Upload failed:', error);
      message.error('アップロードに失敗しました。もう一度お試しください。');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }

    return false; // Ant Design の自動アップロード無効化
  };

  return (
    <div>
      <Dragger
        name="file"
        multiple={false}
        accept="video/*"
        beforeUpload={handleUpload}
        disabled={uploading}
        showUploadList={false}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">
          クリックまたはドラッグしてビデオをアップロード
        </p>
        <p className="ant-upload-hint">最大 100MB（MP4, MOV, AVI 対応）</p>
      </Dragger>

      {/* アップロード進捗バー */}
      {uploading && (
        <div className="mt-4">
          <Progress
            percent={uploadProgress}
            status="active"
            strokeColor={{
              '0%': '#108ee9',
              '100%': '#87d068',
            }}
          />
          <p className="text-center text-gray-600 mt-2">
            アップロード中... {uploadProgress}%
          </p>
        </div>
      )}
    </div>
  );
};
```

#### 3. ビデオアップロードページ

```typescript name=src/features/videos/pages/VideoUploadPage.tsx
import React, { useState } from 'react';
import { Card, Form, Input, Button, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { VideoUploader } from '../components/VideoUploader';
import { ThumbnailUploader } from '../components/ThumbnailUploader';
import { saveVideoMetadata } from '../services/videoService';
import { extractVideoMetadata } from '@/lib/utils/fileUtils';

/**
 * ビデオアップロードページ
 */
export const VideoUploadPage: React.FC = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [videoUrl, setVideoUrl] = useState<string>('');
  const [thumbnailUrl, setThumbnailUrl] = useState<string>('');
  const [duration, setDuration] = useState<number | undefined>();
  const [saving, setSaving] = useState(false);

  /**
   * ビデオアップロード完了時の処理
   */
  const handleVideoUploadComplete = async (url: string, file: File) => {
    setVideoUrl(url);

    // ビデオの再生時間を抽出（File API 使用）
    try {
      const metadata = await extractVideoMetadata(file);
      setDuration(metadata.duration);
    } catch (error) {
      console.error('Failed to extract video metadata:', error);
    }
  };

  /**
   * サムネイルアップロード完了時の処理
   */
  const handleThumbnailUploadComplete = (url: string) => {
    setThumbnailUrl(url);
  };

  /**
   * フォーム送信処理
   */
  const handleSubmit = async (values: any) => {
    if (!videoUrl) {
      message.error('ビデオをアップロードしてください');
      return;
    }

    setSaving(true);

    try {
      // バックエンドにメタデータ保存
      await saveVideoMetadata({
        title: values.title,
        description: values.description,
        videoUrl,
        thumbnailUrl,
        duration,
        fileSize: 0, // ファイルサイズは省略（バックエンドで取得可能）
      });

      message.success('ビデオを保存しました');
      navigate('/videos'); // 一覧ページへ遷移
    } catch (error) {
      message.error('保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6">
      <Card title="���デオアップロード">
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {/* ビデオアップロード */}
          <Form.Item label="ビデオファイル" required>
            <VideoUploader onUploadComplete={handleVideoUploadComplete} />
          </Form.Item>

          {/* サムネイルアップロード */}
          <Form.Item label="サムネイル画像（オプション）">
            <ThumbnailUploader
              onUploadComplete={handleThumbnailUploadComplete}
            />
          </Form.Item>

          {/* タイトル */}
          <Form.Item
            label="タイトル"
            name="title"
            rules={[{ required: true, message: 'タイトルを入力してください' }]}
          >
            <Input placeholder="ビデオのタイトル" />
          </Form.Item>

          {/* 説明 */}
          <Form.Item label="説明" name="description">
            <Input.TextArea rows={4} placeholder="ビデオの説明" />
          </Form.Item>

          {/* 再生時間表示 */}
          {duration && (
            <Form.Item label="再生時間">
              <Input
                value={`${Math.floor(duration / 60)}分${duration % 60}秒`}
                disabled
              />
            </Form.Item>
          )}

          {/* 送信ボタン */}
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={saving}
              disabled={!videoUrl}
            >
              保存
            </Button>
            <Button className="ml-2" onClick={() => navigate('/videos')}>
              キャンセル
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};
```

---

## 状態管理設計

### 状態管理戦略

本プロジェクトでは **2 層状態管理** を採用：

1. **サーバー状態**: TanStack Query（React Query）
2. **クライアント状態**: Zustand

#### 1. サーバー状態管理（TanStack Query）

API から取得したデータのキャッシュ・同期を担当。

**使用例**:

```typescript name=src/features/contents/hooks/useContents.ts
import { useQuery } from '@tanstack/react-query';
import { contentService } from '../services/contentService';

/**
 * コンテンツ一覧取得フック
 * @param page ページ番号
 * @param size ページサイズ
 */
export const useContents = (page: number = 0, size: number = 20) => {
  return useQuery({
    queryKey: ['contents', page, size], // キャッシュキー
    queryFn: () => contentService.getContents({ page, size }),
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ有効
  });
};
```

**使用例（コンポーネント内）**:

```typescript
const { data, isLoading, error } = useContents(0, 20);

if (isLoading) return <LoadingSpinner />;
if (error) return <div>エラーが発生しました</div>;

return <ContentList contents={data.content} />;
```

#### 2. クライアント状態管理（Zustand）

認証状態・UI 状態等、クライアント側のみで管理する状態を担当。

**認証ストア例**:

```typescript name=src/features/auth/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null; // ログイン中のユーザー
  isAuthenticated: boolean; // 認証済みフラグ
  setUser: (user: User) => void; // ユーザー設定
  logout: () => void; // ログアウト
}

/**
 * 認証状態ストア（Zustand）
 * - LocalStorage に永続��（ページリロード後も保持）
 */
export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      isAuthenticated: false,

      // ユーザー設定（ログイン成功時）
      setUser: user => set({ user, isAuthenticated: true }),

      // ログアウト
      logout: () => set({ user: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage', // LocalStorage のキー名
    },
  ),
);
```

**使用例**:

```typescript
const { user, isAuthenticated, logout } = useAuthStore();

if (!isAuthenticated) {
  return <Navigate to="/login" />;
}

return (
  <div>
    <p>ようこそ、{user.username} さん</p>
    <Button onClick={logout}>ログアウト</Button>
  </div>
);
```

---

## セキュリティ設計

### JWT 認証フロー

```
1. ユーザーがログインフォーム送信
   ↓
2. POST /api/auth/login { username, password }
   ↓
3. バックエンドがユーザー検証・JWT 発行
   ↓
4. フロントエンドが JWT を LocalStorage に保存
   ↓
5. 以降の全リクエストで Authorization: Bearer {JWT} ヘッダー付与
   ↓
6. バックエンドが JWT 検証
   ↓
7. 有効なら API レスポンス返却
   無効なら 401 Unauthorized
```

### トークン管理ユーティリティ

```typescript name=src/lib/utils/tokenUtils.ts
const ACCESS_TOKEN_KEY = 'access_token';

/**
 * アクセストークン取得
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
};

/**
 * アクセストークン保存
 */
export const setAccessToken = (token: string): void => {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
};

/**
 * トークン削除（ログアウト時）
 */
export const removeTokens = (): void => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
};

/**
 * トークン有効期限チェック（オプション）
 * @param token JWT トークン
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};
```

### SAS Token セキュリティ

Azure Blob Storage へのアップロードで使用する SAS Token は：

- ✅ **有効期限**: 1 時間（短期間）
- ✅ **最小権限**: Write（書き込み）のみ
- ✅ **単一ファイル**: 特定の Blob パスのみアクセス可能
- ✅ **バックエンド生成**: フロントエンドは保存しない

---

## ルーティング設計

### ルート定義

```typescript name=src/routes/index.tsx
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { PrivateRoute } from './PrivateRoute';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Lazy Loading（コード分割）
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const DashboardPage = lazy(
  () => import('@/features/dashboard/pages/DashboardPage'),
);
const ContentListPage = lazy(
  () => import('@/features/contents/pages/ContentListPage'),
);
const ContentCreatePage = lazy(
  () => import('@/features/contents/pages/ContentCreatePage'),
);
const ContentEditPage = lazy(
  () => import('@/features/contents/pages/ContentEditPage'),
);
const VideoListPage = lazy(
  () => import('@/features/videos/pages/VideoListPage'),
);
const VideoUploadPage = lazy(
  () => import('@/features/videos/pages/VideoUploadPage'),
);
const NotificationListPage = lazy(
  () => import('@/features/notifications/pages/NotificationListPage'),
);
const NotificationCreatePage = lazy(
  () => import('@/features/notifications/pages/NotificationCreatePage'),
);
const SystemSettingsPage = lazy(
  () => import('@/features/system/pages/SystemSettingsPage'),
);

/**
 * アプリケーションルート定義
 */
export const router = createBrowserRouter([
  // 公開ルート（認証不要）
  {
    path: '/login',
    element: (
      <Suspense fallback={<LoadingSpinner />}>
        <LoginPage />
      </Suspense>
    ),
  },

  // 認証必須ルート
  {
    path: '/',
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <DashboardPage />
          </Suspense>
        ),
      },
      {
        path: 'contents',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <ContentListPage />
              </Suspense>
            ),
          },
          {
            path: 'create',
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <ContentCreatePage />
              </Suspense>
            ),
          },
          {
            path: ':id/edit',
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <ContentEditPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'videos',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <VideoListPage />
              </Suspense>
            ),
          },
          {
            path: 'upload',
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <VideoUploadPage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'notifications',
        children: [
          {
            index: true,
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <NotificationListPage />
              </Suspense>
            ),
          },
          {
            path: 'create',
            element: (
              <Suspense fallback={<LoadingSpinner />}>
                <NotificationCreatePage />
              </Suspense>
            ),
          },
        ],
      },
      {
        path: 'settings',
        element: (
          <Suspense fallback={<LoadingSpinner />}>
            <SystemSettingsPage />
          </Suspense>
        ),
      },
    ],
  },

  // 404 ページ
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
```

### 認証ガード

```typescript name=src/routes/PrivateRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';

interface PrivateRouteProps {
  children: React.ReactNode;
}

/**
 * 認証必須ルートラッパー
 * 未認証の場合、ログインページへリダイレクト
 */
export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

---

## デプロイメント設計

### Azure Static Web Apps 設定

```json name=.azure/staticwebapp.config.json
{
  "routes": [
    {
      "route": "/api/*",
      "rewrite": "https://juxyi-cms-prod.azurewebsites.net/api/*"
    },
    {
      "route": "/*",
      "serve": "/index.html",
      "statusCode": 200
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif,svg}", "/css/*", "/js/*"]
  },
  "responseOverrides": {
    "404": {
      "rewrite": "/index.html",
      "statusCode": 200
    }
  },
  "globalHeaders": {
    "Content-Security-Policy": "default-src 'self' https://juxyi-cms-prod.azurewebsites.net https://*.blob.core.windows.net; img-src 'self' https://*.blob.core.windows.net data:; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
  },
  "mimeTypes": {
    ".json": "application/json",
    ".js": "application/javascript",
    ".css": "text/css"
  }
}
```

### Vite 設定

```typescript name=vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],

  // パスエイリアス設定
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },

  // 開発サーバー設定
  server: {
    port: 3000,
    proxy: {
      // 開発時にバックエンド API へプロキシ
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },

  // ビルド設定
  build: {
    outDir: 'dist',
    sourcemap: false, // 本番環境ではソースマップ無効
    rollupOptions: {
      output: {
        // コード分割設定
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
  },
});
```

### 環境変数設定

```bash name=.env.production
# API エンドポイント
VITE_API_BASE_URL=https://juxyi-cms-prod.azurewebsites.net/api

# Azure Application Insights（オプション）
VITE_APP_INSIGHTS_KEY=your-app-insights-key

# アプリケーションバージョン
VITE_APP_VERSION=1.0.0
```

---

## パフォーマンス最適化

### 実装済み最適化

1. **コード分割（Code Splitting）**

   - React.lazy + Suspense によるルート単位の分割
   - 初回ロード時間短縮

2. **画像最適化**

   - Lazy Loading（Intersection Observer）
   - WebP 形式対応

3. **キャッシュ戦略**

   - TanStack Query による API レスポンスキャッシュ
   - staleTime: 5 分間

4. **バンドル最適化**
   - Vendor チャンク分割（React, Ant Design, TanStack Query）
   - Tree Shaking（未使用コード削除）

### パフォーマンス目標

| メトリック                     | 目標値          |
| ------------------------------ | --------------- |
| First Contentful Paint (FCP)   | < 1.5 秒        |
| Largest Contentful Paint (LCP) | < 2.5 秒        |
| Time to Interactive (TTI)      | < 3 秒          |
| Bundle Size (gzip)             | < 300KB（初回） |

---

## コーディング規約

### TypeScript ルール

1. **型定義必須**: すべての関数・変数に型を明示
2. **any 禁止**: unknown または具体的な型を使用
3. **インターフェース命名**: PascalCase（例: `User`, `ContentResponse`）
4. **型エクスポート**: `type` キーワードで明示（例: `export type User = ...`）

### React コンポーネントルール

1. **関数コンポーネント**: Function Declaration 使用

   ```typescript
   export const MyComponent: React.FC<Props> = ({ prop1, prop2 }) => {
     // ...
   };
   ```

2. **Props 型定義**: インターフェース定義

   ```typescript
   interface MyComponentProps {
     title: string;
     onSubmit: (data: FormData) => void;
   }
   ```

3. **デフォルトエクスポート禁止**: Named Export 使用

### ファイル命名規則

| ファイルタイプ | 命名規則           | 例                  |
| -------------- | ------------------ | ------------------- |
| コンポーネント | PascalCase.tsx     | `ContentList.tsx`   |
| フック         | camelCase.ts       | `useContents.ts`    |
| サービス       | camelCase.ts       | `contentService.ts` |
| 型定義         | camelCase.types.ts | `content.types.ts`  |
| ユーティリティ | camelCase.ts       | `formatters.ts`     |

---

## まとめ

本フロントエンドアーキテクチャは以下の特徴を持ちます：

### ✅ 主要な設計判断

| 項目                     | 選択                        | 理由                                 |
| ------------------------ | --------------------------- | ------------------------------------ |
| **アーキテクチャ**       | Feature-based               | 高凝集・低結合、スケーラビリティ     |
| **状態管理**             | TanStack Query + Zustand    | サーバー状態とクライアント状態の分離 |
| **ファイルアップロード** | Azure Blob 直接アップロード | 帯域幅削減、パフォーマンス向上       |
| **UI ライブラリ**        | Ant Design                  | エンタープライズ対応、日本語サポート |
| **ビルドツール**         | Vite                        | 高速ビルド、HMR                      |
| **デプロイ**             | Azure Static Web Apps       | CI/CD 統合、グローバル配信           |

### 🎯 非機能要件達成

| 要件             | 達成方法                                      |
| ---------------- | --------------------------------------------- |
| **高速表示**     | コード分割、画像 Lazy Loading、API キャッシュ |
| **セキュリティ** | JWT 認証、SAS Token（短期限）                 |
| **開発効率**     | TypeScript、Feature-based、共通コンポーネント |
| **保守性**       | 明確なディレクトリ構造、型安全性              |

---

**最終更新日**: 2025-02-06  
**ドキュメントバージョン**: 1.0.0  
**作成者**: JUXYI 開発チーム
