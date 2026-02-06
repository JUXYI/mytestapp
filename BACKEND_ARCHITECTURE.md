# Content Management System - アーキテクチャ設計書

## 目次

1. [システム概要](#システム概要)
2. [技術スタック](#技術スタック)
3. [アーキテクチャ設計](#アーキテクチャ設計)
4. [ディレクトリ構造](#ディレクトリ構造)
5. [レイヤー設計](#レイヤー設計)
6. [データベース設計](#データベース設計)
7. [Azure インフラストラクチャ](#azure-インフラストラクチャ)
8. [セキュリティ設計](#セキュリティ設計)
9. [高可用性・スケーラビリティ](#高可用性スケーラビリティ)
10. [パフォーマンス最適化](#パフォーマンス最適化)
11. [監視・ログ](#監視ログ)
12. [デプロイ戦略](#デプロイ戦略)

---

## システム概要

### プロジェクト情報

- **プロジェクト名**: JUXYI Content Management System
- **バージョン**: 1.0.0
- **目的**: アプリケーション端末に表示されるコンテンツ（ドキュメント、ビデオ、URL リンク）を管理
- **想定ユーザー数**: 1000 並行ユーザー
- **開発チーム規模**: 10 人未満

### 主要機能

1. **コンテンツ管理（CRUD）**

   - ドキュメント管理（PDF、Word 等）
   - ビデオ管理（MP4、MOV 等）
   - URL リンク管理
   - 説明テキスト管理

2. **認証・認可**

   - JWT ベースの認証
   - ID/パスワード ログイン
   - トークンリフレッシュ

3. **ファイルストレージ**

   - Azure Blob Storage 連携
   - 大容量ファイル対応（最大 500MB）
   - 並列アップロード

4. **定期タスク**
   - 期限切れファイル自動削除
   - キャッシュ同期

---

## 技術スタック

### バックエンド

| カテゴリ           | 技術            | バージョン | 用途                 |
| ------------------ | --------------- | ---------- | -------------------- |
| **フレームワーク** | Spring Boot     | 3.2.x      | アプリケーション基盤 |
| **言語**           | Java            | 17         | プログラミング言語   |
| **ビルドツール**   | Gradle          | 8.x        | プロジェクトビルド   |
| **ORM**            | JPA/Hibernate   | 6.x        | データベースアクセス |
| **セキュリティ**   | Spring Security | 6.x        | 認証・認可           |
| **JWT**            | jjwt            | 0.12.x     | トークン生成・検証   |

### データベース・ストレージ

| カテゴリ               | 技術                                | 用途                               |
| ---------------------- | ----------------------------------- | ---------------------------------- |
| **データベース**       | Azure SQL Database (Standard S2/S3) | メインデータ保存                   |
| **キャッシュ**         | Azure Redis Cache (Basic/Standard)  | セッション・ホットデータキャッシュ |
| **ファイルストレージ** | Azure Blob Storage (Hot Tier)       | ドキュメント・ビデオ保存           |
| **シークレット管理**   | Azure Key Vault                     | パスワード・キー暗号化保存         |

### インフラストラクチャ

| カテゴリ         | 技術                     | 用途                         |
| ---------------- | ------------------------ | ---------------------------- |
| **ホスティング** | Azure App Service (PaaS) | アプリケーション実行環境     |
| **監視**         | Application Insights     | パフォーマンス監視・ログ集約 |
| **CI/CD**        | Azure DevOps Pipelines   | 自動ビルド・デプロイ         |

### データベースマイグレーション

| 技術   | 用途                   |
| ------ | ---------------------- |
| Flyway | スキーマバージョン管理 |

---

## アーキテクチャ設計

### システムアーキテクチャ図

```
                                    ┌──────────────────────────────────┐
                                    │      グローバルユーザー           │
                                    │    （モバイルアプリ + Web）        │
                                    └────────────┬─────────────────────┘
                                                 │ HTTPS
                                                 │
┌────────────────────────────────────────────────▼─────────────────────────────────────┐
│                        Azure Front Door Premium + WAF                                │
│  ┌──────────────────────────────────────────────────────────────────────────────┐   │
│  │ - グローバル負荷分散・高速配信                                                │   │
│  │ - Web Application Firewall（WAF）                                            │   │
│  │   - OWASP Top 10 防御（SQL Injection, XSS, CSRF）                           │   │
│  │   - DDoS 保護（Layer 3/4/7）                                                 │   │
│  │   - Bot 保護                                                                  │   │
│  │ - Primary / Secondary リージョン間インテリジェントルーティング               │   │
│  │ - SSL/TLS 終端処理                                                            │   │
│  └──────────────────────────────────────────────────────────────────────────────┘   │
└────────────┬───────────────────────────────────────────────┬────────────────────���────┘
             │                                               │
             │ Primary Region                                │ Secondary Region (DR)
             │ (Japan East / East Asia)                      │ (Japan West / Southeast Asia)
             │                                               │
┌────────────▼────────────────────────────┐    ┌────────────▼────────────────────────────┐
│      Primary Region Infrastructure      │    │     Secondary Region Infrastructure     │
│                                          │    │         （Disaster Recovery）           │
│  ┌────────────────────────────────────┐ │    │  ┌────────────────────────────────────┐ │
│  │   Azure App Service (Primary)      │ │    │  │   Azure App Service (Secondary)    │ │
│  │   ┌──────────────────────────────┐ │ │    │  │   ┌──────────────────────────────┐ │ │
│  │   │ Spring Boot Application      │ │ │    │  │   │ Spring Boot Application      │ │ │
│  │   │ - REST API                   │ │ │    │  │   │ (Standby Mode)               │ │ │
│  │   │ - JWT 認証                   │ │ │    │  │   └──────────────────────────────┘ │ │
│  │   │ - スケジュールタスク          │ │ │    │  │                                    │ │
│  │   └──────────────────────────────┘ │ │    │  │   自動スケーリング:               │ │
│  │                                    │ │    │  │   - 通常: 0インスタンス（コスト削減）│ │
│  │   自動スケーリング:                │ │    │  │   - 災害時: 自動起動             │ │
│  │   - 最小: 2インスタンス            │ │    │  └────────────────────────────────────┘ │
│  │   - 最大: 5インスタンス            │ │    │                                          │
│  └────────────┬───────────────────────┘ │    │                                          │
│               │                         │    │                                          │
└───────────────┼─────────────────────────┘    └──��───────────────────────────────────────┘
                │                                              │
                │ ┌────────────────────────────────────────────┘
                │ │ Geo-Replication / Auto-Failover
                │ │
    ┌───────────┼─┼──────────┬──────────────┬──────────────┬───────────────┬──────────────┐
    │           │ │          │              │              │               │              │
┌───▼───────┐ ┌─▼─▼──────┐ ┌▼────────────┐ ┌▼────────────┐ ┌─────▼───────┐ ┌▼────────────┐
│  Azure    │ │  Azure   │ │Azure Storage│ │Azure Storage│ │  Azure Key  │ │   Azure     │
│    SQL    │ │   SQL    │ │  Account 1  │ │  Account 2  │ │    Vault    │ │   Redis     │
│ Database  │ │ Database │ │  (Videos)   │ │ (Documents) │ │             │ │   Cache     │
│ (Primary) │ │(Secondary│ │             │ │             │ │             │ │             │
│           │ │  Read    │ │  Blob       │ │  Blob       │ │  Secrets    │ │ Premium     │
│ Standard  │ │  Replica)│ │  Storage    │ │  Storage    │ │  Management │ │             │
│ S2/S3     │ │          │ │  - Hot Tier │ │  - Hot Tier │ │             │ │ 機能:       │
│           │ │ 自動      │ │  - GRS      │ │  - GRS      │ │ - DB Password│ │ - Session  │
│ 機能:     │ │ フェイル  │ │             │ │             │ │ - JWT Secret│ │ - JWT Token│
│ - CRUD    │ │ オーバー  │ │ 用途:       │ │ 用途:       │ │ - Storage   │ │   Blacklist│
│ - 全文検索│ │ (RTO<1h) │ │ - ビデオ    │ │ - ドキュメント│ │   Keys      │ │ - Hot Data │
│ - 自動    │ │          │ │ - サムネイル │ │ - 画像      │ │ - Redis Key │ │   Cache    │
│   バックアップ│ │        │ │             │ │             │ │             │ │            │
│   (7-35日)│ │          │ │ CDN統合:    │ │ CDN統合:    │ │ Managed     │ │ Geo-       │
│ - 長期保留│ │          │ │ - Azure     │ │ - Azure     │ │ Identity    │ │ Replication│
│   (1年)   │ │          │ │   CDN       │ │   CDN       │ │             │ │            │
│           │ │          │ │ - グローバル │ │ - グローバル │ │             │ │            │
│ 自動      │ │          │ │   配信加速  │ │   配信加速  │ │             │ │            │
│ 暗号化    │ │          │ │             │ │             │ │             │ │            │
└───────────┘ └──────────┘ └─────────────┘ └─────────────┘ └─────────────┘ └────────────┘
     │             │              │              │                │              │
     │             │              │              │                │              │
     └─────────────┴──────────────┴──────────────┴────────────────┴──────────────┘
                                  │
                    ログ・メトリクス・診断データ送信
                                  │
     ┌────────────────────────────▼────────────────────────────────────────────┐
     │                  セキュリティ・監視レイヤー                              │
     │                                                                          │
     │  ┌────────────────────┐  ┌────────────────────┐  ┌──────────────────┐  │
     │  │ Application        │  │  Log Analytics     │  │ Microsoft        │  │
     │  │ Insights           │  │  Workspace         │  │ Sentinel (SIEM)  │  │
     │  │                    │  │                    │  │                  │  │
     │  │ - パフォーマンス    │  │ - 統合ログ収集     │  │ - セキュリティ   │  │
     │  │   メトリクス        │  │ - KQLクエリ        │  │   脅威検知       │  │
     │  │ - リクエスト追跡    │  │ - カスタムアラート │  │ - 異常ログイン   │  │
     │  │ - 例外トラッキング  │  │ - ダッシュボード   │  │   検出           │  │
     │  │ - 分散トレーシング  │  │                    │  │ - インシデント   │  │
     │  │ - 可用性テスト      │  │ データソース:      │  │   対応自動化     │  │
     │  │                    │  │ - App Service      │  │ - コンプライアンス│ │
     │  └────────────────────┘  │ - SQL Database     │  │   レポート       │  │
     │                          │ - Storage Account  │  │                  │  │
     │  ┌────────────────────┐  │ - Front Door       │  └──────────────────┘  │
     │  │ Defender for Cloud │  │ - Key Vault        │                        │
     │  │                    │  └────────────────────┘  ┌──────────────────┐  │
     │  │ - App Service 脆弱性│                         │  Azure Backup    │  │
     │  │   スキャン          │                         │                  │  │
     │  │ - SQL Database     │                         │ - SQL Database   │  │
     │  │   脆弱性評価        │                         │   長期バックアップ│ │
     │  │ - Storage 脅威検出 │                         │   (1年保持)      │  │
     │  │ - セキュリティ      │                         │ - Blob Storage   │  │
     │  │   推奨事項          │                         │   ソフト削除     │  │
     │  │ - コンプライアンス  │                         │   (30日保持)     │  │
     │  │   スコア            │                         │ - App Service    │  │
     │  └────────────────────┘                         │   構成バックアップ│ │
     │                                                  └──────────────────┘  │
     └──────────────────────────────────────────────────────────────────────────┘
                                  │
                                  │ アラート・通知
                                  │
     ┌────────────────────────────▼────────────────────────────────────────────┐
     │                      通知・プッシュサービス                               │
     │                                                                          │
     │  ┌─────────────────────────────────────────────────────────────────┐    │
     │  │              Azure Notification Hubs                            │    │
     │  │  ┌──────────────────────────────────────────────────────────┐   │    │
     │  │  │ - iOS (APNS) プッシュ通知                                │   │    │
     │  │  │ - Android (FCM) プッシュ通知                             │   │    │
     │  │  │                                                          │   │    │
     │  │  │ 用途:                                                    │   │    │
     │  │  │ - 新コンテンツ公開通知                                   │   │    │
     │  │  │ - システムメンテナンス通知                               │   │    │
     │  │  │ - セキュリティアラート（管理者向け）                     │   │    │
     │  │  │ - カスタムイベント通知                                   │   │    │
     │  │  └──────────────────────────────────────────────────────────┘   │    │
     │  └─────────────────────────────────────────────────────────────────┘    │
     └──────────────────────────────────────────────────────────────────────────┘

                              ┌─────────────────────┐
                              │   モバイルアプリ    │
                              │   (iOS / Android)   │
                              │                     │
                              │ - コンテンツ閲覧    │
                              │ - プッシュ通知受信  │
                              └─────────────────────┘
```

### データフローと冗長化構成

```
┌──────────────────────────────────────────────────────────────────┐
│                      Primary Region（通常運用）                   │
│                                                                  │
│  App Service (2-5 instances)                                    │
│         │                                                        │
│         ├──CRUD操作──────────► Azure SQL Database (Primary)     │
│         │                             │                         │
│         │                             │ Geo-Replication         │
│         │                             │ (非同期, RPO < 5分)      │
│         │                             ▼                         │
│         │                      Azure SQL Database (Secondary)   │
│         │                      ※ 読み取り専用レプリカ           │
│         │                                                        │
│         ├──ファイル操作──────► Blob Storage (GRS)               │
│         │                       │                               │
│         │                       │ Geo-Redundant Storage         │
│         │                       │ (自動, 6コピー)                │
│         │                       ▼                               │
│         │                Secondary Region にレプリケート済み    │
│         │                                                        │
│         ├──キャッシュ─────────► Azure Redis Cache (Premium)     │
│         │                       │                               │
│         │                       │ Geo-Replication               │
│         │                       ▼                               │
│         │                Secondary Region Redis                │
│         │                                                        │
│         └──シークレット取得───► Azure Key Vault                 │
│                                  │                              │
│                                  │ Soft-Delete & Purge Protection│
│                                  │ (バックアップ済み)            │
└──────────────────────────────────────────────────────────────────┘

                      ▼ 災害発生時（Primary Region 障害）

┌──────────────────────────────────────────────────────────────────┐
│              Secondary Region（Disaster Recovery）               │
│                                                                  │
│  Front Door による自動フェイルオーバー                            │
│         │                                                        │
│         ▼                                                        │
│  App Service (Secondary) が自動起動                              │
│         │                                                        │
│         ├──読み書き────────► Azure SQL Database (Secondary)      │
│         │                    ※ Primary に昇格                   │
│         │                                                        │
│         ├──ファイル操作────► Blob Storage (Secondary Region)    │
│         │                    ※ GRS により既に同期済み            │
│         │                                                        │
│         └──キャッシュ──────► Azure Redis Cache (Secondary)       │
│                                                                  │
│  RTO: < 1時間（自動フェイルオーバー + 手動確認）                  │
│  RPO: < 5分（データ損失最小）                                    │
└──────────────────────────────────────────────────────────────────┘
```

### セキュリティレイヤーの詳細

```
┌─────────────────────────────────────────────────────────────────┐
│                  多層防御セキュリティモデル                      │
└─────────────────────────────────────────────────────────────────┘

   Layer 1: ネットワークセキュリティ
   ┌────────────────────────────────────────────────────────┐
   │  Azure Front Door Premium + WAF                        │
   │  - DDoS Protection (Layer 3/4/7)                       │
   │  - Bot 保護                                            │
   │  - Geo-Filtering                                       │
   │  - Rate Limiting                                       │
   └────────────────────────────────────────────────────────┘
                          │
                          ▼
   Layer 2: アプリケーションセキュリティ
   ┌────────────────────────────────────────────────────────┐
   │  App Service + Spring Security                         │
   │  - JWT 認証（Bearer Token）                            │
   │  - HTTPS Only                                          │
   │  - CORS 制御                                           │
   │  - Input Validation                                    │
   └────────────────────────────────────────────────────────┘
                          │
                          ▼
   Layer 3: データセキュリティ
   ┌────────────────────────────────────────────────────────┐
   │  Azure SQL Database                                    │
   │  - Transparent Data Encryption (TDE)                   │
   │  - Advanced Threat Protection                          │
   │  - Dynamic Data Masking                                │
   │                                                        │
   │  Azure Storage                                         │
   │  - Encryption at Rest (256-bit AES)                    │
   │  - Encryption in Transit (TLS 1.2+)                    │
   │  - Shared Access Signature (SAS) Tokens                │
   └────────────────────────────────────────────────────────┘
                          │
                          ▼
   Layer 4: シークレット管理
   ┌────────────────────────────────────────────────────────┐
   │  Azure Key Vault                                       │
   │  - HSM-Backed Keys                                     │
   │  - Managed Identity 認証                               │
   │  - アクセス監査ログ                                    │
   └────────────────────────────────────────────────────────┘
                          │
                          ▼
   Layer 5: 脅威検知・監視
   ┌────────────────────────────────────────────────────────┐
   │  Microsoft Sentinel (SIEM)                             │
   │  - リアルタイム脅威検知                                │
   │  - 異常ログイン検出                                    │
   │  - 大量ファイル削除検知                                │
   │                                                        │
   │  Defender for Cloud                                    │
   │  - 脆弱性スキャン                                      │
   │  - セキュリティスコア                                  │
   │  - 推奨事項の自動適用                                  │
   └────────────────────────────────────────────────────────┘
```

---

### Azure サービス構成一覧

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
| **通知**               | Notification Hubs              | Standard          | モバイルプッシュ通知          |

---

## ディレクトリ構造

### プロジェクト全体構造

```
content-management-system/
│
├── .azure/                              # Azure 関連設定
│   └── pipelines/                       # CI/CD パイプライン
│       ├── azure-pipelines-dev.yml      # 開発環境デプロイ
│       ├── azure-pipelines-staging.yml  # ステージング環境デプロイ
│       └── azure-pipelines-prod.yml     # 本番環境デプロイ
│
├── docker/                              # Docker設定
│   ├── Dockerfile                       # アプリケーションイメージ
│   └── docker-compose.yml               # ローカル開発環境
│
├── docs/                                # ドキュメント
│   ├── API.md                           # API設計書
│   ├── ARCHITECTURE.md                  # アーキテクチャ設計書（本文書）
│   └── DEPLOYMENT.md                    # デプロイ手順書
│
├── scripts/                             # 運用スクリプト
│   ├── init-azure-resources.sh          # Azure リソース初期化
│   └── deploy.sh                        # 手動デプロイ
│
├── src/
│   ├── main/
│   │   ├── java/com/juxyi/cms/
│   │   │   ├── CmsApplication.java
│   │   │   ├── config/                  # 設定クラス
│   │   │   ├── controller/              # REST API エンドポイント
│   │   │   ├── service/                 # ビジネスロジック
│   │   │   ├── repository/              # データアクセス
│   │   │   ├── model/                   # データモデル
│   │   │   ├── security/                # セキュリティ
│   │   │   ├── exception/               # 例外処理
│   │   │   ├── util/                    # ユーティリティ
│   │   │   └── constant/                # 定数
│   │   │
│   │   └── resources/
│   │       ├── application.yml          # メイン設定
│   │       ├── application-dev.yml      # 開発環境設定
│   │       ├── application-staging.yml  # ステージング環境設定
│   │       ├── application-prod.yml     # 本番環境設定
│   │       ├── db/migration/            # Flyway マイグレーション
│   │       └── logback-spring.xml       # ログ設定
│   │
│   └── test/                            # テストコード
│       └── java/com/juxyi/cms/
│
├── build.gradle                         # Gradle ビルド設定
├── settings.gradle
├── gradle.properties
└── README.md
```

### パッケージ構成の詳細

```
com.juxyi.cms/
│
├── config/                              # 設定クラスパッケージ
│   ├── SecurityConfig.java              # Spring Security 設定
│   ├── JwtConfig.java                   # JWT 設定
│   ├── AzureStorageConfig.java          # Azure Blob Storage 設定
│   ├── AzureKeyVaultConfig.java         # Key Vault 設定
│   ├── RedisConfig.java                 # Redis キャッシュ設定
│   ├── SchedulingConfig.java            # スケジュールタスク設定
│   ├── CorsConfig.java                  # CORS 設定
│   └── WebMvcConfig.java                # MVC 設定
│
├── controller/                          # コントローラー層
│   ├── AuthController.java              # 認証 API
│   ├── ContentController.java           # コンテンツ管理 API
│   ├── DocumentController.java          # ドキュメント管理 API
│   ├── VideoController.java             # ビデオ管理 API
│   ├── UrlLinkController.java           # URLリンク管理 API
│   ├── FileUploadController.java        # ファイルアップロード API
│   └── HealthController.java            # ヘルスチェック API
│
├── service/                             # サービス層
│   ├── AuthService.java                 # 認証サービス
│   ├── ContentService.java              # コンテンツサービス
│   ├── DocumentService.java             # ドキュメントサービス
│   ├── VideoService.java                # ビデオサービス
│   ├── UrlLinkService.java              # URLリンクサービス
│   ├── FileStorageService.java          # ファイルストレージサービス（Azure Blob封装）
│   ├── CacheService.java                # キャッシュサービス
│   └── ScheduledTaskService.java        # 定期タスクサービス
│
├── repository/                          # リポジトリ層
│   ├── UserRepository.java
│   ├── ContentRepository.java
│   ├── DocumentRepository.java
│   ├── VideoRepository.java
│   └── UrlLinkRepository.java
│
├── model/                               # モデルパッケージ
│   ├── entity/                          # JPAエンティティ
│   │   ├── BaseEntity.java              # 基底エンティティ
│   │   ├── User.java
│   │   ├── Content.java
│   │   ├── Document.java
│   │   ├── Video.java
│   │   └── UrlLink.java
│   │
│   ├── dto/                             # データ転送オブジェクト
│   │   ├── request/                     # リクエストDTO
│   │   │   ├── LoginRequest.java
│   │   │   ├── RegisterRequest.java
│   │   │   ├── ContentCreateRequest.java
│   │   │   ├── ContentUpdateRequest.java
│   │   │   ├── DocumentCreateRequest.java
│   │   │   ├── VideoCreateRequest.java
│   │   │   └── UrlLinkCreateRequest.java
│   │   │
│   │   └── response/                    # レスポンスDTO
│   │       ├── ApiResponse.java         # 統一レスポンス形式
│   │       ├── JwtResponse.java
│   │       ├── ContentResponse.java
│   │       ├── DocumentResponse.java
│   │       ├── VideoResponse.java
│   │       ├── UrlLinkResponse.java
│   │       ├── FileUploadResponse.java
│   │       └── PageResponse.java
│   │
│   └── enums/                           # 列挙型
│       ├── ContentType.java
│       ├── ContentStatus.java
│       └── FileType.java
│
├── security/                            # セキュリティパッケージ
│   ├── JwtAuthenticationFilter.java     # JWT フィルター
│   ├── JwtTokenProvider.java            # トークン生成・検証
│   ├── CustomUserDetailsService.java    # ユーザー詳細サービス
│   └── UserPrincipal.java               # 認証ユーザー情報
│
├── exception/                           # 例外処理
│   ├── GlobalExceptionHandler.java      # グローバル例外ハンドラー
│   ├── ResourceNotFoundException.java
│   ├── UnauthorizedException.java
│   ├── BadRequestException.java
│   └── FileStorageException.java
│
├── util/                                # ユーティリティ
│   ├── DateUtil.java
│   ├── FileUtil.java
│   ├── ValidationUtil.java
│   └── AzureUtil.java
│
└── constant/                            # 定数
    ├── AppConstants.java
    ├── SecurityConstants.java
    └── StorageConstants.java
```

---

## レイヤー設計

### レイヤーアーキテクチャ

本システムは **4 層アーキテクチャ** を採用しています：

```
┌─────────────────────────────────────────────────────┐
│              Controller 層（表示層）                 │
│  - HTTPリクエスト/レスポンス処理                     │
│  - リクエストバリデーション                         │
│  - DTOマッピング                                    │
└────────────────┬────────────────────────────────────┘
                 │ 依存
┌────────────────▼────────────────────────────────────┐
│              Service 層（ビジネスロジック層）        │
│  - トランザクション管理                             │
│  - ビジネスルール実装                               │
│  - 複数Repositoryの調整                             │
│  - 外部サービス連携                                 │
└────────────────┬────────────────────────────────────┘
                 │ 依存
┌────────────────▼────────────────────────────────────┐
│            Repository 層（データアクセス層）         │
│  - データベースCRUD操作                             │
│  - クエリ定義                                       │
│  - ページネーション                                 │
└────────────────┬────────────────────────────────────┘
                 │ 依存
┌────────────────▼────────────────────────────────────┐
│              Entity 層（ドメインモデル層）           │
│  - ビジネスエンティティ定義                         │
│  - テーブルマッピング                               │
│  - 関連定義                                         │
└─────────────────────────────────────────────────────┘
```

### 各層の責務

#### 1. Controller 層

**責務**:

- HTTP リクエストの受信
- リクエストバリデーション（`@Valid`）
- Service 層の呼び出し
- レスポンス生成（DTO への変換）
- HTTP ステータスコード設定

**禁止事項**:

- ビジネスロジックの記述
- データベースへの直接アクセス
- トランザクション管理

**例**:

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

#### 2. Service 層

**責務**:

- ビジネスロジック実装
- トランザクション管理（`@Transactional`）
- 複数 Repository の調整
- Entity ⇔ DTO 変換
- キャッシュ制御
- 外部サービス呼び出し（Azure SDK 等）

**例**:

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

#### 3. Repository 層

**責務**:

- データベース CRUD 操作
- カスタムクエリ定義（`@Query`）
- ページネーション処理
- ソート処理

**例**:

```java
@Repository
public interface ContentRepository extends JpaRepository<Content, Long> {
    Page<Content> findByContentType(ContentType contentType, Pageable pageable);

    @Query("SELECT c FROM Content c WHERE c.title LIKE %:keyword%")
    Page<Content> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);
}
```

#### 4. Entity 層

**責務**:

- ビジネスエンティティ定義
- テーブルマッピング（`@Entity`, `@Table`）
- 関連定義（`@OneToOne`, `@ManyToOne`等）
- バリデーション制約（`@NotNull`, `@Size`等）

**例**:

```java
@Entity
@Table(name = "contents")
@Getter
@Setter
public class Content extends BaseEntity {
    @NotNull
    @Enumerated(EnumType.STRING)
    private ContentType contentType;

    @NotBlank
    @Column(nullable = false, length = 200)
    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
}
```

---

## データベース設計

### ER 図

```
┌─────────────────┐
│     users       │
├─────────────────┤
│ PK  id          │
│     username    │◄──┐
│     password    │   │
│     email       │   │
│     enabled     │   │
│     created_at  │   │
│     updated_at  │   │
└─────────────────┘   │
                      │ FK (created_by)
                      │
┌─────────────────────▼─────────┐
│        contents               │
├───────────────────────────────┤
│ PK  id                        │◄──┐
│     content_type (ENUM)       │   │
│     title                     │   │
│     description               │   │
│     status (ENUM)             │   │
│ FK  created_by → users.id     │   │
│     created_at                │   │
│     updated_at                │   │
│                               │   │
│ INDEX: content_type           │   │
│ INDEX: status                 │   │
│ INDEX: created_at             │   │
└───────────────────────────────┘   │
           │                        │
           ├────────────────────────┼────────────────────┐
           │                        │                    │
           │ FK (content_id)        │                    │
           │                        │                    │
┌──────────▼──────────┐  ┌─────────▼────────┐  ┌────────▼─────────┐
│     documents       │  │     videos       │  │    url_links     │
├─────────────────────┤  ├──────────────────┤  ├──────────────────┤
│ PK  id              │  │ PK  id           │  │ PK  id           │
│ FK  content_id      │  │ FK  content_id   │  │ FK  content_id   │
│     file_url        │  │     video_url    │  │     url          │
│     file_name       │  │     thumbnail_url│  │     display_text │
│     file_size       │  │     duration     │  │                  │
│     mime_type       │  │     file_size    │  │                  │
└─────────────────────┘  └──────────────────┘  └──────────────────┘
```

### テーブル定義

#### users テーブル

| カラム名   | 型            | 制約               | 説明                 |
| ---------- | ------------- | ------------------ | -------------------- |
| id         | BIGINT        | PK, AUTO_INCREMENT | ユーザー ID          |
| username   | NVARCHAR(50)  | NOT NULL, UNIQUE   | ユーザー名           |
| password   | NVARCHAR(255) | NOT NULL           | ハッシュ化パスワード |
| email      | NVARCHAR(100) | UNIQUE             | メールアドレス       |
| enabled    | BIT           | DEFAULT 1          | 有効フラグ           |
| created_at | DATETIME2     | DEFAULT GETDATE()  | 作成日時             |
| updated_at | DATETIME2     | DEFAULT GETDATE()  | 更新日時             |

#### contents テーブル

| カラム名     | 型            | 制約               | 説明                     |
| ------------ | ------------- | ------------------ | ------------------------ |
| id           | BIGINT        | PK, AUTO_INCREMENT | コンテンツ ID            |
| content_type | NVARCHAR(20)  | NOT NULL           | DOCUMENT/VIDEO/URL_LINK  |
| title        | NVARCHAR(200) | NOT NULL           | タイトル                 |
| description  | NVARCHAR(MAX) | NULL               | 説明文                   |
| status       | NVARCHAR(20)  | DEFAULT 'DRAFT'    | DRAFT/PUBLISHED/ARCHIVED |
| created_by   | BIGINT        | FK → users.id      | 作成者                   |
| created_at   | DATETIME2     | DEFAULT GETDATE()  | 作成日時                 |
| updated_at   | DATETIME2     | DEFAULT GETDATE()  | 更新日時                 |

**インデックス**:

- `idx_content_type` ON (content_type)
- `idx_status` ON (status)
- `idx_created_at` ON (created_at)
- `idx_composite` ON (content_type, status, created_at)

#### documents テーブル

| カラム名   | 型            | 制約                     | 説明                        |
| ---------- | ------------- | ------------------------ | --------------------------- |
| id         | BIGINT        | PK, AUTO_INCREMENT       | ドキュメント ID             |
| content_id | BIGINT        | FK → contents.id, UNIQUE | コンテンツ ID               |
| file_url   | NVARCHAR(500) | NOT NULL                 | フ �� イル URL (Azure Blob) |
| file_name  | NVARCHAR(255) | NULL                     | ファイル名                  |
| file_size  | BIGINT        | NULL                     | ファイルサイズ（bytes）     |
| mime_type  | NVARCHAR(100) | NULL                     | MIME タイプ                 |

#### videos テーブル

| カラム名      | 型            | 制約                     | 説明                    |
| ------------- | ------------- | ------------------------ | ----------------------- |
| id            | BIGINT        | PK, AUTO_INCREMENT       | ビデオ ID               |
| content_id    | BIGINT        | FK → contents.id, UNIQUE | コンテンツ ID           |
| video_url     | NVARCHAR(500) | NOT NULL                 | ビデオ URL              |
| thumbnail_url | NVARCHAR(500) | NULL                     | サムネイル URL          |
| duration      | INT           | NULL                     | 再生時間（秒）          |
| file_size     | BIGINT        | NULL                     | ファイルサイズ（bytes） |

#### url_links テーブル

| カラム名     | 型            | 制約                     | 説明          |
| ------------ | ------------- | ------------------------ | ------------- |
| id           | BIGINT        | PK, AUTO_INCREMENT       | URL リンク ID |
| content_id   | BIGINT        | FK → contents.id, UNIQUE | コンテンツ ID |
| url          | NVARCHAR(500) | NOT NULL                 | 外部 URL      |
| display_text | NVARCHAR(200) | NULL                     | 表示テキスト  |

### Flyway マイグレーションスクリプト

```sql
-- V1__init_schema.sql
CREATE TABLE users (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(50) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    email NVARCHAR(100),
    enabled BIT DEFAULT 1,
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

CREATE TABLE contents (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    content_type NVARCHAR(20) NOT NULL,
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    status NVARCHAR(20) DEFAULT 'DRAFT',
    created_by BIGINT FOREIGN KEY REFERENCES users(id),
    created_at DATETIME2 DEFAULT GETDATE(),
    updated_at DATETIME2 DEFAULT GETDATE()
);

-- V2__add_content_tables.sql
CREATE TABLE documents (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    content_id BIGINT FOREIGN KEY REFERENCES contents(id) ON DELETE CASCADE,
    file_url NVARCHAR(500) NOT NULL,
    file_name NVARCHAR(255),
    file_size BIGINT,
    mime_type NVARCHAR(100)
);

CREATE TABLE videos (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    content_id BIGINT FOREIGN KEY REFERENCES contents(id) ON DELETE CASCADE,
    video_url NVARCHAR(500) NOT NULL,
    thumbnail_url NVARCHAR(500),
    duration INT,
    file_size BIGINT
);

CREATE TABLE url_links (
    id BIGINT IDENTITY(1,1) PRIMARY KEY,
    content_id BIGINT FOREIGN KEY REFERENCES contents(id) ON DELETE CASCADE,
    url NVARCHAR(500) NOT NULL,
    display_text NVARCHAR(200)
);

-- V3__add_indexes.sql
CREATE INDEX idx_contents_type ON contents(content_type);
CREATE INDEX idx_contents_status ON contents(status);
CREATE INDEX idx_contents_created_at ON contents(created_at);
CREATE INDEX idx_contents_composite ON contents(content_type, status, created_at);
```

---

## Azure インフラストラクチャ

### リソース構成

| リソース                  | SKU/Tier               | 目的               | 推定コスト（月額） |
| ------------------------- | ---------------------- | ------------------ | ------------------ |
| **App Service Plan**      | Premium P1v3           | アプリホスティング | $100               |
| **Azure SQL Database**    | Standard S2            | メインデータベース | $75                |
| **Azure Storage Account** | Standard LRS, Hot Tier | Blob ストレージ    | $20                |
| **Azure Redis Cache**     | Basic C1               | キャッシュ         | $15                |
| **Azure Key Vault**       | Standard               | シークレット管理   | $5                 |
| **Application Insights**  | -                      | 監視・ログ         | $10                |
| **合計**                  | -                      | -                  | **約 $225/月**     |

### Azure Blob Storage 構成

#### コンテナ構造

```
content-files/                    # メインコンテナ
├── documents/                    # ドキュメント用
│   ├── {uuid}.pdf
│   ├── {uuid}.docx
│   └── {uuid}.txt
│
├── videos/                       # ビデオ用
│   ├── {uuid}.mp4
│   ├── {uuid}.mov
│   └── thumbnails/               # サムネイル
│       ├── {uuid}_thumb.jpg
│       └── {uuid}_thumb.png
│
└── temp/                         # 一時ファイル（30日後自動削除）
    └── {uuid}.tmp
```

#### アクセス設定

- **パブリックアクセス**: Blob レベル（個別 URL でアクセス可能）
- **認証**: Shared Key（接続文字列）
- **暗号化**: Storage Service Encryption (SSE) 有効
- **ライフサイクル管理**: temp/ フォルダ 30 日後自動削除

### FileStorageService による Azure Blob 封装

**配置場所**: `src/main/java/com/juxyi/cms/service/FileStorageService.java`

**責務**:

1. ファイルアップロード（通常・ビデオ対応）
2. ファイル削除
3. ファイル存在チェック
4. メタデータ取得
5. バリデーション（サイズ・拡張子）

**主要メソッド**:

```java
@Service
@RequiredArgsConstructor
public class FileStorageService {
    private final BlobContainerClient containerClient;

    // 通常ファイルアップロード
    public FileUploadResponse uploadFile(MultipartFile file, String folder)

    // ビデオファイルアップロード（並列処理）
    public FileUploadResponse uploadVideo(MultipartFile file, String folder)

    // ファイル削除
    public void deleteFile(String blobUrl)

    // ファイル存在チェック
    public boolean fileExists(String blobUrl)

    // メタデータ取得
    public BlobProperties getFileMetadata(String blobUrl)
}
```

**ビデオアップロード最適化**:

- **並列アップロード**: 4MB ブロック単位、5 並列処理
- **リトライ**: 失敗時最大 3 回自動リトライ
- **タイムアウト**: 30 分
- **最大サイズ**: 500MB

---

## セキュリティ設計

### 認証フロー

```
┌────────┐                           ┌──────────────┐
│ Client │                           │   Backend    │
└───┬────┘                           └──────┬───────┘
    │                                       │
    │ 1. POST /api/auth/login              │
    │    { username, password }             │
    ├──────────────────────────────────────>│
    │                                       │
    │                                       │ 2. ユーザー検証
    │                                       │    BCrypt.verify()
    │                                       │
    │                                       │ 3. JWTトークン生成
    │                                       │    - ユーザーID
    │                                       │    - 有効期限: 24時間
    │                                       │    - 署名: HMAC-SHA512
    │                                       │
    │ 4. 200 OK                             │
    │    { accessToken, expiresIn }         │
    │<──────────────────────────────────────┤
    │                                       │
    │ 5. GET /api/contents                 │
    │    Authorization: Bearer {token}      │
    ├──────────────────────────────────────>│
    │                                       │
    │                                       │ 6. JwtAuthenticationFilter
    │                                       │    - トークン抽出
    │                                       │    - 署名検証
    │                                       │    - 有効期限チェック
    │                                       │    - SecurityContext設定
    │                                       │
    │                                       │ 7. ビジネスロジック実行
    │                                       │
    │ 8. 200 OK                             │
    │    { data }                           │
    │<──────────────────────────────────────┤
```

### JWT 構造

```json
{
  "header": {
    "alg": "HS512",
    "typ": "JWT"
  },
  "payload": {
    "sub": "1", // ユーザーID
    "username": "admin",
    "iat": 1643678400, // 発行時刻
    "exp": 1643764800 // 有効期限
  },
  "signature": "..."
}
```

### パスワード暗号化

- **アルゴリズム**: BCrypt
- **ストレングス**: 10 rounds
- **ソルト**: 自動生成

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

### CORS 設定

```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);
        config.setAllowedOriginPatterns(Collections.singletonList(allowedOrigins));
        config.setAllowedHeaders(Arrays.asList("*"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", config);
        return new CorsFilter(source);
    }
}
```

### Azure Key Vault 連携

機密情報は Key Vault に保存：

- **DB 接続文字列**
- **JWT 秘密鍵**
- **Azure Storage アカウントキー**
- **Redis 接続パスワード**

```yaml
# application-prod.yml
spring:
  cloud:
    azure:
      keyvault:
        secret:
          endpoint: ${AZURE_KEYVAULT_ENDPOINT}

# シークレット参照例
spring:
  datasource:
    password: ${azure-keyvault-secret:db-password}
```

---

## 高可用性・スケーラビリティ

### 自動スケーリング設定

#### スケールアウト条件

| メトリック    | 閾値  | アクション     |
| ------------- | ----- | -------------- |
| CPU 使用率    | > 70% | インスタンス+1 |
| メモリ使用率  | > 80% | インスタンス+1 |
| HTTP キュー長 | > 100 | インスタンス+1 |

#### スケールイン条件

| メトリック   | 閾値  | アクション     |
| ------------ | ----- | -------------- |
| CPU 使用率   | < 30% | インスタンス-1 |
| メモリ使用率 | < 50% | インスタンス-1 |

**設定**:

- 最小インスタンス数: 2（高可用性）
- 最大インスタンス数: 5（コスト最適化）
- クールダウン期間: 5 分

### データベース接続プール

```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20 # 最大接続数
      minimum-idle: 5 # 最小アイドル接続数
      connection-timeout: 30000 # 接続タイムアウト（30秒）
      idle-timeout: 600000 # アイドルタイムアウト（10分）
      max-lifetime: 1800000 # 接続最大寿命（30分）
```

**計算根拠**:

- 1000 並行ユーザー
- 平均レスポンスタイム: 200ms
- 最大インスタンス数: 5
- 必要接続数 ≈ (1000 × 0.2) / 5 = 40
- バッファ考慮 → 20 接続/インスタンス

### キャッシュ戦略

#### Redis キャッシュ対象

| データ             | キャッシュキー          | TTL     |
| ------------------ | ----------------------- | ------- |
| コンテンツ詳細     | `contents:{id}`         | 1 時間  |
| ユーザー情報       | `users:{id}`            | 30 分   |
| JWT ブラックリスト | `jwt:blacklist:{token}` | 24 時間 |

```java
@Cacheable(value = "contents", key = "#id")
public ContentResponse getContentById(Long id) {
    // キャッシュミス時のみDB取得
}

@CacheEvict(value = "contents", key = "#id")
public void updateContent(Long id, ContentUpdateRequest request) {
    // 更新時キャッシュクリア
}
```

---

## パフォーマンス最適化

### データベース最適化

#### 1. インデックス戦略

```sql
-- 単一インデックス
CREATE INDEX idx_contents_type ON contents(content_type);
CREATE INDEX idx_contents_status ON contents(status);
CREATE INDEX idx_contents_created_at ON contents(created_at);

-- 複合インデックス（検索最適化）
CREATE INDEX idx_contents_composite ON contents(content_type, status, created_at);
```

#### 2. クエリ最適化

**N+1 問題の回避**:

```java
// ❌ 悪い例：N+1問題発生
public List<Content> getAllContents() {
    List<Content> contents = contentRepository.findAll();
    for (Content content : contents) {
        User user = content.getCreatedBy(); // 各行で追加クエリ発生
    }
}

// ✅ 良い例：JOIN FETCH使用
@Query("SELECT c FROM Content c JOIN FETCH c.createdBy")
public List<Content> findAllWithCreatedBy();
```

#### 3. ページネーション

```java
// 大量データ取得時は必ずページネーション使用
Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
Page<Content> contentPage = contentRepository.findAll(pageable);
```

### ファイルアップロード最適化

#### ビデオファイル並列アップロード

```java
// 4MB ブロック単位、5並列処理
ParallelTransferOptions parallelOptions = new ParallelTransferOptions()
        .setBlockSizeLong(4 * 1024 * 1024)    // 4MB
        .setMaxConcurrency(5);                 // 5並列
```

**効果**:

- 100MB ビデオのアップロード時間: 約 30 秒 → 約 10 秒（3 倍高速化）

### CDN 統合（オプション）

Azure Blob Storage を Azure CDN と統合することで、グローバル配信を高速化：

```
通常アクセス:
https://juxyistorage.blob.core.windows.net/content-files/videos/abc.mp4

CDN経由:
https://cdn.juxyi.com/videos/abc.mp4
```

**効果**:

- 初回アクセス: エッジサーバーにキャッシュ
- 2 回目以降: CDN から直接配信（レイテンシ大幅削減）

---

## 監視・ログ

### Application Insights 統合

#### 自動収集されるメトリクス

| カテゴリ           | メトリクス                                                |
| ------------------ | --------------------------------------------------------- |
| **リクエスト**     | レスポンスタイム、スループット、成功率                    |
| **依存関係**       | SQL クエリ時間、Redis 応答時間、Blob Storage アクセス時間 |
| **例外**           | 例外発生回数、スタックトレース                            |
| **パフォーマンス** | CPU 使用率、メモリ使用率                                  |

#### カスタムイベント記録

```java
@Service
@RequiredArgsConstructor
public class ContentService {
    private final TelemetryClient telemetryClient;

    public void createContent(ContentCreateRequest request) {
        // カスタムイベント送信
        telemetryClient.trackEvent("ContentCreated",
            Map.of("contentType", request.getContentType().toString()));
    }
}
```

### ログレベル設定

```yaml
# application-prod.yml
logging:
  level:
    root: INFO
    com.juxyi.cms: INFO
    org.springframework.web: WARN
    org.hibernate.SQL: WARN
```

### アラート設定

| アラート名         | 条件                        | アクション     |
| ------------------ | --------------------------- | -------------- |
| 高エラー率         | エラー率 > 5%               | メール通知     |
| 高レスポンスタイム | 平均レスポンスタイム > 3 秒 | Slack 通知     |
| DB 接続エラー      | DB 接続失敗 > 10 回/5 分    | PagerDuty 通知 |

---

## デプロイ戦略

### 環境構成

| 環境            | 用途         | URL                                   | デプロイトリガー              |
| --------------- | ------------ | ------------------------------------- | ----------------------------- |
| **Development** | 開発・テスト | `juxyi-cms-dev.azurewebsites.net`     | develop ブランチプッシュ      |
| **Staging**     | 本番前検証   | `juxyi-cms-staging.azurewebsites.net` | main ブランチプッシュ         |
| **Production**  | 本番環境     | `juxyi-cms-prod.azurewebsites.net`    | タグプッシュ (v\*) + 手動承認 |

### CI/CD パイプライン

```yaml
# azure-pipelines-prod.yml
trigger:
  branches:
    include:
      - main
  tags:
    include:
      - v*

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
                    package: '$(Pipeline.Workspace)/drop/*.jar'
```

### ブルーグリーンデプロイ

1. **Staging スロット**にデプロイ
2. **ヘルスチェック**実行
3. **スモークテスト**実行
4. 問題なければ **Production スロット**とスワップ
5. 問題あれば即座にロールバック

### ロールバック手順

```bash
# Azure CLI でスロットスワップ（ロールバック）
az webapp deployment slot swap \
  --name juxyi-cms-prod \
  --resource-group juxyi-cms-rg \
  --slot staging \
  --target-slot production
```

---

## まとめ

本アーキテクチャは以下の特徴を持ちます：

### ✅ 主要な設計判断

| 項目                   | 選択                       | 理由                           |
| ---------------------- | -------------------------- | ------------------------------ |
| **アーキテクチャ**     | 4 層レイヤーアーキテクチャ | 責務分離、テスト容易性         |
| **ホスティング**       | Azure App Service (PaaS)   | 運用負荷軽減、自動スケーリング |
| **認証**               | JWT                        | ステートレス、スケーラブル     |
| **ファイルストレージ** | Azure Blob Storage         | 大容量対応、高可用性           |
| **キャッシュ**         | Redis                      | 高速、セッション共有           |
| **データベース**       | Azure SQL Database         | マネージドサービス、高可用性   |

### 🎯 非機能要件達成

| 要件                  | 達成方法                                  |
| --------------------- | ----------------------------------------- |
| **1000 並行ユーザー** | 自動スケーリング（2-5 インスタンス）      |
| **高可用性**          | 最小 2 インスタンス、Azure SQL 99.99% SLA |
| **高速レスポンス**    | Redis キャッシュ、DB インデックス最適化   |
| **セキュリティ**      | JWT 認証、Key Vault、HTTPS                |
| **運用性**            | Application Insights、自動アラート        |
| **コスト最適化**      | 適切な SKU 選択、自動スケールイン         |

### 📚 関連ドキュメント

- [API 設計書](./API.md)
- [デプロイ手順書](./DEPLOYMENT.md)
- [README](../README.md)

---

**最終更新日**: 2025-02-06  
**ドキュメントバージョン**: 1.0.0  
**作成者**: JUXYI 開発チーム
