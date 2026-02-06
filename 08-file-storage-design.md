# 第 9 章：ファイルストレージ設計（Azure Blob Storage）

**前のファイル**: [07-database-design.md](./07-database-design.md)  
**次のファイル**: [09-push-notification-design.md](./09-push-notification-design.md) →

---

## 目次

- [9.1 ストレージ構成](#91-ストレージ構成)
- [9.2 アップロードフロー（SAS Token）](#92-アップロードフローsas-token)
- [9.3 キャッシュ戦略](#93-キャッシュ戦略)

---

## 9.1 ストレージ構成

### Azure Blob Storage 構成

```
Azure Storage Account: juxyicmsstorage
├── Container: videos (Public Blob)
│   ├── 2025/02/video1.mp4
│   ├── 2025/02/video2.mp4
│   └── thumbnails/
│       ├── video1_thumb.jpg
│       └── video2_thumb.jpg
│
├── Container: documents (Public Blob)
│   ├── 2025/02/doc1.pdf
│   └── 2025/02/doc2.pdf
│
├── Container: images (Public Blob)
│   └── banners/
│       ├── banner1.jpg
│       └── banner2.jpg
│
└── Container: private (Private)
    └── temp/                    # 一時ファイル（24時間後自動削除）
```

### コンテナ設定

| コンテナ名  | アクセスレベル | CDN     | ライフサイクルポリシー | 用途             |
| ----------- | -------------- | ------- | ---------------------- | ---------------- |
| `videos`    | Public Blob    | ✅ 有効 | Hot → Cool（90 日後）  | ビデオファイル   |
| `documents` | Public Blob    | ✅ 有効 | Hot → Cool（90 日後）  | PDF ドキュメント |
| `images`    | Public Blob    | ✅ 有効 | -                      | 画像ファイル     |
| `private`   | Private        | ❌ 無効 | 自動削除（24 時間後）  | 一時ファイル     |

### ファイル命名規則

```
{year}/{month}/{uuid}.{extension}

例:
- 2025/02/550e8400-e29b-41d4-a716-446655440000.mp4
- 2025/02/550e8400-e29b-41d4-a716-446655440000.pdf
```

---

## 9.2 アップロードフロー（SAS Token）

### SAS Token アップロードフロー

```
[Web 管理画面]
    │
    │ ① ファイル選択（video.mp4, 100MB）
    │
    │ ② POST /api/files/sas-token
    │    {
    │      fileName: "video.mp4",
    │      fileSize: 104857600,
    │      containerName: "videos"
    │    }
    │
    ▼
[CMS API]
    │
    ├─► ③ ファイル名生成
    │      UUID.randomUUID() + ".mp4"
    │      → 550e8400-e29b-41d4-a716-446655440000.mp4
    │
    ├─► ④ パス生成
    │      2025/02/550e8400-e29b-41d4-a716-446655440000.mp4
    │
    ├─► ⑤ SAS Token生成
    │      BlobClient.generateSas()
    │      - 権限: Write
    │      - 有効期限: 1時間
    │
    │ ⑥ レスポンス
    │    {
    │      sasUrl: "https://juxyicmsstorage.blob.core.windows.net/videos/2025/02/550e8400.mp4?sv=2021-06-08&...",
    │      blobUrl: "https://juxyicmsstorage.blob.core.windows.net/videos/2025/02/550e8400.mp4",
    │      expiresAt: "2025-02-06T11:00:00Z"
    │    }
    │
    ▼
[Web 管理画面]
    │
    │ ⑦ Azure Blob へ直接アップロード
    │    PUT {sasUrl}
    │    Headers:
    │      Content-Type: video/mp4
    │      x-ms-blob-type: BlockBlob
    │    Body: <binary data>
    │
    │    進捗表示（Axios onUploadProgress）:
    │    0% → 25% → 50% → 75% → 100%
    │
    ▼
[Azure Blob Storage]
    │
    │ ⑧ アップロード完了
    │    200 OK
    │
    ▼
[Web 管理画面]
    │
    │ ⑨ POST /api/videos
    │    {
    │      title: "サンプルビデオ",
    │      videoUrl: "https://juxyicmsstorage.blob.core.windows.net/videos/2025/02/550e8400.mp4",
    │      fileSize: 104857600,
    │      duration: 120
    │    }
    │
    ▼
[CMS API]
    │
    └─► ⑩ DB保存
         INSERT INTO contents (title, content_type, file_url, file_size)
```

### SAS Token 生成実装

```java name=backend/cms-api/src/main/java/com/juxyi/cms/service/AzureBlobService.java
@Service
public class AzureBlobService {

    private final BlobServiceClient blobServiceClient;

    /**
     * SAS Token生成（アップロード用）
     */
    public SasTokenResponse generateUploadSasToken(String containerName, String fileName, long fileSize) {
        // 1. ファイル名生成（UUID）
        String extension = fileName.substring(fileName.lastIndexOf("."));
        String blobName = String.format("%s/%s/%s%s",
            LocalDate.now().getYear(),
            String.format("%02d", LocalDate.now().getMonthValue()),
            UUID.randomUUID().toString(),
            extension
        );

        // 2. Blob クライアント取得
        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);

        // 3. SAS Token生成
        OffsetDateTime expiryTime = OffsetDateTime.now().plusHours(1);
        BlobSasPermission permission = new BlobSasPermission().setWritePermission(true);

        BlobServiceSasSignatureValues values = new BlobServiceSasSignatureValues(expiryTime, permission)
            .setStartTime(OffsetDateTime.now());

        String sasToken = blobClient.generateSas(values);
        String sasUrl = blobClient.getBlobUrl() + "?" + sasToken;

        return SasTokenResponse.builder()
            .sasUrl(sasUrl)
            .blobUrl(blobClient.getBlobUrl())
            .expiresAt(expiryTime)
            .build();
    }

    /**
     * ファイル削除
     */
    public void deleteBlob(String blobUrl) {
        String blobName = extractBlobNameFromUrl(blobUrl);
        String containerName = extractContainerNameFromUrl(blobUrl);

        BlobContainerClient containerClient = blobServiceClient.getBlobContainerClient(containerName);
        BlobClient blobClient = containerClient.getBlobClient(blobName);

        blobClient.delete();
    }
}
```

### フロントエンド アップロード実装

```typescript name=frontend/src/features/files/hooks/useVideoUpload.ts
import { useState } from 'react';
import axios from 'axios';
import apiClient from '@/lib/api/axios';
import { message } from 'antd';

export const useVideoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadVideo = async (file: File) => {
    setUploading(true);
    setProgress(0);

    try {
      // 1. SAS Token取得
      const { data: sasData } = await apiClient.post('/api/files/sas-token', {
        fileName: file.name,
        fileSize: file.size,
        containerName: 'videos',
      });

      // 2. Azure Blob へ直接アップロード
      await axios.put(sasData.sasUrl, file, {
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type,
        },
        onUploadProgress: progressEvent => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || file.size),
          );
          setProgress(percent);
        },
      });

      message.success('アップロード完了');
      return sasData.blobUrl;
    } catch (error) {
      message.error('アップロードに失敗しました');
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return { uploadVideo, uploading, progress };
};
```

---

## 9.3 キャッシュ戦略

### CDN キャッシュ設定

```
Azure CDN (Front Door Premium)
├── Cache Rule: videos/*
│   ├── Cache Duration: 7 days
│   ├── Query String Caching: Ignore
│   └── Compression: Enabled
│
├── Cache Rule: documents/*
│   ├── Cache Duration: 30 days
│   ├── Query String Caching: Ignore
│   └── Compression: Enabled
│
└── Cache Rule: images/*
    ├── Cache Duration: 90 days
    ├── Query String Caching: Ignore
    └── Compression: Enabled
```

### ライフサイクル管理ポリシー

```json
{
  "rules": [
    {
      "name": "moveToArchiveAfter90Days",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["videos/", "documents/"]
        },
        "actions": {
          "baseBlob": {
            "tierToCool": {
              "daysAfterModificationGreaterThan": 90
            }
          }
        }
      }
    },
    {
      "name": "deleteTempFilesAfter1Day",
      "enabled": true,
      "type": "Lifecycle",
      "definition": {
        "filters": {
          "blobTypes": ["blockBlob"],
          "prefixMatch": ["private/temp/"]
        },
        "actions": {
          "baseBlob": {
            "delete": {
              "daysAfterModificationGreaterThan": 1
            }
          }
        }
      }
    }
  ]
}
```

### モバイルアプリ ローカルキャッシュ

```typescript name=mobile/src/lib/cache/fileCache.ts
import RNFS from 'react-native-fs';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const fileCache = {
  /**
   * ファイルダウンロード・キャッシュ
   */
  downloadAndCache: async (url: string, contentId: number) => {
    const filename = `content_${contentId}_${Date.now()}.mp4`;
    const path = `${RNFS.DocumentDirectoryPath}/${filename}`;

    // ダウンロード
    await RNFS.downloadFile({
      fromUrl: url,
      toFile: path,
    }).promise;

    // メタデータ保存
    await AsyncStorage.setItem(
      `cache:content:${contentId}`,
      JSON.stringify({
        url,
        path,
        filename,
        cachedAt: Date.now(),
      }),
    );

    return path;
  },

  /**
   * キャッシュから取得
   */
  getFromCache: async (contentId: number): Promise<string | null> => {
    const metaJson = await AsyncStorage.getItem(`cache:content:${contentId}`);
    if (!metaJson) return null;

    const meta = JSON.parse(metaJson);
    const exists = await RNFS.exists(meta.path);

    return exists ? meta.path : null;
  },

  /**
   * キャッシュクリア
   */
  clearCache: async () => {
    const files = await RNFS.readDir(RNFS.DocumentDirectoryPath);

    for (const file of files) {
      if (file.name.startsWith('content_')) {
        await RNFS.unlink(file.path);
      }
    }

    // メタデータクリア
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter(key => key.startsWith('cache:content:'));
    await AsyncStorage.multiRemove(cacheKeys);
  },
};
```

---

**次のファイル**: [09-push-notification-design.md](./09-push-notification-design.md) →
