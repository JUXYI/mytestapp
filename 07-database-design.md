# 第 8 章：データベース設計

**前のファイル**: [06-api-design.md](./06-api-design.md)  
**次のファイル**: [08-file-storage-design.md](./08-file-storage-design.md) →

---

## 目次

- [8.1 ER 図](#81-er-図)
- [8.2 テーブル定義](#82-テーブル定義)
- [8.3 インデックス設計](#83-インデックス設計)
- [8.4 パーティション戦略](#84-パーティション戦略)

---

## 8.1 ER 図

```
┌─────────────────────────────────────────────────────────────────┐
│                     エンティティ関係図（ER図）                    │
└─────────────────────────────────────────────────────────────────┘

        ┌──────────────┐
        │    users     │
        ├──────────────┤
        │ id (PK)      │
        │ username     │
        │ password     │
        │ email        │
        │ role         │
        │ eninsho_id   │
        └──────┬───────┘
               │ 1
               │
               │ *
        ┌──────▼───────┐
        │  contents    │
        ├──────────────┤
        │ id (PK)      │
        │ title        │
        │ description  │
        │ content_type │
        │ status       │
        │ file_url     │
        │ thumbnail_url│
        │ created_by(FK)│
        │ created_at   │
        └──────────────┘

        ┌──────────────┐
        │ user_devices │
        ├──────────────┤
        │ id (PK)      │
        │ user_id (FK) │
        │ device_token │
        │ platform     │
        │ registered_at│
        └──────┬───────┘
               │ *
               │
               │ 1
        ┌──────▼───────┐
        │    users     │
        └──────────────┘

        ┌──────────────┐
        │notifications │
        ├──────────────┤
        │ id (PK)      │
        │ title        │
        │ message      │
        │ platforms    │
        │ sent_count   │
        │ sent_at      │
        │ created_by(FK)│
        └──────────────┘

        ┌──────────────┐
        │    stamps    │
        ├──────────────┤
        │ id (PK)      │
        │ name         │
        │ qr_code      │
        │ location     │
        └──────┬───────┘
               │ 1
               │
               │ *
        ┌──────▼───────┐
        │user_stamps   │
        ├──────────────┤
        │ id (PK)      │
        │ user_id (FK) │
        │ stamp_id (FK)│
        │ collected_at │
        └──────────────┘

        ┌──────────────┐
        │ sso_tickets  │
        ├──────────────┤
        │ ticket_id(PK)│
        │ user_id (FK) │
        │ target       │
        │ created_at   │
        │ expires_at   │
        └──────────────┘
```

---

## 8.2 テーブル定義

### users（ユーザー）

```sql
CREATE TABLE users (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    email NVARCHAR(100),
    role NVARCHAR(20) NOT NULL DEFAULT 'USER',  -- USER, ADMIN
    eninsho_id NVARCHAR(100) UNIQUE,             -- e-ninsho ユーザーID
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2,
    INDEX idx_username (username),
    INDEX idx_eninsho_id (eninsho_id)
);
```

### contents（コンテンツ）

```sql
CREATE TABLE contents (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    content_type NVARCHAR(20) NOT NULL,           -- DOCUMENT, VIDEO, URL_LINK
    status NVARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, ARCHIVED
    file_url NVARCHAR(500),
    thumbnail_url NVARCHAR(500),
    file_size BIGINT,
    duration INT,                                  -- ビデオの長さ（秒）
    created_by BIGINT,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    updated_at DATETIME2,
    published_at DATETIME2,
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_status (status),
    INDEX idx_content_type (content_type),
    INDEX idx_created_at (created_at DESC)
);
```

### user_devices（デバイス情報）

```sql
CREATE TABLE user_devices (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    user_id BIGINT NOT NULL,
    device_token NVARCHAR(255) NOT NULL UNIQUE,
    platform NVARCHAR(20) NOT NULL,               -- ios, android
    device_model NVARCHAR(100),
    os_version NVARCHAR(20),
    app_version NVARCHAR(20),
    registered_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    last_active_at DATETIME2,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_platform (platform),
    INDEX idx_device_token (device_token)
);
```

### notifications（プッシュ通知）

```sql
CREATE TABLE notifications (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    title NVARCHAR(100) NOT NULL,
    message NVARCHAR(500) NOT NULL,
    platforms NVARCHAR(50),                        -- ios,android
    sent_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    sent_at DATETIME2,
    created_by BIGINT,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_sent_at (sent_at DESC)
);
```

### stamps（スタンプマスタ）

```sql
CREATE TABLE stamps (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    name NVARCHAR(100) NOT NULL,
    description NVARCHAR(500),
    qr_code NVARCHAR(255) NOT NULL UNIQUE,
    location NVARCHAR(200),
    image_url NVARCHAR(500),
    is_active BIT NOT NULL DEFAULT 1,
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    INDEX idx_qr_code (qr_code),
    INDEX idx_is_active (is_active)
);
```

### user_stamps（ユーザー獲得スタンプ）

```sql
CREATE TABLE user_stamps (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    user_id BIGINT NOT NULL,
    stamp_id BIGINT NOT NULL,
    collected_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (stamp_id) REFERENCES stamps(id),
    UNIQUE (user_id, stamp_id),                    -- 重複獲得防止
    INDEX idx_user_id (user_id),
    INDEX idx_stamp_id (stamp_id),
    INDEX idx_collected_at (collected_at DESC)
);
```

### sso_tickets（SSO チケット）

```sql
CREATE TABLE sso_tickets (
    ticket_id NVARCHAR(36) PRIMARY KEY,            -- UUID
    user_id BIGINT NOT NULL,
    target NVARCHAR(200) NOT NULL,                 -- リダイレクト先
    created_at DATETIME2 NOT NULL DEFAULT GETDATE(),
    expires_at DATETIME2 NOT NULL,                 -- 30秒後
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_expires_at (expires_at)
);
```

### audit_logs（監査ログ）

```sql
CREATE TABLE audit_logs (
    id BIGINT PRIMARY KEY IDENTITY(1,1),
    username NVARCHAR(50),
    action NVARCHAR(100) NOT NULL,                 -- LOGIN, CREATE_CONTENT, DELETE_CONTENT
    details NVARCHAR(MAX),
    ip_address NVARCHAR(45),
    status NVARCHAR(20),                           -- SUCCESS, FAILED
    error_message NVARCHAR(500),
    timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
    INDEX idx_username (username),
    INDEX idx_action (action),
    INDEX idx_timestamp (timestamp DESC)
);
```

---

## 8.3 インデックス設計

### インデックス戦略

| テーブル       | カラム                | インデックスタイプ | 理由                   |
| -------------- | --------------------- | ------------------ | ---------------------- |
| `users`        | `username`            | UNIQUE             | ログイン検索高速化     |
| `users`        | `eninsho_id`          | UNIQUE             | e-ninsho 認証高速化    |
| `contents`     | `status`              | Non-Clustered      | ステータス別検索       |
| `contents`     | `content_type`        | Non-Clustered      | タイプ別検索           |
| `contents`     | `created_at DESC`     | Non-Clustered      | 新着順ソート           |
| `user_devices` | `device_token`        | UNIQUE             | デバイス重複防止       |
| `user_devices` | `user_id`             | Non-Clustered      | ユーザー別デバイス取得 |
| `user_stamps`  | `(user_id, stamp_id)` | UNIQUE             | 重複獲得防止           |
| `audit_logs`   | `timestamp DESC`      | Non-Clustered      | ログ検索高速化         |

### 複合インデックス

```sql
-- コンテンツ検索用（ステータス + 作成日）
CREATE NONCLUSTERED INDEX idx_contents_status_created
ON contents(status, created_at DESC)
INCLUDE (title, content_type);

-- ユーザーデバイス検索用（ユーザーID + プラットフォーム）
CREATE NONCLUSTERED INDEX idx_devices_user_platform
ON user_devices(user_id, platform);
```

---

## 8.4 パーティション戦略

### audit_logs テーブルパーティション

```sql
-- パーティション関数（月別）
CREATE PARTITION FUNCTION pf_audit_logs_monthly (DATETIME2)
AS RANGE RIGHT FOR VALUES (
    '2025-01-01', '2025-02-01', '2025-03-01', '2025-04-01',
    '2025-05-01', '2025-06-01', '2025-07-01', '2025-08-01',
    '2025-09-01', '2025-10-01', '2025-11-01', '2025-12-01'
);

-- パーティションスキーマ
CREATE PARTITION SCHEME ps_audit_logs_monthly
AS PARTITION pf_audit_logs_monthly
ALL TO ([PRIMARY]);

-- テーブル作成（パーティション適用）
CREATE TABLE audit_logs (
    id BIGINT IDENTITY(1,1),
    username NVARCHAR(50),
    action NVARCHAR(100) NOT NULL,
    timestamp DATETIME2 NOT NULL DEFAULT GETDATE(),
    ...
) ON ps_audit_logs_monthly(timestamp);
```

**パーティションの利点**：

- ✅ 古いデータの削除が高速（パーティション単位で削除）
- ✅ クエリパフォーマンス向上（必要なパーティションのみスキャン）
- ✅ メンテナンス容易（パーティション単位でインデックス再構築）

---

**次のファイル**: [08-file-storage-design.md](./08-file-storage-design.md) →
