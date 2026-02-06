# 第 13-17 章：付録

**前のファイル**: [11-cicd-deployment.md](./11-cicd-deployment.md)  
**最初に戻る**: [00-SYSTEM_ARCHITECTURE_INDEX.md](./00-SYSTEM_ARCHITECTURE_INDEX.md) ←

---

## 目次

- [第 13 章：トラブルシューティング](#第13章トラブルシューティング)
- [第 14 章：パフォーマンスチューニング指南](#第14章パフォーマンスチューニング指南)
- [第 15 章：セキュリティチェックリスト](#第15章セキュリティチェックリスト)
- [第 16 章：用語集](#第16章用語集)
- [第 17 章：API 仕様一覧](#第17章api-仕様一覧)

---

## 第 13 章：トラブルシューティング

### よくある問題と解決方法

#### 1. JWT Token 期限切れエラー

**症状**:

```
401 Unauthorized
{
  "message": "Tokenの有効期限が切れました",
  "errorCode": "TOKEN_EXPIRED"
}
```

**解決方法**:

- Refresh Token を使用して新しい Access Token を取得
- フロントエンドの Axios Interceptor が自動的に処理
- 失敗した場合はログイン画面へリダイレクト

#### 2. e-ninsho 認証失敗

**症状**:

```
Error: CARD_READ_ERROR
```

**チェックポイント**:

- [ ] NFC 機能が有効か確認
- [ ] マイナンバーカードを正しくかざしているか
- [ ] カードの暗証番号が正しいか
- [ ] e-ninsho SDK が正しく統合されているか

#### 3. ビデオアップロード失敗

**症状**:

```
Error: Request failed with status code 413
```

**解決方法**:

- ファイルサイズ上限確認（100MB）
- SAS Token の有効期限確認（1 時間）
- Azure Blob Storage の容量確認

#### 4. プッシュ通知が届かない

**チェックポイント**:

- [ ] デバイス Token が登録されているか
- [ ] 通知権限が許可されているか
- [ ] APNS/FCM の設定が正しいか
- [ ] Azure Notification Hubs の設定確認

#### 5. アプリ起動時のクラッシュ

**デバッグ手順**:

```bash
# iOS
npx react-native log-ios

# Android
npx react-native log-android

# クラッシュレポート確認
# Application Insights → Failures → Exceptions
```

---

## 第 14 章：パフォーマンスチューニング指南

### バックエンド最適化

#### 1. データベースクエリ最適化

```sql
-- ❌ 悪い例（N+1問題）
SELECT * FROM contents;
-- 各contentに対してcreated_byを個別取得

-- ✅ 良い例（JOIN使用）
SELECT c.*, u.username
FROM contents c
LEFT JOIN users u ON c.created_by = u.id
WHERE c.status = 'PUBLISHED';
```

#### 2. Redis キャッシュ活用

```java
@Cacheable(value = "contents", key = "#page + '_' + #status")
public Page<ContentDto> getContents(int page, String status) {
    // DB クエリ
}

@CacheEvict(value = "contents", allEntries = true)
public void createContent(ContentDto dto) {
    // コンテンツ作成
}
```

#### 3. 非同期処理

```java
@Async
public CompletableFuture<Void> sendPushNotifications(List<UserDevice> devices) {
    // 通知送信を非同期実行
    return CompletableFuture.completedFuture(null);
}
```

### フロントエンド最適化

#### 1. React コンポーネント最適化

```typescript
// React.memo でメモ化
export const ContentCard = React.memo(({ content }: Props) => {
  return <Card>{content.title}</Card>;
});

// useMemo で計算結果をキャッシュ
const filteredContents = useMemo(() => {
  return contents.filter(c => c.status === 'PUBLISHED');
}, [contents]);
```

#### 2. 画像最適化

```typescript
// React Native - FastImage 使用
import FastImage from 'react-native-fast-image';

<FastImage
  source={{ uri: content.thumbnailUrl, priority: FastImage.priority.normal }}
  resizeMode={FastImage.resizeMode.cover}
  style={styles.thumbnail}
/>;
```

#### 3. リスト仮想化

```typescript
// React Native - FlatList
<FlatList
  data={contents}
  renderItem={({ item }) => <ContentCard content={item} />}
  keyExtractor={item => item.id.toString()}
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  windowSize={5}
/>
```

### インフラ最適化

#### 1. Auto Scaling 設定

```json
{
  "rules": [
    {
      "metricTrigger": {
        "metricName": "CpuPercentage",
        "operator": "GreaterThan",
        "threshold": 70,
        "timeWindow": "PT5M"
      },
      "scaleAction": {
        "direction": "Increase",
        "value": 1,
        "cooldown": "PT5M"
      }
    }
  ],
  "profiles": [
    {
      "name": "Auto scale condition",
      "capacity": {
        "minimum": 1,
        "maximum": 3,
        "default": 1
      }
    }
  ]
}
```

#### 2. CDN キャッシュ最適化

```
Cache-Control: public, max-age=604800, immutable
```

---

## 第 15 章：セキュリティチェックリスト

### 開発時チェックリスト

#### 認証・認可

- [ ] JWT 秘密鍵は環境変数で管理（Git 除外）
- [ ] パスワードは BCrypt でハッシュ化
- [ ] Token 有効期限を設定（Access: 24h, Refresh: 30d）
- [ ] HTTPS 通信を強制
- [ ] 管理者権限チェックを実装

#### データ保護

- [ ] SQL インジェクション対策（Prepared Statement）
- [ ] XSS 対策（入力サニタイズ、CSP Header）
- [ ] CSRF 対策（JWT でステートレス認証）
- [ ] 機密情報はログに出力しない

#### API セキュリティ

- [ ] Rate Limiting 実装（ログイン: 5 回/15 分）
- [ ] CORS 設定は必要最小限
- [ ] セキュリティヘッダー設定（HSTS, X-Frame-Options）
- [ ] エラーメッセージに機密情報を含めない

### デプロイ前チェックリスト

#### 設定

- [ ] 本番環境の JWT 秘密鍵を変更済み
- [ ] Azure Key Vault に秘密情報を保存
- [ ] データベース接続は Private Link 経由
- [ ] ファイアウォールルール設定完了

#### 監視

- [ ] Application Insights 統合完了
- [ ] アラート設定完了（エラー率、応答時間）
- [ ] ログ保持期間設定（90 日）

#### テスト

- [ ] 脆弱性スキャン実施（npm audit, Dependabot）
- [ ] ペネトレーションテスト実施
- [ ] 負荷テスト実施

---

## 第 16 章：用語集

| 用語          | 説明                                                      |
| ------------- | --------------------------------------------------------- |
| **JWT**       | JSON Web Token。認証情報を含むトークン形式                |
| **SAS Token** | Shared Access Signature。Azure Blob への一時アクセス権限  |
| **SSO**       | Single Sign-On。一度のログインで複数システムにアクセス    |
| **e-ninsho**  | 公的個人認証サービス。マイナンバーカードによる認証        |
| **APNS**      | Apple Push Notification Service。iOS プッシュ通知         |
| **FCM**       | Firebase Cloud Messaging。Android プッシュ通知            |
| **OTA**       | Over-The-Air。アプリストアを経由しないアップデート        |
| **DTU**       | Database Transaction Unit。Azure SQL のパフォーマンス単位 |
| **CDN**       | Content Delivery Network。コンテンツ配信ネットワーク      |
| **WAF**       | Web Application Firewall。Web アプリケーション保護        |

---

## 第 17 章：API 仕様一覧

### 認証 API

| エンドポイント            | メソッド | 説明                 | 認証          |
| ------------------------- | -------- | -------------------- | ------------- |
| `/api/mobile-auth/login`  | POST     | モバイルログイン     | 不要          |
| `/api/mobile-auth/verify` | POST     | Token 検証・JWT 発行 | 不要          |
| `/api/auth/eninsho`       | POST     | e-ninsho 認証        | 不要          |
| `/api/auth/refresh`       | POST     | Token 更新           | Refresh Token |
| `/api/admin/login`        | POST     | 管理者ログイン       | 不要          |

### コンテンツ API

| エンドポイント       | メソッド | 説明     | 権限  |
| -------------------- | -------- | -------- | ----- |
| `/api/contents`      | GET      | 一覧取得 | USER  |
| `/api/contents/{id}` | GET      | 詳細取得 | USER  |
| `/api/contents`      | POST     | 作成     | ADMIN |
| `/api/contents/{id}` | PUT      | 更新     | ADMIN |
| `/api/contents/{id}` | DELETE   | 削除     | ADMIN |

### ファイル API

| エンドポイント         | メソッド | 説明           | 権限  |
| ---------------------- | -------- | -------------- | ----- |
| `/api/files/sas-token` | POST     | SAS Token 生成 | ADMIN |
| `/api/files/metadata`  | POST     | メタデータ保存 | ADMIN |
| `/api/files/{id}`      | DELETE   | 削除           | ADMIN |

### プッシュ通知 API

| エンドポイント                       | メソッド | 説明         | 権限  |
| ------------------------------------ | -------- | ------------ | ----- |
| `/api/notifications/send`            | POST     | 通知送信     | ADMIN |
| `/api/notifications`                 | GET      | 履歴取得     | USER  |
| `/api/notifications/register-device` | POST     | デバイス登録 | USER  |

### 集章活動 API

| エンドポイント         | メソッド | 説明         | 権限 |
| ---------------------- | -------- | ------------ | ---- |
| `/api/stamps`          | GET      | スタンプ一覧 | USER |
| `/api/stamps/collect`  | POST     | スタンプ獲得 | USER |
| `/api/stamps/progress` | GET      | 達成率取得   | USER |

---

## 🎉 ドキュメント完了

本システムアーキテクチャ設計書は以上です。

### 次のステップ

1. **開発開始**: 各チームメンバーが担当章を確認
2. **環境構築**: Azure リソースのプロビジョニング
3. **実装**: Feature-based で機能実装
4. **テスト**: 単体テスト・統合テスト・E2E テスト
5. **デプロイ**: Azure DevOps Pipeline 実行

### ドキュメント更新

本ドキュメントは **Living Document** として、プロジェクト進行に応じて更新してください。

**変更履歴**:

- v1.0.0 (2025-02-06): 初版作成

---

**最初に戻る**: [00-SYSTEM_ARCHITECTURE_INDEX.md](./00-SYSTEM_ARCHITECTURE_INDEX.md) ←
