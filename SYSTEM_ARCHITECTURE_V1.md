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
17. [統合デプロイメント戦略](#17-統合デプロイメント戦略)

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

| サブシステム         | 技術スタック                     | 目的                        |
| -------------------- | -------------------------------- | --------------------------- |
| **CMS バックエンド** | Spring Boot 3.2 + Java 17        | コンテンツ CRUD・API 提供   |
| **CMS Web 管理画面** | React 18 + Vite 5 + Ant Design 5 | 管理者向けコンテンツ管理 UI |
| **モバイルアプリ**   | React Native 0.73+ + Hermes      | ユーザー向けコンテンツ閲覧  |

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
- 集章活動（QR コード読取）
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
│  (iOS / Android)     │  │  (既存システム)       │  │  (React 18)       │
│                      │  │                      │  │                   │
│  - コンテンツ閲覧    │  │  - 家族契約確認      │  │  - コンテンツ管理 │
│  - 集章活動          │  │  - 各種情報閲覧      │  │  - プッシュ通知   │
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
       │ JWT 共有（共通秘密鍵）      │
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
              │ (Japan East / East Asia)              │ (Japan West / Southeast Asia)
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
│S2/S3  ││Read   ││             ││             ││Management ││Premium │
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
| **フレームワーク**   | Spring Boot     | 3.2.x      | アプリケーション基盤   |
| **言語**             | Java            | 17         | プログラミング言語     |
| **ビルドツール**     | Gradle          | 8.x        | プロジェクトビルド     |
| **ORM**              | JPA/Hibernate   | 6.x        | データベースアクセス   |
| **セキュリティ**     | Spring Security | 6.x        | 認証・認可             |
| **JWT**              | jjwt            | 0.12.x     | トークン生成・検証     |
| **マイグレーション** | Flyway          | -          | スキーマバージョン管理 |

### Web フロントエンド

| カテゴリ           | 技術                  | バージョン | 用途                          |
| ------------------ | --------------------- | ---------- | ----------------------------- |
| **言語**           | TypeScript            | 5.3+       | 型安全な開発                  |
| **フレームワーク** | React                 | 18.2+      | UI コンポーネント構築         |
| **ビルドツール**   | Vite                  | 5.1+       | 高速ビルド・HMR               |
| **UI ライブラリ**  | Ant Design            | 5.14+      | エンタープライズ UI           |
| **CSS**            | Tailwind CSS          | 3.4+       | ユーティリティファースト CSS  |
| **ルーティング**   | React Router          | 6.22+      | SPA ルーティング              |
| **フォーム**       | React Hook Form + Zod | -          | フォーム管理 + バリデーション |
| **デプロイ先**     | Azure Static Web Apps | -          | 静的サイトホスティング        |

### モバイルアプリ

| カテゴリ                | 技術               | バージョン | 用途                           |
| ----------------------- | ------------------ | ---------- | ------------------------------ |
| **言語**                | TypeScript         | 5.3+       | 型安全な開発                   |
| **フレームワーク**      | React Native       | 0.73+      | クロスプラットフォーム開発     |
| **JavaScript エンジン** | Hermes             | -          | 高速起動・低メモリ             |
| **ナビゲーション**      | React Navigation   | 6.x        | 画面遷移管理                   |
| **UI ライブラリ**       | React Native Paper | 5.x        | Material Design コンポーネント |
| **OTA 更新**            | CodePush           | -          | JavaScript バンドル即時配信    |

### 3 システム共通

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

```
juxyi-cms/                                   # Monorepo ルート
│
├── backend/                                  # CMS API (Spring Boot + Java 17)
│   ├── src/
│   ├── build.gradle
│   └── README.md
│
├── frontend/                                 # CMS Web 管理画面 (React 18)
│   ├── src/
│   ├── package.json
│   ├── vite.config.ts
│   └── README.md
│
├── mobile/                                   # React Native App
│   ├── android/
│   ├── ios/
│   ├── src/
│   ├── package.json
│   └── README.md
│
├── mypage-api/                               # マイページ API (Spring Boot)
│   ├── src/
│   └── build.gradle
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
├── .gitignore
└── README.md
```

---

## 5. ディレクトリ構造

### バックエンド（Spring Boot）

```
backend/src/main/java/com/juxyi/cms/
├── CmsApplication.java          # エントリーポイント
├── config/                      # 設定クラス
│   ├── SecurityConfig.java      # Spring Security 設定
│   ├── JwtConfig.java           # JWT 設定
│   ├── AzureStorageConfig.java  # Azure Blob Storage 設定
│   ├── RedisConfig.java         # Redis キャッシュ設定
│   ├── CorsConfig.java          # CORS 設定
│   └── SchedulingConfig.java    # スケジュールタスク設定
├── controller/                  # REST API エンドポイント
│   ├── AuthController.java
│   ├── ContentController.java
│   ├── DocumentController.java
│   ├── VideoController.java
│   ├── FileUploadController.java
│   └── HealthController.java
├── service/                     # ビジネスロジック
│   ├── ContentService.java
│   ├── FileStorageService.java  # Azure Blob 封装
│   ├── CacheService.java
│   ├── NotificationService.java # Azure NH 連携
│   └── ScheduledTaskService.java
├── repository/                  # データアクセス
├── model/                       # エンティティ / DTO / Enum
│   ├── entity/
│   ├── dto/request/
│   ├── dto/response/
│   └── enums/
├── security/                    # JWT フィルター / プロバイダー
├── exception/                   # グローバル例外ハンドラー
└── util/                        # ユーティリティ
```

### Web フロントエンド（React 18）

```
frontend/src/
├── main.tsx                               # エントリーポイント
├── App.tsx                                # ルートコンポーネント
├── components/                            # 共通コンポーネント
│   ├── layout/                            # AppLayout, Header, Sidebar
│   ├── common/                            # LoadingSpinner, ErrorBoundary, ConfirmModal
│   ├── upload/                            # FileUploader, VideoUploader
│   ├── preview/                           # PdfViewer, VideoPlayer
│   └── table/                             # DataTable
├── features/                              # Feature-based Architecture
│   ├── auth/                              # 認証（LoginForm, useAuth, authStore）
│   ├── dashboard/                         # 統計ダッシュボード
│   ├── contents/                          # コンテンツ統合管理
│   ├── documents/                         # ドキュメント管理
│   ├── videos/                            # ビデオ管理（Azure Blob 直接 UP）
│   ├── url-links/                         # URL リンク管理
│   ├── notifications/                     # プッシュ通知管理
│   └── system/                            # メンテナンスモード等
├── lib/                                   # ライブラリ
│   ├── api/                               # Axios, QueryClient
│   ├── utils/                             # formatters, tokenUtils
│   └── constants/                         # 定数定義
├── routes/                                # React Router 設定
├── types/                                 # グローバル型定義
└── config/                                # 環境変数管理
```

### モバイルアプリ（React Native）

```
mobile/src/
├── App.tsx                                # ルートコンポーネント
├── components/                            # 共通コンポーネント
│   ├── layout/                            # AppContainer, Header, TabBar
│   ├── common/                            # Button, Card, LoadingSpinner, Toast
│   ├── media/                             # PdfViewer, VideoPlayer, WebViewContainer
│   ├── list/                              # ContentList, ContentCard
│   └── form/                              # TextInput, SearchBar
├── features/                              # Feature-based Architecture
│   ├── auth/                              # WebView / e-ninsho / 生体認証
│   ├── home/                              # ホーム画面
│   ├── contents/                          # コンテンツ閲覧
│   ├── stamp-rally/                       # QR コード集章
│   ├── notifications/                     # プッシュ通知受信
│   ├── sso/                               # SSO（App → マイページ Web）
│   ├── settings/                          # ユーザー設定
│   └── webview/                           # WebView 双方向通信
├── navigation/                            # React Navigation 設定
│   ├── RootNavigator.tsx                  # 認証状態による画面切り替え
│   ├── AuthStack.tsx                      # ログイン画面群
│   ├── MainStack.tsx                      # メイン画面群
│   └── TabNavigator.tsx                   # ボトムタブ
├── lib/                                   # ライブラリ
│   ├── api/                               # Axios (マイページ/CMS 2 インスタンス)
│   ├── cache/                             # fileCache (LRU), metadataCache
│   ├── storage/                           # asyncStorage, secureStorage
│   ├── monitoring/                        # appInsights
│   └── constants/                         # 定数
├── hooks/                                 # グローバルフック
│   ├── useAppState.ts                     # フォアグラウンド/バックグラウンド
│   └── useNetworkStatus.ts               # オンライン/オフライン
└── config/                                # 環境変数, CodePush
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

> 詳細はバックエンドアーキテクチャ設計書（BACKEND_ARCHITECTURE.md）を参照。

---

## 7. Web フロントエンドアーキテクチャ

### Feature-based Architecture

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

### 主要機能モジュール

| Feature           | 主要機能           | ページ数 | API エンドポイント                   |
| ----------------- | ------------------ | -------- | ------------------------------------ |
| **auth**          | JWT 認証           | 1        | POST /api/auth/login                 |
| **dashboard**     | 統計情報表示       | 1        | GET /api/dashboard/stats             |
| **contents**      | コンテンツ統合管理 | 3        | /api/contents/\*                     |
| **documents**     | ドキュメント管理   | 2        | /api/documents/\*                    |
| **videos**        | ビデオ管理         | 2        | /api/videos/\*, /api/files/sas-token |
| **notifications** | プッシュ通知       | 2        | /api/notifications/\*                |
| **system**        | システム設定       | 1        | /api/system/\*                       |

### 状態管理（2 層）

| 層                   | 技術              | 用途                                     |
| -------------------- | ----------------- | ---------------------------------------- |
| **サーバー状態**     | TanStack Query    | API データキャッシュ（staleTime: 5 分）  |
| **クライアント状態** | Zustand + persist | 認証情報、UI 状態（localStorage 永続化） |

### ファイルアップロードフロー（Azure Blob 直接）

```
Frontend                         Backend                      Azure Blob Storage
   │                                │                               │
   │ 1. POST /api/files/sas-token  │                               │
   ├───────────────────────────────►│                               │
   │ 2. { sasToken, blobUrl }      │                               │
   │◄───────────────────────────────┤                               │
   │                                │                               │
   │ 3. PUT blobUrl?sasToken (file) │                               │
   ├────────────────────────────────┼──────────────────────────────►│
   │ 4. 200 OK                     │                               │
   │◄────────────────────────────────────────────────────────────────┤
   │                                │                               │
   │ 5. POST /api/videos (metadata)│                               │
   ├───────────────────────────────►│ 6. INSERT INTO videos         │
   │ 7. 201 Created                │                               │
   │◄───────────────────────────────┤                               │
```

> 詳細はフロントエンドアーキテクチャ設計書（FRONTEND_ARCHITECTURE.md）を参照。

---

## 8. モバイルアプリアーキテクチャ

### アプリ構成

```
┌─────────────────────────────────────────────────────────────────┐
│                    React Native App                              │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │ ホーム   │  │コンテンツ │  │ 集章     │  │ 通知         │   │
│  │          │  │閲覧       │  │ 活動     │  │              │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────┘   │
│       Tab Navigator (React Navigation 6)                        │
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

> 詳細はモバイルアーキテクチャ設計書（MOBILE_ARCHITECTURE.md）を参照。

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
│  - JWT 認証 (HS512, 24h 有効)                          │
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
  "header": { "alg": "HS512", "typ": "JWT" },
  "payload": {
    "sub": "1",
    "username": "admin",
    "iat": 1643678400,
    "exp": 1643764800
  },
  "signature": "..."
}
```

- **パスワード暗号化**: BCrypt（10 rounds、自動ソルト生成）
- **Key Vault 管理対象**: DB 接続文字列、JWT 秘密鍵、Azure Storage キー、Redis パスワード

### 各クライアントのセキュリティ対策

| 対策                    | Web (CMS 管理画面)        | Mobile (React Native)                     |
| ----------------------- | ------------------------- | ----------------------------------------- |
| **Token 保存**          | localStorage              | Keychain (iOS) / Keystore (Android)       |
| **Token リフレッシュ**  | 401 → /login リダイレクト | Axios Interceptor 自動リフレッシュ        |
| **通信**                | HTTPS + CSP ヘッダー      | HTTPS + Certificate Pinning（オプション） |
| **難読化**              | Vite ビルド minify        | ProGuard (Android) / Bitcode (iOS)        |
| **Root/Jailbreak 検知** | N/A                       | 検知時に認証機能制限                      |

---

## 10. API 設計

### CMS API（バックエンド）

| メソッド | エンドポイント                       | 用途                   | 使用元       |
| -------- | ------------------------------------ | ---------------------- | ------------ |
| POST     | `/api/auth/login`                    | CMS ログイン           | Web          |
| GET      | `/api/contents`                      | コンテンツ一覧         | Web / Mobile |
| GET      | `/api/contents/:id`                  | コンテンツ詳細         | Web / Mobile |
| GET      | `/api/contents/search`               | コンテンツ検索         | Web / Mobile |
| POST     | `/api/contents`                      | コンテンツ作成         | Web          |
| PUT      | `/api/contents/:id`                  | コンテンツ更新         | Web          |
| DELETE   | `/api/contents/:id`                  | コンテンツ削除         | Web          |
| POST     | `/api/files/sas-token`               | SAS Token 取得         | Web          |
| GET      | `/api/documents`                     | ドキュメント一覧       | Web          |
| POST     | `/api/documents`                     | ドキュメント作成       | Web          |
| GET      | `/api/videos`                        | ビデオ一覧             | Web          |
| POST     | `/api/videos`                        | ビデオメタデータ保存   | Web          |
| POST     | `/api/notifications/send`            | 通知送信               | Web          |
| POST     | `/api/notifications/register-device` | デバイス Token 登録    | Mobile       |
| GET      | `/api/notifications`                 | 通知履歴取得           | Web / Mobile |
| GET      | `/api/stamps`                        | 集章一覧取得           | Mobile       |
| POST     | `/api/stamps/collect`                | スタンプ獲得           | Mobile       |
| GET      | `/api/system/maintenance`            | メンテナンスモード     | Web          |
| PUT      | `/api/system/maintenance`            | メンテナンスモード設定 | Web          |

### マイページ API（認証用）

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

---

## 11. データベース設計

> **注**: データベース設計の詳細（ER 図、テーブル定義、インデックス設計、Flyway マイグレーション等）は **データベース設計書** を参照してください。

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

| 項目                   | 設定                                |
| ---------------------- | ----------------------------------- |
| **冗長性**             | GRS（Geo-Redundant Storage）        |
| **アクセス層**         | Hot Tier                            |
| **暗号化**             | SSE（Storage Service Encryption）   |
| **パブリックアクセス** | Blob レベル（個別 URL アクセス）    |
| **認証**               | Shared Key（接続文字列）+ SAS Token |

#### SAS Token セキュリティ

| 項目         | 設定                   |
| ------------ | ---------------------- |
| **有効期限** | 1 時間                 |
| **権限**     | Write のみ（最小権限） |
| **スコープ** | 単一 Blob パス         |
| **生成元**   | バックエンドのみ       |

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
| **キャッシュ**         | Azure Redis Cache              | Premium           | セッション・ホットデータ      |
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
│   Azure Redis Cache (Primary) ──── Geo-Replication ─────────┤│
│   Azure Storage (GRS) ──── 6 コピー自動レプリケート ─────────┤│
│   Azure Key Vault ──── Soft-Delete + Purge Protection       ││
└───────────────────────────────────────────────────────────────┘│
                                                                 │
┌───────────────────────────────────────────────────────────────┐│
│            Secondary Region (Japan West / DR)                 ││
│                                                               ││
│   App Service (通常 0 台、災害時自動起動)                     │◄┘
│   Azure SQL Database (Secondary / Read Replica)              │
│   Azure Redis Cache (Secondary)                               │
│   Azure Storage (GRS Secondary)                               │
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
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
      idle-timeout: 600000
      max-lifetime: 1800000
```

**計算根拠**: 1,000 並行ユーザー × 200ms 平均レスポンス / 5 インスタンス = 40 → バッファ込み 20 接続/インスタンス

### Redis キャッシュ戦略

| データ             | キャッシュキー          | TTL     |
| ------------------ | ----------------------- | ------- |
| コンテンツ詳細     | `contents:{id}`         | 1 時間  |
| ユーザー情報       | `users:{id}`            | 30 分   |
| JWT ブラックリスト | `jwt:blacklist:{token}` | 24 時間 |

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

| 最適化項目          | 手法                               | 効果                     |
| ------------------- | ---------------------------------- | ------------------------ |
| **Hermes エンジン** | AOT コンパイル                     | 起動時間 57% 改善        |
| **FastImage**       | ディスクキャッシュ + 優先度制御    | 画像読み込み高速化       |
| **FlatList 最適化** | windowSize + removeClippedSubviews | スクロール FPS ≥ 55      |
| **3 層キャッシュ**  | メモリ → AsyncStorage → FileSystem | オフライン対応           |
| **CodePush OTA**    | JS バンドル即時配信                | ストア審査不要で修正配信 |

### パフォーマンス目標

| メトリック               | バックエンド | Web フロントエンド | モバイル |
| ------------------------ | ------------ | ------------------ | -------- |
| 平均レスポンスタイム     | < 200 ms     | -                  | -        |
| First Contentful Paint   | -            | < 1.5 秒           | -        |
| Largest Contentful Paint | -            | < 2.5 秒           | -        |
| コールドスタート         | -            | -                  | < 2 秒   |
| 画面遷移                 | -            | -                  | < 300 ms |
| FlatList スクロール FPS  | -            | -                  | ≥ 55 FPS |

---

## 16. 監視・ログ

### Application Insights 統合（3 システム共通）

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
```

---

## 17. 統合デプロイメント戦略

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
│  │  OTA:    CodePush (JS バンドル即時配信)                     │    │
│  └─────────────────────────────────────────────────────────────┘    │
│                                                                      │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │  モバイル Android Pipeline (mobile-android-pipeline.yml)    │    │
│  │                                                             │    │
│  │  Build:  yarn install → ./gradlew assembleRelease          │    │
│  │  Deploy: 内部テスト (Staging) → Google Play (Production)   │    │
│  │  OTA:    CodePush (JS バンドル即時配信)                     │    │
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
              tasks: 'clean build'
              publishJUnitResults: true
          - task: PublishBuildArtifacts@1

  - stage: Deploy
    dependsOn: Build
    condition: and(succeeded(), startsWith(variables['Build.SourceBranch'], 'refs/tags/v'))
    jobs:
      - deployment: DeployProduction
        environment: 'production'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    appName: 'juxyi-cms-prod'
                    deployToSlotOrASE: true
                    slotName: 'staging'
                    package: '$(Pipeline.Workspace)/drop/*.jar'
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

```json
// .azure/staticwebapp.config.json
{
  "routes": [
    {
      "route": "/api/*",
      "rewrite": "https://juxyi-cms-prod.azurewebsites.net/api/*"
    },
    { "route": "/*", "serve": "/index.html", "statusCode": 200 }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/images/*.{png,jpg,gif,svg}", "/css/*", "/js/*"]
  }
}
```

### モバイル: CodePush OTA 更新

| 変更種別             | CodePush | ストア再申請 |
| -------------------- | -------- | ------------ |
| 画面 UI 修正         | ✅ 可能  | ❌ 不要      |
| ロジック修正         | ✅ 可能  | ❌ 不要      |
| ライブラリ更新（JS） | ✅ 可能  | ❌ 不要      |
| Native Module 追加   | ❌ 不可  | ✅ 必要      |
| SDK 更新             | ❌ 不可  | ✅ 必要      |

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

4. ホットフィックス（JS のみ）
   └─ CodePush OTA 配信（ストア審査不要、即時反映）
```

### ロールバック手順

| システム              | ロールバック方法                      | 所要時間 |
| --------------------- | ------------------------------------- | -------- |
| **バックエンド**      | Staging ↔ Production スロットスワップ | < 1 分   |
| **フロントエンド**    | 前バージョン再デプロイ                | < 5 分   |
| **モバイル (JS)**     | CodePush ロールバック                 | < 5 分   |
| **モバイル (Native)** | ストア緊急リリース                    | 1-3 日   |

---

## まとめ

### 設計判断サマリー

| 項目                   | 選択                              | 理由                               |
| ---------------------- | --------------------------------- | ---------------------------------- |
| **バックエンド**       | Spring Boot 3.2 + Java 17         | エンタープライズ実績、長期サポート |
| **Web フロントエンド** | React 18 + Vite 5 + Ant Design    | 高速ビルド、エンタープライズ UI    |
| **モバイル**           | React Native 0.73 + Hermes        | Web チームとの技術共有             |
| **アーキテクチャ**     | Feature-based (Web/Mobile 共通)   | 高凝集・低結合・スケーラブル       |
| **状態管理**           | TanStack Query + Zustand          | 3 システム統一パターン             |
| **インフラ**           | Azure PaaS (App Service/SQL/Blob) | 運用負荷軽減、マネージドサービス   |
| **認証**               | JWT + e-ninsho + 生体認証         | 多要素・マイナンバーカード対応     |
| **デプロイ**           | ブルーグリーン + CodePush OTA     | ゼロダウンタイム + 即時 JS 更新    |

### 関連ドキュメント

| ドキュメント             | 内容                   |
| ------------------------ | ---------------------- |
| BACKEND_ARCHITECTURE.md  | バックエンド詳細設計   |
| FRONTEND_ARCHITECTURE.md | フロントエンド詳細設計 |
| MOBILE_ARCHITECTURE.md   | モバイルアプリ詳細設計 |
| API.md                   | API 仕様書             |

---

**最終更新日**: 2025-02-10
**ドキュメントバージョン**: 1.0.0
**作成者**: JUXYI 開発チーム
