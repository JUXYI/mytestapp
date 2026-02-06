# 第 5 章：Web 管理画面アーキテクチャ（React）

**前のファイル**: [03-backend-architecture.md](./03-backend-architecture.md)  
**次のファイル**: [05-mobile-app-architecture.md](./05-mobile-app-architecture.md) →

---

## 目次

- [5.1 アーキテクチャパターン（Feature-based）](#51-アーキテクチャパターンfeature-based)
- [5.2 技術スタック](#52-技術スタック)
- [5.3 ディレクトリ構造](#53-ディレクトリ構造)
- [5.4 状態管理設計](#54-状態管理設計)
- [5.5 主要機能実装](#55-主要機能実装)

---

## 5.1 アーキテクチャパターン（Feature-based）

### アーキテクチャ概要

```
frontend/src/
├── features/                    # Feature-based モジュール
│   ├── auth/                    # 認証機能
│   │   ├── pages/              # ページコンポーネント
│   │   ├── components/         # 機能専用コンポーネント
│   │   ├── hooks/              # カスタムフック（ビジネスロジック）
│   │   ├── services/           # API呼び出し（純関数）
│   │   ├── stores/             # クライアント状態（Zustand）
│   │   └── types/              # 型定義
│   │
│   └── contents/                # コンテンツ管理機能
│       ├── pages/
│       ├── components/
│       ├── hooks/
│       ├── services/
│       └── types/
│
├── components/                  # 共通コンポーネント
├── lib/                        # ライブラリ・ユーティリティ
├── routes/                     # ルーティング設定
└── theme/                      # テーマ設定
```

### Feature-based の利点

| 利点                 | 説明                                            |
| -------------------- | ----------------------------------------------- |
| **高内聚低耦合**     | 機能ごとにコードが集中、依存関係が明確          |
| **スケーラビリティ** | 新機能追加時、新しい feature フォルダを作るだけ |
| **チーム協作**       | 機能別に開発担当を分けやすい                    |
| **テスト容易性**     | 機能単位でテストを書ける                        |
| **コード再利用**     | 共通部分は `components/` に抽出                 |

---

## 5.2 技術スタック

| カテゴリ              | 技術            | バージョン | 用途                     |
| --------------------- | --------------- | ---------- | ------------------------ |
| **フレームワーク**    | React           | 18.2+      | UI フレームワーク        |
| **言語**              | TypeScript      | 5.3+       | 型安全な開発             |
| **ビルドツール**      | Vite            | 5.x        | 高速ビルド・HMR          |
| **UI ライブラリ**     | Ant Design      | 5.x        | エンタープライズ UI      |
| **スタイリング**      | Tailwind CSS    | 3.x        | ユーティリティ CSS       |
| **ルーティング**      | React Router    | 6.x        | SPA ルーティング         |
| **状態管理**          | TanStack Query  | 5.x        | サーバー状態管理         |
|                       | Zustand         | 4.x        | クライアント状態管理     |
| **HTTP クライアント** | Axios           | 1.x        | API 通信                 |
| **フォーム**          | React Hook Form | 7.x        | フォーム管理             |
| **バリデーション**    | Zod             | 3.x        | スキーマバリデーション   |
| **エディター**        | react-quill     | 2.x        | リッチテキストエディター |
| **PDF プレビュー**    | react-pdf       | 7.x        | PDF 表示                 |

---

## 5.3 ディレクトリ構造

### 完全ディレクトリ構造

```
frontend/
├── public/
│   ├── index.html
│   └── favicon.ico
│
├── src/
│   ├── main.tsx                          # エントリーポイント
│   ├── App.tsx                           # ルートコンポーネント
│   │
│   ├── features/                         # Feature-based モジュール
│   │   │
│   │   ├── auth/                         # 認証機能
│   │   │   ├── pages/
│   │   │   │   └── LoginPage.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useLogin.ts
│   │   │   ├── services/
│   │   │   │   └── authService.ts
│   │   │   ├── stores/
│   │   │   │   └── authStore.ts
│   │   │   └── types/
│   │   │       └── auth.types.ts
│   │   │
│   │   ├── contents/                     # コンテンツ管理
│   │   │   ├── pages/
│   │   │   │   ├── ContentListPage.tsx
│   │   │   │   ├── ContentCreatePage.tsx
│   │   │   │   └── ContentEditPage.tsx
│   │   │   ├── components/
│   │   │   │   ├── ContentForm.tsx
│   │   │   │   ├── ContentTable.tsx
│   │   │   │   └── ContentPreview.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useContents.ts
│   │   │   │   ├── useCreateContent.ts
│   │   │   │   └── useUpdateContent.ts
│   │   │   ├── services/
│   │   │   │   └── contentService.ts
│   │   │   └── types/
│   │   │       └── content.types.ts
│   │   │
│   │   ├── files/                        # ファイル管理
│   │   │   ├── pages/
│   │   │   ├── components/
│   │   │   │   ├── FileUploader.tsx
│   │   │   │   └── VideoUploader.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useFileUpload.ts
│   │   │   └── services/
│   │   │       └── fileService.ts
│   │   │
���   │   ├── notifications/                # プッシュ通知
│   │   │   ├── pages/
│   │   │   │   ├── NotificationListPage.tsx
│   │   │   │   └── NotificationCreatePage.tsx
│   │   │   ├── components/
│   │   │   │   └── NotificationForm.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useSendNotification.ts
│   │   │   └── services/
│   │   │       └── notificationService.ts
│   │   │
│   │   └── dashboard/                    # ダッシュボード
│   │       ├── pages/
│   │       │   └── DashboardPage.tsx
│   │       └── components/
│   │           ├── StatCard.tsx
│   │           └── RecentActivities.tsx
│   │
│   ├── components/                       # 共通コンポーネント
│   │   ├── layout/
│   │   │   ├── AppLayout.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── common/
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── LoadingSpinner.tsx
│   │   │   └── ErrorBoundary.tsx
│   │   └── form/
│   │       ├── FormInput.tsx
│   │       └── FormSelect.tsx
│   │
│   ├── lib/                              # ライブラリ・ユーティリティ
│   │   ├── api/
│   │   │   ├── axios.ts                  # Axios 設定
│   │   │   └── queryClient.ts            # TanStack Query 設定
│   │   └── utils/
│   │       ├── formatters.ts
│   │       └── validators.ts
│   │
│   ├── routes/                           # ルーティング
│   │   ├── index.tsx                     # ルート定義
│   │   ├── PrivateRoute.tsx              # 認証ガード
│   │   └── routes.ts                     # パス定義
│   │
│   ├── hooks/                            # グローバルフック
│   │   └── useAuth.ts
│   │
│   ├── types/                            # グローバル型定義
│   │   ├── api.types.ts
│   │   └── common.types.ts
│   │
│   ├── theme/                            # テーマ設定
│   │   ├── index.ts
│   │   └── antd.config.ts
│   │
│   └── config/                           # 設定
│       └── env.ts
│
├── .env.development
├── .env.production
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 5.4 状態管理設計

### 状態管理の分離

```
┌─────────────────────────────────────────────────────────┐
│                    状態管理戦略                          │
└─────────────────────────────────────────────────────────┘

■ サーバー状態（TanStack Query）
  - API から取得したデータ
  - 自動キャッシュ・リフレッシュ
  - オプティミスティック更新

■ クライアント状態（Zustand）
  - 認証状態（user, isAuthenticated）
  - UI 状態（サイドバー開閉、テーマ）
  - 一時データ（フォーム入力中のデータ）

■ URL 状態（React Router）
  - ページネーション（?page=1）
  - フィルター（?status=published）
  - 検索（?q=keyword）
```

### TanStack Query 設定

```typescript name=frontend/src/lib/api/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5分間キャッシュ
      gcTime: 10 * 60 * 1000, // 10分間保持
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});
```

### Zustand ストア

```typescript name=frontend/src/features/auth/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    set => ({
      user: null,
      isAuthenticated: false,
      setUser: user => set({ user, isAuthenticated: true }),
      logout: () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ user: null, isAuthenticated: false });
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
```

### Axios 設定（JWT 自動付与）

```typescript name=frontend/src/lib/api/axios.ts
import axios from 'axios';
import { message } from 'antd';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
});

// リクエストインターセプター（JWT 自動付与）
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

// レスポンスインターセプター（エラーハンドリング）
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config;

    // Token期限切れ → 自動更新
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        const { data } = await axios.post('/api/auth/refresh', {
          refreshToken,
        });

        localStorage.setItem('access_token', data.accessToken);
        localStorage.setItem('refresh_token', data.refreshToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = '/login';
      }
    }

    // エラーメッセージ表示
    const errorMessage =
      error.response?.data?.message || 'エラーが発生しました';
    message.error(errorMessage);

    return Promise.reject(error);
  },
);

export default apiClient;
```

---

## 5.5 主要機能実装

### コンテンツ一覧ページ

```typescript name=frontend/src/features/contents/pages/ContentListPage.tsx
import React, { useState } from 'react';
import { Table, Button, Input, Select, Space } from 'antd';
import { PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useContents } from '../hooks/useContents';
import { ContentType, ContentStatus } from '../types/content.types';

export const ContentListPage: React.FC = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [contentType, setContentType] = useState<ContentType | undefined>();
  const [status, setStatus] = useState<ContentStatus | undefined>();

  const { data, isLoading, refetch } = useContents({
    page,
    size: 20,
    contentType,
    status,
  });

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id', width: 80 },
    { title: 'タイトル', dataIndex: 'title', key: 'title' },
    {
      title: 'タイプ',
      dataIndex: 'contentType',
      key: 'contentType',
      width: 120,
    },
    { title: 'ステータス', dataIndex: 'status', key: 'status', width: 120 },
    {
      title: '操作',
      key: 'actions',
      width: 150,
      render: (_: any, record: any) => (
        <Space>
          <Button
            size="small"
            onClick={() => navigate(`/contents/${record.id}/edit`)}
          >
            編集
          </Button>
          <Button size="small" danger>
            削除
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div
        style={{
          marginBottom: 16,
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <Space>
          <Select
            placeholder="タイプ"
            style={{ width: 150 }}
            allowClear
            onChange={setContentType}
          >
            <Select.Option value="DOCUMENT">ドキュメント</Select.Option>
            <Select.Option value="VIDEO">ビデオ</Select.Option>
            <Select.Option value="URL_LINK">URLリンク</Select.Option>
          </Select>
          <Select
            placeholder="ステータス"
            style={{ width: 150 }}
            allowClear
            onChange={setStatus}
          >
            <Select.Option value="DRAFT">下書き</Select.Option>
            <Select.Option value="PUBLISHED">公開</Select.Option>
          </Select>
        </Space>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/contents/new')}
        >
          新規作成
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={data?.content || []}
        loading={isLoading}
        rowKey="id"
        pagination={{
          current: page + 1,
          pageSize: 20,
          total: data?.totalElements || 0,
          onChange: page => setPage(page - 1),
        }}
      />
    </div>
  );
};
```

### コンテンツ作成フック

```typescript name=frontend/src/features/contents/hooks/useCreateContent.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { contentService } from '../services/contentService';
import type { ContentDto } from '../types/content.types';

export const useCreateContent = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: ContentDto) => contentService.createContent(data),
    onSuccess: data => {
      // キャッシュ無効化
      queryClient.invalidateQueries({ queryKey: ['contents'] });

      message.success('コンテンツを作成しました');
      navigate('/contents');
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || 'コンテンツの作成に失敗しました',
      );
    },
  });
};
```

### ファイルアップロード（SAS Token 使用）

```typescript name=frontend/src/features/files/hooks/useFileUpload.ts
import { useState } from 'react';
import { message } from 'antd';
import axios from 'axios';
import apiClient from '@/lib/api/axios';

export const useFileUpload = () => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadFile = async (file: File, containerName: string) => {
    setUploading(true);
    setProgress(0);

    try {
      // 1. SAS Token取得
      const { data } = await apiClient.post('/api/files/sas-token', {
        fileName: file.name,
        fileSize: file.size,
        containerName,
      });

      const { sasUrl } = data;

      // 2. Azure Blob へ直接アップロード
      await axios.put(sasUrl, file, {
        headers: {
          'x-ms-blob-type': 'BlockBlob',
          'Content-Type': file.type,
        },
        onUploadProgress: progressEvent => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || file.size),
          );
          setProgress(percentCompleted);
        },
      });

      message.success('アップロード完了');
      return sasUrl.split('?')[0]; // SAS Token を除いた URL
    } catch (error) {
      message.error('アップロードに失敗しました');
      throw error;
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return { uploadFile, uploading, progress };
};
```

### プッシュ通知送信

```typescript name=frontend/src/features/notifications/hooks/useSendNotification.ts
import { useMutation } from '@tanstack/react-query';
import { message } from 'antd';
import { notificationService } from '../services/notificationService';

interface SendNotificationRequest {
  title: string;
  message: string;
  platforms: string[];
}

export const useSendNotification = () => {
  return useMutation({
    mutationFn: (data: SendNotificationRequest) =>
      notificationService.send(data),
    onSuccess: response => {
      message.success(`通知を送信しました（${response.sentCount}件）`);
    },
    onError: (error: any) => {
      message.error(
        error.response?.data?.message || '通知の送信に失敗しました',
      );
    },
  });
};
```

### プライベートルート（認証ガード）

```typescript name=frontend/src/routes/PrivateRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/features/auth/stores/authStore';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
```

### ルート定義

```typescript name=frontend/src/routes/index.tsx
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { PrivateRoute } from './PrivateRoute';
import { LoginPage } from '@/features/auth/pages/LoginPage';
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage';
import { ContentListPage } from '@/features/contents/pages/ContentListPage';
import { ContentCreatePage } from '@/features/contents/pages/ContentCreatePage';
import { NotificationListPage } from '@/features/notifications/pages/NotificationListPage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <PrivateRoute>
        <AppLayout />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'contents', element: <ContentListPage /> },
      { path: 'contents/new', element: <ContentCreatePage /> },
      { path: 'contents/:id/edit', element: <ContentCreatePage /> },
      { path: 'notifications', element: <NotificationListPage /> },
    ],
  },
]);
```

---

**次のファイル**: [05-mobile-app-architecture.md](./05-mobile-app-architecture.md) →
