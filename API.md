# Content Management System API 設計書

## 目次（もくじ）

1. [概要](#概要)
2. [ベース URL](#ベースurl)
3. [認証](#認証)
4. [共通レスポンス形式](#共通レスポンス形式)
5. [エラーコード](#エラーコード)
6. [API エンドポイント](#apiエンドポイント)
   - [認証 API](#認証api)
   - [コンテンツ管理 API](#コンテンツ管理api)
   - [ドキュメント管理 API](#ドキュメント管理api)
   - [ビデオ管理 API](#ビデオ管理api)
   - [URL リンク管理 API](#urlリンク管理api)
   - [ファイルアップロード API](#ファイルアップロードapi)
7. [データモデル](#データモデル)
8. [ページネーション](#ページネーション)
9. [レート制限](#レート制限)
10. [変更履歴](#変更履歴)

---

## 概要

### プロジェクト情報

- **プロジェクト名**: JUXYI Content Management System
- **バージョン**: v1.0.0
- **最終更新日**: 2025-02-06
- **担当者**: JUXYI 開発チーム

### API 概要

この API は、アプリケーション端末に表示されるコンテンツ（ドキュメント、ビデオ、URL リンク）を管理するための
RESTful API です。管理者はこの API を通じてコンテンツの作成・更新・削除・検索を行うことができます。

### 技術スタック

- **バックエンド**: Spring Boot 3.x
- **データベース**: Azure SQL Database
- **認証方式**: JWT (JSON Web Token)
- **ファイルストレージ**: Azure Blob Storage
- **キャッシュ**: Azure Redis Cache

---

## ベース URL

### 環境別エンドポイント

| 環境                 | ベース URL                                        | 説明           |
| -------------------- | ------------------------------------------------- | -------------- |
| **開発環境**         | `http://localhost:8080/api`                       | ローカル開発用 |
| **ステージング環境** | `https://juxyi-cms-staging.azurewebsites.net/api` | テスト環境     |
| **本番環境**         | `https://juxyi-cms-prod.azurewebsites.net/api`    | 本番環境       |

---

## 認証

### JWT 認証フロー

1. ユーザーは `/api/auth/login` でログインし、JWT トークンを取得
2. 以降のリクエストでは、`Authorization` ヘッダーにトークンを含める
3. トークンの有効期限は **24 時間**

### リクエストヘッダー形式

```http
Authorization: Bearer {JWT_TOKEN}
Content-Type: application/json
```

### 認証不要エンドポイント

以下のエンドポイントは認証不要です：

- `POST /api/auth/login` - ログイン
- `POST /api/auth/register` - ユーザー登録
- `GET /api/health` - ヘルスチェック

---

## 共通レスポンス形式

### 成功レスポンス

全ての成功レスポンスは以下の形式で返されます：

```json
{
  "success": true,
  "message": "Success",
  "data": {
    // レスポンスデータ
  },
  "timestamp": "2025-02-06T10:30:00"
}
```

### エラーレスポンス

```json
{
  "success": false,
  "message": "エラーメッセージ",
  "data": null,
  "timestamp": "2025-02-06T10:30:00"
}
```

### バリデーションエラーレスポンス

```json
{
  "success": false,
  "message": "Validation failed",
  "data": {
    "username": "Username is required",
    "password": "Password must be at least 6 characters"
  },
  "timestamp": "2025-02-06T10:30:00"
}
```

---

## エラーコード

| HTTP ステータスコード | エラーコード          | 説明                 | 対処方法                      |
| --------------------- | --------------------- | -------------------- | ----------------------------- |
| **200**               | OK                    | 成功                 | -                             |
| **201**               | Created               | リソース作成成功     | -                             |
| **400**               | Bad Request           | リクエストが不正     | リクエストパラメータを確認    |
| **401**               | Unauthorized          | 認証失敗             | トークンを確認、再ログイン    |
| **403**               | Forbidden             | アクセス権限なし     | 権限を確認                    |
| **404**               | Not Found             | リソースが存在しない | ID を確認                     |
| **409**               | Conflict              | リソースの競合       | 既存データを確認              |
| **413**               | Payload Too Large     | ファイルサイズ超過   | ファイルサイズを 100MB 以下に |
| **429**               | Too Many Requests     | レート制限超過       | 一定時間待機                  |
| **500**               | Internal Server Error | サーバーエラー       | サポートに連絡                |

---

## API エンドポイント

### 認証 API

#### 1. ログイン

**エンドポイント**: `POST /api/auth/login`

**説明**: ユーザー名とパスワードでログインし、JWT トークンを取得します。

**認証**: 不要

**リクエストボディ**:

```json
{
  "username": "admin",
  "password": "password123"
}
```

**リクエストパラメータ**:

| パラメータ | 型     | 必須 | 説明       | 制約       |
| ---------- | ------ | ---- | ---------- | ---------- |
| username   | string | ✅   | ユーザー名 | 3-50 文字  |
| password   | string | ✅   | パスワード | 6-100 文字 |

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiIxIiwidXNlcm5hbWUiOiJhZG1pbiIsImlhdCI6MTY0MzY3ODQwMCwiZXhwIjoxNjQzNzY0ODAwfQ.xxx",
    "tokenType": "Bearer",
    "expiresIn": 86400000,
    "username": "admin"
  },
  "timestamp": "2025-02-06T10:30:00"
}
```

**エラーレスポンス**:

```json
// 401 Unauthorized - 認証失敗
{
  "success": false,
  "message": "Invalid username or password",
  "data": null,
  "timestamp": "2025-02-06T10:30:00"
}
```

**cURL サンプル**:

```bash
curl -X POST "http://localhost:8080/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password123"
  }'
```

---

#### 2. ユーザー登録

**エンドポイント**: `POST /api/auth/register`

**説明**: 新規ユーザーを登録します。

**認証**: 不要

**リクエストボディ**:

```json
{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "securePassword123"
}
```

**リクエストパラメータ**:

| パラメータ | 型     | 必須 | 説明           | 制約                            |
| ---------- | ------ | ---- | -------------- | ------------------------------- |
| username   | string | ✅   | ユーザー名     | 3-50 文字、英数字のみ、ユニーク |
| email      | string | ✅   | メールアドレス | 有効なメール形式、ユニーク      |
| password   | string | ✅   | パスワード     | 6-100 文字                      |

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "Registration successful",
  "data": null,
  "timestamp": "2025-02-06T10:30:00"
}
```

**エラーレスポンス**:

```json
// 400 Bad Request - ユーザー名重複
{
  "success": false,
  "message": "Username already exists",
  "data": null,
  "timestamp": "2025-02-06T10:30:00"
}
```

---

### コンテンツ管理 API

#### 1. コンテンツ一覧取得

**エンドポイント**: `GET /api/contents`

**説明**: コンテンツ一覧をページネーション付きで取得します。

**認証**: 必要

**クエリパラメータ**:

| パラメータ | 型      | 必須 | デフォルト値 | 説明                                      |
| ---------- | ------- | ---- | ------------ | ----------------------------------------- |
| page       | integer | ❌   | 0            | ページ番号（0 始まり）                    |
| size       | integer | ❌   | 20           | 1 ページあたりの件数（最大 100）          |
| sortBy     | string  | ❌   | createdAt    | ソート項目（createdAt, updatedAt, title） |

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "content": [
      {
        "id": 1,
        "contentType": "DOCUMENT",
        "title": "製品マニュアル",
        "description": "製品の使用方法を説明するドキュメント",
        "status": "PUBLISHED",
        "createdBy": "admin",
        "createdAt": "2025-02-01T10:00:00",
        "updatedAt": "2025-02-05T15:30:00",
        "document": {
          "id": 1,
          "fileUrl": "https://juxyistorage.blob.core.windows.net/documents/abc123.pdf",
          "fileName": "product_manual.pdf",
          "fileSize": 2048576,
          "mimeType": "application/pdf"
        },
        "video": null,
        "urlLink": null
      },
      {
        "id": 2,
        "contentType": "VIDEO",
        "title": "チュートリアルビデオ",
        "description": "初心者向けの使い方ビデオ",
        "status": "PUBLISHED",
        "createdBy": "admin",
        "createdAt": "2025-02-02T14:00:00",
        "updatedAt": "2025-02-02T14:00:00",
        "document": null,
        "video": {
          "id": 1,
          "videoUrl": "https://juxyistorage.blob.core.windows.net/videos/xyz789.mp4",
          "thumbnailUrl": "https://juxyistorage.blob.core.windows.net/videos/xyz789_thumb.jpg",
          "duration": 180,
          "fileSize": 15728640
        },
        "urlLink": null
      }
    ],
    "pageNumber": 0,
    "pageSize": 20,
    "totalElements": 45,
    "totalPages": 3,
    "last": false
  },
  "timestamp": "2025-02-06T10:30:00"
}
```

**cURL サンプル**:

```bash
curl -X GET "http://localhost:8080/api/contents?page=0&size=20&sortBy=createdAt" \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

---

#### 2. コンテンツ詳細取得

**エンドポイント**: `GET /api/contents/{id}`

**説明**: 指定された ID のコンテンツ詳細を取得します。

**認証**: 必要

**パスパラメータ**:

| パラメータ | 型   | 必須 | 説明          |
| ---------- | ---- | ---- | ------------- |
| id         | long | ✅   | コンテンツ ID |

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 1,
    "contentType": "DOCUMENT",
    "title": "製品マニュアル",
    "description": "製品の使用方法を説明するドキュメント",
    "status": "PUBLISHED",
    "createdBy": "admin",
    "createdAt": "2025-02-01T10:00:00",
    "updatedAt": "2025-02-05T15:30:00",
    "document": {
      "id": 1,
      "fileUrl": "https://juxyistorage.blob.core.windows.net/documents/abc123.pdf",
      "fileName": "product_manual.pdf",
      "fileSize": 2048576,
      "mimeType": "application/pdf"
    }
  },
  "timestamp": "2025-02-06T10:30:00"
}
```

**エラーレスポンス**:

```json
// 404 Not Found
{
  "success": false,
  "message": "Content not found: 999",
  "data": null,
  "timestamp": "2025-02-06T10:30:00"
}
```

---

#### 3. コンテンツ作成

**エンドポイント**: `POST /api/contents`

**説明**: 新規コンテンツを作成します（基本情報のみ）。

**認証**: 必要

**リクエストボディ**:

```json
{
  "contentType": "DOCUMENT",
  "title": "新しいマニュアル",
  "description": "詳細な説明文",
  "status": "DRAFT"
}
```

**リクエストパラメータ**:

| パラメータ  | 型     | 必須 | 説明             | 制約                                            |
| ----------- | ------ | ---- | ---------------- | ----------------------------------------------- |
| contentType | enum   | ✅   | コンテンツタイプ | DOCUMENT, VIDEO, URL_LINK                       |
| title       | string | ✅   | タイトル         | 1-200 文字                                      |
| description | string | ❌   | 説明文           | 最大 5000 文字                                  |
| status      | enum   | ❌   | ステータス       | DRAFT, PUBLISHED, ARCHIVED（デフォルト: DRAFT） |

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "Content created successfully",
  "data": {
    "id": 50,
    "contentType": "DOCUMENT",
    "title": "新しいマニュアル",
    "description": "詳細な説明文",
    "status": "DRAFT",
    "createdBy": "admin",
    "createdAt": "2025-02-06T10:30:00",
    "updatedAt": "2025-02-06T10:30:00"
  },
  "timestamp": "2025-02-06T10:30:00"
}
```

---

#### 4. コンテンツ更新

**エンドポイント**: `PUT /api/contents/{id}`

**説明**: 既存のコンテンツを更新します（部分更新対応）。

**認証**: 必要

**パスパラメータ**:

| パラメータ | 型   | 必須 | 説明          |
| ---------- | ---- | ---- | ------------- |
| id         | long | ✅   | コンテンツ ID |

**リクエストボディ**:

```json
{
  "title": "更新されたタイトル",
  "description": "更新された説明文",
  "status": "PUBLISHED"
}
```

**リクエストパラメータ**:

| パラメータ  | 型     | 必須 | 説明       |
| ----------- | ------ | ---- | ---------- |
| title       | string | ❌   | タイトル   |
| description | string | ❌   | 説明文     |
| status      | enum   | ❌   | ステータス |

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "Content updated successfully",
  "data": {
    "id": 50,
    "contentType": "DOCUMENT",
    "title": "更新されたタイトル",
    "description": "更新された説明文",
    "status": "PUBLISHED",
    "createdBy": "admin",
    "createdAt": "2025-02-06T10:30:00",
    "updatedAt": "2025-02-06T11:00:00"
  },
  "timestamp": "2025-02-06T11:00:00"
}
```

---

#### 5. コンテンツ削除

**エンドポイント**: `DELETE /api/contents/{id}`

**説明**: 指定されたコンテンツを削除します（関連ファイルも削除）。

**認証**: 必要

**パスパラメータ**:

| パラメータ | 型   | 必須 | 説明          |
| ---------- | ---- | ---- | ------------- |
| id         | long | ✅   | コンテンツ ID |

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "Content deleted successfully",
  "data": null,
  "timestamp": "2025-02-06T11:00:00"
}
```

---

#### 6. タイプ別コンテンツ取得

**エンドポイント**: `GET /api/contents/type/{type}`

**説明**: 指定されたタイプのコンテンツ一覧を取得します。

**認証**: 必要

**パスパラメータ**:

| パラメータ | 型   | 必須 | 説明                                          |
| ---------- | ---- | ---- | --------------------------------------------- |
| type       | enum | ���  | コンテンツタイプ（DOCUMENT, VIDEO, URL_LINK） |

**クエリパラメータ**:

| パラメータ | 型      | 必須 | デフォルト値 | 説明                 |
| ---------- | ------- | ---- | ------------ | -------------------- |
| page       | integer | ❌   | 0            | ページ番号           |
| size       | integer | ❌   | 20           | 1 ページあたりの件数 |

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "content": [
      // DOCUMENT タイプのコンテンツのみ
    ],
    "pageNumber": 0,
    "pageSize": 20,
    "totalElements": 15,
    "totalPages": 1,
    "last": true
  },
  "timestamp": "2025-02-06T11:00:00"
}
```

**cURL サンプル**:

```bash
curl -X GET "http://localhost:8080/api/contents/type/DOCUMENT?page=0&size=20" \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

---

#### 7. キーワード検索

**エンドポイント**: `GET /api/contents/search`

**説明**: タイトルまたは説明文からキーワード検索を行います。

**認証**: 必要

**クエリパラメータ**:

| パラメータ | 型      | 必須 | デフォルト値 | 説明                 |
| ---------- | ------- | ---- | ------------ | -------------------- |
| keyword    | string  | ✅   | -            | 検索キーワード       |
| page       | integer | ❌   | 0            | ページ番号           |
| size       | integer | ❌   | 20           | 1 ページあたりの件数 |

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "content": [
      // キーワードにマッチするコンテンツ
    ],
    "pageNumber": 0,
    "pageSize": 20,
    "totalElements": 5,
    "totalPages": 1,
    "last": true
  },
  "timestamp": "2025-02-06T11:00:00"
}
```

**cURL サンプル**:

```bash
curl -X GET "http://localhost:8080/api/contents/search?keyword=マニュアル&page=0&size=20" \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

---

### ドキュメント管理 API

#### 1. ドキュメント作成

**エンドポイント**: `POST /api/documents`

**説明**: ドキュメント型のコンテンツを作成します（ファイル情報付き）。

**認証**: 必要

**リクエストボディ**:

```json
{
  "contentType": "DOCUMENT",
  "title": "ユーザーマニュアル",
  "description": "アプリケーションの使い方",
  "status": "PUBLISHED",
  "fileUrl": "https://juxyistorage.blob.core.windows.net/documents/abc123.pdf",
  "fileName": "user_manual.pdf",
  "fileSize": 2048576,
  "mimeType": "application/pdf"
}
```

**リクエストパラメータ**:

| パラメータ  | 型     | 必須 | 説明                       |
| ----------- | ------ | ---- | -------------------------- |
| contentType | enum   | ✅   | 必ず "DOCUMENT"            |
| title       | string | ✅   | タイトル                   |
| description | string | ❌   | 説明文                     |
| status      | enum   | ❌   | ステータス                 |
| fileUrl     | string | ✅   | ファイル URL（Azure Blob） |
| fileName    | string | ❌   | ファイル名                 |
| fileSize    | long   | ❌   | ファイルサイズ（bytes）    |
| mimeType    | string | ❌   | MIME タイプ                |

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "Document created successfully",
  "data": {
    "id": 10,
    "fileUrl": "https://juxyistorage.blob.core.windows.net/documents/abc123.pdf",
    "fileName": "user_manual.pdf",
    "fileSize": 2048576,
    "mimeType": "application/pdf"
  },
  "timestamp": "2025-02-06T11:00:00"
}
```

---

#### 2. ドキュメント詳細取得

**エンドポイント**: `GET /api/documents/{id}`

**説明**: 指定されたドキュメントの詳細を取得します。

**認証**: 必要

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "Success",
  "data": {
    "id": 10,
    "fileUrl": "https://juxyistorage.blob.core.windows.net/documents/abc123.pdf",
    "fileName": "user_manual.pdf",
    "fileSize": 2048576,
    "mimeType": "application/pdf"
  },
  "timestamp": "2025-02-06T11:00:00"
}
```

---

#### 3. ドキュメント削除

**エンドポイント**: `DELETE /api/documents/{id}`

**説明**: ドキュメントを削除します（Azure Blob のファイルも削除）。

**認証**: 必要

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "Document deleted successfully",
  "data": null,
  "timestamp": "2025-02-06T11:00:00"
}
```

---

### ビデオ管理 API

#### 1. ビデオ作成

**エンドポイント**: `POST /api/videos`

**説明**: ビデオ型のコンテンツを作成します。

**認証**: 必要

**リクエストボディ**:

```json
{
  "contentType": "VIDEO",
  "title": "チュートリアルビデオ",
  "description": "初心者向けガイド",
  "status": "PUBLISHED",
  "videoUrl": "https://juxyistorage.blob.core.windows.net/videos/xyz789.mp4",
  "thumbnailUrl": "https://juxyistorage.blob.core.windows.net/videos/xyz789_thumb.jpg",
  "duration": 180,
  "fileSize": 15728640
}
```

**リクエストパラメータ**:

| パラメータ   | 型      | 必須 | 説明                       |
| ------------ | ------- | ---- | -------------------------- |
| contentType  | enum    | ✅   | 必ず "VIDEO"               |
| title        | string  | ✅   | タイトル                   |
| description  | string  | ❌   | 説明文                     |
| status       | enum    | ❌   | ステータス                 |
| videoUrl     | string  | ✅   | ビデオ URL                 |
| thumbnailUrl | string  | ❌   | サムネイル URL             |
| duration     | integer | ❌   | 再生時間（秒）             |
| fileSize     | long    | ❌   | ファイルサ ��� ズ（bytes） |

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "Video created successfully",
  "data": {
    "id": 5,
    "videoUrl": "https://juxyistorage.blob.core.windows.net/videos/xyz789.mp4",
    "thumbnailUrl": "https://juxyistorage.blob.core.windows.net/videos/xyz789_thumb.jpg",
    "duration": 180,
    "fileSize": 15728640
  },
  "timestamp": "2025-02-06T11:00:00"
}
```

---

### URL リンク管理 API

#### 1. URL リンク作成

**エンドポイント**: `POST /api/urls`

**説明**: URL リンク型のコンテンツを作成します。

**認証**: 必要

**リクエストボディ**:

```json
{
  "contentType": "URL_LINK",
  "title": "公式サイト",
  "description": "製品の公式ウェブサイト",
  "status": "PUBLISHED",
  "url": "https://www.example.com",
  "displayText": "公式サイトはこちら"
}
```

**リクエストパラメータ**:

| パラメータ  | 型     | 必須 | 説明            |
| ----------- | ------ | ---- | --------------- |
| contentType | enum   | ✅   | 必ず "URL_LINK" |
| title       | string | ✅   | タイトル        |
| description | string | ❌   | 説明文          |
| status      | enum   | ❌   | ステータス      |
| url         | string | ✅   | 外部 URL        |
| displayText | string | ❌   | 表示テキスト    |

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "URL link created successfully",
  "data": {
    "id": 3,
    "url": "https://www.example.com",
    "displayText": "公式サイトはこちら"
  },
  "timestamp": "2025-02-06T11:00:00"
}
```

---

### ファイルアップロード API

#### 1. ファイルアップロード

**エンドポイント**: `POST /api/files/upload`

**説明**: ファイルを Azure Blob Storage にアップロードします。

**認証**: 必要

**リクエストタイプ**: `multipart/form-data`

**リクエストパラメータ**:

| パラメータ | 型     | 必須 | 説明                                            |
| ---------- | ------ | ---- | ----------------------------------------------- |
| file       | file   | ✅   | アップロードするファイル                        |
| folder     | string | ❌   | アップロード先フォルダ（デフォルト: "general"） |

**制約**:

- 最大ファイルサイズ: 100MB
- 許可される拡張子: .pdf, .doc, .docx, .mp4, .mov, .avi, .png, .jpg, .jpeg

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileUrl": "https://juxyistorage.blob.core.windows.net/documents/550e8400-e29b-41d4-a716-446655440000.pdf",
    "fileName": "user_manual.pdf",
    "fileSize": 2048576,
    "mimeType": "application/pdf"
  },
  "timestamp": "2025-02-06T11:00:00"
}
```

**エラーレスポンス**:

```json
// 413 Payload Too Large
{
  "success": false,
  "message": "File size exceeds maximum limit",
  "data": null,
  "timestamp": "2025-02-06T11:00:00"
}

// 400 Bad Request - 不正な拡張子
{
  "success": false,
  "message": "File type not allowed: .exe",
  "data": null,
  "timestamp": "2025-02-06T11:00:00"
}
```

**cURL サンプル**:

```bash
curl -X POST "http://localhost:8080/api/files/upload" \
  -H "Authorization: Bearer {JWT_TOKEN}" \
  -F "file=@/path/to/file.pdf" \
  -F "folder=documents"
```

---

#### 2. ファイル削除

**エンドポイント**: `DELETE /api/files`

**説明**: Azure Blob Storage からファイルを削除します。

**認証**: 必要

**クエリパラメータ**:

| パラメータ | 型     | 必須 | 説明                   |
| ---------- | ------ | ---- | ---------------------- |
| fileUrl    | string | ✅   | 削除するファイルの URL |

**成功レスポンス** (200 OK):

```json
{
  "success": true,
  "message": "File deleted successfully",
  "data": null,
  "timestamp": "2025-02-06T11:00:00"
}
```

**cURL サンプル**:

```bash
curl -X DELETE "http://localhost:8080/api/files?fileUrl=https://juxyistorage.blob.core.windows.net/documents/abc123.pdf" \
  -H "Authorization: Bearer {JWT_TOKEN}"
```

---

## データモデル

### Content（コンテンツ）

```json
{
  "id": 1,
  "contentType": "DOCUMENT | VIDEO | URL_LINK",
  "title": "string",
  "description": "string",
  "status": "DRAFT | PUBLISHED | ARCHIVED",
  "createdBy": "string",
  "createdAt": "2025-02-06T10:30:00",
  "updatedAt": "2025-02-06T10:30:00"
}
```

### Document（ドキュメント）

```json
{
  "id": 1,
  "fileUrl": "string",
  "fileName": "string",
  "fileSize": 2048576,
  "mimeType": "application/pdf"
}
```

### Video（ビデオ）

```json
{
  "id": 1,
  "videoUrl": "string",
  "thumbnailUrl": "string",
  "duration": 180,
  "fileSize": 15728640
}
```

### UrlLink（URL リンク）

```json
{
  "id": 1,
  "url": "string",
  "displayText": "string"
}
```

---

## ページネーション

全ての一覧取得 API はページネーションをサポートしています。

### リクエストパラメータ

| パラメータ | デフォルト値 | 説明                             |
| ---------- | ------------ | -------------------------------- |
| page       | 0            | ページ番号（0 始まり）           |
| size       | 20           | 1 ページあたりの件数（最大 100） |
| sortBy     | createdAt    | ソート項目                       |

### レスポンス形式

```json
{
  "content": [],
  "pageNumber": 0,
  "pageSize": 20,
  "totalElements": 100,
  "totalPages": 5,
  "last": false
}
```

---

## レート制限

### 制限内容

| 項目                             | 制限値          |
| -------------------------------- | --------------- |
| 1 分あたりのリクエスト数         | 100 リクエスト  |
| 1 時間あたりのリクエスト数       | 3000 リクエスト |
| 1 日あたりのファイルアップロード | 1000 ファイル   |

### レート制限超過時のレスポンス

```json
// 429 Too Many Requests
{
  "success": false,
  "message": "Rate limit exceeded. Please try again later.",
  "data": null,
  "timestamp": "2025-02-06T11:00:00"
}
```

---

## 変更履歴

| バージョン | 日付       | 変更内容     |
| ---------- | ---------- | ------------ |
| v1.0.0     | 2025-02-06 | 初版リリース |

---

## 補足情報

### タイムゾーン

- 全ての日時は UTC（協定世界時）で返されます
- フォーマット: ISO 8601 形式（`yyyy-MM-ddTHH:mm:ss`）

### 文字エンコーディング

- UTF-8

### コンテンツタイプ

- リクエスト: `application/json`
- レスポンス: `application/json`
- ファイルアップロード: `multipart/form-data`

---

**End of API Documentation**
