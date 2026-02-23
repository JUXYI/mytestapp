# JUXYI Content Management System - 統合システムアーキテクチャ設計書

## 目次

1. [システム概要](#1-システム概要)
2. [全体アーキテクチャ](#2-全体アーキテクチャ)
3. [技術スタック](#3-技術スタック)
4. [Monorepo 構造](#4-monorepo-構造)
5. [ディレクトリ構造](#5-ディレクトリ構造)
6. [バックエンドアーキテクチャ](#6-バックエンドアーキテクチャ)
7. [Web フロントエンドアーキテクチャ](#7-web-フロントエンドアーキテクチャ)
8. [モバイルアプリアーキテクチャ](#8-モバイルアプリアーキテクチャ)
9. [認証・セキュリティ設計](#9-認証セキュリティ設計)
10. [API 設計](#10-api-設計)
11. [データベース設計](#11-データベース設計)
12. [ファイルストレージ設計](#12-ファイルストレージ設計)
13. [Azure インフラストラクチャ](#13-azure-インフラストラクチャ)
14. [高可用性・スケーラビリティ](#14-高可用性スケーラビリティ)
15. [パフォーマンス最適化](#15-パフォーマンス最適化)
16. [監視・ログ](#16-監視ログ)
17. [エラーハンドリング設計](#17-エラーハンドリング設計)
18. [テスト戦略](#18-テスト戦略)
19. [WebView ↔ Native 通信プロトコル](#19-webview--native-通信プロトコル)
20. [統合デプロイメント戦略](#20-統合デプロイメント戦略)

---

## 1. システム概要

### プロジェクト情報

| 項目                     | 内容                                                             |
| ------------------------ | ---------------------------------------------------------------- |
| **プロジェクト名**       | JUXYI Content Management System                                  |
| **バージョン**           | 1.0.0                                                            |
| **目的**                 | コンテンツ（ドキュメント・ビデオ・URL）の管理と配信              |
| **想定ユーザー数**       | 1,000 並行ユーザー（バックエンド）/ 10,000+ ユーザー（モバイル） |
| **開発チーム規模**       | 10 人未満                                                        |
| **対象プラットフォーム** | Web（管理画面）+ iOS + Android（閲覧アプリ）                     |

### サブシステム構成

本システムは **3 つのサブシステム** で構成されます：

| サブシステム         | 技術スタック                               | 目的                        |
| -------------------- | ------------------------------------------ | --------------------------- |
| **CMS バックエンド** | Spring Boot 3.5.x + Java 17                | コンテンツ CRUD・API 提供   |
| **CMS Web 管理画面** | React 19.2.x + Vite 6.x + Ant Design 5.23+ | 管理者向けコンテンツ管理 UI |
| **モバイルアプリ**   | React Native 0.83.x + Hermes               | ユーザー向けコンテンツ閲覧  |

### 主要機能

#### バックエンド（CMS API）

- コンテンツ管理（CRUD）— ドキュメント、ビデオ、URL リンク
- JWT ベースの認証・認可
- Azure Blob Storage 連携（大容量ファイル対応、最大 500MB）
- 定期タスク（期限切れファイル自動削除、キャッシュ同期）
- プッシュ通知管理（Azure Notification Hubs 連携）

#### Web フロントエンド（CMS 管理画面）

- ダッシュボード（統計情報・アクティビティ表示）
- コンテンツ統合管理（ドキュメント・ビデオ・URL リンク）
- Azure Blob 直接アップロード（SAS Token 方式、最大 100MB）
- プッシュ通知管理（送信・スケジュール・テスト）
- メンテナンスモード設定

#### モバイルアプリ（React Native）

- マイページ WebView ログイン + e-ninsho SDK 認証 + 生体認証
- コンテンツ閲覧（PDF・ビデオ・URL）
- ログインスタンプ（QR コード読取）
- SSO（App → マイページ Web 連携）
- プッシュ通知受信
- オフラインキャッシュ（最大 500MB）

---

## 2. 全体アーキテクチャ

### システム全体構成図

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              ユーザー                                    │
└──────────┬───────────────────────────┬──────────────────────┬───────────┘
           │ モバイルアプリ             │ Web ブラウザ          │ 管理者
           │                           │                      │
           ▼                           ▼                      ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐
│  React Native App    │  │  マイページ Web      │  │  CMS Web 管理画面 │
│  (iOS / Android)     │  │  (既存システム)       │  │  (React 19)       │
│                      │  │                      │  │                   │
│  - コンテンツ閲覧    │  │  - 家族契約確認      │  │  - コンテンツ管理 │
│  - ログインスタンプ   │  │  - 各種情報閲覧      │  │  - プッシュ通知   │
│  - e-ninsho 認証     │  │  - ユーザー設定      │  │  - システム設定   │
└──────┬───────────────┘  └─────────┬────────────┘  └────────┬──────────┘
       │ JWT Token                  │ Session/Cookie          │ JWT Token
       │                            │                         │
       ├────────────────────────────┼─────────────────────────┤
       │                            │                         │
       ▼                            ▼                         ▼
┌──────────────────────┐  ┌──────────────────────┐  ┌───────────────────┐
│  CMS API             │  │  マイページ API       │  │  Azure Static     │
│  (Spring Boot)       │  │  (Spring Boot)       │  │  Web Apps         │
│                      │  │                      │  │  (フロントエンド  │
│  - コンテンツ CRUD   │  │  - ユーザー認証      │  │   ホスティング)   │
│  - プッシュ通知      │  │  - App ログイン API  │  │                   │
│  - App データ提供    │  │  - SSO Ticket 発行   │  │                   │
└──────────────────────┘  └──────────────────────┘  └───────────────────┘
       │ JWT 共有（RS256 非対称署名）       │
       └────────────────────────────┘
```

### データフロー概要

```
┌──────────────────────────────────────────────────────────────────────┐
│                  Azure Front Door Premium + WAF                       │
│  - グローバル負荷分散 / DDoS 防御 / Bot 保護                         │
│  - OWASP Top 10 防御 (SQL Injection, XSS, CSRF)                    │
│  - Primary/Secondary リージョン間インテリジェントルーティング        │
└─────────────┬──────────────────────────────────────┬─────────────────┘
              │ Primary Region                        │ Secondary Region (DR)
              │ (Japan East)                           │ (Japan West)
              ▼                                       ▼
┌──────────────────────────────┐    ┌──────────────────────────────────┐
│  App Service (Primary)       │    │  App Service (Secondary)         │
│  Spring Boot + Java 17       │    │  Standby Mode（災害時自動起動）   │
│  自動スケーリング: 2-5 台    │    │  自動スケーリング: 0 台（通常）   │
└──────────┬───────────────────┘    └──────────────────────────────────┘
           │
    ┌──────┼────────┬───────────────┬───────────────┬─────────────┐
    │      │        │               │               │             │
    ▼      ▼        ▼               ▼               ▼             ▼
┌───────┐┌───────┐┌─────────────┐┌─────────────┐┌───────────┐┌────────┐
│Azure  ││Azure  ││Azure Storage││Azure Storage││Azure Key  ││Azure   │
│SQL DB ││SQL DB ││(Videos)     ││(Documents)  ││Vault      ││Redis   │
│Primary││Second.││Blob/GRS/Hot ││Blob/GRS/Hot ││Secrets    ││Cache   │
│S2/S3  ││Read   ││             ││             ││Management ││C1      │
│       ││Replica││             ││             ││           ││        │
└───────┘└───────┘└─────────────┘└─────────────┘└───────────┘└────────┘
```

### 認証・通信フロー概要

| シナリオ               | 使用システム                  | 認証方式           | Token タイプ    |
| ---------------------- | ----------------------------- | ------------------ | --------------- |
| **App ログイン**       | React Native → マイページ API | WebView / e-ninsho | JWT（24h 有効） |
| **App コンテンツ取得** | React Native → CMS API        | JWT Token          | 共有 JWT        |
| **App → Web SSO**      | React Native → マイページ Web | Ticket（30 秒）    | UUID Ticket     |
| **マイページ Web**     | ブラウザ → マイページ API     | Session/Cookie     | JSESSIONID      |
| **CMS 管理画面**       | CMS Web → CMS API             | JWT Token          | JWT（24h 有効） |

---

## 3. 技術スタック

### バックエンド

| カテゴリ             | 技術            | バージョン | 用途                   |
| -------------------- | --------------- | ---------- | ---------------------- |
| **フレームワーク**   | Spring Boot     | 3.5.x      | アプリケーション基盤   |
| **言語**             | Java            | 17         | プログラミング言語     |
| **ビルドツール**     | Gradle          | 8.x        | プロジェクトビルド     |
| **ORM**              | JPA/Hibernate   | 6.x        | データベースアクセス   |
| **セキュリティ**     | Spring Security | 6.x        | 認証・認可             |
| **JWT**              | jjwt            | 0.12.x     | トークン生成・検証     |
| **マイグレーション** | Flyway          | -          | スキーマバージョン管理 |

### Web フロントエンド

| カテゴリ           | 技術                  | バージョン | 用途                          |
| ------------------ | --------------------- | ---------- | ----------------------------- |
| **言語**           | TypeScript            | 5.7.x      | 型安全な開発                  |
| **フレームワーク** | React                 | 19.2.x     | UI コンポーネント構築         |
| **ビルドツール**   | Vite                  | 6.x        | 高速ビルド・HMR               |
| **UI ライブラリ**  | Ant Design            | 5.23+      | エンタープライズ UI           |
| **CSS**            | Tailwind CSS          | 3.4.x      | ユーティリティファースト CSS  |
| **ルーティング**   | React Router          | 7.x        | SPA ルーティング              |
| **フォーム**       | React Hook Form + Zod | -          | フォーム管理 + バリデーション |
| **デプロイ先**     | Azure Static Web Apps | -          | 静的サイトホスティング        |

### モバイルアプリ

| カテゴリ                | 技術                     | バージョン   | 用途                           |
| ----------------------- | ------------------------ | ------------ | ------------------------------ |
| **言語**                | TypeScript               | 5.7.x        | 型安全な開発                   |
| **フレームワーク**      | React Native             | 0.83.x       | クロスプラットフォーム開発     |
| **JavaScript エンジン** | Hermes                   | -            | 高速起動・低メモリ             |
| **ナビゲーション**      | React Navigation         | 7.x          | 画面遷移管理                   |
| **UI ライブラリ**       | React Native Paper       | 5.x          | Material Design コンポーネント |
| **CSS**                 | NativeWind(Tailwind CSS) | 4.1.x(3.4.x) | ユーティリティファースト CSS   |

### Web / Mobile 共通

| カテゴリ              | 技術                         | 用途                           |
| --------------------- | ---------------------------- | ------------------------------ |
| **サーバー状態**      | TanStack Query (React Query) | API データキャッシュ・同期     |
| **クライアント状態**  | Zustand                      | 軽量グローバル状態管理         |
| **HTTP クライアント** | Axios                        | API 通信 + インターセプター    |
| **監視**              | Application Insights         | パフォーマンス監視・エラー追跡 |
| **CI/CD**             | Azure DevOps Pipelines       | 自動ビルド・デプロイ           |
| **リンター**          | ESLint + Prettier            | コード品質・フォーマット統一   |

---

## 4. Monorepo 構造

本プロジェクトは **Nx** を使用した Monorepo 構成を採用します。

```
juxyi-cms/                                   # Monorepo ルート
│
├── apps/                                     # アプリケーション
│   ├── backend/                              # CMS API (Spring Boot + Java 17)
│   │   ├── src/
│   │   │   ├── main/java/
│   │   │   ├── main/resources/
│   │   │   └── test/java/
│   │   ├── build.gradle
│   │   └── project.json                      # Nx プロジェクト設定
│   │
│   ├── frontend/                             # CMS Web 管理画面 (React 19)
│   │   ├── src/
│   │   ├── public/
│   │   ├── __tests__/
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── project.json                      # Nx プロジェクト設定
│   │
│   └── mobile/                               # React Native App
│       ├── android/
│       ├── ios/
│       ├── src/
│       ├── __tests__/
│       ├── package.json
│       └── project.json                      # Nx プロジェクト設定
│
├── libs/                                     # ライブラリ（ビジネスロジックの中枢 - 80%のコードはここ）
│   ├── api-client/                           # 【重要】API通信層（Web/Mobile 共通）
│   │   ├── src/
│   │   │   ├── api/                          # API レスポンス型（Content, Video, User 等）
│   │   │   ├── models/                       # ドメインモデル型
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── shared-constants/                     # 共有定数
│   │   ├── src/
│   │   │   ├── errorCodes.ts                 # エラーコード定義
│   │   │   ├── apiEndpoints.ts               # API エンドポイント定義
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── shared-utils/                         # 共有ユーティリティ関数
│   │   ├── src/
│   │   │   ├── formatters.ts                 # formatDate, formatFileSize 等
│   │   │   ├── validators.ts                 # 汎用バリデーション
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   └── shared-validators/                    # Zod スキーマ（バリデーションルール）
│       ├── src/
│       │   ├── contentSchema.ts
│       │   ├── userSchema.ts
│       │   └── index.ts
│       └── package.json
│
├── docs/                                     # 共有ドキュメント
│   ├── SYSTEM_ARCHITECTURE.md                # 統合アーキテクチャ（本文書）
│   ├── BACKEND_ARCHITECTURE.md               # バックエンド詳細設計
│   ├── FRONTEND_ARCHITECTURE.md              # フロントエンド詳細設計
│   ├── MOBILE_ARCHITECTURE.md                # モバイル詳細設計
│   ├── API.md                                # API 仕様書
│   └── DEPLOYMENT.md                         # デプロイ手順書
│
├── .azure/                                   # Azure DevOps Pipelines
│   └── pipelines/
│       ├── backend-pipeline.yml              # バックエンド CI/CD
│       ├── frontend-pipeline.yml             # フロントエンド CI/CD
│       ├── mobile-ios-pipeline.yml           # iOS ビルド・デプロイ
│       ├── mobile-android-pipeline.yml       # Android ビルド・デプロイ
│       └── shared/
│           └── azure-resources.yml           # 共有 Azure リソース定義
│
├── nx.json                                   # Nx 設定
├── package.json                              # ルート package.json
├── .env.example                              # 環境変数サンプル
├── .gitignore
└── README.md
```

### 共有パッケージの利用方法

Frontend / Mobile から共有パッケージをインポート：

```typescript
// 型定義のインポート
import { Content, Video, ApiResponse } from "@juxyi/shared-types";

// 定数のインポート
import { ERROR_CODES, API_ENDPOINTS } from "@juxyi/shared-constants";

// ユーティリティ関数のインポート
import { formatDate, formatFileSize } from "@juxyi/shared-utils";

// バリデーションスキーマのインポート
import { contentSchema } from "@juxyi/shared-validators";
```

---

## 5. ディレクトリ構造

### バックエンド（Spring Boot）

```
apps/backend/
├── src/
│   ├── main/
│   │   ├── java/com/juxyi/cms/
│   │   │   ├── CmsApplication.java          # エントリーポイント
│   │   │   ├── config/                      # 設定クラス
│   │   │   │   ├── SecurityConfig.java      # Spring Security 設定
│   │   │   │   ├── JwtConfig.java           # JWT 設定
│   │   │   │   ├── AzureStorageConfig.java  # Azure Blob Storage 設定
│   │   │   │   ├── RedisConfig.java         # Redis キャッシュ設定
│   │   │   │   ├── CorsConfig.java          # CORS 設定
│   │   │   │   └── SchedulingConfig.java    # スケジュールタスク設定
│   │   │   ├── controller/                  # REST API エンドポイント
│   │   │   │   ├── AuthController.java
│   │   │   │   ├── ContentController.java
│   │   │   │   ├── DocumentController.java
│   │   │   │   ├── VideoController.java
│   │   │   │   ├── FileUploadController.java
│   │   │   │   └── HealthController.java
│   │   │   ├── service/                     # ビジネスロジック
│   │   │   │   ├── ContentService.java
│   │   │   │   ├── FileStorageService.java  # Azure Blob 封装
│   │   │   │   ├── CacheService.java
│   │   │   │   ├── NotificationService.java # Azure NH 連携
│   │   │   │   └── ScheduledTaskService.java
│   │   │   ├── repository/                  # データアクセス
│   │   │   │   ├── ContentRepository.java
│   │   │   │   ├── DocumentRepository.java
│   │   │   │   ├── VideoRepository.java
│   │   │   │   └── UserRepository.java
│   │   │   ├── model/                       # エンティティ / DTO / Enum
│   │   │   │   ├── entity/
│   │   │   │   ├── dto/request/
│   │   │   │   ├── dto/response/
│   │   │   │   └── enums/
│   │   │   ├── security/                    # JWT フィルター / プロバイダー
│   │   │   │   ├── JwtAuthenticationFilter.java
│   │   │   │   └── JwtTokenProvider.java
│   │   │   ├── exception/                   # グローバル例外ハンドラー
│   │   │   │   ├── GlobalExceptionHandler.java
│   │   │   │   └── ResourceNotFoundException.java
│   │   │   └── util/                        # ユーティリティ
│   │   └── resources/
│   │       ├── application.yml              # メイン設定
│   │       ├── application-dev.yml          # 開発環境設定
│   │       ├── application-prod.yml         # 本番環境設定
│   │       └── db/migration/                # Flyway マイグレーション
│   │           ├── V1__create_users_table.sql
│   │           ├── V2__create_contents_table.sql
│   │           └── V3__create_notifications_table.sql
│   └── test/java/com/juxyi/cms/             # テストコード
│       ├── controller/
│       │   └── ContentControllerTest.java
│       ├── service/
│       │   └── ContentServiceTest.java
│       └── repository/
│           └── ContentRepositoryTest.java
├── build.gradle
└── README.md
```

### Web フロントエンド（React 19）

```
apps/frontend/
├── public/                                    # 静的ファイル
│   ├── favicon.ico
│   └── robots.txt
├── src/
│   ├── main.tsx                               # エントリーポイント
│   ├── App.tsx                                # ルートコンポーネント
│   ├── components/                            # 共通コンポーネント
│   │   ├── layout/                            # AppLayout, Header, Sidebar
│   │   ├── common/                            # LoadingSpinner, ErrorBoundary, ConfirmModal
│   │   ├── upload/                            # FileUploader, VideoUploader
│   │   ├── preview/                           # PdfViewer, VideoPlayer
│   │   └── table/                             # DataTable
│   ├── pages/                                 # ページコンポーネント（フラット構成）
│   │   ├── LoginPage.tsx                      # ログイン
│   │   ├── DashboardPage.tsx                  # ダッシュボード
│   │   ├── ContentListPage.tsx                # コンテンツ一覧
│   │   ├── ContentDetailPage.tsx              # コンテンツ詳細
│   │   ├── ContentFormPage.tsx                # コンテンツ作成・編集
│   │   ├── DocumentListPage.tsx               # ドキュメント一覧
│   │   ├── DocumentFormPage.tsx               # ドキュメント作成
│   │   ├── VideoListPage.tsx                  # ビデオ一覧
│   │   ├── VideoFormPage.tsx                  # ビデオ作成
│   │   ├── NotificationListPage.tsx           # プッシュ通知一覧
│   │   ├── NotificationFormPage.tsx           # プッシュ通知作成
│   │   └── SystemSettingsPage.tsx             # システム設定
│   ├── services/                              # API サービス層
│   │   ├── authService.ts                     # 認証 API
│   │   ├── contentService.ts                  # コンテンツ CRUD
│   │   ├── documentService.ts                 # ドキュメント CRUD
│   │   ├── videoService.ts                    # ビデオ CRUD + SAS
│   │   ├── notificationService.ts             # プッシュ通知
│   │   └── systemService.ts                   # システム設定
│   ├── hooks/                                 # カスタムフック
│   │   ├── useAuth.ts                         # 認証状態・ログイン処理
│   │   ├── useContents.ts                     # コンテンツ TanStack Query
│   │   ├── useDocuments.ts                    # ドキュメント TanStack Query
│   │   ├── useVideos.ts                       # ビデオ TanStack Query
│   │   ├── useNotifications.ts                # 通知 TanStack Query
│   │   └── useFileUpload.ts                   # Blob アップロード
│   ├── stores/                                # Zustand ストア
│   │   ├── authStore.ts                       # 認証情報（Token、ユーザー）
│   │   └── uiStore.ts                         # UI 状態（サイドバー開閉等）
│   ├── lib/                                   # 第三者ライブラリ封装
│   │   ├── axios.ts                           # Axios インスタンス + Interceptor
│   │   └── queryClient.ts                     # TanStack Query 設定
│   ├── utils/                                 # ユーティリティ関数（フロントエンド固有）
│   │   └── tokenUtils.ts                      # Token 操作（localStorage）
│   ├── constants/                             # 定数（フロントエンド固有）
│   │   ├── routes.ts                          # ルートパス定義
│   │   ├── storageKeys.ts                     # localStorage キー
│   │   └── theme.ts                           # AntD テーマ設定
│   ├── routes/                                # React Router 設定
│   ├── types/                                 # グローバル型定義
│   └── config/                                # 環境変数管理
├── __tests__/                                 # テストコード
│   ├── pages/
│   │   └── ContentListPage.test.tsx
│   ├── hooks/
│   │   └── useAuth.test.ts
│   └── setup.ts                               # テスト共通設定
├── package.json
├── vite.config.ts
└── README.md
```

### モバイルアプリ（React Native）

```
apps/mobile/
├── android/                                   # Android ネイティブコード
│   └── app/src/main/java/.../
│       └── eninsho/                           # e-ninsho Native Module
├── ios/                                       # iOS ネイティブコード
│   └── JuxyiApp/
│       └── Eninsho/                           # e-ninsho Native Module
├── src/
│   ├── App.tsx                                # ルートコンポーネント
│   ├── screens/                               # 画面コンポーネント（フラット構成）
│   │   ├── HomeScreen.tsx                     # ホーム
│   │   ├── ContentListScreen.tsx              # コンテンツ一覧
│   │   ├── ContentDetailScreen.tsx            # コンテンツ詳細
│   │   ├── PdfViewerScreen.tsx                # PDF 閲覧
│   │   ├── VideoPlayerScreen.tsx              # ビデオ再生
│   │   ├── WebViewScreen.tsx                  # WebView 画面
│   │   ├── StampRallyScreen.tsx               # ログインスタンプ
│   │   ├── QrScannerScreen.tsx                # QR コード読取
│   │   ├── NotificationListScreen.tsx         # 通知一覧
│   │   ├── SettingsScreen.tsx                 # ユーザー設定
│   │   ├── LoginScreen.tsx                    # ログイン
│   │   └── SsoScreen.tsx                      # SSO 遷移
│   ├── components/                            # 共通コンポーネント
│   │   ├── layout/                            # AppContainer, Header, TabBar
│   │   ├── common/                            # Button, Card, LoadingSpinner, Toast
│   │   ├── media/                             # PdfViewer, VideoPlayer, WebViewContainer
│   │   ├── list/                              # ContentList, ContentCard
│   │   └── form/                              # TextInput, SearchBar
│   ├── navigation/                            # React Navigation 設定
│   │   ├── RootNavigator.tsx                  # 認証状態による画面切り替え
│   │   ├── AuthStack.tsx                      # ログイン画面群
│   │   ├── MainStack.tsx                      # メイン画面群
│   │   └── TabNavigator.tsx                   # ボトムタブ
│   ├── services/                              # API サービス層
│   │   ├── cmsApi.ts                          # CMS API Axios インスタンス
│   │   ├── mypageApi.ts                       # マイページ API Axios インスタンス
│   │   ├── contentService.ts                  # コンテンツ API
│   │   ├── authService.ts                     # 認証 API
│   │   ├── notificationService.ts             # 通知 API
│   │   └── stampService.ts                    # ログインスタンプ API
│   ├── stores/                                # Zustand ストア
│   │   ├── authStore.ts                       # 認証状態
│   │   ├── settingsStore.ts                   # ユーザー設定
│   │   └── cacheStore.ts                      # キャッシュ管理
│   ├── hooks/                                 # カスタムフック
│   │   ├── useAppState.ts                     # フォアグラウンド／バックグラウンド
│   │   ├── useNetworkStatus.ts                # オンライン／オフライン
│   │   ├── useAuth.ts                         # 認証フロー制御
│   │   ├── useContents.ts                     # コンテンツ TanStack Query
│   │   ├── useNotifications.ts                # 通知 TanStack Query
│   │   ├── useBiometrics.ts                   # 生体認証制御
│   │   ├── useDeepLink.ts                     # Deep Link ハンドリング
│   │   └── useOfflineSync.ts                  # オフライン同期
│   ├── native/                                # Native Module ブリッジ（JS/TS 側）
│   │   ├── EninshoModule.ts                   # e-ninsho SDK ブリッジ
│   │   ├── BiometricsModule.ts                # 生体認証ブリッジ
│   │   └── types.ts                           # Native Module 型定義
│   ├── lib/                                   # 第三者ライブラリ封装
│   │   ├── axios.ts                           # Axios インスタンス + Interceptor
│   │   ├── queryClient.ts                     # TanStack Query 設定
│   │   ├── cache/                             # fileCache (LRU), metadataCache
│   │   ├── storage/                           # asyncStorage, secureStorage
│   │   └── monitoring/                        # appInsights
│   ├── utils/                                 # ユーティリティ関数（モバイル固有）
│   │   └── tokenUtils.ts                      # Token 操作（SecureStore）
│   ├── constants/                             # 定数（モバイル固有）
│   │   ├── screenNames.ts                     # 画面名定義
│   │   ├── storageKeys.ts                     # AsyncStorage / SecureStore キー
│   │   └── platform.ts                        # プラットフォーム固有値
│   ├── types/                                 # グローバル型定義
│   └── config/                                # 環境変数
├── __tests__/                                 # テストコード
│   ├── screens/
│   │   └── HomeScreen.test.tsx
│   ├── hooks/
│   │   └── useAuth.test.ts
│   └── setup.ts                               # テスト共通設定
├── package.json
└── README.md
```

---

## 6. バックエンドアーキテクチャ

### レイヤー設計（4 層アーキテクチャ）

```
┌──────────────────────────────────────────────────────┐
│  Controller 層（HTTP リクエスト/レスポンス処理）      │
│  - @RestController / @RequestMapping                 │
│  - リクエストバリデーション / DTO マッピング          │
└───────────────┬──────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────┐
│  Service 層（ビジネスロジック）                        │
│  - @Transactional / @Cacheable                       │
│  - 外部サービス連携（Azure SDK）                      │
└───────────────┬──────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────┐
│  Repository 層（データアクセス）                       │
│  - JpaRepository 継承 / @Query                       │
│  - ページネーション / ソート                          │
└───────────────┬──────────────────────────────────────┘
                │
┌───────────────▼──────────────────────────────────────┐
│  Entity 層（ドメインモデル）                           │
│  - @Entity / @Table / 関連定義                        │
└──────────────────────────────────────────────────────┘
```

### コード例

**Controller 層**:

```java
@RestController
@RequestMapping("/api/contents")
@RequiredArgsConstructor
public class ContentController {
    private final ContentService contentService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ContentResponse>> getContent(@PathVariable Long id) {
        ContentResponse response = contentService.getContentById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
```

**Service 層**:

```java
@Service
@RequiredArgsConstructor
public class ContentService {
    private final ContentRepository contentRepository;

    @Transactional(readOnly = true)
    @Cacheable(value = "contents", key = "#id")
    public ContentResponse getContentById(Long id) {
        Content content = contentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Content not found: " + id));
        return mapToResponse(content);
    }
}
```

**Repository 層**:

```java
@Repository
public interface ContentRepository extends JpaRepository<Content, Long> {
    Page<Content> findByContentType(ContentType contentType, Pageable pageable);

    @Query("SELECT c FROM Content c JOIN FETCH c.createdBy")
    List<Content> findAllWithCreatedBy();
}
```

### Azure Blob Storage 封装

`FileStorageService` がすべてのファイル操作を抽象化：

| メソッド            | 用途                     | 備考                  |
| ------------------- | ------------------------ | --------------------- |
| `uploadFile()`      | 通常ファイルアップロード | ドキュメント用        |
| `uploadVideo()`     | ビデオ並列アップロード   | 4MB ブロック × 5 並列 |
| `deleteFile()`      | ファイル削除             | Blob URL 指定         |
| `fileExists()`      | 存在チェック             |                       |
| `getFileMetadata()` | メタデータ取得           |                       |

---

## 7. Web フロントエンドアーキテクチャ

### Web構成

本プロジェクトでは機能数が少ないため、フラットな Pages + Services + Hooks 構成を採用します：

```
pages/             # ページコンポーネント（画面単位）
services/          # API サービス（ドメイン単位）
hooks/             # TanStack Query フック（ドメイン単位）
stores/            # Zustand グローバル状態
components/        # 共通 UI コンポーネント
```

### 主要機能モジュール

| Feature           | 主要機能           | ページ数 | API エンドポイント                         |
| ----------------- | ------------------ | -------- | ------------------------------------------ |
| **auth**          | JWT 認証           | 1        | POST /api/v1/auth/login                    |
| **dashboard**     | 統計情報表示       | 1        | GET /api/v1/dashboard/stats                |
| **contents**      | コンテンツ統合管理 | 3        | /api/v1/contents/\*                        |
| **documents**     | ドキュメント管理   | 2        | /api/v1/documents/\*                       |
| **videos**        | ビデオ管理         | 2        | /api/v1/videos/\*, /api/v1/files/sas-token |
| **notifications** | プッシュ通知       | 2        | /api/v1/notifications/\*                   |
| **system**        | システム設定       | 1        | /api/v1/system/\*                          |

### 状態管理（2 層）

| 層                   | 技術              | 用途                                     |
| -------------------- | ----------------- | ---------------------------------------- |
| **サーバー状態**     | TanStack Query    | API データキャッシュ（staleTime: 5 分）  |
| **クライアント状態** | Zustand + persist | 認証情報、UI 状態（localStorage 永続化） |

### ファイルアップロードフロー（Azure Blob 直接）

```
Frontend                         Backend                      Azure Blob Storage
   │                                │                               │
   │ 1. POST /api/v1/files/sas-token│                               │
   ├───────────────────────────────►│                               │
   │ 2. { sasToken, blobUrl }      │                               │
   │◄───────────────────────────────┤                               │
   │                                │                               │
   │ 3. PUT blobUrl?sasToken (file) │                               │
   ├────────────────────────────────┼──────────────────────────────►│
   │ 4. 200 OK                     │                               │
   │◄────────────────────────────────────────────────────────────────┤
   │                                │                               │
   │ 5. POST /api/v1/videos (metadata)│                               │
   ├───────────────────────────────►│ 6. INSERT INTO videos         │
   │ 7. 201 Created                │                               │
   │◄───────────────────────────────┤                               │
```

---

## 8. モバイルアプリアーキテクチャ

### アプリ構成

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Native App                              │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ ホーム   │  │コンテンツ │  │ ログイン  │  │ 通知         │   │
│  │          │  │閲覧       │  │ スタンプ │  │              │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│       Tab Navigator (React Navigation 7)                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  共通レイヤー                                              │   │
│  │  - TanStack Query (offlineFirst)                          │   │
│  │  - Zustand (認証状態)                                      │   │
│  │  - Axios (マイページ API / CMS API 2 インスタンス)         │   │
│  │  - 3 層キャッシュ (メモリ / AsyncStorage / FileSystem)     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  ネイティブレイヤー                                        │   │
│  │  - e-ninsho SDK (NFC, 公的個人認証)                       │   │
│  │  - Firebase Messaging (プッシュ通知)                       │   │
│  │  - react-native-biometrics (生体認証)                      │   │
│  │  - react-native-vision-camera (QR コード読取)              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 認証フロー（3 方式）

| 方式                 | 対象               | フロー                                               |
| -------------------- | ------------------ | ---------------------------------------------------- |
| **WebView ログイン** | 初回ログイン       | WebView → 一時 Token（30 秒有効）→ postMessage → JWT |
| **e-ninsho 認証**    | マイナンバーカード | NFC 読取 → Native Module → SDK 認証 → JWT            |
| **生体認証**         | 再ログイン         | Face ID / Touch ID → 保存済み JWT で自動認証         |

### オフラインキャッシュ（3 層）

| 層                 | 技術            | 容量        | データ種別                  |
| ------------------ | --------------- | ----------- | --------------------------- |
| **L1: インメモリ** | TanStack Query  | -           | API レスポンス（5 分有効）  |
| **L2: メタデータ** | AsyncStorage    | < 6 MB      | コンテンツリスト、閲覧履歴  |
| **L3: ファイル**   | react-native-fs | 最大 500 MB | PDF、ビデオ（LRU 自動削除） |

### プッシュ通知

Firebase Cloud Messaging + Azure Notification Hubs の組み合わせ：

- **デバイス登録**: FCM Token 取得 → CMS API → Azure NH Installation 登録
- **送信**: CMS Web 管理画面 → CMS API → Azure NH → APNS (iOS) / FCM (Android)
- **受信**: フォアグラウンド（アプリ内バナー）/ バックグラウンド（OS 通知）/ タップ（Deep Link 遷移）

---

## 9. 認証・セキュリティ設計

### 多層防御セキュリティモデル

```
Layer 1: ネットワークセキュリティ
┌────────────────────────────────────────────────────────┐
│  Azure Front Door Premium + WAF                        │
│  - DDoS Protection (Layer 3/4/7)                       │
│  - Bot 保護 / Geo-Filtering / Rate Limiting            │
└────────────────────────────────────────────────────────┘
                       │
Layer 2: アプリケーションセキュリティ
┌────────────────────────────────────────────────────────┐
│  App Service + Spring Security                         │
│  - JWT 認証 (RS256 非対称署名, 24h 有効)                   │
│  - HTTPS Only / CORS 制御 / Input Validation           │
└────────────────────────────────────────────────────────┘
                       │
Layer 3: データセキュリティ
┌────────────────────────────────────────────────────────┐
│  Azure SQL: TDE + Advanced Threat Protection           │
│  Azure Storage: AES-256 + TLS 1.2+ + SAS Tokens       │
└────────────────────────────────────────────────────────┘
                       │
Layer 4: シークレット管理
┌────────────────────────────────────────────────────────┐
│  Azure Key Vault                                       │
│  - HSM-Backed Keys / Managed Identity / 監査ログ       │
└────────────────────────────────────────────────────────┘
                       │
Layer 5: 脅威検知・監視
┌────────────────────────────────────────────────────────┐
│  Microsoft Sentinel (SIEM) + Defender for Cloud        │
│  - リアルタイム脅威検知 / 異常ログイン検出              │
│  - 脆弱性スキャン / セキュリティスコア                  │
└────────────────────────────────────────────────────────┘
```

### JWT 構造

```json
{
  "header": { "alg": "RS256", "typ": "JWT" },
  "payload": {
    "sub": "1",
    "username": "admin",
    "iss": "mypage-api",
    "iat": 1643678400,
    "exp": 1643764800
  },
  "signature": "..."
}
```

- **署名方式**: RS256（非対称署名）— マイページ API が秘密鍵で署名、CMS API が公開鍵で検証
- **パスワード暗号化**: BCrypt（10 rounds、自動ソルト生成）
- **Key Vault 管理対象**: DB 接続文字列、JWT 秘密鍵/公開鍵、Azure Storage キー、Redis パスワード

### 各クライアントのセキュリティ対策

| 対策                    | Web (CMS 管理画面)                  | Mobile (React Native)                     |
| ----------------------- | ----------------------------------- | ----------------------------------------- |
| **Token 保存**          | HttpOnly + Secure + SameSite Cookie | Keychain (iOS) / Keystore (Android)       |
| **Token リフレッシュ**  | Axios Interceptor 自動リフレッシュ  | Axios Interceptor 自動リフレッシュ        |
| **通信**                | HTTPS + CSP ヘッダー                | HTTPS + Certificate Pinning（オプション） |
| **難読化**              | Vite ビルド minify                  | ProGuard (Android) / Bitcode (iOS)        |
| **Root/Jailbreak 検知** | N/A                                 | 検知時に認証機能制限                      |

---

## 10. API 設計

### CMS API（バックエンド）

| メソッド | エンドポイント                          | 用途                     | 使用元       |
| -------- | --------------------------------------- | ------------------------ | ------------ |
| POST     | `/api/v1/auth/login`                    | CMS ログイン             | Web          |
| POST     | `/api/v1/auth/refresh`                  | Token リフレッシュ       | Web / Mobile |
| GET      | `/api/v1/contents`                      | コンテンツ一覧           | Web / Mobile |
| GET      | `/api/v1/contents/:id`                  | コンテンツ詳細           | Web / Mobile |
| GET      | `/api/v1/contents/search`               | コンテンツ検索           | Web / Mobile |
| POST     | `/api/v1/contents`                      | コンテンツ作成           | Web          |
| PUT      | `/api/v1/contents/:id`                  | コンテンツ更新           | Web          |
| DELETE   | `/api/v1/contents/:id`                  | コンテンツ削除           | Web          |
| POST     | `/api/v1/files/sas-token`               | SAS Token 取得           | Web          |
| GET      | `/api/v1/documents`                     | ドキュメント一覧         | Web          |
| POST     | `/api/v1/documents`                     | ドキュメント作成         | Web          |
| GET      | `/api/v1/videos`                        | ビデオ一覧               | Web          |
| POST     | `/api/v1/videos`                        | ビデオメタデータ保存     | Web          |
| POST     | `/api/v1/notifications/send`            | 通知即時送信             | Web          |
| POST     | `/api/v1/notifications/schedule`        | 通知スケジュール送信     | Web          |
| POST     | `/api/v1/notifications/test`            | 通知テスト送信           | Web          |
| POST     | `/api/v1/notifications/register-device` | デバイス Token 登録      | Mobile       |
| GET      | `/api/v1/notifications`                 | 通知履歴取得             | Web / Mobile |
| GET      | `/api/v1/stamps`                        | スタンプ一覧取得         | Mobile       |
| POST     | `/api/v1/stamps/collect`                | スタンプ獲得             | Mobile       |
| GET      | `/api/v1/system/maintenance`            | メンテナンスモード       | Web / Mobile |
| PUT      | `/api/v1/system/maintenance`            | メンテナンスモード設定   | Web          |
| GET      | `/api/v1/system/version`                | アプリ最低バージョン確認 | Mobile       |
| GET      | `/api/v1/dashboard/stats`               | ダッシュボード統計       | Web          |

### マイページ API（外部システム・認証用）

> **注**: マイページ API は本プロジェクトの管理外の既存システムです。以下はモバイルアプリが連携するインターフェース契約です。

| メソッド | エンドポイント            | 用途                       | 使用元 |
| -------- | ------------------------- | -------------------------- | ------ |
| GET      | `/mobile-login`           | WebView ログインページ表示 | Mobile |
| POST     | `/api/mobile-auth/login`  | WebView ログイン処理       | Mobile |
| POST     | `/api/mobile-auth/verify` | 一時 Token 検証 → JWT 発行 | Mobile |
| POST     | `/api/auth/eninsho`       | e-ninsho 認証 → JWT 発行   | Mobile |
| POST     | `/api/auth/refresh`       | Token リフレッシュ         | Mobile |
| POST     | `/api/sso/create-ticket`  | SSO Ticket 生成            | Mobile |

### 共通レスポンス形式

```json
{
  "success": true,
  "message": "操作が成功しました",
  "data": { ... },
  "timestamp": "2025-02-10T10:30:00Z"
}
```

**ページネーションレスポンス**:

```json
{
  "success": true,
  "data": {
    "content": [ ... ],
    "page": 0,
    "size": 20,
    "totalPages": 5,
    "totalElements": 100
  }
}
```

### API バージョン管理戦略

| 項目               | 方針                                                    |
| ------------------ | ------------------------------------------------------- |
| **バージョン方式** | URL パスプレフィックス（`/api/v1/`, `/api/v2/`）        |
| **後方互換性**     | 新バージョンリリース後も旧バージョンを最低 12 ヶ月維持  |
| **非推奨通知**     | `Deprecation` ヘッダー + API レスポンスに警告メッセージ |
| **廃止手順**       | 非推奨通知 → 6 ヶ月猶予 → 404 レスポンス                |
| **変更種別**       | 追加は同一バージョン内 / 破壊的変更は新バージョン       |

**バージョニング例**:

```
/api/v1/contents     # 現行バージョン
/api/v2/contents     # 新バージョン（レスポンス構造変更時）
```

**非推奨ヘッダー例**:

```http
HTTP/1.1 200 OK
Deprecation: true
Sunset: Sat, 01 Aug 2027 00:00:00 GMT
Link: </api/v2/contents>; rel="successor-version"
```

---

## 11. データベース設計

### ER 概要図

```
┌──────────────────┐       ┌──────────────────┐
│     cms_users     │       │     contents      │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ username         │◄──────│ created_by (FK)  │
│ password_hash    │       │ updated_by (FK)  │
│ display_name     │       │ title            │
│ role (ENUM)      │       │ description      │
│ is_active        │       │ content_type     │
│ created_at       │       │ status (ENUM)    │
│ updated_at       │       │ published_at     │
└──────────────────┘       │ expired_at       │
                           │ created_at       │
                           │ updated_at       │
                           └────────┬─────────┘
                                    │ 1:1
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
          ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
          │  documents   │ │   videos    │ │  url_links   │
          ├─────────────┤ ├─────────────┤ ├─────────────┤
          │ id (PK)     │ │ id (PK)     │ │ id (PK)     │
          │ content_id  │ │ content_id  │ │ content_id  │
          │ file_name   │ │ file_name   │ │ url         │
          │ blob_url    │ │ blob_url    │ │ open_in_app │
          │ file_size   │ │ file_size   │ └─────────────┘
          │ mime_type   │ │ duration    │
          └─────────────┘ │ thumbnail   │
                          │ mime_type   │
                          └─────────────┘

┌──────────────────┐       ┌──────────────────┐
│  notifications    │       │ device_tokens     │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ title            │       │ user_id          │
│ body             │       │ platform (ENUM)  │
│ target_type      │       │ fcm_token        │
│ scheduled_at     │       │ device_info      │
│ sent_at          │       │ is_active        │
│ status (ENUM)    │       │ created_at       │
│ created_by (FK)  │       │ updated_at       │
│ created_at       │       └──────────────────┘
└──────────────────┘

┌──────────────────┐       ┌──────────────────┐
│     stamps        │       │ stamp_collections │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ name             │       │ stamp_id (FK)    │
│ description      │       │ user_id          │
│ qr_code          │       │ collected_at     │
│ image_url        │       │ latitude         │
│ is_active        │       │ longitude        │
│ start_date       │       └──────────────────┘
│ end_date         │
│ created_at       │       ┌──────────────────┐
└──────────────────┘       │ system_settings   │
                           ├──────────────────┤
                           │ id (PK)          │
                           │ setting_key      │
                           │ setting_value    │
                           │ updated_by (FK)  │
                           │ updated_at       │
                           └──────────────────┘
```

### 主要テーブル一覧

| テーブル名          | 用途                     | 主要カラム                                            |
| ------------------- | ------------------------ | ----------------------------------------------------- |
| `cms_users`         | CMS 管理者ユーザー       | username, password_hash, role, is_active              |
| `contents`          | コンテンツ基本情報       | title, content_type, status, published_at, expired_at |
| `documents`         | ドキュメント詳細         | content_id, file_name, blob_url, file_size, mime_type |
| `videos`            | ビデオ詳細               | content_id, file_name, blob_url, duration, thumbnail  |
| `url_links`         | URL リンク詳細           | content_id, url, open_in_app                          |
| `notifications`     | プッシュ通知             | title, body, target_type, scheduled_at, status        |
| `device_tokens`     | デバイストークン登録     | user_id, platform, fcm_token, is_active               |
| `stamps`            | スタンプ定義             | name, qr_code, image_url, start_date, end_date        |
| `stamp_collections` | スタンプ獲得履歴         | stamp_id, user_id, collected_at                       |
| `system_settings`   | システム設定（メンテ等） | setting_key, setting_value                            |

### Enum 定義

| Enum            | 値                                  |
| --------------- | ----------------------------------- |
| `ContentType`   | DOCUMENT, VIDEO, URL_LINK           |
| `ContentStatus` | DRAFT, PUBLISHED, ARCHIVED, EXPIRED |
| `UserRole`      | ADMIN, EDITOR                       |
| `Platform`      | IOS, ANDROID                        |
| `NotifyStatus`  | DRAFT, SCHEDULED, SENT, FAILED      |
| `NotifyTarget`  | ALL, IOS_ONLY, ANDROID_ONLY         |

### インデックス設計

| テーブル    | インデックス                                     | 用途                     |
| ----------- | ------------------------------------------------ | ------------------------ |
| `contents`  | `idx_content_type_status` (content_type, status) | コンテンツ種別・状態検索 |
| `contents`  | `idx_published_at` (published_at DESC)           | 公開日順ソート           |
| `contents`  | `idx_expired_at` (expired_at)                    | 期限切れバッチ処理       |
| `documents` | `idx_doc_content_id` (content_id)                | コンテンツ紐付け検索     |
| `videos`    | `idx_video_content_id` (content_id)              | コンテンツ紐付け検索     |

### マイグレーション管理

- **ツール**: Flyway
- **命名規則**: `V{version}__{description}.sql`（例: `V1__create_contents_table.sql`）
- **実行タイミング**: アプリケーション起動時に自動適用

### バックアップ戦略

| 項目                     | 設定                                              |
| ------------------------ | ------------------------------------------------- |
| **自動バックアップ**     | Azure SQL 自動バックアップ（7-35 日保持）         |
| **長期保持（LTR）**      | 週次バックアップ 52 週 + 月次バックアップ 12 ヶ月 |
| **Geo レプリケーション** | Japan East → Japan West（非同期、RPO < 5 分）     |
| **PITR**                 | Point-in-Time Restore（過去 35 日以内任意時点）   |
| **手動エクスポート**     | 月次で .bacpac を Azure Storage にアーカイブ      |

**復旧目標**:

| 指標 | 目標     | 達成方法                                |
| ---- | -------- | --------------------------------------- |
| RTO  | < 1 時間 | Geo レプリカへの自動フェイルオーバー    |
| RPO  | < 5 分   | 非同期 Geo レプリケーション             |
| RTO  | < 4 時間 | PITR による任意時点復旧（データ破損時） |

**バックアップ検証**:

- **頻度**: 四半期に 1 回
- **内容**: LTR バックアップからの復元テスト（別リソースグループで実施）

---

## 12. ファイルストレージ設計

### Azure Blob Storage 構成

#### コンテナ構造

```
content-files/                    # メインコンテナ
├── documents/                    # ドキュメント用
│   ├── {uuid}.pdf
│   ├── {uuid}.docx
│   └── {uuid}.txt
├── videos/                       # ビデオ用
│   ├── {uuid}.mp4
│   ├── {uuid}.mov
│   └── thumbnails/               # サムネイル
│       └── {uuid}_thumb.jpg
└── temp/                         # 一時ファイル（30 日後自動削除）
    └── {uuid}.tmp
```

#### ストレージ設定

| 項目                   | 設定                                  |
| ---------------------- | ------------------------------------- |
| **冗長性**             | GRS（Geo-Redundant Storage）          |
| **アクセス層**         | Hot Tier                              |
| **暗号化**             | SSE（Storage Service Encryption）     |
| **パブリックアクセス** | Private（SAS Token 経由のみアクセス） |
| **認証**               | Managed Identity + SAS Token          |

#### SAS Token セキュリティ

**アップロード用 SAS**:

| 項目         | 設定                   |
| ------------ | ---------------------- |
| **有効期限** | 1 時間                 |
| **権限**     | Write のみ（最小権限） |
| **スコープ** | 単一 Blob パス         |
| **生成元**   | バックエンドのみ       |

> **計算根拠**: Web 端最大ファイルサイズ 100MB を平均アップロード速度 200 Kbps (25 KB/s) で計算すると約 70 分。低速ネットワーク環境でも 1 時間以内に完了します。

**読み取り用 SAS**:

| 項目         | 設定                  |
| ------------ | --------------------- |
| **有効期限** | 15 分                 |
| **権限**     | Read のみ（最小権限） |
| **スコープ** | 単一 Blob パス        |
| **生成元**   | バックエンドのみ      |

> **用途**: ユーザーがコンテンツをダウンロード・プレビューする際に生成。短期間有効にすることで、URL の共有によるコンテンツ漏洩リスクを最小化します。

**SAS Token 有効期限切れ時の対応**:

- **アップロード中に期限切れ**: フロントエンドが自動的に新しい SAS Token を取得してアップロードを再開（Resumable Upload）
- **ネットワーク断絶**: 最大 3 回の自動リトライ（指数バックオフ）

#### ビデオアップロード最適化

- **並列**: 4MB ブロック × 5 並列処理
- **リトライ**: 失敗時最大 3 回自動リトライ
- **最大サイズ**: 500MB（バックエンド）、100MB（Web フロントエンド）

---

## 13. Azure インフラストラクチャ

### リソース構成一覧

| カテゴリ               | サービス                       | SKU/Tier          | 用途                          |
| ---------------------- | ------------------------------ | ----------------- | ----------------------------- |
| **CDN・WAF**           | Azure Front Door               | Premium           | グローバル配信、WAF、負荷分散 |
| **コンピューティング** | App Service (Primary)          | Premium P1v3      | メインアプリケーション        |
| **コンピューティング** | App Service (Secondary)        | Premium P1v3      | DR（災害復旧）                |
| **データベース**       | Azure SQL Database (Primary)   | Standard S2/S3    | メイン DB                     |
| **データベース**       | Azure SQL Database (Secondary) | Standard S2/S3    | 読み取りレプリカ・DR          |
| **ストレージ**         | Azure Storage (Videos)         | Standard GRS, Hot | ビデオファイル                |
| **ストレージ**         | Azure Storage (Documents)      | Standard GRS, Hot | ドキュメント・画像            |
| **キャッシュ**         | Azure Redis Cache              | Standard C1 (1GB) | セッション・ホットデータ      |
| **シークレット**       | Azure Key Vault                | Standard          | パスワード・キー管理          |
| **監視**               | Application Insights           | -                 | APM・パフォーマンス監視       |
| **ログ**               | Log Analytics                  | -                 | 統合ログ管理                  |
| **SIEM**               | Microsoft Sentinel             | -                 | セキュリティ脅威検知          |
| **セキュリティ**       | Defender for Cloud             | Standard          | 脆弱性スキャン                |
| **バックアップ**       | Azure Backup                   | -                 | 長期バックアップ（1 年）      |
| **通知**               | Azure Notification Hubs        | Standard          | iOS/Android プッシュ通知      |
| **フロントエンド**     | Azure Static Web Apps          | -                 | CMS Web 管理画面ホスティング  |

### 主要リージョン構成

```
┌───────────────────────────────────────────────────────────────┐
│              Primary Region (Japan East)                       │
│                                                               │
│   App Service (2-5 instances)                                │
│   Azure SQL Database (Primary) ──── Geo-Replication ────────┐│
│   Azure Redis Cache (Standard C1) - Primary のみ            ││
│   Azure Storage (GRS) ──── 6 コピー自動レプリケート ─────────┤│
│   Azure Key Vault ──── Soft-Delete + Purge Protection       ││
└───────────────────────────────────────────────────────────────┘│
                                                                 │
┌───────────────────────────────────────────────────────────────┐│
│            Secondary Region (Japan West / DR)                 ││
│                                                               ││
│   App Service (通常 0 台、災害時自動起動)                     │◄┘
│   Azure SQL Database (Secondary / Read Replica)              │
│   Azure Storage (GRS Secondary)                               │
│   ※ Redis なし - 災害時はキャッシュなしで起動                 │
│                                                               │
│   RTO: < 1 時間 / RPO: < 5 分                                │
└───────────────────────────────────────────────────────────────┘
```

---

## 14. 高可用性・スケーラビリティ

### 自動スケーリング（App Service）

| 条件           | メトリック    | 閾値  | アクション      |
| -------------- | ------------- | ----- | --------------- |
| スケールアウト | CPU 使用率    | > 70% | +1 インスタンス |
| スケールアウト | メモリ使用率  | > 80% | +1 インスタンス |
| スケールアウト | HTTP キュー長 | > 100 | +1 インスタンス |
| スケールイン   | CPU 使用率    | < 30% | -1 インスタンス |
| スケールイン   | メモリ使用率  | < 50% | -1 インスタンス |

- **最小**: 2 インスタンス（高可用性保証）
- **最大**: 5 インスタンス（コスト最適化）
- **クールダウン**: 5 分

### データベース接続プール（HikariCP）

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 50
      minimum-idle: 10
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

**計算根拠**: 1,000 並行ユーザー × 200ms 平均レスポンス / 5 インスタンス = 40 → バッファ込み 50 接続/インスタンス

### Redis キャッシュ戦略

| データ             | キャッシュキー          | TTL     |
| ------------------ | ----------------------- | ------- |
| コンテンツ詳細     | `contents:{id}`         | 1 時間  |
| ユーザー情報       | `users:{id}`            | 30 分   |
| JWT ブラックリスト | `jwt:blacklist:{token}` | 24 時間 |

**Redis 構成**:

| 項目                  | 設定                      |
| --------------------- | ------------------------- |
| **Tier**              | Standard                  |
| **Size**              | C1 (1GB)                  |
| **Region**            | Japan East (Primary のみ) |
| **Replication**       | 主従レプリケーション有効  |
| **Persistence**       | RDB スナップショット有効  |
| **SSL**               | 必須                      |
| **Max Memory Policy** | allkeys-lru               |
| **容量見積**          | 実使用 < 10MB / 1GB       |

> **DR 時の動作**: Secondary Region には Redis を配置せず、災害時は Primary Region の Redis に接続できなくなります。この場合、アプリケーションはキャッシュなしで動作し、すべてのリクエストが SQL Database に直接アクセスします。5-10 分後に新しい Redis インスタンスを起動するか、キャッシュなしでの運用を継続します（性能は低下しますが機能は維持）。

### 災害復旧（DR）

| 指標 | 目標     | 達成方法                                             |
| ---- | -------- | ---------------------------------------------------- |
| RTO  | < 1 時間 | Front Door 自動フェイルオーバー + Secondary 自動起動 |
| RPO  | < 5 分   | SQL Database Geo-Replication（非同期）               |

---

## 15. パフォーマンス最適化

### バックエンド

| 最適化項目           | 手法                                     | 効果                 |
| -------------------- | ---------------------------------------- | -------------------- |
| **DB インデックス**  | 複合インデックス（type + status + date） | 検索クエリ高速化     |
| **N+1 問題回避**     | JOIN FETCH 使用                          | クエリ数削減         |
| **ページネーション** | PageRequest + Sort                       | 大量データ効率的取得 |
| **Redis キャッシュ** | @Cacheable / @CacheEvict                 | DB 負荷軽減          |
| **並列アップロード** | 4MB × 5 並列                             | ビデオ UP 3 倍高速化 |

### Web フロントエンド

| 最適化項目         | 手法                                    | 目標                |
| ------------------ | --------------------------------------- | ------------------- |
| **コード分割**     | React.lazy + Suspense                   | FCP < 1.5 秒        |
| **バンドル最適化** | Vendor チャンク分割（React/AntD/Query） | 初回 < 300KB (gzip) |
| **API キャッシュ** | TanStack Query staleTime: 5 分          | API 呼び出し削減    |
| **Tree Shaking**   | Vite ビルド                             | 未使用コード削除    |

### モバイルアプリ

| 最適化項目          | 手法                               | 効果                |
| ------------------- | ---------------------------------- | ------------------- |
| **Hermes エンジン** | AOT コンパイル                     | 起動時間 57% 改善   |
| **FastImage**       | ディスクキャッシュ + 優先度制御    | 画像読み込み高速化  |
| **FlatList 最適化** | windowSize + removeClippedSubviews | スクロール FPS ≥ 55 |
| **3 層キャッシュ**  | メモリ → AsyncStorage → FileSystem | オフライン対応      |

### パフォーマンス目標

| メトリック                 | バックエンド | Web フロントエンド | モバイル         |
| -------------------------- | ------------ | ------------------ | ---------------- |
| 平均レスポンスタイム       | < 200 ms     | -                  | -                |
| First Contentful Paint     | -            | < 1.5 秒           | -                |
| Largest Contentful Paint   | -            | < 2.5 秒           | -                |
| コールドスタート           | -            | -                  | < 2 秒           |
| 画面遷移                   | -            | -                  | < 300 ms         |
| FlatList スクロール FPS    | -            | -                  | ≥ 55 FPS         |
| メモリ使用量（通常時）     | -            | -                  | < 150 MB         |
| メモリ使用量（ビデオ再生） | -            | -                  | < 250 MB         |
| バッテリー消費             | -            | -                  | < 5% / 30 分使用 |
| アプリサイズ（iOS）        | -            | -                  | < 50 MB          |
| アプリサイズ（Android）    | -            | -                  | < 40 MB          |
| クラッシュ率               | -            | -                  | < 0.5%           |

---

## 16. 監視・ログ

### Application Insights 統合（全システム共通）

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Application Insights                              │
│                                                                      │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────────────┐   │
│  │  バックエンド  │  │  Web Frontend │  │  Mobile App           │   │
│  │  (自動収集)    │  │  (JS SDK)     │  │  (RN SDK)             │   │
│  ├───────────────┤  ├───────────────┤  ├───────────────────────┤   │
│  │ リクエスト     │  │ ページビュー  │  │ 画面遷移              │   │
│  │ 依存関係      │  │ Ajax 呼び出し │  │ API 呼び出し          │   │
│  │ 例外          │  │ 例外          │  │ クラッシュ            │   │
│  │ カスタムイベント│ │ カスタムイベント│ │ カスタムイベント      │   │
│  └───────────────┘  └───────────────┘  └───────────────────────┘   │
│                                                                      │
│  統合ダッシュボード → アラート設定 → 自動通知                         │
└─────────────────────────────────────────────────────────────────────┘
```

### バックエンドカスタムイベント例

```java
@Service
@RequiredArgsConstructor
public class ContentService {
    private final TelemetryClient telemetryClient;

    public void createContent(ContentCreateRequest request) {
        // ... ビジネスロジック ...
        telemetryClient.trackEvent("ContentCreated",
            Map.of("contentType", request.getContentType().toString()));
    }
}
```

### アラート設定

| アラート名           | 条件                        | アクション     |
| -------------------- | --------------------------- | -------------- |
| 高エラー率           | エラー率 > 5%               | メール通知     |
| 高レスポンスタイム   | 平均レスポンスタイム > 3 秒 | Slack 通知     |
| DB 接続エラー        | 接続失敗 > 10 回 / 5 分     | PagerDuty 通知 |
| モバイルクラッシュ率 | クラッシュ率 > 1%           | メール通知     |

### ログレベル設定

```yaml
# backend: application-prod.yml
logging:
  level:
    root: INFO
    com.juxyi.cms: INFO
    org.springframework.web: WARN
    org.hibernate.SQL: WARN
  pattern:
    console: '{"timestamp":"%d{ISO8601}","level":"%p","logger":"%logger","message":"%m","traceId":"%X{traceId}"}%n'
```

> **構造化ログ**: JSON 形式で出力し、Log Analytics でのクエリ検索を容易にします。`traceId` を含めることで、Application Insights の分散トレースとログを相関付け可能です。

---

## 17. エラーハンドリング設計

### バックエンド（グローバル例外ハンドラー）

`@ControllerAdvice` によるグローバル例外処理：

```java
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(404)
            .body(new ApiError("NOT_FOUND", ex.getMessage()));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException ex) {
        return ResponseEntity.status(400)
            .body(new ApiError("VALIDATION_ERROR", extractErrors(ex)));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception ex) {
        log.error("Unexpected error", ex);
        return ResponseEntity.status(500)
            .body(new ApiError("INTERNAL_ERROR", "サーバー内部エラーが発生しました"));
    }
}
```

### 標準エラーレスポンス形式

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [{ "field": "title", "message": "タイトルは必須です" }]
  },
  "timestamp": "2026-02-10T10:30:00Z"
}
```

### エラーコード一覧

| コード                | HTTP | 説明                     |
| --------------------- | ---- | ------------------------ |
| `VALIDATION_ERROR`    | 400  | 入力バリデーションエラー |
| `UNAUTHORIZED`        | 401  | 未認証                   |
| `FORBIDDEN`           | 403  | 権限不足                 |
| `NOT_FOUND`           | 404  | リソース未発見           |
| `CONFLICT`            | 409  | 競合（重複登録等）       |
| `FILE_TOO_LARGE`      | 413  | ファイルサイズ超過       |
| `RATE_LIMITED`        | 429  | レート制限超過           |
| `INTERNAL_ERROR`      | 500  | サーバー内部エラー       |
| `SERVICE_UNAVAILABLE` | 503  | 外部サービス接続エラー   |

### 外部サービス呼び出しのリトライ・サーキットブレーカー

Azure SDK / 外部 API 呼び出しには Resilience4j を使用：

| 設定                     | 値                           | 対象サービス              |
| ------------------------ | ---------------------------- | ------------------------- |
| **リトライ回数**         | 最大 3 回                    | Azure Blob Storage, Redis |
| **リトライ間隔**         | 指数バックオフ（1s, 2s, 4s） | Azure Blob Storage        |
| **サーキットブレーカー** | 50% 失敗率でオープン         | Azure Notification Hubs   |
| **タイムアウト**         | 10 秒                        | すべての外部呼び出し      |

### フロントエンド・モバイルのエラーハンドリング

| レイヤー                | 手法                                                 |
| ----------------------- | ---------------------------------------------------- |
| **Axios Interceptor**   | 401 → Token リフレッシュ、503 → メンテナンス画面表示 |
| **React ErrorBoundary** | コンポーネントクラッシュ時のフォールバック UI        |
| **TanStack Query**      | `onError` コールバックでトースト通知表示             |

---

## 18. テスト戦略

### テストピラミッド

| テスト種別         | ツール                           | カバレッジ目標   | 対象                           |
| ------------------ | -------------------------------- | ---------------- | ------------------------------ |
| **単体テスト**     | JUnit 5 + Mockito                | ≥ 80%            | Service 層、Utility            |
| **統合テスト**     | @SpringBootTest + Testcontainers | -                | Repository、API エンドポイント |
| **API テスト**     | REST Assured                     | 全エンドポイント | CMS API レスポンス検証         |
| **Web E2E テスト** | Playwright                       | 主要フロー       | ログイン、CRUD、アップロード   |
| **Mobile E2E**     | Detox                            | 主要フロー       | ログイン、コンテンツ閲覧       |
| **パフォーマンス** | k6                               | -                | 1,000 並行ユーザー負荷         |

### CI パイプラインでのテスト実行

```
Build Stage:
├── Backend:   Gradle test (JUnit 5) → コードカバレッジレポート
├── Frontend:  vitest run → Lighthouse CI
└── Mobile:    jest --coverage

Deploy to Staging:
└── Integration Tests: REST Assured → Playwright E2E
```

---

## 19. WebView ↔ Native 通信プロトコル

### 通信方式

WebView（マイページ Web）と React Native 間は `postMessage` / `onMessage` で双方向通信を行います。

### メッセージスキーマ

```typescript
interface WebViewMessage {
  type: string; // イベント種別
  payload: unknown; // データ本体
  timestamp: number; // 送信時刻（ミリ秒）
}
```

### イベント一覧

| 方向         | type            | payload                 | 用途                   |
| ------------ | --------------- | ----------------------- | ---------------------- |
| Web → Native | `LOGIN_SUCCESS` | `{ tempToken: string }` | WebView ログイン成功   |
| Web → Native | `LOGIN_FAILED`  | `{ error: string }`     | WebView ログイン失敗   |
| Web → Native | `PAGE_LOADED`   | `{ url: string }`       | ページ読み込み完了     |
| Web → Native | `CLOSE_WEBVIEW` | `{}`                    | WebView 終了リクエスト |
| Native → Web | `SET_TOKEN`     | `{ token: string }`     | SSO Token 受け渡し     |
| Native → Web | `NAVIGATE`      | `{ path: string }`      | ページ遷移指示         |

### セキュリティ

- **Origin 検証**: `onMessage` 受信時に送信元 URL のドメインを検証
- **Token 有効期限**: 一時 Token は 30 秒で失効
- **HTTPS 必須**: WebView の `source.uri` は HTTPS のみ許可

---

## 20. 統合デプロイメント戦略

### 環境構成

| 環境            | 用途         | デプロイトリガー              |
| --------------- | ------------ | ----------------------------- |
| **Development** | 開発・テスト | develop ブランチプッシュ      |
| **Staging**     | 本番前検証   | main ブランチプッシュ         |
| **Production**  | 本番環境     | タグプッシュ (v\*) + 手動承認 |

### Git ブランチ戦略（Git Flow）

```
main ──────●────────────────●──────────────→  本番リリース
           │                ▲
           │                │ merge
           │     staging ◄──┘
           │
develop ───┼──●──●──●──●──●──────────────→  開発統合
              │     │     │
              │     │     └── feature/push-notification
              │     └── feature/video-upload
              └── feature/auth-flow
```

### 3 システム統合 CI/CD パイプライン

```
┌──────────────────────────────────────────────────────────────────────┐
│                    Azure DevOps Pipelines                             │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  バックエンド Pipeline (backend-pipeline.yml)               │    │
│  │                                                             │    │
│  │  Build:  Gradle clean build + JUnit テスト                  │    │
│  │  Deploy: Azure Web App (Spring Boot JAR)                    │    │
│  │  方式:   ブルーグリーンデプロイ (Staging Slot → Swap)       │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  フロントエンド Pipeline (frontend-pipeline.yml)            │    │
│  │                                                             │    │
│  │  Build:  npm install + Vite build + Lighthouse CI           │    │
│  │  Deploy: Azure Static Web Apps                              │    │
│  │  方式:   自動デプロイ (SWA GitHub/DevOps 統合)              │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  モバイル iOS Pipeline (mobile-ios-pipeline.yml)            │    │
│  │                                                             │    │
│  │  Build:  yarn install → pod install → Xcode archive        │    │
│  │  Deploy: TestFlight (Staging) → App Store (Production)     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  モバイル Android Pipeline (mobile-android-pipeline.yml)    │    │
│  │                                                             │    │
│  │  Build:  yarn install → ./gradlew assembleRelease          │    │
│  │  Deploy: 内部テスト (Staging) → Google Play (Production)   │    │
│  └─────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
```

### バックエンド: ブルーグリーンデプロイ

```yaml
# azure-pipelines: backend deploy stage
stages:
  - stage: Build
    jobs:
      - job: BuildJob
        steps:
          - task: Gradle@3
            inputs:
              tasks: "clean build"
              publishJUnitResults: true
          - task: PublishBuildArtifacts@1

  - stage: Deploy
    dependsOn: Build
    condition: and(succeeded(), startsWith(variables['Build.SourceBranch'], 'refs/tags/v'))
    jobs:
      - deployment: DeployProduction
        environment: "production"
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    appName: "juxyi-cms-prod"
                    deployToSlotOrASE: true
                    slotName: "staging"
                    package: "$(Pipeline.Workspace)/drop/*.jar"
                # ヘルスチェック → スモークテスト → Swap
                - script: |
                    az webapp deployment slot swap \
                      --name juxyi-cms-prod \
                      --resource-group juxyi-cms-rg \
                      --slot staging \
                      --target-slot production
```

**手順**: Staging スロットにデプロイ → ヘルスチェック → スモークテスト → Production スワップ（問題時は即ロールバック）

### フロントエンド: Azure Static Web Apps デプロイ

> **注**: Azure Static Web Apps のルート rewrite は外部 URL へのプロキシをネイティブサポートしません。API プロキシには [SWA Linked Backend](https://learn.microsoft.com/azure/static-web-apps/apis-overview) を使用し、App Service に紐付けます。

```json
// .azure/staticwebapp.config.json
{
  "routes": [{ "route": "/*", "serve": "/index.html", "statusCode": 200 }],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif,svg}", "/css/*", "/js/*"]
  }
}
```

**API プロキシ設定**: Azure Portal で Static Web Apps の "API" ブレードから App Service を Linked Backend として紐付け。フロントエンドから `/api/*` へのリクエストが自動的に App Service にルーティングされます。

### モバイル: リリースフロー

モバイルアプリの更新はすべてストア審査を経由して配信します：

| 変更種別               | 配信方法                     | 所要時間 |
| ---------------------- | ---------------------------- | -------- |
| 画面 UI / ロジック修正 | App Store / Google Play      | 1-3 日   |
| Native Module 追加     | App Store / Google Play      | 1-3 日   |
| SDK 更新               | App Store / Google Play      | 1-3 日   |
| 緊急バグフィックス     | 各ストアの緊急審査リクエスト | 1-2 日   |

### モバイル: バージョン互換管理

モバイルアプリはリリース後も旧バージョンがユーザー端末で動作し続けます。以下の仕組みで対応します：

- **API 後方互換**: 新 API バージョンリリース時も旧バージョンのエンドポイントを最低 2 バージョン分維持
- **強制アップデート**: `GET /api/v1/system/version` で最低サポートバージョンを返却、アプリ起動時にチェック
- **やわらかな誘導**: バージョンが古い場合は更新を促すダイアログを表示、最低バージョン未満の場合は強制アップデート画面

### リリースフロー

```
1. develop → main PR マージ
   └─ 自動ビルド & Staging 環境デプロイ（3 システム同時）

2. Staging 環境で結合テスト
   ├─ バックエンド API テスト
   ├─ Web フロントエンド E2E テスト
   └─ モバイル TestFlight / 内部テスト

3. リリースタグ作成 (v1.0.0)
   ├─ バックエンド: ブルーグリーンデプロイ → Production
   ├─ フロントエンド: Static Web Apps → Production
   ├─ モバイル iOS: App Store 申請
   └─ モバイル Android: Google Play 申請

4. ホットフィックス
   ├─ バックエンド: スロットスワップで即時ロールバック可能
   └─ モバイル: 各ストアの緊急審査リクエストを使用
```

### ロールバック手順

| システム           | ロールバック方法                      | 所要時間 |
| ------------------ | ------------------------------------- | -------- |
| **バックエンド**   | Staging ↔ Production スロットスワップ | < 1 分   |
| **フロントエンド** | 前バージョン再デプロイ                | < 5 分   |
| **モバイル**       | ストア緊急リリース                    | 1-3 日   |

---

## まとめ

### 設計判断サマリー

| 項目                   | 選択                                 | 理由                               |
| ---------------------- | ------------------------------------ | ---------------------------------- |
| **バックエンド**       | Spring Boot 3.5.x + Java 17          | エンタープライズ実績、長期サポート |
| **Web フロントエンド** | React 19.2.x + Vite 6.x + Ant Design | 高速ビルド、エンタープライズ UI    |
| **モバイル**           | React Native 0.83.x + Hermes         | Web チームとの技術共有             |
| **アーキテクチャ**     | Pages + Services + Hooks             | シンプル・保守容易                 |
| **状態管理**           | TanStack Query + Zustand             | Web / Mobile 統一パターン          |
| **インフラ**           | Azure PaaS (App Service/SQL/Blob)    | 運用負荷軽減、マネージドサービス   |
| **認証**               | JWT (RS256) + e-ninsho + 生体認証    | 非対称署名・マイナンバーカード対応 |
| **デプロイ**           | ブルーグリーン                       | ゼロダウンタイム                   |

---

**最終更新日**: 2026-02-11
**ドキュメントバージョン**: 1.2.0
**作成者**: JUXYI 開発チーム
