# JUXYI CMS - 完全システムアーキテクチャ設計書

# 総目次・索引ファイル

---

## ドキュメント情報

| 項目               | 内容                                       |
| ------------------ | ------------------------------------------ |
| **ドキュメント名** | JUXYI CMS 完全システムアーキテクチャ設計書 |
| **バージョン**     | v1.0.0                                     |
| **最終更新日**     | 2025-02-06                                 |
| **作成者**         | JUXYI 開発チーム                           |
| **レビュー者**     | システムアーキテクト                       |
| **ステータス**     | 承認済み                                   |

---

## ドキュメント構成

本設計書は以下のファイルで構成されています。**順番に読むことを推奨**します。

### Part 1: システム概要

| ファイル                  | 章        | 内容                                     | ページ数 |
| ------------------------- | --------- | ---------------------------------------- | -------- |
| **01-system-overview.md** | 第 1-2 章 | システム概要・技術スタック・インフラ構成 | ~800 行  |

### Part 2: 横断設計

| ファイル                          | 章      | 内容                                       | ページ数 |
| --------------------------------- | ------- | ------------------------------------------ | -------- |
| **02-authentication-security.md** | 第 3 章 | 認証・セキュリティ設計（全認証フロー統合） | ~1200 行 |

### Part 3: 各層詳細設計

| ファイル                            | 章      | 内容                                         | ページ数 |
| ----------------------------------- | ------- | -------------------------------------------- | -------- |
| **03-backend-architecture.md**      | 第 4 章 | バックエンドアーキテクチャ（Spring Boot）    | ~1000 行 |
| **04-web-frontend-architecture.md** | 第 5 章 | Web 管理画面アーキテクチャ（React）          | ~900 行  |
| **05-mobile-app-architecture.md**   | 第 6 章 | モバイルアプリアーキテクチャ（React Native） | ~1100 行 |

### Part 4: データ・連携設計

| ファイル                           | 章       | 内容                                        | ページ数 |
| ---------------------------------- | -------- | ------------------------------------------- | -------- |
| **06-api-design.md**               | 第 7 章  | API 設計・連携フロー                        | ~600 行  |
| **07-database-design.md**          | 第 8 章  | データベース設計（ER 図・DDL）              | ~700 行  |
| **08-file-storage-design.md**      | 第 9 章  | ファイルストレージ設計（Azure Blob）        | ~400 行  |
| **09-push-notification-design.md** | 第 10 章 | プッシュ通知設計（Azure Notification Hubs） | ~500 行  |

### Part 5: 運用設計

| ファイル                     | 章       | 内容                                   | ページ数 |
| ---------------------------- | -------- | -------------------------------------- | -------- |
| **10-monitoring-logging.md** | 第 11 章 | 監視・ログ設計（Application Insights） | ~500 行  |
| **11-cicd-deployment.md**    | 第 12 章 | CI/CD・デプロイメント（Azure DevOps）  | ~700 行  |

### Part 6: 付録

| ファイル           | 章          | 内容                                     | ページ数 |
| ------------------ | ----------- | ---------------------------------------- | -------- |
| **12-appendix.md** | 第 13-17 章 | トラブルシューティング・用語集・API 仕様 | ~500 行  |

**合計**: 約 **8,000 行**

---

## 読み方ガイド

### 📖 初めて読む方

1. **01-system-overview.md** から順番に読む
2. 第 3 章（認証設計）は全体フローの理解に重要
3. 各層の詳細は必要に応じて参照

### 🔧 開発者向け

- **フロントエンド開発者**: 第 5 章（Web）または第 6 章（Mobile）を重点的に
- **バックエンド開発者**: 第 4 章・第 7 章・第 8 章を重点的に
- **インフラ担当**: 第 11 章・第 12 章を重点的に

### 🚀 新規メンバー向けオンボーディング

**Day 1-2**:

- 第 1-2 章（システム概要・技術スタック）
- 第 3 章（認証フロー全体像）

**Day 3-5**:

- 担当領域の詳細章（第 4-6 章のいずれか）
- 第 7 章（API 設計）

**Week 2**:

- 第 8-12 章（データベース・運用設計）

---

## ファイル結合方法

### Linux/Mac

```bash
cd docs/architecture

# 全ファイルを結合
cat 01-system-overview.md \
    02-authentication-security.md \
    03-backend-architecture.md \
    04-web-frontend-architecture.md \
    05-mobile-app-architecture.md \
    06-api-design.md \
    07-database-design.md \
    08-file-storage-design.md \
    09-push-notification-design.md \
    10-monitoring-logging.md \
    11-cicd-deployment.md \
    12-appendix.md \
    > ../SYSTEM_ARCHITECTURE_FULL.md

echo "✅ 結合完了: docs/SYSTEM_ARCHITECTURE_FULL.md"
```

### Windows (PowerShell)

```powershell
cd docs\architecture

# 全ファイルを結合
Get-Content `
    01-system-overview.md, `
    02-authentication-security.md, `
    03-backend-architecture.md, `
    04-web-frontend-architecture.md, `
    05-mobile-app-architecture.md, `
    06-api-design.md, `
    07-database-design.md, `
    08-file-storage-design.md, `
    09-push-notification-design.md, `
    10-monitoring-logging.md, `
    11-cicd-deployment.md, `
    12-appendix.md `
    | Out-File -Encoding UTF8 ..\SYSTEM_ARCHITECTURE_FULL.md

Write-Host "✅ 結合完了: docs\SYSTEM_ARCHITECTURE_FULL.md"
```

---

## 変更履歴

| バージョン | 日付       | 変更内容 | 作成者     |
| ---------- | ---------- | -------- | ---------- |
| v1.0.0     | 2025-02-06 | 初版作成 | 開発チーム |

---

## 関連ドキュメント

| ドキュメント名            | 場所                                   | 説明                |
| ------------------------- | -------------------------------------- | ------------------- |
| **API 仕様書（OpenAPI）** | `docs/api/openapi.yaml`                | REST API の詳細仕様 |
| **データベーススキーマ**  | `docs/database/schema.sql`             | DDL スクリプト      |
| **デプロイ手順書**        | `docs/operations/deployment.md`        | 本番デプロイ手順    |
| **運用手順書**            | `docs/operations/runbook.md`           | 日常運用タスク      |
| **障害対応手順書**        | `docs/operations/incident-response.md` | インシデント対応    |

---

## 連絡先

| 役割                         | 担当者 | 連絡先              |
| ---------------------------- | ------ | ------------------- |
| **プロジェクトマネージャー** | -      | pm@juxyi.com        |
| **システムアーキテクト**     | -      | architect@juxyi.com |
| **開発リーダー**             | -      | dev-lead@juxyi.com  |

---

## ライセンス

本ドキュメントは JUXYI 社内専用資料です。無断転載・配布を禁じます。

---

**次のファイルを読む**: [01-system-overview.md](./01-system-overview.md) →
