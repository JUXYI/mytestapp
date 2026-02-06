# バックエンド ディレクトリ構造

```
com.company.project
├── common                 # 工具类、全局异常、常量
├── config                 # 配置类 (AzureClientConfig, SecurityConfig)
├── controller
│   ├── admin              # 管理后台接口 (CRUD, SAS 签发)
│   └── app                # App 端接口 (内容清单, SAS 获取)
├── domain                 # 核心领域模型
│   ├── entity             # 数据库实体 (Content, AppConfig)
│   ├── repository         # Spring Data JPA 接口
│   └── service            # 业务逻辑接口及其实现
├── infrastructure         # 基础设施层
│   └── azure              # 封装 Azure Blob 存储的底层操作
└── security               # 鉴权中心 (JWT 校验, WebView 登录态转换)
```

```
┌─────────────────────────────────────────────────────────────────┐
│                        Internet / CDN                           │
│                      （グローバルアクセス）                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│                   Azure Front Door (Optional)                   │
│                    (Global Load Balancer)                       │
└──────────────────────┬──────────────────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────────────────┐
│              Azure App Service（PaaSホスティング）                │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Spring Boot Application（Javaアプリケーション）         │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Controller層：REST APIエンドポイント              │  │   │
│  │  │ - HTTPリクエスト処理                              │  │   │
│  │  │ - JSONシリアライゼーション                        │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Security層：JWT認証フィルター                     │  │   │
│  │  │ - トークン検証                                    │  │   │
│  │  │ - 権限チェック                                    │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Service層：ビジネスロジック                       │  │   │
│  │  │ - トランザクション管理                            │  │   │
│  │  │ - データ変換・加工                                │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Repository層：データアクセス                      │  │   │
│  │  │ - JPA/Hibernateによるクエリ実行                  │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  │  ┌───────────────────────────────────────────────────┐  │   │
│  │  │ Scheduled Tasks：定期実行タスク                   │  │   │
│  │  │ - ファイルクリーンアップ（毎日2時）               │  │   │
│  │  │ - キャッシュ同期（毎時）                          │  │   │
│  │  └───────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────┘   │
│  自動スケーリング：2～5インスタンス（CPU/メモリベース）          │
└───┬──────────────┬──────────────┬──────────────┬───────────────┘
    │              │              │              │
    │              │              │              │
┌───▼────┐  ┌──────▼──────┐  ┌───▼─────┐  ┌────▼──────────┐
│ Azure  │  │   Azure     │  │  Azure  │  │  Azure Key    │
│  SQL   │  │  Storage    │  │  Redis  │  │    Vault      │
│Database│  │  (Blob)     │  │  Cache  │  │ （シークレット │
│        │  │             │  │         │  │   管理）       │
│Standard│  │Hot Tier     │  │Basic/   │  │               │
│S2/S3   │  │             │  │Standard │  │- DB Password  │
│        │  │- ドキュメント│  │         │  │- JWT Secret   │
│- CRUD  │  │- ビデオ      │  │- セッション│  │- Storage Key  │
│- 検索  │  │- サムネイル  │  │- ホットデータ│ │               │
│        │  │             │  │  キャッシュ│  │               │
└────────┘  └─────────────┘  └─────────┘  └───────────────┘
                                                    │
┌───────────────────────────────────────────────────▼───────────┐
│        Application Insights（監視・ログ集約）                 │
│        - パフォーマンスメトリクス                              │
│        - エラートラッキング                                    │
│        - アラート設定                                          │
│        - ログクエリ（KQL）                                     │
└───────────────────────────────────────────────────────────────┘
```

```
asahi-myapp-tool-server/
│
├── .azure/                                      # Azure関連の設定ファイル
│   └── pipelines/                               # Azure DevOps CI/CDパイプライン定義
│       ├── azure-pipelines-dev.yml              # 開発環境用パイプライン（自動ビルド・デプロイ）
│       ├── azure-pipelines-staging.yml          # ステージング環境用パイプライン（テスト環境デプロイ）
│       └── azure-pipelines-prod.yml             # 本番環境用パイプライン（本番デプロイ、承認プロセス含む）
│
├── docker/                                      # Docker関連ファイル
│   ├── Dockerfile                               # アプリケーションのDockerイメージ定義
│   └── docker-compose.yml                       # ローカル開発環境用（SQL Server + Redis）
│
├── docs/                                        # プロジェクトドキュメント
│   ├── API.md                                   # RESTful API仕様書（エンドポイント、リクエスト/レスポンス形式）
│   ├── ARCHITECTURE.md                          # システムアーキテクチャ設計書
│   └── DEPLOYMENT.md                            # デプロイ手順書（Azure環境構築からデプロイまで）
│
├── scripts/                                     # 運用スクリプト
│   ├── init-azure-resources.sh                  # Azure リソース初期化スクリプト（自動リソース作成）
│   └── deploy.sh                                # 手動デプロイスクリプト
│
├── src/
│   ├── main/
│   │   ├── java/jp/co/asahi-myapp-tool-server/
│   │   │   │
│   │   │   ├── Application.java                  # Spring Bootアプリケーション起動クラス
│   │   │   │
│   │   │   ├── config/                          # 設定クラスパッケージ（全てのBean定義とアプリ設定）
│   │   │   │   ├── SecurityConfig.java          # Spring Security設定
│   │   │   │   ├── JwtConfig.java               # JWT設定
│   │   │   │   ├── AzureStorageConfig.java      # Azure Blob Storage設定
│   │   │   │   ├── AzureKeyVaultConfig.java     # Azure Key Vault設定
│   │   │   │   ├── RedisConfig.java             # Redis キャッシュ設定
│   │   │   │   ├── SchedulingConfig.java        # スケジュールタスク設定
│   │   │   │   ├── CorsConfig.java              # CORS（クロスオリジン）設定
│   │   │   │   └── WebMvcConfig.java            # Spring MVC設定
│   │   │   │
│   │   │   ├── controller/                      # コントローラー層（RESTful APIエンドポイント定義）
│   │   │   │   ├── AuthController.java          # 認証関連API
│   │   │   │   ├── ContentController.java       # コンテンツ管理API
│   │   │   │   ├── DocumentController.java      # ドキュメント管理API
│   │   │   │   ├── VideoController.java         # ビデオ管理API
│   │   │   │   ├── UrlLinkController.java       # URLリンク管理API
│   │   │   │   ├── FileUploadController.java    # ファイルアップロードAPI
│   │   │   │   └── HealthController.java        # ヘルスチェックAPI
│   │   │   │
│   │   │   ├── service/                         # サービス層（ビジネスロジック実装）
│   │   │   │   ├── AuthService.java             # 認証サービス
│   │   │   │   ├── ContentService.java          # コンテンツサービス
│   │   │   │   ├── DocumentService.java         # ドキュメントサービス
│   │   │   │   ├── VideoService.java            # ビデオサービス
│   │   │   │   ├── UrlLinkService.java          # URLリンクサービス
│   │   │   │   ├── FileStorageService.java      # ファイルストレージサービス
│   │   │   │   ├── CacheService.java            # キャッシュサービス
│   │   │   │   └── ScheduledTaskService.java    # スケジュールタスクサービス
│   │   │   │
│   │   │   ├── repository/                      # リポジトリ層（データアクセス）
│   │   │   │   ├── UserRepository.java          # ユーザーリポジトリ
│   │   │   │   ├── ContentRepository.java       # コンテンツリポジトリ
│   │   │   │   ├── DocumentRepository.java      # ドキュメントリポジトリ
│   │   │   │   ├── VideoRepository.java         # ビデオリポジトリ
│   │   │   │   └── UrlLinkRepository.java       # URLリンクリポジトリ
│   │   │   │
│   │   │   ├── model/                           # モデルパッケージ（データ構造定義）
│   │   │   │   ├── entity/                      # エンティティ（DBテーブルマッピング）
│   │   │   │   │   ├── BaseEntity.java          # 基底エンティティ
│   │   │   │   │   ├── User.java                # ユーザーエンティティ
│   │   │   │   │   ├── Content.java             # コンテンツエンティティ（基本情報）
│   │   │   │   │   ├── Document.java            # ドキュメントエンティティ
│   │   │   │   │   ├── Video.java               # ビデオエンティティ
│   │   │   │   │   └── UrlLink.java             # URLリンクエンティティ
│   │   │   │   │
│   │   │   │   ├── dto/                         # DTO（Data Transfer Object）
│   │   │   │   │   ├── request/                 # リクエストDTO（API入力データ）
│   │   │   │   │   │   ├── LoginRequest.java    # ログインリクエスト
│   │   │   │   │   │   ├── RegisterRequest.java # ユーザー登録リクエスト
│   │   │   │   │   │   ├── ContentCreateRequest.java     # コンテンツ作成リクエスト
│   │   │   │   │   │   ├── ContentUpdateRequest.java     # コンテンツ更新リクエスト
│   │   │   │   │   │   ├── DocumentCreateRequest.java    # ドキュメント作成リクエスト
│   │   │   │   │   │   ├── VideoCreateRequest.java       # ビデオ作成リクエスト
│   │   │   │   │   │   └── UrlLinkCreateRequest.java     # URLリンク作成リクエスト
│   │   │   │   │   │
│   │   │   │   │   └── response/                # レスポンスDTO（API出力データ）
│   │   │   │   │       ├── ApiResponse.java     # 統一APIレスポンス形式
│   │   │   │   │       ├── JwtResponse.java     # JWT認証レスポンス
│   │   │   │   │       ├── ContentResponse.java # コンテンツレスポンス
│   │   │   │   │       ├── DocumentResponse.java        # ドキュメントレスポンス
│   │   │   │   │       ├── VideoResponse.java           # ビデオレスポンス
│   │   │   │   │       ├── UrlLinkResponse.java         # URLリンクレスポンス
│   │   │   │   │       ├── FileUploadResponse.java      # ファイルアップロードレスポンス
│   │   │   │   │       └── PageResponse.java    # ページネーションレスポンス
│   │   │   │   │
│   │   │   │   └── enums/                       # 列挙型定義
│   │   │   │       ├── ContentType.java         # コンテンツタイプ
│   │   │   │       ├── ContentStatus.java       # コンテンツステータス
│   │   │   │       └── FileType.java            # ファイルタイプ
│   │   │   │
│   │   │   ├── security/                        # セキュリティパッケージ（認証・認可）
│   │   │   │   ├── JwtAuthenticationFilter.java # JWTフィルター
│   │   │   │   ├── JwtTokenProvider.java        # JWTトークン生成・検証
│   │   │   │   ├── CustomUserDetailsService.java # ユーザー詳細サービス
│   │   │   │   └── UserPrincipal.java           # 認証ユーザー情報
│   │   │   │
│   │   │   ├── exception/                       # 例外処理パッケージ
│   │   │   │   ├── GlobalExceptionHandler.java  # グローバル例外ハンドラー
│   │   │   │   ├── ResourceNotFoundException.java    # リソース未発見例外
│   │   │   │   ├── BadRequestException.java     # 不正リクエスト例外
│   │   │   │   ├── UnauthorizedException.java   # 認証失敗例外
│   │   │   │   └── FileStorageException.java    # ファイルストレージ例外
│   │   │   │
│   │   │   ├── util/                            # ユーティリティクラス
│   │   │   │   ├── DateUtil.java                # 日付ユーティリティ
│   │   │   │   ├── FileUtil.java                # ファイルユーティリティ
│   │   │   │   ├── ValidationUtil.java          # バリデーションユーティリティ
│   │   │   │   └── AzureUtil.java               # Azure SDK ユーティリティ
│   │   │   │
│   │   │   └── constant/                        # 定数クラス
│   │   │       ├── AppConstants.java            # アプリケーション定数
│   │   │       ├── SecurityConstants.java       # セキュリティ定数
│   │   │       └── StorageConstants.java        # ストレージ定数
│   │   │
│   │   └── resources/                           # リソースファイル
│   │       │
│   │       ├── application.yml                  # メイン設定ファイル
│   │       ├── application-dev.yml              # 開発環境設定
│   │       ├── application-staging.yml          # ステージング環境設定
│   │       ├── application-prod.yml             # 本番環境設定
│   │       │
│   │       ├── db/
│   │       │   └── migration/                   # Flywayデータベースマイグレーション
│   │       │       ├── V1__init_schema.sql      # 初期スキーマ作成
│   │       │       ├── V2__add_content_tables.sql    # コンテンツ詳細テーブル作成
│   │       │       └── V3__add_indexes.sql      # インデックス作成
│   │       │
│   │       └── logback-spring.xml               # ログ設定（Logback）
│   │
│   └── test/                                    # テストコード
│       └── java/jp/co/asahi-myapp-tool-server/
│           │
│           ├── ApplicationTests.java            # アプリケーション起動テスト
│           │
│           ├── controller/                      # コントローラーテスト
│           │   ├── AuthControllerTest.java      # 認証API単体テスト
│           │   └── ContentControllerTest.java   # コンテンツAPI単体テスト

│           ├── service/                         # サービス層テスト
│           │   ├── ContentServiceTest.java      # コンテンツサービステスト
│           │   └── FileStorageServiceTest.java  # ファイルストレージサービステスト
│           │
│           ├── repository/                      # リポジトリテスト
│           │   └── ContentRepositoryTest.java   # コンテンツリポジトリテスト
│           │
│           └── integration/                     # 統合テスト
│               └── ContentIntegrationTest.java  # コンテンツ統合テスト
│
├── .gitignore                                   # Git除外設定
├── build.gradle                                 # Gradleビルド設定
├── settings.gradle                              # Gradleプロジェクト設定
├── gradle.properties                            # Gradle プロパティ
├── gradlew                                      # Gradle Wrapper（Unix/Mac）
├── gradlew.bat                                  # Gradle Wrapper（Windows）
└── README.md                                    # プロジェクト説明書
```
