# 第 6 章：モバイルアプリアーキテクチャ（React Native）

**前のファイル**: [04-web-frontend-architecture.md](./04-web-frontend-architecture.md)  
**次のファイル**: [06-api-design.md](./06-api-design.md) →

---

## 目次

- [6.1 アーキテクチャパターン](#61-アーキテクチャパターン)
- [6.2 技術スタック](#62-技術スタック)
- [6.3 ディレクトリ構造](#63-ディレクトリ構造)
- [6.4 原生機能統合](#64-原生機能統合)
- [6.5 オフライン機能設計](#65-オフライン機能設計)
- [6.6 主要機能実装](#66-主要機能実装)

---

## 6.1 アーキテクチャパターン

### Feature-based + Hooks + TanStack Query

```
■ アーキテクチャの3本柱

1. Feature-based（構造）
   - 機能ごとにコードを組織化
   - 高内聚低耦合

2. React Hooks（ビジネスロジック）
   - カスタムフックに業務ロジックを集約
   - 再利用可能・テスト容易

3. TanStack Query（データ管理）
   - サーバー状態の自動管理
   - キャッシュ・リトライ・オフライン対応
```

**Web 管理画面と同じアーキテクチャを採用** → コード一貫性・学習コスト削減

---

## 6.2 技術スタック

| カテゴリ           | 技術                             | バージョン |
| ------------------ | -------------------------------- | ---------- |
| **コア**           | React Native                     | 0.73+      |
|                    | TypeScript                       | 5.3+       |
|                    | Hermes Engine                    | -          |
| **UI**             | React Native Paper               | 5.x        |
| **ナビゲーション** | React Navigation                 | 6.x        |
| **状態管理**       | TanStack Query                   | 5.x        |
|                    | Zustand                          | 4.x        |
| **原生機能**       | react-native-video               | 6.x        |
|                    | react-native-pdf                 | 6.x        |
|                    | react-native-biometrics          | 3.x        |
|                    | e-ninsho SDK                     | -          |
|                    | @react-native-firebase/messaging | 18.x       |

---

## 6.3 ディレクトリ構造

```
mobile/src/
├── features/
│   ├── auth/              # 認証（WebView/e-ninsho/生体）
│   ├── contents/          # コンテンツ閲覧
│   ├── stamp-rally/       # 集章活動（QRコード）
│   └── notifications/     # プッシュ通知
│
├── components/            # 共通コンポーネント
├── navigation/            # ナビゲーション設定
├── lib/                   # ライブラリ・ユーティリティ
└── theme/                 # テーマ設定
```

**※ 詳細は第 1 章参照**

---

## 6.4 原生機能統合

### e-ninsho SDK（Native Module）

**iOS**:

```objective-c name=mobile/ios/JuxyiMobile/ENinshoModule.m
RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(authenticate:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject) {
  [[ENinshoManager sharedManager] authenticateWithCompletion:^(ENinshoResult *result, NSError *error) {
    if (error) {
      reject(@"ENINSHO_ERROR", error.localizedDescription, error);
    } else {
      resolve(@{@"success": @(result.isSuccess), @"userId": result.userId});
    }
  }];
}
```

**Android**:

```java name=mobile/android/app/src/main/java/com/juxyi/mobile/ENinshoModule.java
@ReactMethod
public void authenticate(Promise promise) {
    ENinshoManager.getInstance(reactContext).authenticate(new Callback() {
        @Override
        public void onSuccess(ENinshoResult result) {
            WritableMap response = Arguments.createMap();
            response.putBoolean("success", true);
            response.putString("userId", result.getUserId());
            promise.resolve(response);
        }

        @Override
        public void onError(String errorMessage) {
            promise.reject("ENINSHO_ERROR", errorMessage);
        }
    });
}
```

### 生体認証

```typescript name=mobile/src/features/auth/hooks/useBiometricAuth.ts
import ReactNativeBiometrics from 'react-native-biometrics';

export const useBiometricAuth = () => {
  const authenticate = async () => {
    const rnBiometrics = new ReactNativeBiometrics();
    const { success } = await rnBiometrics.simplePrompt({
      promptMessage: 'Face IDでログイン',
    });

    if (success) {
      // Token取得・有効期限チェック...
    }
  };

  return { authenticate };
};
```

### QR コードスキャン

```typescript name=mobile/src/features/stamp-rally/hooks/useQRScanner.ts
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';

export const useQRScanner = () => {
  const device = useCameraDevice('back');

  const codeScanner = useCodeScanner({
    codeTypes: ['qr'],
    onCodeScanned: codes => {
      const qrData = codes[0]?.value;
      // スタンプ獲得API呼び出し
    },
  });

  return { device, codeScanner };
};
```

---

## 6.5 オフライン機能設計

### キャッシュ戦略

```typescript name=mobile/src/lib/cache/fileCache.ts
import RNFS from 'react-native-fs';

export const fileCache = {
  /**
   * ファイルダウンロード・保存
   */
  downloadAndCache: async (url: string, filename: string) => {
    const path = `${RNFS.DocumentDirectoryPath}/${filename}`;

    await RNFS.downloadFile({
      fromUrl: url,
      toFile: path,
    }).promise;

    // メタデータ保存
    await AsyncStorage.setItem(
      `cache:${filename}`,
      JSON.stringify({
        url,
        path,
        cachedAt: Date.now(),
      }),
    );

    return path;
  },

  /**
   * キャッシュから取得
   */
  getFromCache: async (filename: string) => {
    const metaJson = await AsyncStorage.getItem(`cache:${filename}`);
    if (!metaJson) return null;

    const meta = JSON.parse(metaJson);
    const exists = await RNFS.exists(meta.path);

    return exists ? meta.path : null;
  },
};
```

### TanStack Query オフライン設定

```typescript name=mobile/src/lib/api/queryClient.ts
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: 'offlineFirst', // オフライン時キャッシュ返却
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    },
  },
});
```

---

## 6.6 主要機能実装

### コンテンツ閲覧

```typescript name=mobile/src/features/contents/screens/ContentDetailScreen.tsx
export const ContentDetailScreen: React.FC = ({ route }) => {
  const { id } = route.params;
  const { data: content, isLoading } = useContentDetail(id);

  if (isLoading) return <LoadingSpinner />;

  return (
    <ScrollView>
      <Text style={styles.title}>{content.title}</Text>
      <Text>{content.description}</Text>

      {content.contentType === 'VIDEO' && (
        <Video source={{ uri: content.fileUrl }} style={styles.video} />
      )}

      {content.contentType === 'DOCUMENT' && (
        <Pdf source={{ uri: content.fileUrl }} style={styles.pdf} />
      )}
    </ScrollView>
  );
};
```

### プッシュ通知受信

```typescript name=mobile/src/features/notifications/hooks/usePushNotification.ts
import messaging from '@react-native-firebase/messaging';

export const usePushNotification = () => {
  useEffect(() => {
    // フォアグラウンド通知受信
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || '通知',
        remoteMessage.notification?.body,
      );
    });

    // バックグラウンド通知タップ
    messaging().onNotificationOpenedApp(remoteMessage => {
      // 通知からの画面遷移
      navigation.navigate('ContentDetail', {
        id: remoteMessage.data?.contentId,
      });
    });

    return unsubscribe;
  }, []);
};
```

### デバイス Token 登録

```typescript name=mobile/src/features/notifications/hooks/useRegisterDevice.ts
import messaging from '@react-native-firebase/messaging';
import { cmsApiClient } from '@/lib/api/axios';

export const useRegisterDevice = () => {
  const registerDevice = async () => {
    const token = await messaging().getToken();

    await cmsApiClient.post('/api/notifications/register-device', {
      deviceToken: token,
      platform: Platform.OS,
    });
  };

  useEffect(() => {
    registerDevice();
  }, []);
};
```

---

**次のファイル**: [06-api-design.md](./06-api-design.md) →
