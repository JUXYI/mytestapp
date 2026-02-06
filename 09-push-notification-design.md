# 第 10 章：プッシュ通知設計（Azure Notification Hubs）

**前のファイル**: [08-file-storage-design.md](./08-file-storage-design.md)  
**次のファイル**: [10-monitoring-logging.md](./10-monitoring-logging.md) →

---

## 目次

- [10.1 通知アーキテクチャ](#101-通知アーキテクチャ)
- [10.2 デバイス登録フロー](#102-デバイス登録フロー)
- [10.3 通知送信フロー](#103-通知送信フロー)

---

## 10.1 通知アーキテクチャ

### Azure Notification Hubs 構成

```
┌─────────────────────────────────────────────────────────────────┐
│           Azure Notification Hubs Architecture                  │
└─────────────────────────────────────────────────────────────────┘

[CMS API] ─────► [Azure Notification Hubs]
                        │
                        ├─► [APNS] ─────► [iOS デバイス]
                        │   (Apple Push Notification Service)
                        │
                        └─► [FCM] ──────► [Android デバイス]
                            (Firebase Cloud Messaging)
```

### Notification Hubs 設定

| 設定項目      | 値              | 説明                       |
| ------------- | --------------- | -------------------------- |
| **名前空間**  | juxyi-cms-notif | Notification Hubs 名前空間 |
| **通知ハブ**  | juxyi-cms-hub   | 通知ハブ名                 |
| **プラン**    | Free            | 100 万通知/月まで無料      |
| **APNS 認証** | Certificate     | iOS 用プッシュ証明書       |
| **FCM 認証**  | Server Key      | Firebase サーバーキー      |

---

## 10.2 デバイス登録フロー

```
[Mobile App起動]
    │
    │ ① Firebase Messaging初期化
    │    messaging().requestPermission()
    │
    ▼
[Firebase Messaging]
    │
    │ ② デバイスToken取得
    │    messaging().getToken()
    │    → "fK7X9mPnR8w:APA91bH..."
    │
    ▼
[Mobile App]
    │
    │ ③ POST /api/notifications/register-device
    │    Authorization: Bearer {JWT}
    │    {
    │      deviceToken: "fK7X9mPnR8w...",
    │      platform: "ios",
    │      deviceModel: "iPhone 15 Pro",
    │      osVersion: "17.2",
    │      appVersion: "1.0.0"
    │    }
    │
    ▼
[CMS API]
    │
    ├─► ④ ユーザーID取得（JWT）
    │
    ├─► ⑤ DB保存（既存チェック）
    │      INSERT INTO user_devices
    │      ON CONFLICT (device_token) DO UPDATE
    │
    └─► ⑥ レスポンス
         {
           "success": true,
           "deviceId": 123
         }
```

### デバイス登録実装

```java name=backend/cms-api/src/main/java/com/juxyi/cms/controller/NotificationController.java
@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @PostMapping("/register-device")
    public ResponseEntity<DeviceResponse> registerDevice(
            @RequestBody RegisterDeviceRequest request,
            Authentication authentication) {

        Long userId = Long.parseLong(authentication.getName());

        Device device = notificationService.registerDevice(
            userId,
            request.getDeviceToken(),
            request.getPlatform(),
            request.getDeviceModel(),
            request.getOsVersion(),
            request.getAppVersion()
        );

        return ResponseEntity.ok(new DeviceResponse(device.getId(), true));
    }
}
```

```typescript name=mobile/src/features/notifications/hooks/useRegisterDevice.ts
import { useEffect } from 'react';
import { Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import DeviceInfo from 'react-native-device-info';
import { cmsApiClient } from '@/lib/api/axios';

export const useRegisterDevice = () => {
  useEffect(() => {
    registerDevice();
  }, []);

  const registerDevice = async () => {
    try {
      // 1. 通知権限リクエスト
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (!enabled) {
        console.log('Notification permission denied');
        return;
      }

      // 2. デバイスToken取得
      const token = await messaging().getToken();

      // 3. デバイス情報取得
      const deviceModel = await DeviceInfo.getModel();
      const osVersion = await DeviceInfo.getSystemVersion();
      const appVersion = await DeviceInfo.getVersion();

      // 4. サーバーに登録
      await cmsApiClient.post('/api/notifications/register-device', {
        deviceToken: token,
        platform: Platform.OS,
        deviceModel,
        osVersion,
        appVersion,
      });

      console.log('Device registered successfully');
    } catch (error) {
      console.error('Failed to register device:', error);
    }
  };
};
```

---

## 10.3 通知送信フロー

```
[Web 管理画面]
    │
    │ ① POST /api/notifications/send
    │    {
    │      title: "新着ビデオ",
    │      message: "新しいビデオが公開されました",
    │      platforms: ["ios", "android"],
    │      contentId: 123  // オプション（ディープリンク用）
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
    ├─► ③ プラットフォーム別に分離
    │      iOS: 1,234件
    │      Android: 2,567件
    │
    ├─► ④ Azure Notification Hubs SDK呼び出し
    │      - iOS: sendAppleNativeNotification()
    │      - Android: sendFcmNativeNotification()
    │
    ▼
[Azure Notification Hubs]
    │
    ├─► ⑤ iOS デバイスへ送信
    │      APNS（Apple Push Notification Service）
    │      Payload: {
    │        "aps": {
    │          "alert": {"title": "...", "body": "..."},
    │          "sound": "default",
    │          "badge": 1
    │        },
    │        "contentId": 123
    │      }
    │
    └─► ⑥ Android デバイスへ送信
         FCM（Firebase Cloud Messaging）
         Payload: {
           "notification": {"title": "...", "body": "..."},
           "data": {"contentId": "123"}
         }

    ▼
[Mobile App]
    │
    ├─► ⑦ フォアグラウンド: Alert表示
    └─► ⑧ バックグラウンド: 通知バナー表示
         タップ時: ContentDetailScreen へ遷移
```

### 通知送信実装

```java name=backend/cms-api/src/main/java/com/juxyi/cms/service/NotificationService.java
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationHubClient notificationHubClient;
    private final UserDeviceRepository userDeviceRepository;

    public SendNotificationResponse sendPushNotification(SendNotificationRequest request) {
        List<UserDevice> devices = userDeviceRepository.findByPlatformIn(request.getPlatforms());

        int sentCount = 0;
        int failedCount = 0;

        // iOS 通知送信
        if (request.getPlatforms().contains("ios")) {
            List<UserDevice> iosDevices = devices.stream()
                .filter(d -> "ios".equals(d.getPlatform()))
                .collect(Collectors.toList());

            sentCount += sendToIOS(iosDevices, request.getTitle(), request.getMessage(), request.getContentId());
        }

        // Android 通知送信
        if (request.getPlatforms().contains("android")) {
            List<UserDevice> androidDevices = devices.stream()
                .filter(d -> "android".equals(d.getPlatform()))
                .collect(Collectors.toList());

            sentCount += sendToAndroid(androidDevices, request.getTitle(), request.getMessage(), request.getContentId());
        }

        // 通知履歴保存
        saveNotificationHistory(request, sentCount, failedCount);

        return SendNotificationResponse.builder()
            .sentCount(sentCount)
            .failedCount(failedCount)
            .build();
    }

    private int sendToIOS(List<UserDevice> devices, String title, String message, Long contentId) {
        String payload = String.format(
            "{\"aps\":{\"alert\":{\"title\":\"%s\",\"body\":\"%s\"},\"sound\":\"default\",\"badge\":1},\"contentId\":%d}",
            title, message, contentId
        );

        int sent = 0;
        for (UserDevice device : devices) {
            try {
                notificationHubClient.sendAppleNativeNotification(payload, device.getDeviceToken());
                sent++;
            } catch (Exception e) {
                log.error("Failed to send iOS notification to device: {}", device.getDeviceToken(), e);
            }
        }
        return sent;
    }

    private int sendToAndroid(List<UserDevice> devices, String title, String message, Long contentId) {
        String payload = String.format(
            "{\"notification\":{\"title\":\"%s\",\"body\":\"%s\"},\"data\":{\"contentId\":\"%d\"}}",
            title, message, contentId
        );

        int sent = 0;
        for (UserDevice device : devices) {
            try {
                notificationHubClient.sendFcmNativeNotification(payload, device.getDeviceToken());
                sent++;
            } catch (Exception e) {
                log.error("Failed to send Android notification to device: {}", device.getDeviceToken(), e);
            }
        }
        return sent;
    }
}
```

### 通知受信実装

```typescript name=mobile/src/features/notifications/hooks/usePushNotification.ts
import { useEffect } from 'react';
import messaging from '@react-native-firebase/messaging';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

export const usePushNotification = () => {
  const navigation = useNavigation();

  useEffect(() => {
    // フォアグラウンド通知受信
    const unsubscribe = messaging().onMessage(async remoteMessage => {
      Alert.alert(
        remoteMessage.notification?.title || '通知',
        remoteMessage.notification?.body,
        [
          { text: 'キャンセル', style: 'cancel' },
          {
            text: '表示',
            onPress: () => {
              const contentId = remoteMessage.data?.contentId;
              if (contentId) {
                navigation.navigate('ContentDetail', {
                  id: parseInt(contentId),
                });
              }
            },
          },
        ],
      );
    });

    // バックグラウンド通知タップ
    messaging().onNotificationOpenedApp(remoteMessage => {
      const contentId = remoteMessage.data?.contentId;
      if (contentId) {
        navigation.navigate('ContentDetail', { id: parseInt(contentId) });
      }
    });

    // アプリ終了状態から通知タップで起動
    messaging()
      .getInitialNotification()
      .then(remoteMessage => {
        if (remoteMessage) {
          const contentId = remoteMessage.data?.contentId;
          if (contentId) {
            navigation.navigate('ContentDetail', { id: parseInt(contentId) });
          }
        }
      });

    return unsubscribe;
  }, [navigation]);
};
```

---

**次のファイル**: [10-monitoring-logging.md](./10-monitoring-logging.md) →
