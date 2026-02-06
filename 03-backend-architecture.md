# 第 4 章：バックエンドアーキテクチャ（Spring Boot）

**前のファイル**: [02-authentication-security.md](./02-authentication-security.md)  
**次のファイル**: [04-web-frontend-architecture.md](./04-web-frontend-architecture.md) →

---

## 目次

- [4.1 アーキテクチャパターン（レイヤードアーキテクチャ）](#41-アーキテクチャパターンレイヤードアーキテクチャ)
- [4.2 CMS API 設計](#42-cms-api-設計)
- [4.3 マイページ API 設計](#43-マイページ-api-設計)
- [4.4 ディレクトリ構造](#44-ディレクトリ構造)
- [4.5 主要機能実装](#45-主要機能実装)

---

## 4.1 アーキテクチャパターン（レイヤードアーキテクチャ）

### レイヤー構成

```
┌─────────────────────────────────────────────────────────────┐
│                  Presentation Layer                         │
│                  (プレゼンテーション層)                       │
├─────────────────────────────────────────────────────────────┤
│  Controller                                                 │
│  - @RestController                                          │
│  - リクエスト受付・レスポンス返却                            │
│  - バリデーション（@Valid）                                  │
│  - DTOへの変換                                               │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                            │
│                    (ビジネスロジック層)                       │
├─────────────────────────────────────────────────────────────┤
│  Service                                                    │
│  - @Service                                                 │
│  - ビジネスロジック実装                                      │
│  - トランザクション管理（@Transactional）                    │
│  - Entity ⇔ DTO 変換                                        │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Persistence Layer                          │
│                  (データアクセス層)                           │
├─────────────────────────────────────────────────────────────┤
│  Repository                                                 │
│  - @Repository                                              │
│  - Spring Data JPA                                          │
│  - CRUD操作                                                  │
│  - カスタムクエリ（@Query）                                  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Database                                 │
│                    (Azure SQL Database)                     │
└─────────────────────────────────────────────────────────────┘
```

### レイヤー間の依存関係ルール

| ルール                   | 説明                                                            |
| ------------------------ | --------------------------------------------------------------- |
| **下位層への依存のみ**   | Controller → Service → Repository の一方向                      |
| **DTO の使用**           | Controller - Service 間は DTO、Service - Repository 間は Entity |
| **トランザクション境界** | Service 層でトランザクション管理（@Transactional）              |
| **例外ハンドリング**     | Controller 層で統一的にハンドリング（@ControllerAdvice）        |

---

## 4.2 CMS API 設計

### API エンドポイント一覧

#### コンテンツ管理

| メソッド | エンドポイント         | 説明               | 権限  |
| -------- | ---------------------- | ------------------ | ----- |
| GET      | `/api/contents`        | コンテンツ一覧取得 | USER  |
| GET      | `/api/contents/{id}`   | コンテンツ詳細取得 | USER  |
| POST     | `/api/contents`        | コンテンツ作成     | ADMIN |
| PUT      | `/api/contents/{id}`   | コンテンツ更新     | ADMIN |
| DELETE   | `/api/contents/{id}`   | コンテンツ削除     | ADMIN |
| GET      | `/api/contents/search` | コンテンツ検索     | USER  |

#### ファイル管理

| メソッド | エンドポイント         | 説明                   | 権限  |
| -------- | ---------------------- | ---------------------- | ----- |
| POST     | `/api/files/sas-token` | SAS Token 生成         | ADMIN |
| POST     | `/api/files/metadata`  | ファイルメタデータ保存 | ADMIN |
| DELETE   | `/api/files/{id}`      | ファイル削除           | ADMIN |

#### プッシュ通知

| メソッド | エンドポイント                       | 説明         | 権限  |
| -------- | ------------------------------------ | ------------ | ----- |
| POST     | `/api/notifications/send`            | 通知送信     | ADMIN |
| GET      | `/api/notifications`                 | 通知履歴取得 | USER  |
| POST     | `/api/notifications/register-device` | デバイス登録 | USER  |

### コンテンツ管理実装例

```java name=backend/cms-api/src/main/java/com/juxyi/cms/controller/ContentController.java
@RestController
@RequestMapping("/api/contents")
@RequiredArgsConstructor
public class ContentController {

    private final ContentService contentService;

    @GetMapping
    public ResponseEntity<Page<ContentDto>> getContents(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String contentType,
            @RequestParam(required = false) String status) {

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<ContentDto> contents = contentService.getContents(pageable, contentType, status);

        return ResponseEntity.ok(contents);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ContentDto> createContent(@Valid @RequestBody ContentDto dto) {
        ContentDto created = contentService.createContent(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }
}
```

```java name=backend/cms-api/src/main/java/com/juxyi/cms/service/ContentService.java
@Service
@Transactional
@RequiredArgsConstructor
public class ContentService {

    private final ContentRepository contentRepository;
    private final ContentMapper contentMapper;

    @Transactional(readOnly = true)
    public Page<ContentDto> getContents(Pageable pageable, String contentType, String status) {
        Specification<Content> spec = ContentSpecification.builder()
            .contentType(contentType)
            .status(status)
            .build();

        Page<Content> contents = contentRepository.findAll(spec, pageable);
        return contents.map(contentMapper::toDto);
    }

    public ContentDto createContent(ContentDto dto) {
        Content content = contentMapper.toEntity(dto);
        content.setCreatedAt(LocalDateTime.now());
        content.setCreatedBy(getCurrentUsername());

        Content saved = contentRepository.save(content);
        return contentMapper.toDto(saved);
    }
}
```

```java name=backend/cms-api/src/main/java/com/juxyi/cms/entity/Content.java
@Entity
@Table(name = "contents")
@Data
public class Content {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentType contentType;  // DOCUMENT, VIDEO, URL_LINK

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ContentStatus status;  // DRAFT, PUBLISHED, ARCHIVED

    private String fileUrl;
    private String thumbnailUrl;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    private String createdBy;
}
```

### Azure Blob Storage 統合

```java name=backend/cms-api/src/main/java/com/juxyi/cms/service/AzureBlobService.java
@Service
public class AzureBlobService {

    private final BlobServiceClient blobServiceClient;

    @Autowired
    public AzureBlobService(@Value("${azure.storage.connection-string}") String connectionString) {
        this.blobServiceClient = new BlobServiceClientBuilder()
            .connectionString(connectionString)
            .buildClient();
    }

    /**
     * SAS Token生成（アップロード用）
     */
    public String generateUploadSasToken(String containerName, String blobName) {
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);

        OffsetDateTime expiryTime = OffsetDateTime.now().plusHours(1);
        BlobSasPermission permission = new BlobSasPermission().setWritePermission(true);

        BlobServiceSasSignatureValues values = new BlobServiceSasSignatureValues(expiryTime, permission)
            .setStartTime(OffsetDateTime.now());

        String sasToken = blobClient.generateSas(values);
        return blobClient.getBlobUrl() + "?" + sasToken;
    }
}
```

---

## 4.3 マイページ API 設計

### API エンドポイント一覧

| メソッド | エンドポイント            | 説明                   | 認証          |
| -------- | ------------------------- | ---------------------- | ------------- |
| GET      | `/mobile-login`           | モバイルログインページ | 不要          |
| POST     | `/api/mobile-auth/login`  | モバイルログイン       | 不要          |
| POST     | `/api/mobile-auth/verify` | Token 検証・JWT 発行   | 不要          |
| POST     | `/api/auth/eninsho`       | e-ninsho 認証          | 不要          |
| POST     | `/api/auth/refresh`       | Token 更新             | Refresh Token |
| POST     | `/api/sso/create-ticket`  | SSO Ticket 生成        | JWT           |
| GET      | `/sso/auth`               | SSO 認証               | Ticket        |

**※ 詳細は第 3 章参照**

---

## 4.4 ディレクトリ構造

### CMS API 完全構造

```
backend/cms-api/
├── src/main/
│   ├── java/com/juxyi/cms/
│   │   ├── controller/          # REST Controller
│   │   │   ├── ContentController.java
│   │   │   ├── FileController.java
│   │   │   ├── NotificationController.java
│   │   │   └── AdminAuthController.java
│   │   │
│   │   ├── service/             # ビジネスロジック
│   │   │   ├── ContentService.java
│   │   │   ├── AzureBlobService.java
│   │   │   ├── NotificationService.java
│   │   │   └── UserService.java
│   │   │
│   │   ├── repository/          # データアクセス
│   │   │   ├── ContentRepository.java
│   │   │   ├── UserRepository.java
│   │   │   └── NotificationRepository.java
│   │   │
│   │   ├── entity/              # JPA Entity
│   │   │   ├── Content.java
│   │   │   ├── User.java
│   │   │   └── Notification.java
│   │   │
│   │   ├── dto/                 # Data Transfer Object
│   │   │   ├── ContentDto.java
│   │   │   ├── JwtResponse.java
│   │   │   └── ErrorResponse.java
│   │   │
│   │   ├── mapper/              # Entity ⇔ DTO 変換
│   │   │   └── ContentMapper.java  # MapStruct
│   │   │
│   │   ├── security/            # セキュリティ設定
│   │   │   ├── JwtTokenProvider.java
│   │   │   ├── JwtAuthenticationFilter.java
│   │   │   └── UserDetailsServiceImpl.java
│   │   │
│   │   ├── config/              # 設定クラス
│   │   │   ├── SecurityConfig.java
│   │   │   ├── AzureConfig.java
│   │   │   └── WebConfig.java
│   │   │
│   │   ├── exception/           # 例外処理
│   │   │   ├── GlobalExceptionHandler.java
│   │   │   └── ResourceNotFoundException.java
│   │   │
│   │   └── util/                # ユーティリティ
│   │       └── DateTimeUtil.java
│   │
│   └── resources/
│       ├── application.yml
│       ├── application-dev.yml
│       ├── application-prod.yml
│       └── db/migration/        # Flyway
│           ├── V1__create_tables.sql
│           └── V2__add_indexes.sql
│
└── src/test/
    └── java/com/juxyi/cms/
        ├── controller/
        ├── service/
        └── repository/
```

---

## 4.5 主要機能実装

### プッシュ通知送信

```java name=backend/cms-api/src/main/java/com/juxyi/cms/service/NotificationService.java
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationHubClient notificationHubClient;
    private final UserDeviceRepository userDeviceRepository;

    public void sendPushNotification(String title, String message, List<String> platforms) {
        // 1. デバイストークン取得
        List<UserDevice> devices = userDeviceRepository.findByPlatformIn(platforms);

        // 2. プラットフォーム別に通知送信
        if (platforms.contains("ios")) {
            sendToIOS(devices.stream()
                .filter(d -> "ios".equals(d.getPlatform()))
                .collect(Collectors.toList()), title, message);
        }

        if (platforms.contains("android")) {
            sendToAndroid(devices.stream()
                .filter(d -> "android".equals(d.getPlatform()))
                .collect(Collectors.toList()), title, message);
        }
    }

    private void sendToIOS(List<UserDevice> devices, String title, String message) {
        String payload = String.format(
            "{\"aps\":{\"alert\":{\"title\":\"%s\",\"body\":\"%s\"},\"sound\":\"default\"}}",
            title, message
        );

        devices.forEach(device -> {
            try {
                notificationHubClient.sendAppleNativeNotification(payload, device.getToken());
            } catch (Exception e) {
                log.error("Failed to send iOS notification to device: {}", device.getToken(), e);
            }
        });
    }

    private void sendToAndroid(List<UserDevice> devices, String title, String message) {
        String payload = String.format(
            "{\"data\":{\"title\":\"%s\",\"message\":\"%s\"}}",
            title, message
        );

        devices.forEach(device -> {
            try {
                notificationHubClient.sendGcmNativeNotification(payload, device.getToken());
            } catch (Exception e) {
                log.error("Failed to send Android notification to device: {}", device.getToken(), e);
            }
        });
    }
}
```

### グローバル例外ハンドリング

```java name=backend/cms-api/src/main/java/com/juxyi/cms/exception/GlobalExceptionHandler.java
@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleResourceNotFound(ResourceNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(new ErrorResponse(ex.getMessage(), "RESOURCE_NOT_FOUND"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException ex) {
        String message = ex.getBindingResult().getFieldErrors().stream()
            .map(DefaultMessageSourceResolvable::getDefaultMessage)
            .collect(Collectors.joining(", "));

        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(new ErrorResponse(message, "VALIDATION_ERROR"));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex) {
        log.error("Unexpected error occurred", ex);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
            .body(new ErrorResponse("Internal server error", "INTERNAL_ERROR"));
    }
}
```

### テスト実装例

```java name=backend/cms-api/src/test/java/com/juxyi/cms/service/ContentServiceTest.java
@SpringBootTest
class ContentServiceTest {

    @Autowired
    private ContentService contentService;

    @MockBean
    private ContentRepository contentRepository;

    @Test
    void testGetContents() {
        // Given
        Content content = new Content();
        content.setId(1L);
        content.setTitle("Test Content");

        Page<Content> page = new PageImpl<>(List.of(content));
        when(contentRepository.findAll(any(Specification.class), any(Pageable.class)))
            .thenReturn(page);

        // When
        Page<ContentDto> result = contentService.getContents(PageRequest.of(0, 20), null, null);

        // Then
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getTitle()).isEqualTo("Test Content");
    }
}
```

---

**次のファイル**: [04-web-frontend-architecture.md](./04-web-frontend-architecture.md) →
