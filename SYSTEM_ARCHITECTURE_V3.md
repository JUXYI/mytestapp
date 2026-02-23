# JUXYI Content Management System - 統合システムアーキテクチャ設計書

## 目次

1. [システム概要](#1-システム概要)
2. [全体アーキテクチャ](#2-全体アーキテクチャ)
3. [技術スタック](#3-技術スタック)
4. [リポジトリ構成とコード管理戦略](#4-リポジトリ構成とコード管理戦略)
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
19. [統合デプロイメント戦略](#19-統合デプロイメント戦略)

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

| サブシステム         | 技術スタック                                   | 目的                        |
| -------------------- | ---------------------------------------------- | --------------------------- |
| **CMS バックエンド** | Spring Boot 3.4 + Java 17                      | コンテンツ CRUD・API 提供   |
| **CMS Web 管理画面** | React 19 + Vite 6 + Ant Design 5               | 管理者向けコンテンツ管理 UI |
| **モバイルアプリ**   | React Native 0.83（New Architecture） + Hermes | ユーザー向けコンテンツ閲覧  |

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

| シナリオ               | 使用システム                  | 認証方式           | Token タイプ                             |
| ---------------------- | ----------------------------- | ------------------ | ---------------------------------------- |
| **App ログイン**       | React Native → マイページ API | WebView / e-ninsho | Access Token（1h）+ Refresh Token（24h） |
| **App コンテンツ取得** | React Native → CMS API        | JWT Token          | 共有 JWT（Access Token）                 |
| **App → Web SSO**      | React Native → マイページ Web | Ticket（30 秒）    | UUID Ticket                              |
| **マイページ Web**     | ブラウザ → マイページ API     | Session/Cookie     | JSESSIONID                               |
| **CMS 管理画面**       | CMS Web → CMS API             | JWT Token          | Access Token（30m）+ Refresh Token（8h） |

---

## 3. 技術スタック

### バックエンド

| カテゴリ             | 技術            | バージョン | 用途                   |
| -------------------- | --------------- | ---------- | ---------------------- |
| **フレームワーク**   | Spring Boot     | 3.5        | アプリケーション基盤   |
| **言語**             | Java            | 17         | プログラミング言語     |
| **ビルドツール**     | Gradle          | 8          | プロジェクトビルド     |
| **ORM**              | JPA/Hibernate   | 6          | データベースアクセス   |
| **セキュリティ**     | Spring Security | 6          | 認証・認可             |
| **JWT**              | jjwt            | -          | トークン生成・検証     |
| **マイグレーション** | Flyway          | -          | スキーマバージョン管理 |

### Web フロントエンド

| カテゴリ           | 技術                  | バージョン | 用途                          |
| ------------------ | --------------------- | ---------- | ----------------------------- |
| **言語**           | TypeScript            | 5          | 型安全な開発                  |
| **フレームワーク** | React                 | 19         | UI コンポーネント構築         |
| **ビルドツール**   | Vite                  | 6          | 高速ビルド・HMR               |
| **UI ライブラリ**  | Ant Design            | 5          | エンタープライズ UI           |
| **CSS**            | Tailwind CSS          | 3          | ユーティリティファースト CSS  |
| **ルーティング**   | React Router          | 7          | SPA ルーティング              |
| **フォーム**       | React Hook Form + Zod | -          | フォーム管理 + バリデーション |
| **デプロイ先**     | Azure Static Web Apps | -          | 静的サイトホスティング        |

### モバイルアプリ

| カテゴリ                | 技術               | バージョン               | 用途                           |
| ----------------------- | ------------------ | ------------------------ | ------------------------------ |
| **言語**                | TypeScript         | 5                        | 型安全な開発                   |
| **フレームワーク**      | React Native       | 0.83（New Architecture） | クロスプラットフォーム開発     |
| **JavaScript エンジン** | Hermes             | -                        | 高速起動・低メモリ             |
| **ナビゲーション**      | React Navigation   | 7                        | 画面遷移管理                   |
| **UI ライブラリ**       | React Native Paper | 5                        | Material Design コンポーネント |
| **CSS**                 | NativeWind         | 4                        | ユーティリティファースト CSS   |

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

## 4. リポジトリ構成とコード管理戦略

本プロジェクトは **3 つの独立リポジトリ** で管理します。

### リポジトリ一覧

| リポジトリ名           | 技術スタック               | 責務                                           |
| ---------------------- | -------------------------- | ---------------------------------------------- |
| **juxyi-cms-backend**  | Spring Boot 3.5 + Java 17  | CMS API、Flyway マイグレーション、OpenAPI Spec |
| **juxyi-cms-frontend** | React 19 + Vite 6          | CMS Web 管理画面 SPA                           |
| **juxyi-cms-mobile**   | React Native 0.83 + Hermes | iOS / Android モバイルアプリ                   |

### 各リポジトリのルート構成

```
juxyi-cms-backend/
├── src/
├── build.gradle
├── azure-pipelines.yml                  # バックエンド CI/CD
├── .env.example
└── README.md

juxyi-cms-frontend/
├── src/
├── package.json
├── vite.config.ts
├── azure-pipelines.yml                  # フロントエンド CI/CD
├── .env.example
└── README.md

juxyi-cms-mobile/
├── android/
├── ios/
├── src/
├── package.json
├── azure-pipelines-ios.yml              # iOS CI/CD
├── azure-pipelines-android.yml          # Android CI/CD
├── .env.example
└── README.md
```

### 横断ドキュメント管理

3 リポジトリを横断するドキュメントは **Azure DevOps Wiki** で管理します。

| ドキュメント                       | 配置先                                           | 理由                              |
| ---------------------------------- | ------------------------------------------------ | --------------------------------- |
| 統合アーキテクチャ設計書（本文書） | Azure DevOps Wiki                                | 3 リポジトリ横断                  |
| API 仕様書（OpenAPI Spec）         | `juxyi-cms-backend` + Azure Artifacts に publish | API 契約の Single Source of Truth |
| デプロイ手順書                     | Azure DevOps Wiki                                | 3 システム統合リリース手順        |

### 跨リポジトリ API 型定義の共有（OpenAPI コード生成）

Frontend と Mobile が使用する API 型定義（DTO / Request / Response）は、Backend の OpenAPI Spec から **自動生成** することで一貫性を保証します。

```
┌─────────────────────────┐
│  juxyi-cms-backend      │
│                         │
│  SpringDoc OpenAPI      │
│  → openapi.yaml 出力    │
│  → Azure Artifacts に   │
│    publish (CI)         │
└───────────┬─────────────┘
            │ openapi.yaml
    ┌───────┴────────┐
    ▼                ▼
┌──────────────┐ ┌──────────────┐
│ frontend     │ │ mobile       │
│              │ │              │
│ openapi-     │ │ openapi-     │
│ generator    │ │ generator    │
│ → 型定義生成 │ │ → 型定義生成 │
│ → CI で自動  │ │ → CI で自動  │
└──────────────┘ └──────────────┘
```

**運用フロー**:

1. Backend 開発者が API を変更 → CI が `openapi.yaml` を Azure Artifacts に publish
2. Frontend / Mobile の CI が `openapi.yaml` を取得 → `openapi-generator-cli` で TypeScript 型定義を生成
3. API 破壊的変更の検知: Backend CI で `openapi-diff` を実行し、破壊的変更時はビルド警告を出力

### バージョン同期戦略

各リポジトリは独立した Semantic Versioning でバージョン管理します。

| リポジトリ | バージョン例 | バージョニング方針                                      |
| ---------- | ------------ | ------------------------------------------------------- |
| Backend    | v1.2.3       | API バージョン（`/api/v1/`）と Major を対応             |
| Frontend   | v1.2.3       | Backend API バージョンに Major を追従                   |
| Mobile     | v1.2.3       | ストアバージョンに対応、Backend 互換は Minor 範囲で維持 |

**互換性管理**:

- Backend は新 API バージョンリリース後も旧バージョンを最低 12 ヶ月維持（既存の API バージョン管理戦略に準拠）
- リリース協調: 破壊的 API 変更時は **Backend → Frontend → Mobile** の順にリリース
- Azure DevOps Release Pipeline で 3 リポジトリのリリースバージョンを紐付け管理

---

## 5. ディレクトリ構造

### バックエンド（Spring Boot）

```
src/main/java/com/juxyi/cms/              # juxyi-cms-backend リポジトリ
├── config/                      # 設定クラス（Security, JWT, CORS, Redis, Azure Storage 等）
├── controller/                  # REST API エンドポイント
├── service/                     # ビジネスロジック・外部サービス連携
├── repository/                  # データアクセス（JpaRepository）
├── model/                       # エンティティ / DTO / Enum
│   ├── entity/                  # JPA エンティティ
│   ├── dto/                     # Request / Response DTO
│   └── enums/                   # 定数 Enum
├── security/                    # JWT フィルター / 認証プロバイダー
├── exception/                   # グローバル例外ハンドラー
└── util/                        # ユーティリティ
```

### Web フロントエンド（React 19）

```
src/                                      # juxyi-cms-frontend リポジトリ
├── components/                  # 共通 UI コンポーネント
│   ├── layout/                  # レイアウト（Header, Sidebar 等）
│   ├── common/                  # 汎用（Loading, ErrorBoundary 等）
│   ├── upload/                  # ファイルアップロード
│   └── preview/                 # コンテンツプレビュー（PDF, Video）
├── pages/                       # ページコンポーネント（フラット構成、画面単位）
├── services/                    # API サービス層（ドメイン単位）
├── hooks/                       # カスタムフック（TanStack Query ラッパー）
├── stores/                      # Zustand ストア（認証、UI 状態）
├── lib/                         # Axios インスタンス, QueryClient, ユーティリティ, 定数
├── routes/                      # React Router 設定
├── types/                       # グローバル型定義（OpenAPI 生成含む）
└── config/                      # 環境変数管理
```

### モバイルアプリ（React Native）

```
src/                                      # juxyi-cms-mobile リポジトリ
├── screens/                     # 画面コンポーネント（フラット構成）
├── components/                  # 共通 UI コンポーネント
│   ├── layout/                  # レイアウト（Header, TabBar 等）
│   ├── common/                  # 汎用（Button, Card, Toast 等）
│   ├── media/                   # メディア表示（PDF, Video, WebView）
│   └── form/                    # フォーム入力（TextInput, SearchBar）
├── navigation/                  # React Navigation 設定（Root, Auth, Main, Tab）
├── services/                    # API サービス層（CMS API / マイページ API 2 系統）
├── hooks/                       # カスタムフック（認証, オフライン同期, 生体認証 等）
├── stores/                      # Zustand ストア（認証, 設定, キャッシュ）
├── native/                      # Native Module ブリッジ（e-ninsho, 生体認証）
├── lib/                         # キャッシュ, セキュアストレージ, 監視, ユーティリティ
├── types/                       # グローバル型定義（OpenAPI 生成含む）
└── config/                      # 環境変数
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

### 各層の責務

| 層             | 主要アノテーション / パターン              | 責務                                                               |
| -------------- | ------------------------------------------ | ------------------------------------------------------------------ |
| **Controller** | `@RestController`, `@RequestMapping`       | HTTP リクエスト/レスポンス処理、DTO マッピング、入力バリデーション |
| **Service**    | `@Service`, `@Transactional`, `@Cacheable` | ビジネスロジック、外部サービス連携（Azure SDK）、キャッシュ制御    |
| **Repository** | `JpaRepository`, `@Query`                  | データアクセス、ページネーション、カスタムクエリ                   |
| **Entity**     | `@Entity`, `@Table`                        | ドメインモデル定義、テーブルマッピング                             |

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
│  - JWT 認証 (RS256 非対称署名, Access + Refresh Token)      │
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

### JWT 設計

- **署名方式**: RS256（非対称署名）— マイページ API が秘密鍵で署名、CMS API が公開鍵で検証
- **パスワード暗号化**: BCrypt（10 rounds、自動ソルト生成）
- **Key Vault 管理対象**: DB 接続文字列、JWT 秘密鍵/公開鍵、Azure Storage キー、Redis パスワード

### Token 有効期限設計

2 トークン方式（Access Token + Refresh Token）を採用し、セキュリティとユーザー体験を両立します。

| 項目                       | Web (CMS 管理画面)                                            | Mobile (React Native)                    |
| -------------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| **Access Token 有効期限**  | 30 分                                                         | 1 時間                                   |
| **Refresh Token 有効期限** | 8 時間（業務時間内）                                          | 24 時間                                  |
| **Token 保存先**           | localStorage                                                  | Keychain (iOS) / Keystore (Android)      |
| **リフレッシュ方式**       | Axios Interceptor 自動（401 応答時に Refresh Token で再取得） | 同左                                     |
| **Refresh Token 失効後**   | ログイン画面にリダイレクト                                    | ログイン画面に遷移（生体認証で再認証可） |

**設計根拠**:

- Access Token を短寿命にすることで、Token 漏洩時の攻撃窓口を最小化
- Refresh Token による自動リフレッシュにより、ユーザーは有効期限を意識しない
- Web は業務時間内（8h）で再ログインを要求、Mobile は 24h 有効で「ログイン状態の維持」を実現

### 各クライアントのセキュリティ対策

| 対策                    | Web (CMS 管理画面)                              | Mobile (React Native)                     |
| ----------------------- | ----------------------------------------------- | ----------------------------------------- |
| **Token 保存**          | localStorage + Bearer Header（CSP で XSS 防御） | Keychain (iOS) / Keystore (Android)       |
| **Token リフレッシュ**  | Axios Interceptor 自動リフレッシュ              | Axios Interceptor 自動リフレッシュ        |
| **通信**                | HTTPS + CSP ヘッダー                            | HTTPS + Certificate Pinning（オプション） |
| **難読化**              | Vite ビルド minify                              | ProGuard (Android)                        |
| **Root/Jailbreak 検知** | N/A                                             | 検知時に認証機能制限                      |

### WebView ↔ Native 通信プロトコル

#### 通信方式

WebView（マイページ Web）と React Native 間は `postMessage` / `onMessage` で双方向通信を行います。

#### メッセージスキーマ

```typescript
interface WebViewMessage {
  type: string; // イベント種別
  payload: unknown; // データ本体
  timestamp: number; // 送信時刻（ミリ秒）
}
```

#### イベント一覧

| 方向         | type                | payload                 | 用途                                               |
| ------------ | ------------------- | ----------------------- | -------------------------------------------------- |
| Web → Native | `LOGIN_SUCCESS`     | `{ tempToken: string }` | WebView ログイン成功                               |
| Web → Native | `LOGIN_FAILED`      | `{ error: string }`     | WebView ログイン失敗                               |
| Web → Native | `PAGE_LOADED`       | `{ url: string }`       | ページ読み込み完了                                 |
| Web → Native | `CLOSE_WEBVIEW`     | `{}`                    | WebView 終了リクエスト                             |
| Web → Native | `OPEN_EXTERNAL_URL` | `{ url: string }`       | 外部ブラウザでリンクを開く                         |
| Web → Native | `OPEN_CAMERA`       | `{ purpose: string }`   | カメラ起動リクエスト                               |
| Native → Web | `SET_TOKEN`         | `{ token: string }`     | ログイン済み JWT を WebView に注入（自動ログイン） |

#### タイムアウト処理

- **ログイン WebView**: `LOGIN_SUCCESS` / `LOGIN_FAILED` を **5 分間** 受信しない場合、Native 側で WebView を自動クローズし、ユーザーにエラーメッセージを表示
- **WebView 読み込み失敗**: `onError` / `onHttpError` 発生時、リトライ UI を表示（最大 3 回）

#### 通信セキュリティ

- **Origin 検証**: `originWhitelist` でマイページドメインのみ許可 + `onMessage` 受信時に `nativeEvent.url` のドメインを検証（二重チェック）
- **Token 有効期限**: 一時 Token は 30 秒で失効
- **HTTPS 必須**: WebView の `source.uri` は HTTPS のみ許可

### SSO 連携設計（App → マイページ Web）

モバイルアプリからマイページ Web（外部ブラウザ）へのシングルサインオンは、ワンタイム Ticket 方式で実現します。

```
React Native App          マイページ API          マイページ DB          外部ブラウザ
     │                         │                      │                     │
     │ ※ 前提: App ログイン済み（JWT 保持）            │                     │
     │                         │                      │                     │
     │ 1. POST /api/sso/       │                      │                     │
     │    create-ticket        │                      │                     │
     │    Authorization:       │                      │                     │
     │    Bearer {JWT}         │                      │                     │
     ├────────────────────────►│                      │                     │
     │                         │ 2. JWT 検証           │                     │
     │                         │    Ticket 生成        │                     │
     │                         │    (UUID, 30秒有効)   │                     │
     │                         │                      │                     │
     │                         │ 3. INSERT             │                     │
     │                         │    sso_tickets        │                     │
     │                         ├─────────────────────►│                     │
     │                         │                      │                     │
     │ 4. { ticket, url }      │                      │                     │
     │◄────────────────────────┤                      │                     │
     │                         │                      │                     │
     │ 5. 外部ブラウザ起動                             │                     │
     │    https://mypage.example.com/sso/auth?ticket=xxx                    │
     ├──────────────────────────────────────────────────────────────────────►│
     │                         │                      │                     │
     │                         │ 6. GET /sso/auth      │                     │
     │                         │    ?ticket=xxx        │                     │
     │                         │◄─────────────────────────────────────────────┤
     │                         │                      │                     │
     │                         │ 7. Ticket 検証        │                     │
     │                         │    (有効期限 + 存在)  │                     │
     │                         ├─────────────────────►│                     │
     │                         │                      │                     │
     │                         │ 8. DELETE (ワンタイム) │                     │
     │                         ├─────────────────────►│                     │
     │                         │                      │                     │
     │                         │ 9. Session/Cookie 発行 │                     │
     │                         │    302 Redirect       │                     │
     │                         │    Set-Cookie:        │                     │
     │                         │    JSESSIONID=...     │                     │
     │                         ├─────────────────────────────────────────────►│
     │                         │                      │        マイページ表示 │
```

#### SSO セキュリティ設計

| 対策                 | 内容                                                                        |
| -------------------- | --------------------------------------------------------------------------- |
| **Ticket 有効期限**  | 30 秒（短期間で使用を強制）                                                 |
| **ワンタイム使用**   | Ticket 使用後に DB から即時削除（再利用不可）                               |
| **JWT 認証必須**     | Ticket 発行に有効な JWT が必要（未認証ユーザーは発行不可）                  |
| **外部ブラウザ使用** | WebView ではなく外部ブラウザで開く（マイページの Session 管理を独立させる） |
| **Ticket 無効時**    | ログインページにリダイレクト（`/login?error=expired`）                      |

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
| **Geo レプリケーション** | Japan East → Japan West（非同期）                 |
| **PITR**                 | Point-in-Time Restore（過去 35 日以内任意時点）   |
| **手動エクスポート**     | 月次で .bacpac を Azure Storage にアーカイブ      |

> 復旧目標（RTO / RPO）の詳細は「14. 高可用性・スケーラビリティ > 災害復旧（DR）」を参照。

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

### ネットワークセキュリティ設計

App Service から各 PaaS サービスへの通信は Private Endpoint を使用し、パブリックインターネットを経由しない構成とします。

```
┌──────────────────────────────────────────────────────────┐
│                  VNet (10.0.0.0/16)                        │
│                                                            │
│  ┌──────────────────────┐                                 │
│  │ Subnet: app-service   │                                 │
│  │ 10.0.1.0/24           │                                 │
│  │                       │                                 │
│  │ App Service            │                                 │
│  │ (VNet Integration)    │                                 │
│  └───────┬───────────────┘                                 │
│          │ Private Endpoint                                │
│    ┌─────┼─────┬──────────┬──────────┐                    │
│    ▼     ▼     ▼          ▼          ▼                    │
│  SQL DB  Redis  Storage  Key Vault                        │
│                                                            │
│  ※ 各 PaaS はパブリックアクセス無効化                      │
└──────────────────────────────────────────────────────────┘
         │
         ▼
  Azure Front Door (パブリックエンドポイント)
  ※ ユーザーからのアクセスは Front Door 経由のみ
```

| 対象サービス       | Private Endpoint | パブリックアクセス                                  |
| ------------------ | ---------------- | --------------------------------------------------- |
| Azure SQL Database | ✅ 有効          | ❌ 無効                                             |
| Azure Redis Cache  | ✅ 有効          | ❌ 無効                                             |
| Azure Storage      | ✅ 有効          | ❌ 無効（SAS Token はプライベートネットワーク経由） |
| Azure Key Vault    | ✅ 有効          | ❌ 無効                                             |
| App Service        | VNet Integration | Front Door 経由のみ（アクセス制限）                 |

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

| 設定項目           | 値           | 備考                                           |
| ------------------ | ------------ | ---------------------------------------------- |
| maximum-pool-size  | 50           | 1,000 並行ユーザー / 5 インスタンス + バッファ |
| minimum-idle       | 10           |                                                |
| connection-timeout | 30,000 ms    |                                                |
| idle-timeout       | 600,000 ms   |                                                |
| max-lifetime       | 1,800,000 ms |                                                |

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

復旧目標と達成方法:

| 指標 | 目標     | 達成方法                                             |
| ---- | -------- | ---------------------------------------------------- |
| RTO  | < 1 時間 | Front Door 自動フェイルオーバー + Secondary 自動起動 |
| RPO  | < 5 分   | SQL Database Geo-Replication（非同期）               |
| RTO  | < 4 時間 | PITR による任意時点復旧（データ破損時）              |

> DR 時の Redis 動作については「Redis キャッシュ戦略」節を参照。

---

## 15. パフォーマンス最適化

### バックエンド

| 最適化項目           | 手法                                     | 効果                 |
| -------------------- | ---------------------------------------- | -------------------- |
| **DB インデックス**  | 複合インデックス（type + status + date） | 検索クエリ高速化     |
| **N+1 問題回避**     | JOIN FETCH 使用                          | クエリ数削減         |
| **ページネーション** | PageRequest + Sort                       | 大量データ効率的取得 |
| **Redis キャッシュ** | @Cacheable / @CacheEvict                 | DB 負荷軽減          |
| **並列アップロード** | ブロック並列処理（詳細は 12 章参照）     | ビデオ UP 3 倍高速化 |

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

### カスタムイベント追跡方針

各サブシステムは `TelemetryClient`（バックエンド）/ Application Insights SDK（Web / Mobile）を使用して、ビジネス上重要なイベント（コンテンツ作成、ファイルアップロード、認証成功/失敗等）をカスタムイベントとして送信します。

### アラート設定

| アラート名           | 条件                        | アクション     |
| -------------------- | --------------------------- | -------------- |
| 高エラー率           | エラー率 > 5%               | メール通知     |
| 高レスポンスタイム   | 平均レスポンスタイム > 3 秒 | Slack 通知     |
| DB 接続エラー        | 接続失敗 > 10 回 / 5 分     | PagerDuty 通知 |
| モバイルクラッシュ率 | クラッシュ率 > 1%           | メール通知     |

### ログレベル設定

**ログ方針**:

- **形式**: JSON 構造化ログ（`timestamp`, `level`, `logger`, `message`, `traceId` を含む）
- **バックエンド**: `root: INFO`, `com.juxyi.cms: INFO`, `org.springframework.web: WARN`, `org.hibernate.SQL: WARN`
- **相関**: `traceId` を含めることで、Application Insights の分散トレースとログを相関付け可能
- **出力先**: Log Analytics Workspace に集約

---

## 17. エラーハンドリング設計

### バックエンド（グローバル例外ハンドラー）

`@RestControllerAdvice` + `@ExceptionHandler` によるグローバル例外処理を採用し、すべての例外を統一フォーマットでレスポンスします。

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
| **API 契約テスト** | openapi-diff                     | 全エンドポイント | OpenAPI Spec の破壊的変更検知  |
| **API テスト**     | REST Assured                     | 全エンドポイント | CMS API レスポンス検証         |
| **Web E2E テスト** | Playwright                       | 主要フロー       | ログイン、CRUD、アップロード   |
| **Mobile E2E**     | Detox                            | 主要フロー       | ログイン、コンテンツ閲覧       |
| **パフォーマンス** | k6                               | -                | 1,000 並行ユーザー負荷         |

### API 契約テスト（跨リポジトリ品質保証）

3 つの独立リポジトリ間の API 互換性を保証するため、以下の仕組みで契約テストを実施します:

- **Backend CI**: OpenAPI Spec の変更差分を `openapi-diff` で検出。破壊的変更（エンドポイント削除、レスポンス構造変更等）がある場合、ビルド警告を出力
- **Frontend / Mobile CI**: `openapi-generator` で最新の型定義を生成し、TypeScript コンパイルエラーで API 不整合を早期検出

### CI パイプラインでのテスト実行

各リポジトリの CI で単体・統合テストを実行し、Staging デプロイ後に跨リポジトリ結合テストを実施します。

```
各リポジトリ Build Stage（独立実行）:
├── juxyi-cms-backend:   Gradle test (JUnit 5) → コードカバレッジレポート → OpenAPI Spec 出力
├── juxyi-cms-frontend:  openapi-generator → vitest run
└── juxyi-cms-mobile:    openapi-generator → jest --coverage

全システム Staging デプロイ完了後:
└── 結合テスト: REST Assured（API 契約検証）→ Playwright E2E
```

---

## 19. 統合デプロイメント戦略

### 環境構成

| 環境            | 用途         | デプロイトリガー              |
| --------------- | ------------ | ----------------------------- |
| **Development** | 開発・テスト | develop ブランチプッシュ      |
| **Staging**     | 本番前検証   | main ブランチプッシュ         |
| **Production**  | 本番環境     | タグプッシュ (v\*) + 手動承認 |

### Git ブランチ戦略（Git Flow × 3 リポジトリ）

各リポジトリが独立した Git Flow を持ちます。リリース順序の協調ルールは「リリースフロー」節を参照。

```
※ 以下は各リポジトリ共通のブランチ構造

main ──────●────────────────●──────────────→  本番リリース
           │                ▲
           │                │ merge
           │     staging ◄──┘
           │
develop ───┼──●──●──●──●──●──────────────→  開発統合
              │     │     │
              │     │     └── feature/xxx
              │     └── feature/yyy
              └── feature/zzz
```

### 各リポジトリの CI/CD パイプライン

各リポジトリが独立した Azure DevOps Pipeline を持ち、それぞれのリポジトリ内の `azure-pipelines*.yml` で定義します。

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     Azure DevOps Pipelines（独立実行）                    │
│                                                                          │
│  juxyi-cms-backend リポジトリ                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  azure-pipelines.yml                                           │    │
│  │  Build:  Gradle clean build + JUnit テスト + OpenAPI Spec 出力 │    │
│  │  Deploy: Azure Web App (ブルーグリーン: Staging Slot → Swap)   │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  juxyi-cms-frontend リポジトリ                                           │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  azure-pipelines.yml                                           │    │
│  │  Build:  npm install + openapi-generator + Vite build          │    │
│  │  Deploy: Azure Static Web Apps                                 │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                                                                          │
│  juxyi-cms-mobile リポジトリ                                             │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │  azure-pipelines-ios.yml                                       │    │
│  │  Build:  yarn install + openapi-generator + pod install        │    │
│  │          + Xcode archive                                       │    │
│  │  Deploy: TestFlight (Staging) → App Store (Production)         │    │
│  ├─────────────────────────────────────────────────────────────────┤    │
│  │  azure-pipelines-android.yml                                   │    │
│  │  Build:  yarn install + openapi-generator                      │    │
│  │          + ./gradlew assembleRelease                            │    │
│  │  Deploy: 内部テスト (Staging) → Google Play (Production)       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

### バックエンド: ブルーグリーンデプロイ

**手順**: Staging スロットにデプロイ → ヘルスチェック → スモークテスト → Production スワップ（問題時は即ロールバック）

> Pipeline YAML の詳細は `juxyi-cms-backend` リポジトリの `azure-pipelines.yml` を参照。

### フロントエンド: Azure Static Web Apps デプロイ

- Azure Static Web Apps の SPA ルーティング（`navigationFallback`）を設定
- API プロキシ: Azure Portal で [SWA Linked Backend](https://learn.microsoft.com/azure/static-web-apps/apis-overview) を使用し、App Service に紐付け。`/api/*` リクエストが自動的にルーティングされる

> 設定ファイルの詳細は `juxyi-cms-frontend` リポジトリの `staticwebapp.config.json` を参照。

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
1. 各リポジトリで develop → main PR マージ
   └─ 各リポジトリの CI が自動ビルド & Staging 環境デプロイ（独立実行）

2. 全システム Staging デプロイ完了後、結合テスト
   ├─ バックエンド API テスト
   ├─ Web フロントエンド E2E テスト
   └─ モバイル TestFlight / 内部テスト

3. 各リポジトリでリリースタグ作成 (v1.x.x)
   ├─ 破壊的 API 変更がある場合: Backend → Frontend → Mobile の順にリリース
   ├─ 互換性のある変更の場合: 各リポジトリ独立してリリース可能
   ├─ バックエンド: ブルーグリーンデプロイ → Production
   ├─ フロントエンド: Static Web Apps → Production
   ├─ モバイル iOS: App Store 申請
   └─ モバイル Android: Google Play 申請

4. Azure DevOps Release Pipeline で各リポジトリのリリースバージョンを紐付け記録

5. ホットフィックス
   ├─ バックエンド: 該当リポジトリで hotfix ブランチ作成 → スロットスワップで即時ロールバック可能
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

| 項目                   | 選択                               | 理由                                        |
| ---------------------- | ---------------------------------- | ------------------------------------------- |
| **バックエンド**       | Spring Boot 3.5 + Java 17          | エンタープライズ実績、長期サポート          |
| **Web フロントエンド** | React 19 + Vite 6 + Ant Design     | 高速ビルド、エンタープライズ UI             |
| **モバイル**           | React Native 0.83 + Hermes         | Web チームとの技術共有                      |
| **リポジトリ構成**     | 3 独立リポジトリ                   | 独立デプロイ・独立 CI/CD                    |
| **API 型定義共有**     | OpenAPI Spec → コード自動生成      | API 契約の Single Source of Truth           |
| **アーキテクチャ**     | Pages + Services + Hooks           | シンプル・保守容易                          |
| **状態管理**           | TanStack Query + Zustand           | Web / Mobile 統一パターン                   |
| **インフラ**           | Azure PaaS (App Service/SQL/Blob)  | 運用負荷軽減、マネージドサービス            |
| **認証**               | JWT (RS256) + Access/Refresh Token | 非対称署名・短寿命 Token でセキュリティ確保 |
| **デプロイ**           | ブルーグリーン                     | ゼロダウンタイム                            |

---

**最終更新日**: 2026-02-23
**ドキュメントバージョン**: 2.0.0
**作成者**: JUXYI 開発チーム
