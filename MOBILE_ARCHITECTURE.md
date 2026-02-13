# React Native App - アーキテクチャ設計書

## 目次

1. [システム概要](#システム概要)
2. [全体システム構成](#全体システム構成)
3. [技術スタック](#技術スタック)
4. [プロジェクト構造（Monorepo）](#プロジェクト構造monorepo)
5. [ディレクトリ構造](#ディレクトリ構造)
6. [認証フロー設計](#認証フロー設計)
7. [API 統合設計](#api-統合設計)
8. [機能モジュール設計](#機能モジュール設計)
9. [原生機能統合](#原生機能統合)
10. [状態管理設計](#状態管理設計)
11. [オフライン機能設計](#オフライン機能設計)
12. [プッシュ通知設計](#プッシュ通知設計)
13. [WebView 統合設計](#webview-統合設計)
14. [セキュリティ設計](#セキュリティ設計)
15. [パフォーマンス最適化](#パフォーマンス最適化)
16. [デプロイメント設計](#デプロイメント設計)

---

## システム概要

### プロジェクト情報

- **プロジェクト名**: JUXYI Content Viewer Mobile App
- **プラットフォーム**: iOS + Android
- **フレームワーク**: React Native 0.73+
- **言語**: TypeScript 5.3+
- **対象ユーザー**: 日本国内ユーザー（10,000+ ユーザー想定）
- **目的**: コンテンツ（ドキュメント・ビデオ）閲覧、集章活動、マイページ連携

### 主要機能

1. **認証機能**

   - WebView 経由マイページログイン（初回）
   - e-ninsho SDK 認証（公的個人認証）
   - 生体認証（Face ID / Touch ID / 指 ���）
   - 自動ログイン維持（Refresh Token）

2. **コンテンツ閲覧**

   - ドキュメント閲覧（PDF プレビュー）
   - ビデオ視聴（オンライン再生）
   - URL リンク表示（WebView / 外部ブラウザ）
   - キャッシュ対応（最近閲覧した 10 件）

3. **原生機能**

   - QR コード読取（集章活動）
   - NFC 読取（e-ninsho 認証）
   - プッシュ通知受信
   - 外部ブラウザ起動（SSO）

4. **WebView 機能**
   - 富文本表示
   - 外部 Web ページ埋め込み
   - マイページ Web 連携
   - RN ⇔ WebView 双方向通信

---

## 全体システム構成

### システム関係図

```
┌──────────────────────────────────────────────────────────────────┐
│                         ユーザー                                  │
└────────┬────────────────────���──┬─────────────────────────────────┘
         │                       │
         │ モバイルアプリ         │ Web ブラウザ
         │                       │
         ▼                       ▼
┌─────────────────────┐  ┌─────────────────────────────────────┐
│  React Native App   │  │      マイページ Web                  │
│  (iOS / Android)    │  │      (既存システム)                  │
│                     │  │                                      │
│  開発中              │  │  - 家族契約確認                      │
│  - コンテンツ閲覧    │  │  - 各種情報閲覧                      │
│  - ドキュメント/ビデオ│  │  - ユーザー設定                      │
│  - 集章活動          │  │                                      │
│  - e-ninsho 認証     │  │  ドメイン: mypage.example.com       │
└──────┬──────────────┘  └──────────┬──────────────────────────┘
       │                            │
       │ JWT Token                  │ Session/Cookie
       │                            │
       ├────────────────────────────┼──────────────────────────┐
       │                            │                          │
       ▼                            ▼                          │
┌─────────────────────┐  ┌───────────────────────────────────┐ │
│    CMS API          │  │     マイページAPI                  │ │
│  (Spring Boot)      │  │    (Spring Boot)                  │ │
│                     │  │                                    │ │
│  開発中              │  │  開発中                            │ │
│  - コンテンツ CRUD   │  │  - ユーザー認証                    │ │
│  - ドキュメント/ビデオ│  │  - マイページ Web バックエンド     │ │
│  - プッシュ通知      │  │  - App ログイン API                │ │
│  - App データ提供    │  │  - SSO Ticket 発行                 │ │
│                     │  │                                    │ │
│  ドメイン:           │  │  ドメイン:                         │ │
│  cms-api.example.com│  ���  mypage-api.example.com           │ │
└─────────────────────┘  └───────────────────────────────────┘ │
       │                            │                          │
       │ JWT 共有（共通秘密鍵）      │                          │
       └────────────────────────────┘                          │
                                                               │
                  ┌────────────────────────────────────────────┘
                  │ 管理者アクセス
                  │
                  ▼
          ┌───────────────────┐
          │   CMS Web 管理画面 │
          │   (React Web)     │
          │                   │
          │  開発中            │
          │  - コンテンツ管理  │
          │  - プッシュ通知送信│
          └───────────────────┘
```

### 認証・通信フロー概要

| シナリオ               | 使用システム                      | 認証方式           | Token タイプ    |
| ---------------------- | --------------------------------- | ------------------ | --------------- |
| **App ログイン**       | React Native App → マイページ API | WebView / e-ninsho | JWT（24h 有効） |
| **App コンテンツ取得** | React Native App → CMS API        | JWT Token          | 共有 JWT        |
| **App → Web SSO**      | React Native App → マイページ Web | Ticket（30 秒）    | UUID Ticket     |
| **マイページ Web**     | ブラウザ → マイページ API         | Session/Cookie     | JSESSIONID      |
| **CMS 管理画面**       | CMS Web → CMS API                 | JWT Token          | JWT（24h 有効） |

---

## 技術スタック

### コア技術

| カテゴリ                | 技術               | バージョン | 用途                             |
| ----------------------- | ------------------ | ---------- | -------------------------------- |
| **言語**                | TypeScript         | 5.3+       | 型安全な開発                     |
| **フレームワーク**      | React Native       | 0.73+      | クロスプラットフォーム開発       |
| **ビルドツール**        | React Native CLI   | -          | Pure React Native（Expo 不使用） |
| **JavaScript エンジン** | Hermes             | -          | 高速起動・パフォーマンス向上     |
| **ナビゲーション**      | React Navigation   | 6.x        | 画面遷移管理                     |
| **UI ライブラリ**       | React Native Paper | 5.x        | Material Design コンポーネント   |

### 状態管理・データ取得

| カテゴリ               | 技術                         | 用途                                       |
| ---------------------- | ---------------------------- | ------------------------------------------ |
| **サーバー状態**       | TanStack Query (React Query) | API データキャッシュ・同期                 |
| **クライアント状態**   | Zustand                      | 軽量グローバル状態管理（認証状態等）       |
| **HTTP クライアント**  | Axios                        | API 通信                                   |
| **ローカルストレージ** | AsyncStorage                 | 小容量データ保存（< 6MB）                  |
| **ファイルストレージ** | react-native-fs              | 大容量ファイル保存（PDF/ビデオキャッシュ） |

### 原生機能

| カテゴリ           | ライブラリ                                                 | 用途                               |
| ------------------ | ---------------------------------------------------------- | ---------------------------------- |
| **QR コード読取**  | react-native-vision-camera + vision-camera-code-scanner    | 高性能カメラ・QR 読取              |
| **NFC**            | e-ninsho SDK（野村総合研究所）                             | 公的個人認証（マイナンバーカード） |
| **生体認証**       | react-native-biometrics                                    | Face ID / Touch ID / 指紋認証      |
| **プッシュ通知**   | @react-native-firebase/messaging + Azure Notification Hubs | プッシュ通知受信                   |
| **ディープリンク** | @react-navigation/native                                   | アプリ内画面遷移                   |
| **外部ブラウザ**   | react-native-inappbrowser-reborn                           | In-App Browser / 外部ブラウザ起動  |

### メディア処理

| カテゴリ       | ライブラリ              | 用途                           |
| -------------- | ----------------------- | ------------------------------ |
| **PDF 表示**   | react-native-pdf        | PDF ドキュメント表示           |
| **ビデオ再生** | react-native-video      | ビデオプレイヤー               |
| **画像表示**   | react-native-fast-image | 高性能画像読み込み・キャッシュ |
| **WebView**    | react-native-webview    | Web ページ埋め込み             |

### 開発ツール

| カテゴリ           | 技術                                        | 用途                           |
| ------------------ | ------------------------------------------- | ------------------------------ |
| **リンター**       | ESLint                                      | コード品質チェック             |
| **フォーマッター** | Prettier                                    | コードフォーマット統一         |
| **テスト**         | Jest + React Native Testing Library + Detox | 単元・E2E テスト               |
| **エラー監視**     | Application Insights                        | エラー追跡・パフォーマンス監視 |
| **CI/CD**          | Azure DevOps Pipelines                      | 自動ビルド・デプロイ           |
| **コード更新**     | CodePush (App Center)                       | OTA 更新                       |

---

## プロジェクト構造（Monorepo）

### リポジトリ全体構造

```
juxyi-cms/                                   # Monorepo ルート
│
├── backend/                                  # CMS API (Spring Boot)
│   ├── src/
│   ├── build.gradle
│   └── README.md
│
├── frontend/                                 # CMS Web 管理画面 (React)
│   ├── src/
│   ├── package.json
│   └── README.md
│
├── mobile/                                   # React Native App（本プロジェクト）
│   ├── android/                              # Android 原生コード
│   ├── ios/                                  # iOS 原生コード
│   ├── src/                                  # React Native ソースコード
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── mypage-api/                               # マイページAPI (Spring Boot)
│   ├── src/
│   ├── build.gradle
│   └── README.md
│
├── docs/                                     # 共有ドキュメント
│   ├── ARCHITECTURE.md                       # バックエンドアーキテクチャ
│   ├── FRONTEND_ARCHITECTURE.md              # フロントエンドアーキテクチャ
│   ├── MOBILE_ARCHITECTURE.md                # モバイルアーキテクチャ（本文書）
│   ├── API.md                                # API 仕様書
│   └── DEPLOYMENT.md                         # デプロイ手順書
│
├── .azure/                                   # Azure DevOps Pipelines
│   └── pipelines/
│       ├── backend-pipeline.yml
│       ├── frontend-pipeline.yml
│       ├── mobile-ios-pipeline.yml           # iOS ビルド
│       ├── mobile-android-pipeline.yml       # Android ビルド
│       └── shared/
│           └── azure-resources.yml
│
├── .gitignore
└── README.md
```

---

## ディレクトリ構造

### React Native App 完全ディレクトリ構造

```
mobile/
│
├── android/                                   # Android 原生コード
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/juxyi/mobile/
│   │   │   │   └── MainActivity.java          # メインアクティビティ
│   │   │   ├── res/                           # Android リソース
│   │   │   └── AndroidManifest.xml            # マニフェスト設定
│   │   └── build.gradle                       # アプリビルド設定
│   ├── build.gradle                           # プロジェクトビルド設定
│   └── gradle.properties                      # Gradle プロパティ
│
├── ios/                                       # iOS 原生コード
│   ├── JuxyiMobile/
│   │   ├── AppDelegate.mm                     # アプリデリゲート
│   │   ├── Info.plist                         # アプリ設定
│   │   └── Images.xcassets/                   # iOS アセット
│   ├── JuxyiMobile.xcodeproj/                 # Xcode プロジェクト
│   ├── JuxyiMobile.xcworkspace/               # Xcode ワークスペース
│   └── Podfile                                # CocoaPods 依存関係
│
├── src/                                       # React Native ソースコード
│   │
│   ├── App.tsx                                # ルートコンポーネント
│   │                                          # - ナビゲーション設定
│   │                                          # - グローバルプロバイダー統合
│   │                                          # - Application Insights 初期化
│   │
│   ├── index.ts                               # アプリケーションエントリーポイント
│   │                                          # - App コンポーネント登録
│   │                                          # - AppRegistry 登録
│   │
│   ├── assets/                                # 静的アセット
│   │   ├── images/                            # 画像ファイル
│   │   │   ├── logo.png                       # アプリロゴ
│   │   │   ├── splash-screen.png              # スプラッシュ画面
│   │   │   ├── empty-state.svg                # 空状態イラスト
│   │   │   └── placeholder.png                # プレースホルダー
│   │   │
│   │   ├── fonts/                             # カスタムフォント（オプション）
│   │   │   └── NotoSansJP-Regular.ttf         # 日本語フォント
│   │   │
│   │   └── videos/                            # サンプルビデオ（開発用）
│   │
│   ├── components/                            # 共通コンポーネント
│   │   │
│   │   ├── layout/                            # レイアウトコンポーネント
│   │   │   ├── AppContainer.tsx               # アプリコンテナ（SafeAreaView ラッパー）
│   │   │   ├── Header.tsx                     # 共通ヘッダー
│   │   │   ├── TabBar.tsx                     # タブバーナビゲーション
│   │   │   └── BottomNavigation.tsx           # ボトムナビゲーション
│   │   │
│   │   ├── common/                            # 汎用コンポーネント
│   │   │   ├── Button.tsx                     # カスタムボタン（Paper Button ラッパー）
│   │   │   ├── Card.tsx                       # カードコンポーネント
│   │   │   ├── LoadingSpinner.tsx             # ローディングインジケーター
│   │   │   ├── ErrorView.tsx                  # エラー表示ビュー
│   │   │   ├── EmptyState.tsx                 # 空状態表示
│   │   │   ├── ConfirmDialog.tsx              # 確認ダイアログ
│   │   │   └── Toast.tsx                      # トースト通知
│   │   │
│   │   ├── media/                             # メディアコンポーネント
│   │   │   ├── PdfViewer.tsx                  # PDF プレビューコンポーネント
│   │   │   │                                  # - react-native-pdf 使用
│   │   │   │                                  # - ページナビゲーション
│   │   │   │                                  # - ズーム機能
│   │   │   │
│   │   │   ├── VideoPlayer.tsx                # ビデオプレイヤーコンポーネント
│   │   │   │                                  # - react-native-video 使用
│   │   │   │                                  # - 再生・一時停止・シーク
│   │   │   │                                  # - フルスクリーン対応
│   │   │   │
│   │   │   ├── ImageViewer.tsx                # 画像ビューアー
│   │   │   │                                  # - FastImage 使用
│   │   │   │                                  # - ピンチズーム対応
│   │   │   │
│   │   │   └── WebViewContainer.tsx           # WebView コンテナ
│   │   │                                      # - react-native-webview 使用
│   │   │                                      # - JavaScript インジェクション
│   │   │                                      # - postMessage 通信
│   │   │
│   │   ├── list/                              # リストコンポーネント
│   │   │   ├── ContentList.tsx                # コンテンツ一覧
│   │   │   │                                  # - FlatList 使用
│   │   │   │                                  # - プルトゥリフレッシュ
│   │   │   │                                  # - 無限スクロール
│   │   │   │
│   │   │   ├── ContentCard.tsx                # コンテンツカード
│   │   │   │                                  # - サムネイル表示
│   │   │   │                                  # - タイトル・説明表示
│   │   │   │                                  # - タップ時詳細画面へ遷移
│   │   │   │
│   │   │   └── SectionList.tsx                # セクション付きリスト
│   │   │                                      # - カテゴリ別表示
│   │   │
│   │   └── form/                              # フォームコンポーネント
│   │       ├── TextInput.tsx                  # テキスト入力（Paper TextInput ラッパー）
│   │       ├── SearchBar.tsx                  # 検索バー
│   │       └── FilterChips.tsx                # フィルターチップ（タイプ・ステータス選択）
│   │
│   ├── features/                              # 機能別モジュール（Feature-based Architecture）
│   │   │
│   │   ├── auth/                              # 認証機能モジュール
│   │   │   │
│   │   │   ├── screens/                       # 認証画面
│   │   │   │   ├── LoginScreen.tsx            # ログイン画面
│   │   │   │   │                              # - WebView / e-ninsho 選択
│   │   │   │   │                              # - 生体認証ボタン
│   │   │   │   │
│   │   │   │   ├── WebViewLoginScreen.tsx     # WebView ログイン画面
│   │   │   │   │                              # - マイページAPI ログインページ読み込み
│   │   │   │   │                              # - postMessage 受信処理
│   │   │   │   │
│   │   │   │   └── BiometricLoginScreen.tsx   # 生体認証画面
│   │   │   │                                  # - Face ID / Touch ID / 指紋
│   │   │   │                                  # - 保存済み JWT Token で自動ログイン
│   │   │   │
│   │   │   ├── components/                    # 認証用コンポーネント
│   │   │   │   ├── LoginMethodSelector.tsx    # ログイン方法選択
│   │   │   │   │                              # - WebView ログイン
│   │   │   │   │                              # - e-ninsho 認証
│   │   │   │   │                              # - 生体認証
│   │   │   │   │
│   │   │   │   ├── ENinshoButton.tsx          # e-ninsho 認証ボタン
│   │   │   │   │                              # - 野村 SDK 呼び出し
│   │   │   │   │                              # - NFC 読取起動
│   │   │   │   │
│   │   │   │   └── BiometricPrompt.tsx        # 生体認証プロンプト
│   │   │   │                                  # - react-native-biometrics 使用
│   │   │   │
│   │   │   ├── hooks/                         # 認証用フック
│   │   │   │   ├── useAuth.ts                 # 認証状態管理フック
│   │   │   │   │                              # - Zustand ストア連携
│   │   │   │   │                              # - ログイン・ログアウト処理
│   │   │   │   │                              # - JWT Token 管理
│   │   │   │   │
│   │   │   │   ├── useWebViewLogin.ts         # WebView ログインフック
│   │   │   │   │                              # - postMessage 受信
│   │   │   │   │                              # - 一時 Token 検証
│   │   │   │   │                              # - JWT Token 取得
│   │   │   │   │
│   │   │   │   ├── useENinshoAuth.ts          # e-ninsho 認証フック
│   │   │   │   │                              # - 野村 SDK 呼び出し
│   │   │   │   │                              # - 認証結果処理
│   │   │   │   │
│   │   │   │   ├── useBiometricAuth.ts        # 生体認証フック
│   │   │   │   │                              # - 生体認証利用可能チェック
│   │   │   │   │                              # - 認証実行
│   │   │   │   │
│   │   │   │   └── useRefreshToken.ts         # Token リフレッシュフック
│   │   │   │                                  # - Access Token 期限切れ時自動更新
│   │   │   │                                  # - Refresh Token 使用
│   │   │   │
│   │   │   ├── services/                      # 認証 API サービス
│   │   │   │   ├── authService.ts             # 認証 API 呼び出し
│   │   │   │   │                              # - POST /api/mobile-auth/verify（マイページAPI）
│   │   │   │   │                              # - POST /api/auth/eninsho（マイページAPI）
│   │   │   │   │                              # - POST /api/auth/refresh（マイページAPI）
│   │   │   │   │
│   │   │   │   └── eninshoService.ts          # e-ninsho SDK ラッパー
│   │   │   │                                  # - 野村 SDK 呼び出し（Native Module）
│   │   │   │
│   │   │   ├── stores/                        # 認証状態ストア
│   │   │   │   └── authStore.ts               # Zustand 認証ストア
│   │   │   │                                  # - user: User | null
│   │   │   │                                  # - isAuthenticated: boolean
│   │   │   │                                  # - accessToken: string | null
│   │   │   │                                  # - refreshToken: string | null
│   │   │   │                                  # - setUser / logout アクション
│   │   │   │
│   │   │   ├── types/                         # 認証型定義
│   │   │   │   └── auth.types.ts              # User, LoginResponse, ENinshoResult 型
│   │   │   │
│   │   │   └── utils/                         # 認証ユーティリティ
│   │   │       ├── tokenStorage.ts            # Token 保存・取得（AsyncStorage）
│   │   │       └── biometricUtils.ts          # 生体認証ヘルパー
│   │   │
│   │   ├── home/                              # ホーム画面モジュール
│   │   │   │
│   │   │   ├── screens/                       # ホーム画面
│   │   │   │   └── HomeScreen.tsx             # ホーム画面
│   │   │   │                                  # - コンテンツカテゴリ表示
│   │   │   │                                  # - 最近閲覧したコンテンツ
│   │   │   │                                  # - 集章活動ボタン
│   │   │   │                                  # - マイページへのSSO ボタン
│   │   │   │
│   │   │   ├── components/                    # ホーム用コンポーネント
│   │   │   │   ├── CategoryGrid.tsx           # カテゴリグリッド
│   │   │   │   │                              # - ドキュメント・ビデオ・URLリンク
│   │   │   │   │
│   │   │   │   ├── RecentContentList.tsx      # 最近閲覧リスト
│   │   │   │   │                              # - 横スクロールリスト
│   │   │   │   │
│   │   │   │   └── QuickActionButtons.tsx     # クイックアクションボタン
│   │   │   │                                  # - QR コード読取
│   │   │   │                                  # - マイページへ遷移
│   │   │   │
│   │   │   └── hooks/                         # ホーム用フック
│   │   │       └── useRecentContents.ts       # 最近閲覧履歴取得
│   │   │
│   │   ├── contents/                          # コンテンツ閲覧モ��ュール
│   │   │   │
│   │   │   ├── screens/                       # コンテンツ画面
│   │   │   │   ├── ContentListScreen.tsx      # コンテンツ一覧画面
│   │   │   │   │                              # - カテゴリ別一覧表示
│   │   │   │   │                              # - 検索・フィルター
│   │   │   │   │                              # - プルトゥリフレッシュ
│   │   │   │   │
│   │   │   │   ├── ContentDetailScreen.tsx    # コンテンツ詳細画面
│   │   │   │   │                              # - タイトル・説明表示
│   │   │   │   │                              # - ドキュメント/ビデオプレビュー
│   │   │   │   │                              # - ダウンロードボタン（オフライン用）
│   │   │   │   │
│   │   │   │   ├── DocumentViewerScreen.tsx   # ドキュメント閲覧画面
│   │   │   │   │                              # - PDF フルスクリーン表示
│   │   │   │   │                              # - ページナビゲーション
│   │   │   │   │                              # - ズーム機能
│   │   │   │   │
│   │   │   │   ├── VideoPlayerScreen.tsx      # ビデオ再生画面
│   │   │   │   │                              # - ビデオフルスクリーン再生
│   │   │   │   │                              # - 再生コントロール
│   │   │   │   │
│   │   │   │   └── WebContentScreen.tsx       # Web コンテンツ画面
│   │   │   │                                  # - WebView で URL 表示
│   │   │   │                                  # - 外部ブラウザで開くボタン
│   │   │   │
│   │   │   ├── components/                    # コンテンツ用コンポーネント
│   │   │   │   ├── ContentFilterBar.tsx       # フィルターバー
│   │   │   │   │                              # - タイプ・ステータス選択
│   │   │   │   │
│   │   │   │   ├── ContentSearchBar.tsx       # 検索バー
│   │   │   │   │                              # - デバウンス検索
│   │   │   │   │
│   │   │   │   └── DownloadButton.tsx         # ダウンロードボタン
│   │   │   │                                  # - オフライン保存機能
│   │   │   │                                  # - 進捗表示
│   │   │   │
│   │   │   ├── hooks/                         # コンテンツ用フック
│   │   │   │   ├── useContents.ts             # コンテンツ���覧取得
│   │   │   │   │                              # - TanStack Query useQuery
│   │   │   │   │                              # - CMS API 呼び出し
│   │   │   │   │
│   │   │   │   ├── useContentDetail.ts        # コンテンツ詳細取得
│   │   │   │   │                              # - キャッシュ対応
│   │   │   │   │
│   │   │   │   ├── useDownload.ts             # ダウンロード処理
│   │   │   │   │                              # - react-native-fs 使用
│   │   │   │   │                              # - 進捗管理
│   │   │   │   │
│   │   │   │   └── useContentSearch.ts        # コンテンツ検索
│   │   │   │                                  # - デバウンス処理
│   │   │   │
│   │   │   ├── services/                      # コンテンツ API サービス
│   │   │   │   └── contentService.ts          # コンテンツ API 呼び出し
│   │   │   │                                  # - GET /api/contents（CMS API）
│   │   │   │                                  # - GET /api/contents/:id
│   │   │   │
│   │   │   └── types/                         # コンテンツ型定義
│   │   │       └── content.types.ts           # Content, ContentType, ContentStatus 型
│   │   │
│   │   ├── stamp-rally/                       # 集章活動モジュール
│   │   │   │
│   │   │   ├── screens/                       # 集章画面
│   │   │   │   ├── StampRallyScreen.tsx       # 集章一覧画面
│   │   │   │   │                              # - 獲得済みスタンプ表示
│   │   │   │   │                              # - 達成率表示
│   │   │   │   │
│   │   │   │   ├── QRScannerScreen.tsx        # QR コード読取画面
│   │   │   │   │                              # - react-native-vision-camera 使用
│   │   │   │   │                              # - QR コード自動検出
│   │   │   │   │                              # - スキャン成功時スタンプ獲得
│   │   │   │   │
│   │   │   │   └── StampDetailScreen.tsx      # スタンプ詳細画面
│   │   │   │                                  # - スタンプ情報表示
│   │   │   │                                  # - 獲得日時表示
│   │   │   │
│   │   │   ├── components/                    # 集章用コンポーネント
│   │   │   │   ├── StampCard.tsx              # スタンプカード
│   │   │   │   │                              # - 獲得済み/未獲得状態表示
│   │   │   │   │
│   │   │   │   ├── QRCamera.tsx               # QR カメラコンポーネント
│   │   │   │   │                              # - カメラビュー
│   │   │   │   │                              # - QR フレーム表示
│   │   │   │   │
│   │   │   │   └── ProgressBar.tsx            # 達成率プログレスバー
│   │   │   │
│   │   │   ├── hooks/                         # 集章用フック
│   │   │   │   ├── useStamps.ts               # スタンプ一覧取得
│   │   │   │   ├── useQRScanner.ts            # QR スキャナー制御
│   │   │   │   └── useStampCollection.ts      # スタンプ獲得処理
│   │   │   │
│   │   │   ├── services/                      # 集章 API サービス
│   │   │   │   └── stampService.ts            # 集章 API 呼び出し
│   │   │   │                                  # - GET /api/stamps（CMS API）
│   │   │   │                                  # - POST /api/stamps/collect
│   │   │   │
│   │   │   └── types/                         # 集章型定義
│   │   │       └── stamp.types.ts             # Stamp, StampCollection 型
│   │   │
│   │   ├── notifications/                     # プッシュ通知モジュール
│   │   │   │
│   │   │   ├── screens/                       # 通知画面
│   │   │   │   ├── NotificationListScreen.tsx # 通知一覧画面
│   │   │   │   │                              # - 受信済み通知表示
│   │   │   │   │                              # - 未読/既読状態
│   │   │   │   │                              # - タップで詳細またはコンテンツへ遷移
│   │   │   │   │
│   │   │   │   └── NotificationDetailScreen.tsx # 通知詳細画面
│   │   │   │                                  # - 通知内容表示
│   │   │   │                                  # - アクションボタン
│   │   │   │
│   │   │   ├── components/                    # 通知用コンポーネント
│   │   │   │   ├── NotificationCard.tsx       # 通知カード
│   │   │   │   │                              # - タイトル・本文表示
│   │   │   │   │                              # - 未読バッジ
│   │   │   │   │
│   │   │   │   └── NotificationBadge.tsx      # 通知バッジ（タブバー用）
│   │   │   │                                  # - 未読数表示
│   │   │   │
│   │   │   ├── hooks/                         # 通知用フック
│   │   │   │   ├── useNotifications.ts        # 通知一覧取得
│   │   │   │   │                              # - CMS API 呼び��し
│   │   │   │   │
│   │   │   │   ├── usePushNotification.ts     # プッシュ通知受信処理
│   │   │   │   │                              # - Firebase Messaging 設定
│   │   │   │   │                              # - 通知受信リスナー
│   │   │   │   │                              # - デバイス Token 登録
│   │   │   │   │
│   │   │   │   └── useNotificationNavigation.ts # 通知タップ時ナビゲーション
│   │   │   │                                  # - Deep Link 処理
│   │   │   │
│   │   │   ├── services/                      # 通知 API サービス
│   │   │   │   ├── notificationService.ts     # 通知 API 呼び出し
│   │   │   │   │                              # - GET /api/notifications（CMS API）
│   │   │   │   │                              # - POST /api/notifications/register-device
│   │   │   │   │
│   │   │   │   └── pushService.ts             # プッシュ通知サービス
│   │   │   │                                  # - Firebase Messaging 初期化
│   │   │   │                                  # - デバイス Token 取得
│   │   │   │
│   │   │   └── types/                         # 通知型定義
│   │   │       └── notification.types.ts      # Notification, PushPayload 型
│   │   │
│   │   ├── sso/                               # SSO 機能モジュール
│   │   │   │
│   │   │   ├── hooks/                         # SSO 用フック
│   │   │   │   └── useSso.ts                  # SSO 処理フック
│   │   │   │                                  # - マイページAPI に Ticket リクエスト
│   │   │   │                                  # - 外部ブラウザ起動
│   │   │   │
│   │   │   ├── services/                      # SSO API サービス
│   │   │   │   └── ssoService.ts              # SSO API 呼び出し
│   │   │   │                                  # - POST /api/sso/create-ticket（マイページAPI）
│   │   │   │
│   │   │   └── types/                         # SSO 型定義
│   │   │       └── sso.types.ts               # SsoTicket, SsoRequest 型
│   │   │
│   │   ├── settings/                          # 設定モジュール
│   │   │   │
│   │   │   ├── screens/                       # 設定画面
│   │   │   │   ├── SettingsScreen.tsx         # 設定一覧画面
│   │   │   │   │                              # - アカウント情報
│   │   │   │   │                              # - 通知設定
│   │   │   │   │                              # - キャッシュクリア
│   │   │   │   │                              # - ログアウト
│   │   │   │   │
│   │   │   │   ├── AccountScreen.tsx          # アカウント情報画面
│   │   │   │   │                              # - ユーザー情報表示
│   │   │   │   │
│   │   │   │   └── NotificationSettingsScreen.tsx # 通知設定画面
│   │   │   │                                  # - プッシュ通知 ON/OFF
│   │   │   │
│   │   │   ├── components/                    # 設定用コンポーネント
│   │   │   │   ├── SettingItem.tsx            # 設定項目
│   │   │   │   └── SwitchSetting.tsx          # スイッチ設定項目
│   │   │   │
│   │   │   └── hooks/                         # 設定用フック
│   │   │       └── useSettings.ts             # 設定管理フック
│   │   │                                      # - AsyncStorage 連携
│   │   │
│   │   └── webview/                           # WebView 機能モジュール
│   │       │
│   │       ├── screens/                       # WebView 画面
│   │       │   └── WebViewScreen.tsx          # 汎用 WebView 画面
│   │       │                                  # - URL パラメータ受け取り
│   │       │                                  # - JavaScript インジェクション
│   │       │                                  # - postMessage 通信
│   │       │
│   │       ├── components/                    # WebView 用コンポーネント
│   │       │   ├── CustomWebView.tsx          # カスタム WebView
│   │       │   │                              # - JWT Token 自動注入
│   │       │   │                              # - 外部ブラウザ起動ハンドリング
│   │       │   │
│   │       │   └── WebViewToolbar.tsx         # WebView ツールバー
│   │       │                                  # - 戻る・進む・リロード・閉じる
│   │       │
│   │       └── hooks/                         # WebView 用フック
│   │           └── useWebViewBridge.ts        # WebView ⇔ RN 通信フック
│   │                                          # - postMessage 送受信
│   │                                          # - JavaScript 実行
│   │
│   ├── navigation/                            # ナビゲーション設定
│   │   ├── RootNavigator.tsx                  # ルートナビゲーター
│   │   │                                      # - 認証状態による画面切り替え
│   │   │                                      # - 未認証: Auth Stack
│   │   │                                      # - 認証済み: Main Stack
│   │   │
│   │   ├── AuthStack.tsx                      # 認証スタック
│   │   │                                      # - Login / WebViewLogin 画面
│   │   │
│   │   ├── MainStack.tsx                      # メインスタック
│   │   │                                      # - Tab Navigator 内包
│   │   │
│   │   ├── TabNavigator.tsx                   # タブナビゲーター
│   │   │                                      # - ホーム・コンテンツ・集章・通知・設定
│   │   │
│   │   ├── linking.ts                         # Deep Link 設定
│   │   │                                      # - juxyi://content/:id
│   │   │                                      # - juxyi://notification/:id
│   │   │
│   │   └── types.ts                           # ナビゲーション型定義
│   │                                          # - RootStackParamList
│   │                                          # - MainTabParamList
│   │
│   ├── lib/                                   # ライブラリ・ユーティリティ
│   │   │
│   │   ├── api/                               # API 関連
│   │   │   ├── axios.ts                       # Axios インスタンス設定
│   │   │   │                                  # - ベース URL 設定（環境変数）
│   │   │   │                                  # - JWT Token 自動付与（インターセプター）
│   │   │   │                                  # - エラーハンドリング
│   │   │   │                                  # - Token リフレッシュ処理
│   │   │   │
│   │   │   ├── queryClient.ts                 # TanStack Query 設定
│   │   │   │                                  # - デフォルトオプション設定
│   │   │   │                                  # - staleTime: 5分
│   │   │   │                                  # - retry: 1回
│   │   │   │
│   │   │   └── endpoints.ts                   # API エンドポイント定義
│   │   │                                      # - マイページAPI エンドポイント
│   │   │                                      # - CMS API エンドポイント
│   │   │
│   │   ├── cache/                             # キャッシュ管理
│   │   │   ├── fileCache.ts                   # ファイルキャッシュ管理
│   │   │   │                                  # - react-native-fs 使用
│   │   │   │                                  # - LRU アルゴリズム
│   │   │   │                                  # - 最大キャッシュサイズ: 500MB
│   │   │   │
│   │   │   ├── metadataCache.ts               # メタデータキャッシュ
│   │   │   │                                  # - AsyncStorage 使用
│   │   │   │                                  # - コンテンツリスト保存
│   │   │   │
│   │   │   └── cacheManager.ts                # キャッシュマネージャー
│   │   │                                      # - キャッシュクリア
│   │   │                                      # - キャッシュサイズ計算
│   │   │
│   │   ├── storage/                           # ストレージユーティリティ
│   │   │   ├── asyncStorage.ts                # AsyncStorage ラッパー
│   │   │   │                                  # - 型安全な保存・取得
│   │   │   │                                  # - JSON シリアライズ対応
│   │   │   │
│   │   │   └── secureStorage.ts               # セキュアストレージ
│   │   │                                      # - 機密情報保存（Keychain / Keystore）
│   │   │                                      # - JWT Token 保存
│   │   │
│   │   ├── utils/                             # ユーティリティ関数
│   │   │   ├── formatters.ts                  # フォーマット関数
│   │   │   │                                  # - 日付フォーマット（dayjs 使用）
│   │   │   │                                  # - ファイルサイズ変換
│   │   │   │                                  # - 再生時間フォーマット
│   │   │   │
│   │   │   ├── validators.ts                  # バリデーション関数
│   │   │   │                                  # - URL バリデーション
│   │   │   │                                  # - ファイルタイプチェック
│   │   │   │
│   │   │   ├── deviceInfo.ts                  # デバイス情報取得
│   │   │   │                                  # - OS バージョン
│   │   │   │                                  # - デバイス ID
│   │   │   │                                  # - アプリバージョン
│   │   │   │
│   │   │   └── permissions.ts                 # パーミッション管理
│   │   │                                      # - カメラ・通知・ストレージ権限チェック
│   │   │
│   │   ├── monitoring/                        # 監視・ログ
│   │   │   └── appInsights.ts                 # Application Insights 統合
│   │   │                                      # - エラー追跡
│   │   │                                      # - カスタムイベント送信
│   │   │                                      # - パフォーマンスメトリクス
│   │   │
│   │   └── constants/                         # 定数
│   │       ├── api.constants.ts               # API 定数
│   │       │                                  # - エンドポイント定数
│   │       │                                  # - タイムアウト設定
│   │       │
│   │       ├── app.constants.ts               # アプリケーション定数
│   │       │                                  # - キャッシュサイズ上限
│   │       │                                  # - 自動キャッシュ件数
│   │       │
│   │       └── storage.constants.ts           # ストレージキー定数
│   │                                          # - AsyncStorage キー名
│   │
│   ├── hooks/                                 # グローバルカスタムフック
│   │   ├── useAppState.ts                     # アプリ状態フック
│   │   │                                      # - フォアグラウンド/バックグラウンド検知
│   │   │
│   │   ├── useNetworkStatus.ts                # ネットワーク状態フック
│   │   │                                      # - オンライン/オフライン検知
│   │   │
│   │   ├── useOrientation.ts                  # 画面向きフック
│   │   │                                      # - ポートレート/ランドスケープ
│   │   │
│   │   └── useTheme.ts                        # テーマフック
│   │                                          # - React Native Paper テーマ取得
│   │
│   ├── types/                                 # グローバル型定義
│   │   ├── api.types.ts                       # API レスポンス共通型
│   │   │                                      # - ApiResponse<T>
│   │   │                                      # - PageResponse<T>
│   │   │
│   │   ├── common.types.ts                    # 共通型定義
│   │   │                                      # - ID, Timestamp 型
│   │   │
│   │   └── env.d.ts                           # 環境変数型定義
│   │                                          # - process.env 型拡張
│   │
│   ├── theme/                                 # テーマ設定
│   │   ├── index.ts                           # React Native Paper テーマ
│   │   │                                      # - カラー定義
│   │   │                                      # - フォント設定
│   │   │
│   │   └── colors.ts                          # カラーパレット
│   │                                          # - プライマリカラー
│   │                                          # - セカンダリカラー
│   │
│   └── config/                                # 設定ファイル
│       ├── env.ts                             # 環境変数管理
│       │                                      # - API URL 取得
│       │                                      # - 環境別設定
│       │
│       └── codepush.ts                        # CodePush 設定
│                                              # - デプロイメントキー設定
│
├── __tests__/                                 # テストコード
│   ├── unit/                                  # 単体テスト
│   │   ├── components/                        # コンポーネントテスト
│   │   ├── hooks/                             # フックテスト
│   │   └── utils/                             # ユーティリティテスト
│   │
│   └── e2e/                                   # E2E テスト（Detox）
│       ├── login.e2e.ts                       # ログインフローテスト
│       ├── content.e2e.ts                     # コンテンツ閲覧テスト
│       └── stamp-rally.e2e.ts                 # 集章活動テスト
│
├── .env                                       # 環境変数（ローカル開発用・Git 除外）
├── .env.development                           # 開発環境変数
├── .env.staging                               # ステージング環境変数
├── .env.production                            # 本番環境変数
│
├── .eslintrc.js                               # ESLint 設定
├── .prettierrc                                # Prettier 設定
├── tsconfig.json                              # TypeScript 設定
├── jest.config.js                             # Jest 設定
├── babel.config.js                            # Babel 設定
├── metro.config.js                            # Metro Bundler 設定
│
├── package.json                               # 依存関係・スクリプト定義
├── yarn.lock                                  # Yarn ロックファイル
└── README.md                                  # プロジェクト説明
```

---

## 認証フロー設計

### フロー 1：WebView ログイン（初回ログイン）

```mermaid
sequenceDiagram
    autonumber
    actor User as ユーザー
    participant App as React Native App
    participant WebView as WebView
    participant MyPageAPI as マイページAPI<br/>(Spring Boot)
    participant DB as マイページDB

    User->>App: 1. アプリ起動
    App->>App: 2. AsyncStorage から JWT チェック（なし）

    App->>WebView: 3. WebView起動<br/>URL: https://mypage-api.com/mobile-login

    User->>WebView: 4. ログイン（ID/パスワード入力）
    WebView->>MyPageAPI: 5. POST /api/mobile-auth/login<br/>{username, password}

    MyPageAPI->>DB: 6. ユーザー認証

    alt 認証成功
        MyPageAPI->>MyPageAPI: 7. 一時認証Token生成（30秒有効）<br/>AES256暗号化（userId + timestamp）

        MyPageAPI-->>WebView: 8. 認証成功ページ表示<br/>（Thymeleaf テンプレート）<br/>※Token 埋め込み

        Note over WebView: JavaScript 実行（ページ内）
        WebView->>App: 9. postMessage<br/>{type: 'LOGIN_SUCCESS', authToken: 'encrypted_xyz'}

        App->>MyPageAPI: 10. POST /api/mobile-auth/verify<br/>{authToken: 'encrypted_xyz'}

        MyPageAPI->>MyPageAPI: 11. Token 複号���・検証<br/>有効期限チェック（30秒以内）

        MyPageAPI->>MyPageAPI: 12. JWT Token生成<br/>Access Token（24時間）<br/>Refresh Token（30日）

        MyPageAPI-->>App: 13. JWT Token返却<br/>{accessToken, refreshToken, expiresIn}

        App->>App: 14. Token保存（AsyncStorage）<br/>- access_token<br/>- refresh_token

        App->>App: 15. WebView閉じる
        App->>App: 16. ホーム画面表示

    else 認証失敗
        MyPageAPI-->>WebView: 8b. エラーメッセージ表示
    end
```

**実装ポイント**：

- ✅ **一時 Token**: AES256 暗号化（userId + timestamp）、30 秒有効
- ✅ **postMessage**: WebView → React Native 通信
- ✅ **JWT Token**: Access Token（24h） + Refresh Token（30 日）

---

### フロー 2：e-ninsho 認証ログイン

```mermaid
sequenceDiagram
    autonumber
    actor User as ユーザー
    participant App as React Native App
    participant ENinshoSDK as e-ninsho SDK<br/>(野村総合研究所)
    participant NFC as NFC Reader
    participant MyPageAPI as マイページAPI
    participant DB as マイページDB

    User->>App: 1. 「e-ninsho 認証でログイン」ボタン押下

    App->>ENinshoSDK: 2. Native Module 呼び出し<br/>ENinshoModule.authenticate()

    ENinshoSDK->>NFC: 3. NFC リーダー起動

    User->>NFC: 4. マイナンバーカードをかざす

    NFC->>ENinshoSDK: 5. カード情報読取

    ENinshoSDK->>ENinshoSDK: 6. 認証処理（SDK 内部）<br/>公的個人認証サービス連携

    alt 認証成功
        ENinshoSDK-->>App: 7. 認証結果返却<br/>{success: true, userId: 'xxx', certData: '...'}

        App->>MyPageAPI: 8. POST /api/auth/eninsho<br/>{userId, certData, deviceId}

        MyPageAPI->>MyPageAPI: 9. 認証データ検証

        MyPageAPI->>DB: 10. ユーザー存在チェック/作成

        MyPageAPI->>MyPageAPI: 11. JWT Token生成

        MyPageAPI-->>App: 12. JWT Token返却<br/>{accessToken, refreshToken}

        App->>App: 13. Token保存（AsyncStorage）

        App->>App: 14. ホーム画面表示

    else 認証失敗
        ENinshoSDK-->>App: 7b. エラー返却<br/>{success: false, errorCode: 'xxx'}
        App->>User: 8b. エラーメッセージ表示
    end
```

**実装ポイント**：

- ✅ **Native Module**: e-ninsho SDK は iOS/Android ネイティブ実装、RN から呼び出し
- ✅ **NFC**: SDK 内部で NFC 処理
- ✅ **公的認証**: マイナンバーカード利用

---

### フロー 3：生体認証（クイックログイン）

```mermaid
sequenceDiagram
    autonumber
    actor User as ユーザー
    participant App as React Native App
    participant Biometric as 生体認証<br/>(Face ID/Touch ID)
    participant Storage as AsyncStorage

    Note over App: ◆前提：過去にログイン済み<br/>JWT Token保存済み

    User->>App: 1. アプリ起動

    App->>Storage: 2. Token存在チェック

    alt Tokenあり
        App->>Biometric: 3. 生体認証プロンプト表示<br/>「Face IDでログイン」

        User->>Biometric: 4. 生体認証実行（顔認証/指紋）

        alt 生体認証成功
            Biometric-->>App: 5. 認証成功

            App->>Storage: 6. JWT Token取得

            App->>App: 7. Token有効期限チェック

            alt Token有効
                App->>App: 8. ホーム画面表示
            else Token期限切れ
                App->>App: 9. Refresh Token使用<br/>自動Token更新
                App->>App: 10. ホーム画面表示
            end

        else 生体認証失敗
            Biometric-->>App: 5b. 認証失敗
            App->>User: 6b. ログイン画面表示
        end

    else Tokenなし
        App->>User: 3b. ログイン画面表示
    end
```

**実装ポイント**：

- ✅ **生体認証**: react-native-biometrics 使用
- ✅ **自動ログイン**: Token 保存済みなら生体認証のみで再ログイン
- ✅ **Token 更新**: Refresh Token で自動更新

---

### フロー 4：SSO 単点登録（App → マイページ Web）

```mermaid
sequenceDiagram
    autonumber
    actor User as ユーザー
    participant App as React Native App
    participant MyPageAPI as マイページAPI
    participant DB as マイページDB
    participant Browser as 外部ブラウザ

    Note over App: ◆前提：App内でユーザーはログイン済み<br/>JWT Token保持

    User->>App: 1. 「家族の契約を見る」ボタン押下

    App->>MyPageAPI: 2. POST /api/sso/create-ticket<br/>Authorization: Bearer {JWT}<br/>{target: '/family/list'}

    MyPageAPI->>MyPageAPI: 3. JWT検証

    MyPageAPI->>MyPageAPI: 4. Ticket生成（UUID, 30秒有効）

    MyPageAPI->>DB: 5. INSERT INTO sso_tickets<br/>(ticket_id, user_id, target, expires_at)

    MyPageAPI-->>App: 6. Ticket返却<br/>{ticket: 't_xyz', url: 'https://mypage.example.com/sso/auth?ticket=t_xyz'}

    App->>Browser: 7. 外部ブラウザ起動<br/>Linking.openURL(ssoUrl)

    Browser->>MyPageAPI: 8. GET /sso/auth?ticket=t_xyz

    MyPageAPI->>DB: 9. SELECT * FROM sso_tickets<br/>WHERE ticket_id='t_xyz' AND expires_at > NOW()

    alt Ticketが有効
        MyPageAPI->>MyPageAPI: 10. Session/Cookie発行<br/>JSESSIONID生成

        MyPageAPI->>DB: 11. DELETE FROM sso_tickets<br/>WHERE ticket_id='t_xyz'<br/>（ワンタイム保証）

        MyPageAPI-->>Browser: 12. 302 Redirect<br/>→ https://mypage.example.com/family/list<br/>Set-Cookie: JSESSIONID=...

        Note over Browser: ◆マイページ Web に自動ログイン完了<br/>家族契約ページ表示

    else Ticket無効/期限切れ
        MyPageAPI-->>Browser: 12b. 302 Redirect<br/>→ https://mypage.example.com/login?error=expired
    end
```

**実装ポイント**：

- ✅ **Ticket**: UUID、30 秒有効、ワンタイム
- ✅ **JWT → Session**: App の JWT を Web の Session/Cookie に変換
- ✅ **外部ブラウザ**: react-native-inappbrowser-reborn 使用

---

### フロー 5：Token リフレッシュ（自動更新）

```mermaid
sequenceDiagram
    autonumber
    participant App as React Native App
    participant Axios as Axios Interceptor
    participant MyPageAPI as マイページAPI
    participant Storage as AsyncStorage

    App->>Axios: 1. API リクエスト<br/>GET /api/contents<br/>Authorization: Bearer {expired_token}

    Axios->>MyPageAPI: 2. API 呼び出し

    MyPageAPI->>MyPageAPI: 3. JWT検証（期限切れ検出）

    MyPageAPI-->>Axios: 4. 401 Unauthorized<br/>{error: 'Token expired'}

    Axios->>Axios: 5. インターセプターで検知

    Axios->>Storage: 6. Refresh Token取得

    Axios->>MyPageAPI: 7. POST /api/auth/refresh<br/>{refreshToken}

    MyPageAPI->>MyPageAPI: 8. Refresh Token検証

    alt Refresh Token有効
        MyPageAPI->>MyPageAPI: 9. 新しいAccess Token生成

        MyPageAPI-->>Axios: 10. 新しいToken返却<br/>{accessToken, refreshToken}

        Axios->>Storage: 11. 新しいToken保存

        Axios->>MyPageAPI: 12. 元のAPI リクエスト再実行<br/>Authorization: Bearer {new_token}

        MyPageAPI-->>Axios: 13. API レスポンス

        Axios-->>App: 14. レスポンス返却（透過的）

    else Refresh Token無効
        MyPageAPI-->>Axios: 10b. 401 Unauthorized

        Axios->>Storage: 11b. Token削除

        Axios->>App: 12b. ログイン画面へ遷移
    end
```

**実装ポイント**：

- ✅ **自動更新**: Axios Interceptor で透過的に処理
- ✅ **ユーザー体験**: ユーザーに気づかれずに Token 更新
- ✅ **Refresh Token**: 30 日有効

---

## API 統合設計

### API エンドポイント一覧

#### マイページ API（認証用）

| メソッド | エンドポイント            | 用途                           | 認証           |
| -------- | ------------------------- | ------------------------------ | -------------- |
| GET      | `/mobile-login`           | WebView ログインページ表示     | 不要           |
| POST     | `/api/mobile-auth/login`  | WebView ログイン処理           | 不要           |
| POST     | `/api/mobile-auth/verify` | 一時 Token 検証 → JWT 発行     | 不要           |
| POST     | `/api/auth/eninsho`       | e-ninsho 認証 → JWT 発行       | 不要           |
| POST     | `/api/auth/refresh`       | Token リフレッシュ             | Refresh Token  |
| POST     | `/api/sso/create-ticket`  | SSO Ticket 生成                | JWT            |
| GET      | `/sso/auth`               | SSO Ticket 検証 → Session 発行 | 不要（Ticket） |

#### CMS API（コンテンツ取得用）

| メソッド | エンドポイント                       | 用途                 | 認証 |
| -------- | ------------------------------------ | -------------------- | ---- |
| GET      | `/api/contents`                      | コンテンツ一覧取得   | JWT  |
| GET      | `/api/contents/:id`                  | コンテンツ詳細取得   | JWT  |
| GET      | `/api/contents/search`               | コンテンツ検索       | JWT  |
| GET      | `/api/stamps`                        | 集章スタンプ一覧取得 | JWT  |
| POST     | `/api/stamps/collect`                | スタンプ獲得         | JWT  |
| GET      | `/api/notifications`                 | プッシュ通知履歴取得 | JWT  |
| POST     | `/api/notifications/register-device` | デバイス Token 登録  | JWT  |

### Axios 設定（JWT 自動付与）

```typescript name=mobile/src/lib/api/axios.ts
import axios, {
  AxiosError,
  InternalAxiosRequestConfig,
  AxiosResponse,
} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import Config from 'react-native-config';

/**
 * マイページAPI用 Axios インスタンス
 */
export const myPageApiClient = axios.create({
  baseURL: Config.MYPAGE_API_BASE_URL, // 例: https://mypage-api.example.com
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * CMS API用 Axios インスタンス
 */
export const cmsApiClient = axios.create({
  baseURL: Config.CMS_API_BASE_URL, // 例: https://cms-api.example.com
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 共有リフレッシュ処理フラグ（複数リクエストで同時リフレッシュ防止）
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: any) => void;
}> = [];

/**
 * 失敗したリクエストを処理
 */
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });

  failedQueue = [];
};

/**
 * リクエストインターセプター（JWT Token 自動付与）
 */
const requestInterceptor = async (config: InternalAxiosRequestConfig) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
};

/**
 * レスポンスインターセプター（Token リフレッシュ処理）
 */
const responseInterceptor = (response: AxiosResponse) => {
  return response.data; // ApiResponse<T> の data を直接返す
};

const errorInterceptor = async (error: AxiosError) => {
  const originalRequest = error.config as InternalAxiosRequestConfig & {
    _retry?: boolean;
  };

  // 401 Unauthorized（Token 期限切れ）
  if (error.response?.status === 401 && !originalRequest._retry) {
    if (isRefreshing) {
      // 既にリフレッシュ中の場合、キューに追加
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return axios(originalRequest);
        })
        .catch(err => {
          return Promise.reject(err);
        });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await AsyncStorage.getItem('refresh_token');

      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      // Refresh Token で新しい Access Token 取得
      const response = await myPageApiClient.post('/api/auth/refresh', {
        refreshToken,
      });

      const { accessToken, refreshToken: newRefreshToken } = response.data;

      // 新しい Token 保存
      await AsyncStorage.setItem('access_token', accessToken);
      await AsyncStorage.setItem('refresh_token', newRefreshToken);

      // キュー内のリクエスト処理
      processQueue(null, accessToken);

      // 元のリクエスト再実行
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return axios(originalRequest);
    } catch (refreshError) {
      // Refresh Token も無効な場合、ログアウト
      processQueue(refreshError, null);
      await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
      Alert.alert('セッション期限切れ', '再度ログインしてください');
      // ログイン画面へ遷移（ナビゲーション処理は別途実装）
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }

  // その他のエラー
  const errorMessage = error.response?.data?.message || 'エラーが発生しました';
  Alert.alert('エラー', errorMessage);

  return Promise.reject(error);
};

// インターセプター適用
[myPageApiClient, cmsApiClient].forEach(client => {
  client.interceptors.request.use(requestInterceptor);
  client.interceptors.response.use(responseInterceptor, errorInterceptor);
});
```

---

### TanStack Query 設定

```typescript name=mobile/src/lib/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

/**
 * TanStack Query クライアント設定
 * - サーバー状態管理（API データキャッシュ）
 * - オフライン対応
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // ネットワークエラーの場合のみリトライ
        if (error?.message?.includes('Network Error')) {
          return failureCount < 2;
        }
        return false;
      },
      staleTime: 5 * 60 * 1000, // 5分間キャッシュ有効
      gcTime: 10 * 60 * 1000, // 10分間キャッシュ保持
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // ネットワーク再接続時自動再取得
      networkMode: 'offlineFirst', // オフライン時はキャッシュ返却
    },
    mutations: {
      retry: 0,
      networkMode: 'online', // オンライン時のみミューテーション実行
    },
  },
});

/**
 * ネットワーク状態監視
 * オフライン → オンライン時に自動再取得
 */
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    queryClient.refetchQueries();
  }
});
```

---

## 機能モジュール設計

### コンテンツ閲覧機能の実装例

#### コンテンツ一覧取得フック

```typescript name=mobile/src/features/contents/hooks/useContents.ts
import { useQuery } from '@tanstack/react-query';
import { contentService } from '../services/contentService';
import type {
  Content,
  ContentType,
  ContentStatus,
} from '../types/content.types';

interface UseContentsParams {
  page?: number;
  size?: number;
  contentType?: ContentType;
  status?: ContentStatus;
}

/**
 * コンテンツ一覧取得フック
 * - TanStack Query 使用（自動キャッシュ）
 * - CMS API 呼び出し
 *
 * @param params フィルターパラメータ
 */
export const useContents = (params: UseContentsParams = {}) => {
  const { page = 0, size = 20, contentType, status } = params;

  return useQuery({
    queryKey: ['contents', page, size, contentType, status],
    queryFn: () =>
      contentService.getContents({ page, size, contentType, status }),
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });
};
```

#### コンテンツ API サービス

```typescript name=mobile/src/features/contents/services/contentService.ts
import { cmsApiClient } from '@/lib/api/axios';
import type { Content, PageResponse } from '../types/content.types';

/**
 * コンテンツ API サービス
 * CMS API とのすべての通信を担当
 */
export const contentService = {
  /**
   * コンテンツ一覧取得
   */
  getContents: async (params: {
    page: number;
    size: number;
    contentType?: string;
    status?: string;
  }): Promise<PageResponse<Content>> => {
    const response = await cmsApiClient.get('/api/contents', { params });
    return response.data;
  },

  /**
   * コンテンツ詳細取得
   */
  getContentById: async (id: number): Promise<Content> => {
    const response = await cmsApiClient.get(`/api/contents/${id}`);
    return response.data;
  },

  /**
   * コンテンツ検索
   */
  searchContents: async (params: {
    keyword: string;
    page: number;
    size: number;
  }): Promise<PageResponse<Content>> => {
    const response = await cmsApiClient.get('/api/contents/search', { params });
    return response.data;
  },
};
```

#### コンテンツ一覧画面

```typescript name=mobile/src/features/contents/screens/ContentListScreen.tsx
import React, { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Searchbar, ActivityIndicator, Text } from 'react-native-paper';
import { useContents } from '../hooks/useContents';
import { ContentCard } from '../components/ContentCard';
import { ContentFilterBar } from '../components/ContentFilterBar';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorView } from '@/components/common/ErrorView';
import type { ContentType, ContentStatus } from '../types/content.types';

/**
 * コンテンツ一覧画面
 * - フィルター対応（タイプ・ステータス）
 * - 検索対応
 * - プルトゥリフレッシュ
 */
export const ContentListScreen: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [contentType, setContentType] = useState<ContentType | undefined>();
  const [status, setStatus] = useState<ContentStatus | undefined>();

  const { data, isLoading, isError, error, refetch } = useContents({
    page: 0,
    size: 20,
    contentType,
    status,
  });

  // ローディング表示
  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // エラー表示
  if (isError) {
    return <ErrorView message={error.message} onRetry={refetch} />;
  }

  // データなし
  if (!data || data.content.length === 0) {
    return <EmptyState message="コンテンツがありません" />;
  }

  return (
    <View style={styles.container}>
      {/* 検索バー */}
      <Searchbar
        placeholder="コンテンツを検索"
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      {/* フィルターバー */}
      <ContentFilterBar
        contentType={contentType}
        status={status}
        onContentTypeChange={setContentType}
        onStatusChange={setStatus}
      />

      {/* コンテンツリスト */}
      <FlatList
        data={data.content}
        keyExtractor={item => item.id.toString()}
        renderItem={({ item }) => <ContentCard content={item} />}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBar: {
    margin: 16,
  },
  listContent: {
    padding: 16,
  },
});
```

---

## 原生機能統合

### e-ninsho SDK 統合（Native Module）

#### iOS Native Module

```objective-c name=mobile/ios/JuxyiMobile/ENinshoModule.h
// ENinshoModule.h
#import <React/RCTBridgeModule.h>

@interface ENinshoModule : NSObject <RCTBridgeModule>
@end
```

```objective-c name=mobile/ios/JuxyiMobile/ENinshoModule.m
// ENinshoModule.m
#import "ENinshoModule.h"
// 野村 e-ninsho SDK import（実際のSDK名に置き換え）
#import <ENinshoSDK/ENinshoSDK.h>

@implementation ENinshoModule

RCT_EXPORT_MODULE();

/**
 * e-ninsho 認証実行
 */
RCT_EXPORT_METHOD(authenticate:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  // 野村 SDK 呼び出し
  [[ENinshoManager sharedManager] authenticateWithCompletion:^(ENinshoResult *result, NSError *error) {
    if (error) {
      reject(@"ENINSHO_ERROR", error.localizedDescription, error);
    } else {
      NSDictionary *response = @{
        @"success": @(result.isSuccess),
        @"userId": result.userId ?: @"",
        @"certData": result.certificateData ?: @"",
      };
      resolve(response);
    }
  }];
}

@end
```

#### Android Native Module

```java name=mobile/android/app/src/main/java/com/juxyi/mobile/ENinshoModule.java
package com.juxyi.mobile;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;

// 野村 e-ninsho SDK import（実際のSDK名に置き換え）
import jp.co.nri.eninsho.ENinshoManager;
import jp.co.nri.eninsho.ENinshoResult;

public class ENinshoModule extends ReactContextBaseJavaModule {

    public ENinshoModule(ReactApplicationContext reactContext) {
        super(reactContext);
    }

    @Override
    public String getName() {
        return "ENinshoModule";
    }

    /**
     * e-ninsho 認証実行
     */
    @ReactMethod
    public void authenticate(Promise promise) {
        try {
            ENinshoManager manager = ENinshoManager.getInstance(getReactApplicationContext());

            manager.authenticate(new ENinshoManager.Callback() {
                @Override
                public void onSuccess(ENinshoResult result) {
                    WritableMap response = Arguments.createMap();
                    response.putBoolean("success", true);
                    response.putString("userId", result.getUserId());
                    response.putString("certData", result.getCertificateData());
                    promise.resolve(response);
                }

                @Override
                public void onError(String errorCode, String errorMessage) {
                    promise.reject("ENINSHO_ERROR", errorMessage);
                }
            });
        } catch (Exception e) {
            promise.reject("ENINSHO_ERROR", e.getMessage());
        }
    }
}
```

#### React Native ラッパー

```typescript name=mobile/src/features/auth/services/eninshoService.ts
import { NativeModules, Platform } from 'react-native';

const { ENinshoModule } = NativeModules;

export interface ENinshoResult {
  success: boolean;
  userId: string;
  certData: string;
}

/**
 * e-ninsho SDK ラッパーサービス
 * Native Module 経由��野村 SDK 呼び出し
 */
export const eninshoService = {
  /**
   * e-ninsho 認証実行
   * - NFC リーダー起動
   * - マイナンバーカード読取
   * - 公的個人認証
   */
  authenticate: async (): Promise<ENinshoResult> => {
    if (!ENinshoModule) {
      throw new Error('ENinsho module is not available');
    }

    try {
      const result = await ENinshoModule.authenticate();
      return result;
    } catch (error) {
      throw new Error(`e-ninsho authentication failed: ${error}`);
    }
  },

  /**
   * e-ninsho 利用可能チェック
   */
  isAvailable: (): boolean => {
    return (
      (!!ENinshoModule && Platform.OS === 'ios') || Platform.OS === 'android'
    );
  },
};
```

---

## 状態管理設計

### 状態管理戦略

本アプリでは Web フロントエンド（CMS 管理画面）と同一思想の **2 層状態管理** を採用：

1. **サーバー状態**: TanStack Query（React Query）— API データキャッシュ・同期
2. **クライアント状態**: Zustand — 認証状態・UI 状態等

#### 1. サーバー状態管理（TanStack Query）

```typescript name=mobile/src/lib/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';
import NetInfo from '@react-native-community/netinfo';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        if (error?.message?.includes('Network Error')) {
          return failureCount < 2;
        }
        return false;
      },
      staleTime: 5 * 60 * 1000, // 5 分間キャッシュ有効
      gcTime: 10 * 60 * 1000, // 10 分間キャッシュ保持
      refetchOnWindowFocus: false,
      refetchOnReconnect: true, // ネットワーク再接続時自動再取得
      networkMode: 'offlineFirst', // オフライン時はキャッシュ返却
    },
    mutations: {
      retry: 0,
      networkMode: 'online',
    },
  },
});

// ネットワーク復帰時に自動再取得
NetInfo.addEventListener(state => {
  if (state.isConnected) {
    queryClient.refetchQueries();
  }
});
```

#### 2. クライアント状態管理（Zustand）

```typescript name=mobile/src/features/auth/stores/authStore.ts
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: number;
  username: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  setUser: (user: User, accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(set => ({
  user: null,
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,

  setUser: (user, accessToken, refreshToken) => {
    AsyncStorage.setItem('access_token', accessToken);
    AsyncStorage.setItem('refresh_token', refreshToken);
    AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, isAuthenticated: true, accessToken, refreshToken });
  },

  logout: () => {
    AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
    set({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
    });
  },
}));
```

#### 状態管理の使い分け

| 状態カテゴリ     | 管理方法       | 例                                      |
| ---------------- | -------------- | --------------------------------------- |
| **API データ**   | TanStack Query | コンテンツ一覧、通知一覧、集章データ    |
| **認証状態**     | Zustand        | user, isAuthenticated, accessToken      |
| **UI 状態**      | Zustand        | テーマ、表示設定                        |
| **フォーム状態** | useState       | 検索キーワード、フィルター選択          |
| **永続データ**   | AsyncStorage   | JWT Token、ユーザー設定                 |
| **機密データ**   | SecureStorage  | 生体認証トークン、e-ninsho 証明書データ |

---

## オフライン機能設計

### キャッシュ階層

```
┌─────────────────────────────────────────────────────────────┐
│                  キャッシュ階層構造                            │
│                                                               │
│  Layer 1: TanStack Query インメモリキャッシュ                │
│  ├─ API レスポンス（5 分間有効）                              │
│  ├─ 自動バックグラウンド更新                                  │
│  └─ オフライン時はキャッシュ返却（networkMode: offlineFirst） │
│                                                               │
│  Layer 2: AsyncStorage メタデータキャッシュ（< 6 MB）        │
│  ├─ コンテンツメタデータ（タイトル、説明、更新日時）         │
│  ├─ ユーザー設定                                              │
│  └─ 閲覧履歴（最近 10 件）                                   │
│                                                               │
│  Layer 3: react-native-fs ファイルキャッシュ（最大 500 MB）  │
│  ├─ PDF ドキュメント                                          │
│  ├─ ビデオファイル                                            │
│  ├─ 画像・サムネイル                                          │
│  └─ LRU アルゴリズムで自動削除                                │
└─────────────────────────────────────────────────────────────┘
```

### ファイルキャッシュ管理（LRU）

```typescript name=mobile/src/lib/cache/fileCache.ts
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_DIR = `${RNFS.CachesDirectoryPath}/content-cache`;
const MAX_CACHE_SIZE = 500 * 1024 * 1024; // 500 MB
const CACHE_INDEX_KEY = 'file_cache_index';

interface CacheEntry {
  key: string;
  path: string;
  size: number;
  lastAccessed: number;
  url: string;
}

/**
 * LRU ファイルキャッシュマネージャー
 * - 最大 500 MB
 * - 最近使用されたファイルを優先保持
 */
export const fileCache = {
  /**
   * キャッシュからファイル取得（ヒット時は lastAccessed 更新）
   */
  get: async (url: string): Promise<string | null> => {
    const index = await getIndex();
    const entry = index.find(e => e.url === url);
    if (!entry) return null;

    const exists = await RNFS.exists(entry.path);
    if (!exists) {
      await removeFromIndex(entry.key);
      return null;
    }

    // LRU: アクセス時間更新
    entry.lastAccessed = Date.now();
    await saveIndex(index);
    return entry.path;
  },

  /**
   * ファイルをキャッシュに保存
   */
  put: async (url: string, key: string): Promise<string> => {
    await ensureCacheDir();
    const filePath = `${CACHE_DIR}/${key}`;

    // ダウンロード
    const result = await RNFS.downloadFile({
      fromUrl: url,
      toFile: filePath,
    }).promise;

    // キャッシュサイズチェック & LRU 削除
    await evictIfNeeded(result.bytesWritten);

    // インデックス更新
    const index = await getIndex();
    index.push({
      key,
      path: filePath,
      size: result.bytesWritten,
      lastAccessed: Date.now(),
      url,
    });
    await saveIndex(index);

    return filePath;
  },

  /**
   * キャッシュ全クリア
   */
  clear: async (): Promise<void> => {
    await RNFS.unlink(CACHE_DIR).catch(() => {});
    await AsyncStorage.removeItem(CACHE_INDEX_KEY);
  },

  /**
   * 現在のキャッシュサイズ取得
   */
  getSize: async (): Promise<number> => {
    const index = await getIndex();
    return index.reduce((total, entry) => total + entry.size, 0);
  },
};

/** LRU: 容量超過時に古いエントリから削除 */
async function evictIfNeeded(newFileSize: number): Promise<void> {
  const index = await getIndex();
  let totalSize = index.reduce((sum, e) => sum + e.size, 0) + newFileSize;

  // 古い順にソート
  index.sort((a, b) => a.lastAccessed - b.lastAccessed);

  while (totalSize > MAX_CACHE_SIZE && index.length > 0) {
    const oldest = index.shift()!;
    await RNFS.unlink(oldest.path).catch(() => {});
    totalSize -= oldest.size;
  }

  await saveIndex(index);
}

async function getIndex(): Promise<CacheEntry[]> {
  const raw = await AsyncStorage.getItem(CACHE_INDEX_KEY);
  return raw ? JSON.parse(raw) : [];
}

async function saveIndex(index: CacheEntry[]): Promise<void> {
  await AsyncStorage.setItem(CACHE_INDEX_KEY, JSON.stringify(index));
}

async function removeFromIndex(key: string): Promise<void> {
  const index = await getIndex();
  await saveIndex(index.filter(e => e.key !== key));
}

async function ensureCacheDir(): Promise<void> {
  const exists = await RNFS.exists(CACHE_DIR);
  if (!exists) await RNFS.mkdir(CACHE_DIR);
}
```

### オフライン時 UX

| シナリオ           | 挙動                                    |
| ------------------ | --------------------------------------- |
| コンテンツ一覧表示 | TanStack Query キャッシュから返却       |
| コンテンツ詳細表示 | キャッシュ済みメタデータ + ファイル表示 |
| PDF 閲覧           | ローカルキャッシュファイルがあれば表示  |
| ビデオ再生         | ローカルキャッシュファイルがあれば再生  |
| 新規データ取得     | エラー表示 +「オフラインです」バナー    |
| ネットワーク復帰   | 自動再取得（refetchOnReconnect: true）  |

---

## プッシュ通知設計

### アーキテクチャ概要

```
┌──────────────────────────────────────────────────────────────────────┐
│                     プッシュ通知フロー                                │
│                                                                      │
│  ┌───────────┐     ┌──────────────┐     ┌─────────────────────────┐ │
│  │ CMS Web   │────►│ CMS API      │────►│ Azure Notification Hubs │ │
│  │ 管理画面  │     │ (Spring Boot)│     │                         │ │
│  └───────────┘     └──────────────┘     └────────┬────────────────┘ │
│                                                   │                  │
│                                      ┌────────────┼────────────┐    │
│                                      │            │            │    │
│                                      ▼            ▼            ▼    │
│                                   ┌──────┐  ┌──────┐  ┌──────────┐ │
│                                   │ APNS │  │ FCM  │  │ 共通     │ │
│                                   │(iOS) │  │(Android)│ │ ペイロード│ │
│                                   └──┬───┘  └──┬───┘  └──────────┘ │
│                                      │         │                    │
│                                      ▼         ▼                    │
│                                 ┌─────────────────────┐             │
│                                 │  React Native App   │             │
│                                 │  (Firebase Messaging)│             │
│                                 └─────────────────────┘             │
└──────────────────────────────────────────────────────────────────────┘
```

### デバイス登録フロー

```mermaid
sequenceDiagram
    autonumber
    participant App as React Native App
    participant FCM as Firebase Cloud Messaging
    participant API as CMS API (Spring Boot)
    participant ANH as Azure Notification Hubs

    App->>FCM: 1. Firebase Messaging 初期化
    FCM-->>App: 2. デバイス Token 返却

    App->>API: 3. POST /api/notifications/register-device
    Note right of App: {deviceToken, platform, userId}

    API->>ANH: 4. デバイス登録
    Note right of API: Installation API 使用

    ANH-->>API: 5. 登録完了
    API-->>App: 6. 登録成功レスポンス
```

### 通知受信実装

```typescript name=mobile/src/features/notifications/hooks/usePushNotification.ts
import { useEffect, useCallback } from 'react';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { Platform, PermissionsAndroid } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { cmsApiClient } from '@/lib/api/axios';

/**
 * プッシュ通知フック
 * - Firebase Messaging 初期化
 * - デバイス Token 登録
 * - 通知受信処理
 */
export const usePushNotification = () => {
  const navigation = useNavigation();

  /** デバイス Token 取得 & サーバー登録 */
  const registerDevice = useCallback(async () => {
    // iOS: 通知パーミッション要求
    if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      if (
        authStatus !== messaging.AuthorizationStatus.AUTHORIZED &&
        authStatus !== messaging.AuthorizationStatus.PROVISIONAL
      ) {
        return;
      }
    }

    // Android 13+: POST_NOTIFICATIONS パーミッション
    if (Platform.OS === 'android' && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
    }

    // デバイス Token 取得
    const token = await messaging().getToken();

    // サーバーに登録
    await cmsApiClient.post('/api/notifications/register-device', {
      deviceToken: token,
      platform: Platform.OS,
    });
  }, []);

  useEffect(() => {
    registerDevice();

    // Token リフレッシュ時の再登録
    const unsubRefresh = messaging().onTokenRefresh(async newToken => {
      await cmsApiClient.post('/api/notifications/register-device', {
        deviceToken: newToken,
        platform: Platform.OS,
      });
    });

    // フォアグラウンド通知受信
    const unsubMessage = messaging().onMessage(
      async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
        // アプリ内通知バナー表示
        showInAppNotification(remoteMessage);
      },
    );

    // バックグラウンド通知タップ時
    const unsubOpen = messaging().onNotificationOpenedApp(remoteMessage => {
      handleNotificationNavigation(remoteMessage, navigation);
    });

    // アプリ終了状態からの起動時
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          handleNotificationNavigation(remoteMessage, navigation);
        }
      });

    return () => {
      unsubRefresh();
      unsubMessage();
      unsubOpen();
    };
  }, [registerDevice, navigation]);
};

/** 通知タップ時のナビゲーション */
function handleNotificationNavigation(
  remoteMessage: FirebaseMessagingTypes.RemoteMessage,
  navigation: any,
) {
  const data = remoteMessage.data;
  if (data?.contentId) {
    navigation.navigate('ContentDetail', { id: data.contentId });
  } else if (data?.type === 'announcement') {
    navigation.navigate('NotificationList');
  }
}
```

### バックエンド通知送信

```java name=backend/src/main/java/com/juxyi/cms/service/NotificationService.java
@Service
@RequiredArgsConstructor
public class NotificationService {
    private final NotificationHubClient hubClient;
    private final TelemetryClient telemetryClient;

    /**
     * 全ユーザーへプッシュ通知送信
     */
    public void sendToAll(String title, String message) {
        // 共通ペイロード
        String payload = String.format(
            "{\"aps\":{\"alert\":{\"title\":\"%s\",\"body\":\"%s\"},\"sound\":\"default\"}," +
            "\"data\":{\"title\":\"%s\",\"body\":\"%s\"}}",
            title, message, title, message
        );

        // iOS (APNS)
        hubClient.sendNotificationAsync(
            new AppleNotification(payload)
        );

        // Android (FCM)
        String fcmPayload = String.format(
            "{\"notification\":{\"title\":\"%s\",\"body\":\"%s\"}," +
            "\"data\":{\"title\":\"%s\",\"body\":\"%s\"}}",
            title, message, title, message
        );
        hubClient.sendNotificationAsync(
            new FcmV1Notification(fcmPayload)
        );

        telemetryClient.trackEvent("PushNotificationSent",
            Map.of("title", title, "target", "all"));
    }

    /**
     * プラットフォーム指定送信
     */
    public void sendToPlatform(String title, String message, String platform) {
        String tagExpression = String.format("platform:%s", platform);
        // タグベース送信
        hubClient.sendNotificationAsync(
            createNotification(title, message, platform), tagExpression
        );
    }
}
```

---

## WebView 統合設計

### 通信プロトコル

```
┌───────────────────────────────────────────────────────────────────┐
│              RN ⇔ WebView 双方向通信                              │
│                                                                   │
│  React Native App                    WebView (マイページ Web)    │
│  ┌─────────────────────┐            ┌─────────────────────┐      │
│  │                     │  postMessage│                     │      │
│  │  useWebViewBridge() │◄───────────┤  window.ReactNative │      │
│  │                     │            │  .postMessage()     │      │
│  │  webViewRef         │───────────►│                     │      │
│  │  .injectJavaScript()│  JS Inject │  window             │      │
│  │                     │            │  .handleFromRN()    │      │
│  └─────────────────────┘            └─────────────────────┘      │
└───────────────────────────────────────────────────────────────────┘
```

### メッセージ型定義

```typescript name=mobile/src/features/webview/types/webview.types.ts
/** WebView → RN メッセージ */
export type WebViewMessage =
  | { type: 'LOGIN_SUCCESS'; authToken: string }
  | { type: 'NAVIGATION'; url: string }
  | { type: 'OPEN_EXTERNAL'; url: string }
  | { type: 'CLOSE_WEBVIEW' }
  | { type: 'ERROR'; message: string };

/** RN → WebView メッセージ */
export type RNMessage =
  | { type: 'SET_TOKEN'; token: string }
  | { type: 'SET_THEME'; theme: 'light' | 'dark' }
  | { type: 'NAVIGATE'; path: string };
```

### WebView ブリッジフック

```typescript name=mobile/src/features/webview/hooks/useWebViewBridge.ts
import { useRef, useCallback } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Linking } from 'react-native';
import type { WebViewMessage, RNMessage } from '../types/webview.types';

/**
 * WebView ⇔ React Native 双方向通信フック
 */
export const useWebViewBridge = (onMessage?: (msg: WebViewMessage) => void) => {
  const webViewRef = useRef<WebView>(null);

  /** WebView → RN メッセージ受信 */
  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg: WebViewMessage = JSON.parse(event.nativeEvent.data);

        switch (msg.type) {
          case 'OPEN_EXTERNAL':
            Linking.openURL(msg.url);
            break;
          case 'CLOSE_WEBVIEW':
            // ナビゲーションで戻る
            break;
          default:
            onMessage?.(msg);
        }
      } catch (error) {
        console.error('WebView message parse error:', error);
      }
    },
    [onMessage],
  );

  /** RN → WebView メッセージ送信 */
  const sendMessage = useCallback((msg: RNMessage) => {
    const script = `
      window.handleFromRN && window.handleFromRN(${JSON.stringify(msg)});
      true;
    `;
    webViewRef.current?.injectJavaScript(script);
  }, []);

  return { webViewRef, handleMessage, sendMessage };
};
```

### WebView コンテナコンポーネント

```typescript name=mobile/src/components/media/WebViewContainer.tsx
import React from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useWebViewBridge } from '@/features/webview/hooks/useWebViewBridge';

interface WebViewContainerProps {
  url: string;
  jwtToken?: string;
  onLoginSuccess?: (authToken: string) => void;
}

/**
 * カスタム WebView コンテナ
 * - JWT Token 自動注入
 * - postMessage 双方向通信
 * - ローディング表示
 */
export const WebViewContainer: React.FC<WebViewContainerProps> = ({
  url,
  jwtToken,
  onLoginSuccess,
}) => {
  const { webViewRef, handleMessage } = useWebViewBridge(msg => {
    if (msg.type === 'LOGIN_SUCCESS' && onLoginSuccess) {
      onLoginSuccess(msg.authToken);
    }
  });

  // JWT Token を Cookie / ヘッダーとして注入する JavaScript
  const injectedJS = jwtToken
    ? `
      window.JWT_TOKEN = '${jwtToken}';
      true;
    `
    : '';

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{ uri: url }}
        onMessage={handleMessage}
        injectedJavaScript={injectedJS}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" />
          </View>
        )}
        // セキュリティ設定
        allowsBackForwardNavigationGestures={true}
        mixedContentMode="compatibility"
        originWhitelist={['https://*']}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
```

---

## セキュリティ設計

### セキュリティ対策一覧

| 脅威                         | 対策                                                 |
| ---------------------------- | ---------------------------------------------------- |
| **Token 漏洩**               | Keychain (iOS) / Keystore (Android) にセキュア保存   |
| **通信傍受**                 | HTTPS 必須 + Certificate Pinning（オプション）       |
| **リバースエンジニアリング** | ProGuard (Android) / Bitcode (iOS) による難読化      |
| **不正アクセス**             | JWT 有効期限（24h）+ Refresh Token（30 日）          |
| **Root/Jailbreak**           | 検知時に認証機能制限                                 |
| **WebView XSS**              | originWhitelist 制限 + injectedJavaScript サニタイズ |
| **デバッグ接続**             | 本番ビルドでデバッガー接続拒否                       |

### セキュアストレージ

```typescript name=mobile/src/lib/storage/secureStorage.ts
import * as Keychain from 'react-native-keychain';

/**
 * セキュアストレージ
 * - iOS: Keychain Services
 * - Android: Keystore System
 */
export const secureStorage = {
  /** 機密データ保存 */
  set: async (key: string, value: string): Promise<void> => {
    await Keychain.setGenericPassword(key, value, { service: key });
  },

  /** 機密データ取得 */
  get: async (key: string): Promise<string | null> => {
    const credentials = await Keychain.getGenericPassword({ service: key });
    return credentials ? credentials.password : null;
  },

  /** 機密データ削除 */
  remove: async (key: string): Promise<void> => {
    await Keychain.resetGenericPassword({ service: key });
  },
};
```

---

## パフォーマンス最適化

### Hermes JavaScript エンジン

| 指標           | Hermes OFF | Hermes ON | 改善率 |
| -------------- | ---------- | --------- | ------ |
| アプリ起動時間 | ~3.5 秒    | ~1.5 秒   | 57%    |
| メモリ使用量   | ~180 MB    | ~120 MB   | 33%    |
| バンドルサイズ | ~8 MB      | ~5 MB     | 38%    |

### 画像最適化（FastImage）

```typescript name=mobile/src/components/media/OptimizedImage.tsx
import React from 'react';
import FastImage, { Priority } from 'react-native-fast-image';
import { StyleSheet } from 'react-native';

interface OptimizedImageProps {
  uri: string;
  width: number;
  height: number;
  priority?: Priority;
}

/**
 * 高性能画像コンポーネント
 * - ディスクキャッシュ自動管理
 * - 優先度制御
 * - プログレッシブ読み込み
 */
export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  uri,
  width,
  height,
  priority = FastImage.priority.normal,
}) => (
  <FastImage
    style={{ width, height, borderRadius: 8 }}
    source={{ uri, priority, cache: FastImage.cacheControl.immutable }}
    resizeMode={FastImage.resizeMode.cover}
  />
);
```

### FlatList 最適化

```typescript
// コンテンツ一覧での最適化設定
<FlatList
  data={contents}
  keyExtractor={item => item.id.toString()}
  renderItem={renderContentCard}
  // パフォーマンス最適化
  initialNumToRender={10} // 初回レンダリング数
  maxToRenderPerBatch={5} // バッチレンダリング数
  windowSize={5} // ウィンドウサイズ（画面数）
  removeClippedSubviews={true} // 画面外要素のアンマウント
  getItemLayout={(_, index) => ({
    // レイアウト事前計算
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

### パフォーマンス目標

| メトリック              | 目標値   | 測定方法                     |
| ----------------------- | -------- | ---------------------------- |
| コールドスタート        | < 2 秒   | Application Insights         |
| 画面遷移                | < 300 ms | React Navigation metrics     |
| API レスポンス表示      | < 1 秒   | TanStack Query devtools      |
| FlatList スクロール FPS | ≥ 55 FPS | Flipper Performance Monitor  |
| メモリ使用量            | < 200 MB | Xcode Instruments / Profiler |

---

## デプロイメント設計

### 環境構成

| 環境            | 用途         | API 接続先     | 配信方法                |
| --------------- | ------------ | -------------- | ----------------------- |
| **Development** | 開発・テスト | dev API        | ローカルビルド          |
| **Staging**     | 本番前検証   | staging API    | TestFlight / 内部テスト |
| **Production**  | 本番環境     | production API | App Store / Google Play |

### iOS CI/CD パイプライン

```yaml
# .azure/pipelines/mobile-ios-pipeline.yml
trigger:
  branches:
    include:
      - main
      - release/*

pool:
  vmImage: 'macos-latest'

stages:
  - stage: Build
    jobs:
      - job: BuildiOS
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '18.x'

          - script: |
              cd mobile
              yarn install --frozen-lockfile
            displayName: 'Install dependencies'

          - script: |
              cd mobile/ios
              pod install
            displayName: 'Install CocoaPods'

          - task: Xcode@5
            inputs:
              actions: 'build archive'
              sdk: 'iphoneos'
              scheme: 'JuxyiMobile'
              configuration: 'Release'
              exportPath: '$(Build.ArtifactStagingDirectory)/ios'
              signingOption: 'auto'
              packageApp: true

          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: '$(Build.ArtifactStagingDirectory)/ios'
              artifactName: 'ios-build'

  - stage: Deploy
    dependsOn: Build
    condition: and(succeeded(), startsWith(variables['Build.SourceBranch'], 'refs/heads/release/'))
    jobs:
      - deployment: DeployTestFlight
        environment: 'ios-staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AppStoreRelease@1
                  inputs:
                    serviceEndpoint: 'apple-store-connect'
                    appIdentifier: 'com.juxyi.mobile'
                    releaseTrack: 'TestFlight'
```

### Android CI/CD パイプライン

```yaml
# .azure/pipelines/mobile-android-pipeline.yml
trigger:
  branches:
    include:
      - main
      - release/*

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Build
    jobs:
      - job: BuildAndroid
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '18.x'

          - task: JavaToolInstaller@0
            inputs:
              versionSpec: '17'
              jdkArchitectureOption: 'x64'
              jdkSourceOption: 'PreInstalled'

          - script: |
              cd mobile
              yarn install --frozen-lockfile
            displayName: 'Install dependencies'

          - script: |
              cd mobile/android
              ./gradlew assembleRelease
            displayName: 'Build Android APK'

          - task: AndroidSigning@3
            inputs:
              apkFiles: 'mobile/android/app/build/outputs/apk/release/*.apk'
              apksignerKeystoreFile: 'release-keystore.jks'
              apksignerKeystorePassword: '$(KEYSTORE_PASSWORD)'
              apksignerKeystoreAlias: '$(KEY_ALIAS)'
              apksignerKeyPassword: '$(KEY_PASSWORD)'

          - task: PublishBuildArtifacts@1
            inputs:
              pathToPublish: 'mobile/android/app/build/outputs/apk/release'
              artifactName: 'android-build'

  - stage: Deploy
    dependsOn: Build
    condition: and(succeeded(), startsWith(variables['Build.SourceBranch'], 'refs/heads/release/'))
    jobs:
      - deployment: DeployGooglePlay
        environment: 'android-staging'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: GooglePlayRelease@4
                  inputs:
                    serviceConnection: 'google-play-console'
                    applicationId: 'com.juxyi.mobile'
                    action: 'SingleBundle'
                    track: 'internal'
```

### CodePush OTA 更新

```typescript name=mobile/src/config/codepush.ts
import CodePush, { CodePushOptions } from 'react-native-code-push';

/**
 * CodePush 設定
 * - JavaScript バンドルの OTA 更新
 * - ネイティブコード変更不要な修正を即時配信
 */
export const codePushOptions: CodePushOptions = {
  checkFrequency: CodePush.CheckFrequency.ON_APP_RESUME,
  installMode: CodePush.InstallMode.ON_NEXT_RESTART,
  mandatoryInstallMode: CodePush.InstallMode.IMMEDIATE,
};

/**
 * CodePush デプロイメントキー
 */
export const CODEPUSH_KEYS = {
  ios: {
    staging: 'ios-staging-deployment-key',
    production: 'ios-production-deployment-key',
  },
  android: {
    staging: 'android-staging-deployment-key',
    production: 'android-production-deployment-key',
  },
};
```

**CodePush 適用範囲**:

| 変更種別             | CodePush 対応 | ストア再申請 |
| -------------------- | ------------- | ------------ |
| 画面 UI 修正         | ✅ 可能       | ❌ 不要      |
| ロジック修正         | ✅ 可能       | ❌ 不要      |
| ライブラリ更新（JS） | ✅ 可能       | ❌ 不要      |
| Native Module 追加   | ❌ 不可       | ✅ 必要      |
| SDK 更新             | ❌ 不可       | ✅ 必要      |
| アプリアイコン変更   | ❌ 不可       | ✅ 必要      |

---

## まとめ

本モバイルアーキテクチャは以下の特徴を持ちます：

### ✅ 主要な設計判断

| 項目               | 選択                           | 理由                                      |
| ------------------ | ------------------------------ | ----------------------------------------- |
| **フレームワーク** | React Native 0.73+ (Pure RN)   | クロスプラットフォーム、既存 Web 技術活用 |
| **JS エンジン**    | Hermes                         | 高速起動、低メモリ使用量                  |
| **状態管理**       | TanStack Query + Zustand       | Web と統一パターン                        |
| **認証方式**       | WebView + e-ninsho + 生体認証  | 多要素・多チャネル認証                    |
| **キャッシュ**     | 3 層キャッシュ（メモリ/AS/FS） | オフライン対応                            |
| **プッシュ通知**   | FCM + Azure Notification Hubs  | マルチプラットフォーム配信                |
| **OTA 更新**       | CodePush                       | ストア審査不要の即時配信                  |
| **CI/CD**          | Azure DevOps Pipelines         | バックエンド・Web と統一                  |

### 🎯 非機能要件達成

| 要件                 | 達成方法                                       |
| -------------------- | ---------------------------------------------- |
| **10,000+ ユーザー** | 効率的キャッシュ、CDN 経由配信                 |
| **高速起動**         | Hermes エンジン（< 2 秒コールドスタート）      |
| **オフライン対応**   | 3 層キャッシュ + TanStack Query offlineFirst   |
| **セキュリティ**     | Keychain/Keystore + JWT + Root/Jailbreak 検知  |
| **保守性**           | Feature-based Architecture、Web と共通パターン |
| **即時配信**         | CodePush OTA（ストア審査なしで JS 更新）       |

### 📚 関連ドキュメント

- [バックエンドアーキテクチャ設計書](./BACKEND_ARCHITECTURE.md)
- [フロントエンドアーキテクチャ設計書](./FRONTEND_ARCHITECTURE.md)
- [統合システムアーキテクチャ設計書](./SYSTEM_ARCHITECTURE.md)
- [API 設計書](./API.md)

---

**最終更新日**: 2025-02-10
**ドキュメントバージョン**: 1.1.0
**作成者**: JUXYI 開発チーム
