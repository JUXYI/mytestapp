# 第 7 章：API 設計・連携フロー

**前のファイル**: [05-mobile-app-architecture.md](./05-mobile-app-architecture.md)  
**次のファイル**: [07-database-design.md](./07-database-design.md) →

---

## ��� 次

- [7.1 API 設計原則](#71-api-設計原則)
- [7.2 エンドポイント一覧](#72-エンドポイント一覧)
- [7.3 データフロー図](#73-データフロー図)
- [7.4 エラーハンドリング](#74-エラーハンドリング)

---

## 7.1 API 設計原則

### RESTful API 設計ガイドライン

| 原則                     | 説明                          | 例                               |
| ------------------------ | ----------------------------- | -------------------------------- |
| **リソース指向**         | URL はリソースを表現          | `/api/contents/{id}`             |
| **HTTP メソッド**        | CRUD 操作に対応               | GET/POST/PUT/DELETE              |
| **ステートレス**         | サーバーは状態を保持しない    | JWT 認証                         |
| **統一インターフェース** | 一貫した URL 構造             | `/api/{resource}/{id}`           |
| **JSON 形式**            | リクエスト・レスポンスは JSON | `Content-Type: application/json` |

### HTTP ステータスコード

| コード                        | 意味                   | 使用例               |
| ----------------------------- | ---------------------- | -------------------- |
| **200 OK**                    | 成功                   | GET/PUT 成功         |
| **201 Created**               | 作成成功               | POST 成功            |
| **204 No Content**            | 成功（レスポンスなし） | DELETE 成功          |
| **400 Bad Request**           | 不正なリクエスト       | バリデーションエラー |
| **401 Unauthorized**          | 認証失敗               | JWT 無効・期限切れ   |
| **403 Forbidden**             | 権限不足               | 管理者権限なし       |
| **404 Not Found**             | リソースが存在しない   | ID が見つからない    |
| **500 Internal Server Error** | サーバーエラー         | 予期しないエラー     |

### レスポンス形式

**成功時**:

```json
{
  "id": 123,
  "title": "サンプルコンテンツ",
  "status": "PUBLISHED",
  "createdAt": "2025-02-06T10:00:00Z"
}
```

**エラー時**:

```json
{
  "message": "コンテンツが見つかりません",
  "errorCode": "RESOURCE_NOT_FOUND",
  "timestamp": "2025-02-06T10:00:00Z",
  "path": "/api/contents/999"
}
```

**ページネーション**:

```json
{
  "content": [...],
  "totalElements": 150,
  "totalPages": 8,
  "size": 20,
  "number": 0
}
```

---

## 7.2 エンドポイント一覧

### 認証 API（マイページ API）

| メソッド | エンドポイント            | 説明                   | 認証          | リクエスト                     | レスポンス                          |
| -------- | ------------------------- | ---------------------- | ------------- | ------------------------------ | ----------------------------------- |
| GET      | `/mobile-login`           | モバイルログイン画面   | 不要          | -                              | HTML                                |
| POST     | `/api/mobile-auth/login`  | ログイン処理           | 不要          | `{username, password}`         | HTML（成功ページ）                  |
| POST     | `/api/mobile-auth/verify` | Token 検証・JWT 発行   | 不要          | `{authToken}`                  | `{accessToken, refreshToken, user}` |
| POST     | `/api/auth/eninsho`       | e-ninsho 認証          | 不要          | `{userId, certData, deviceId}` | `{accessToken, refreshToken, user}` |
| POST     | `/api/auth/refresh`       | Token 更新             | Refresh Token | `{refreshToken}`               | `{accessToken, refreshToken, user}` |
| POST     | `/api/sso/create-ticket`  | SSO Ticket 生成        | JWT           | `{target}`                     | `{ticket, ssoUrl, expiresAt}`       |
| GET      | `/sso/auth?ticket={id}`   | SSO 認証・Session 発行 | Ticket        | -                              | 302 Redirect                        |

### コンテンツ API（CMS API）

| メソッド | エンドポイント         | 説明           | 権限  | リクエスト                                           | レスポンス         |
| -------- | ---------------------- | -------------- | ----- | ---------------------------------------------------- | ------------------ |
| GET      | `/api/contents`        | コンテンツ一覧 | USER  | `?page=0&size=20&contentType=VIDEO&status=PUBLISHED` | `Page<ContentDto>` |
| GET      | `/api/contents/{id}`   | コンテンツ詳細 | USER  | -                                                    | `ContentDto`       |
| POST     | `/api/contents`        | コンテンツ作成 | ADMIN | `ContentDto`                                         | `ContentDto`       |
| PUT      | `/api/contents/{id}`   | コンテンツ更新 | ADMIN | `ContentDto`                                         | `ContentDto`       |
| DELETE   | `/api/contents/{id}`   | コンテンツ削除 | ADMIN | -                                                    | 204 No Content     |
| GET      | `/api/contents/search` | コンテンツ検索 | USER  | `?q=keyword`                                         | `Page<ContentDto>` |

**ContentDto 構造**:

```typescript
interface ContentDto {
  id?: number;
  title: string;
  description: string;
  contentType: 'DOCUMENT' | 'VIDEO' | 'URL_LINK';
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  fileUrl?: string;
  thumbnailUrl?: string;
  createdAt?: string;
  createdBy?: string;
}
```

### ファイル API（CMS API）

| メソッド | エンドポイント         | 説明                   | 権限  | リクエスト                            | レスポンス            |
| -------- | ---------------------- | ---------------------- | ----- | ------------------------------------- | --------------------- |
| POST     | `/api/files/sas-token` | SAS Token 生成         | ADMIN | `{fileName, fileSize, containerName}` | `{sasUrl, expiresAt}` |
| POST     | `/api/files/metadata`  | ファイルメタデータ保存 | ADMIN | `{fileName, fileUrl, fileSize}`       | `FileDto`             |
| DELETE   | `/api/files/{id}`      | ファイル削除           | ADMIN | -                                     | 204 No Content        |

### プッシュ通知 API（CMS API）

| メソッド | エンドポイント                       | 説明         | 権限  | リクエスト                                       | レスポンス              |
| -------- | ------------------------------------ | ------------ | ----- | ------------------------------------------------ | ----------------------- |
| POST     | `/api/notifications/send`            | 通知送信     | ADMIN | `{title, message, platforms: ['ios','android']}` | `{sentCount}`           |
| GET      | `/api/notifications`                 | 通知履歴     | USER  | `?page=0&size=20`                                | `Page<NotificationDto>` |
| POST     | `/api/notifications/register-device` | デバイス登録 | USER  | `{deviceToken, platform}`                        | `DeviceDto`             |

### 集章活動 API（CMS API）

| メソッド | エンドポイント         | 説明         | 権限 | リクエスト          | レスポンス                               |
| -------- | ---------------------- | ------------ | ---- | ------------------- | ---------------------------------------- |
| GET      | `/api/stamps`          | スタンプ一覧 | USER | -                   | `List<StampDto>`                         |
| POST     | `/api/stamps/collect`  | スタンプ獲得 | USER | `{stampId, qrCode}` | `{success, progress}`                    |
| GET      | `/api/stamps/progress` | 達成率取得   | USER | -                   | `{collectedCount, totalCount, progress}` |

### 管理者認証 API（CMS API）

| メソッド | エンドポイント     | 説明           | 権限 | リクエスト             | レスポンス                          |
| -------- | ------------------ | -------------- | ---- | ---------------------- | ----------------------------------- |
| POST     | `/api/admin/login` | 管理者ログイン | 不要 | `{username, password}` | `{accessToken, refreshToken, user}` |

---

## 7.3 データフロー図

### コンテンツ閲覧フロー

```
[Mobile App]
    │
    │ ① GET /api/contents?page=0&size=20
    │    Authorization: Bearer {JWT}
    │
    ▼
[CMS API]
    │
    ├─► ② JWT検証（JwtAuthenticationFilter）
    │
    ├─► ③ Redis Cacheチェック
    │      Key: contents:page:0
    │
    │   ┌─ Cache Hit → ⑨へ
    │   └─ Cache Miss ↓
    │
    ├─► ④ DB Query（ContentRepository）
    │      SELECT * FROM contents
    │      WHERE status = 'PUBLISHED'
    │      ORDER BY created_at DESC
    │      LIMIT 20 OFFSET 0
    │
    ▼
[Azure SQL Database]
    │
    │ ⑤ データ返却
    │
    ▼
[CMS API]
    │
    ├─► ⑥ Entity → DTO 変換（MapStruct）
    │
    ├─► ⑦ Redis Cache保存
    │      Key: contents:page:0
    │      TTL: 5分
    │
    ├─► ⑧ Page<ContentDto> 構築
    │
    └─► ⑨ JSON レスポンス
         {
           "content": [...],
           "totalElements": 150,
           "totalPages": 8
         }
```

### ビデオアップロードフロー（SAS Token）

```
[Web 管理画面]
    │
    │ ① ファイル選択（video.mp4, 100MB）
    │
    │ ② POST /api/files/sas-token
    │    Authorization: Bearer {JWT}
    │    {fileName: "video.mp4", fileSize: 104857600}
    │
    ▼
[CMS API]
    │
    ├─► ③ Azure Blob SDK呼び出し
    │      BlobClient.generateSas()
    │      - 権限: Write
    │      - 有効期限: 1時間
    │
    │ ④ SAS Token返却
    │    {
    │      sasUrl: "https://storage/.../video.mp4?sv=...",
    │      expiresAt: "2025-02-06T11:00:00Z"
    │    }
    │
    ▼
[Web 管理画面]
    │
    │ ⑤ PUT {sasUrl}
    │    Content-Type: video/mp4
    │    x-ms-blob-type: BlockBlob
    │    Body: <binary data>
    │
    │    進捗表示: 0% → 100%
    │
    ▼
[Azure Blob Storage]
    │
    │ ⑥ アップロード完了
    │    200 OK
    │
    ▼
[Web 管理画面]
    │
    │ ⑦ POST /api/files/metadata
    │    {
    │      fileName: "video.mp4",
    │      fileUrl: "https://storage/.../video.mp4",
    │      fileSize: 104857600
    │    }
    │
    ▼
[CMS API]
    │
    └─► ⑧ メタデータDB保存
         INSERT INTO files (file_name, file_url, file_size)
```

### プッシュ通知送信フロー

```
[Web 管理画面]
    │
    │ ① POST /api/notifications/send
    │    {
    │      title: "新着ビデオ",
    │      message: "新しいビデオが公開されました",
    │      platforms: ["ios", "android"]
    │    }
    │
    ▼
[CMS API]
    │
    ├─► ② デバイスToken取得
    │      SELECT device_token, platform
    │      FROM user_devices
    │      WHERE platform IN ('ios', 'android')
    │
    ├─► ③ Azure Notification Hubs SDK呼び出し
    │      - iOS: sendAppleNativeNotification()
    │      - Android: sendGcmNativeNotification()
    │
    ▼
[Azure Notification Hubs]
    │
    ├─► ④ iOS デバイスへ送信
    │      APNS（Apple Push Notification Service）
    │
    └─► ⑤ Android デバイスへ送信
         FCM（Firebase Cloud Messaging）

    ▼
[Mobile App - 通知受信]
    │
    ├─► ⑥ フォアグラウンド: Alert表示
    └─► ⑦ バックグラウンド: 通知バナー表示
```

---

## 7.4 エラーハンドリング

### エラーレスポンス標準形式

```typescript
interface ErrorResponse {
  message: string; // ユーザー向けメッセージ
  errorCode: string; // エラーコード（システム用）
  timestamp: string; // エラー発生時刻（ISO 8601）
  path: string; // リクエストパス
  details?: any; // 詳細情報（オプション）
}
```

### エラーコード一覧

| エラーコード               | HTTP ステータス | 説明                 | メッセージ例                                             |
| -------------------------- | --------------- | -------------------- | -------------------------------------------------------- |
| `INVALID_CREDENTIALS`      | 401             | 認証情報が無効       | ユーザー名またはパスワードが正しくありません             |
| `TOKEN_EXPIRED`            | 401             | Token 期限切れ       | Token の有効期限が切れました                             |
| `INVALID_TOKEN`            | 401             | Token 無効           | 無効な Token です                                        |
| `INSUFFICIENT_PERMISSIONS` | 403             | 権限不足             | この操作を実行する権限がありません                       |
| `RESOURCE_NOT_FOUND`       | 404             | リソース未存在       | 指定されたリソースが見つかりません                       |
| `VALIDATION_ERROR`         | 400             | バリデーションエラー | 入力内容に誤りがあります                                 |
| `DUPLICATE_RESOURCE`       | 409             | リソース重複         | 既に存在しています                                       |
| `FILE_TOO_LARGE`           | 413             | ファイルサイズ超過   | ファイルサイズが上限を �� えています（最大 100MB）       |
| `RATE_LIMIT_EXCEEDED`      | 429             | レート制限超過       | リクエスト回数が上限を超えました。しばらくお待ちください |
| `INTERNAL_ERROR`           | 500             | サーバーエラー       | サーバーエラーが発生しました                             |

### バリデーションエラー詳細

```json
{
  "message": "入力内容に誤りがあります",
  "errorCode": "VALIDATION_ERROR",
  "timestamp": "2025-02-06T10:00:00Z",
  "path": "/api/contents",
  "details": {
    "title": "タイトルは必須です",
    "contentType": "無効なコンテンツタイプです"
  }
}
```

### フロントエンド エラーハンドリング実装

```typescript name=frontend/src/lib/api/axios.ts
// Axios Interceptor
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const { response } = error;

    // エラーメッセージ取得
    const errorMessage = response?.data?.message || 'エラーが発生しました';
    const errorCode = response?.data?.errorCode;

    // エラーコード別処理
    switch (errorCode) {
      case 'TOKEN_EXPIRED':
        // Token自動更新試行
        return await handleTokenRefresh(error);

      case 'INSUFFICIENT_PERMISSIONS':
        message.error('権限がありません');
        break;

      case 'RESOURCE_NOT_FOUND':
        message.error('データが見つかりません');
        break;

      case 'VALIDATION_ERROR':
        // バリデーションエラー詳細表示
        const details = response.data.details;
        Object.values(details).forEach((msg: any) => message.error(msg));
        break;

      default:
        message.error(errorMessage);
    }

    return Promise.reject(error);
  },
);
```

### バックエンド エラーハンドリング実装

```java name=backend/cms-api/src/main/java/com/juxyi/cms/exception/GlobalExceptionHandler.java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(
            ResourceNotFoundException ex,
            HttpServletRequest request) {

        ErrorResponse error = ErrorResponse.builder()
            .message(ex.getMessage())
            .errorCode("RESOURCE_NOT_FOUND")
            .timestamp(LocalDateTime.now())
            .path(request.getRequestURI())
            .build();

        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        Map<String, String> details = new HashMap<>();
        ex.getBindingResult().getFieldErrors().forEach(error ->
            details.put(error.getField(), error.getDefaultMessage())
        );

        ErrorResponse error = ErrorResponse.builder()
            .message("入力内容に誤りがあります")
            .errorCode("VALIDATION_ERROR")
            .timestamp(LocalDateTime.now())
            .path(request.getRequestURI())
            .details(details)
            .build();

        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request) {

        log.error("Unexpected error occurred", ex);

        ErrorResponse error = ErrorResponse.builder()
            .message("サーバーエラーが発生しました")
            .errorCode("INTERNAL_ERROR")
            .timestamp(LocalDateTime.now())
            .path(request.getRequestURI())
            .build();

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
```

### リトライ戦略（TanStack Query）

```typescript name=mobile/src/lib/api/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // ステータスコード別リトライ戦略
        const status = error.response?.status;

        // 4xx エラー（クライアントエラー）はリトライしない
        if (status >= 400 && status < 500) {
          return false;
        }

        // 5xx エラー（サーバーエラー）は最大3回リトライ
        if (status >= 500 && failureCount < 3) {
          return true;
        }

        // ネットワークエラーは最大3回リトライ
        if (!status && failureCount < 3) {
          return true;
        }

        return false;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

---

**次のファイル**: [07-database-design.md](./07-database-design.md) →
