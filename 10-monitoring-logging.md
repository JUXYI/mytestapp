# 第 11 章：監視・ログ設計（Application Insights）

**前のファイル**: [09-push-notification-design.md](./09-push-notification-design.md)  
**次のファイル**: [11-cicd-deployment.md](./11-cicd-deployment.md) →

---

## 目次

- [11.1 監視戦略](#111-監視戦略)
- [11.2 フロントエンド監視](#112-フロントエンド監視)
- [11.3 バックエンド監視](#113-バックエンド監視)
- [11.4 エンドツーエンド追跡](#114-エンドツーエンド追跡)

---

## 11.1 監視戦略

### 監視対象とメトリクス

| 層                 | 監視対象         | メトリクス                               | アラート閾値    |
| ------------------ | ---------------- | ---------------------------------------- | --------------- |
| **フロントエンド** | React Web/Mobile | ページロード時間、エラー率、API 応答時間 | エラー率 > 5%   |
| **バックエンド**   | Spring Boot API  | リクエスト数、応答時間、例外数           | 応答時間 > 3 秒 |
| **データベース**   | Azure SQL        | DTU 使用率、接続数、クエリ時間           | DTU > 80%       |
| **ストレージ**     | Azure Blob       | リクエスト数、帯域幅                     | -               |
| **インフラ**       | App Service      | CPU、メモリ、スケールアウト              | CPU > 80%       |

### Application Insights 構成

```
Application Insights: juxyi-cms-ai
├── データソース
│   ├── CMS API (Spring Boot)
│   ├── マイページAPI (Spring Boot)
│   ├── Web 管理画面 (React)
│   └── Mobile App (React Native)
│
├── データ保持期間: 90日
│
└── アラートルール
    ├── エラー率 > 5%（5分間）
    ├── 応答時間 > 3秒（5分間）
    ├── 可用性 < 99%
    └── DTU使用率 > 80%
```

---

## 11.2 フロントエンド監視

### React Web 統合

```typescript name=frontend/src/lib/monitoring/appInsights.ts
import { ApplicationInsights } from '@microsoft/applicationinsights-web';
import { ReactPlugin } from '@microsoft/applicationinsights-react-js';

const reactPlugin = new ReactPlugin();

const appInsights = new ApplicationInsights({
  config: {
    connectionString: import.meta.env.VITE_APP_INSIGHTS_CONNECTION_STRING,
    extensions: [reactPlugin],
    enableAutoRouteTracking: true,
    enableCorsCorrelation: true,
    enableRequestHeaderTracking: true,
    enableResponseHeaderTracking: true,
  },
});

appInsights.loadAppInsights();

// カスタムイベント追跡
export const trackEvent = (name: string, properties?: any) => {
  appInsights.trackEvent({ name }, properties);
};

// エラー追跡
export const trackError = (error: Error, properties?: any) => {
  appInsights.trackException({ exception: error }, properties);
};

// ページビュー追跡
export const trackPageView = (name: string, url?: string) => {
  appInsights.trackPageView({ name, uri: url });
};

export default appInsights;
```

```typescript name=frontend/src/App.tsx
import { AppInsightsContext } from '@microsoft/applicationinsights-react-js';
import { reactPlugin } from './lib/monitoring/appInsights';

export const App: React.FC = () => {
  return (
    <AppInsightsContext.Provider value={reactPlugin}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </AppInsightsContext.Provider>
  );
};
```

### React Native 統合

```typescript name=mobile/src/lib/monitoring/appInsights.ts
import { AppInsights } from 'applicationinsights-reactnative';
import Config from 'react-native-config';

export const appInsights = new AppInsights({
  instrumentationKey: Config.APP_INSIGHTS_INSTRUMENTATION_KEY,
});

// 初期化
appInsights.setup();

// 自動収集
appInsights.trackEvent('AppStarted');
appInsights.trackPageView('HomeScreen');
```

---

## 11.3 バックエンド監視

### Spring Boot 統合

```xml name=backend/cms-api/build.gradle
dependencies {
    implementation 'com.microsoft.azure:applicationinsights-spring-boot-starter:3.4.19'
}
```

```yaml name=backend/cms-api/src/main/resources/application.yml
azure:
  application-insights:
    instrumentation-key: ${APP_INSIGHTS_INSTRUMENTATION_KEY}
    enabled: true
    web:
      enable-W3C: true
    logging:
      level: INFO
```

### カスタムメトリクス

```java name=backend/cms-api/src/main/java/com/juxyi/cms/config/TelemetryConfig.java
@Configuration
public class TelemetryConfig {

    @Bean
    public TelemetryClient telemetryClient() {
        TelemetryClient client = new TelemetryClient();
        client.getContext().getComponent().setVersion("1.0.0");
        return client;
    }
}
```

```java name=backend/cms-api/src/main/java/com/juxyi/cms/aspect/TelemetryAspect.java
@Aspect
@Component
@RequiredArgsConstructor
public class TelemetryAspect {

    private final TelemetryClient telemetryClient;

    @Around("@annotation(org.springframework.web.bind.annotation.PostMapping)")
    public Object trackApiCall(ProceedingJoinPoint joinPoint) throws Throwable {
        String methodName = joinPoint.getSignature().getName();
        long startTime = System.currentTimeMillis();

        try {
            Object result = joinPoint.proceed();

            long duration = System.currentTimeMillis() - startTime;
            telemetryClient.trackMetric("api.duration." + methodName, duration);

            return result;
        } catch (Exception e) {
            telemetryClient.trackException(e);
            throw e;
        }
    }
}
```

---

## 11.4 エンドツーエンド追跡

### 分散トレーシング

```
[Mobile App]
    │ Request-Id: |abc123.1.
    │
    │ GET /api/contents
    │ Headers:
    │   Request-Id: |abc123.1.
    │   Authorization: Bearer {JWT}
    │
    ▼
[CMS API]
    │ Request-Id: |abc123.1.
    │ Parent-Id: |abc123.
    │
    │ SELECT * FROM contents
    │ Duration: 45ms
    │
    ▼
[Azure SQL Database]
    │ Request-Id: |abc123.1.1.
    │ Parent-Id: |abc123.1.
    │
    │ Query Execution: 45ms
```

### Kusto クエリ例

**エラー率分析**:

```kusto
requests
| where timestamp > ago(1h)
| summarize
    TotalRequests = count(),
    FailedRequests = countif(success == false)
| extend ErrorRate = (FailedRequests * 100.0) / TotalRequests
```

**レスポンス時間分析**:

```kusto
requests
| where timestamp > ago(24h)
| summarize
    avg(duration),
    percentile(duration, 50),
    percentile(duration, 95),
    percentile(duration, 99)
    by bin(timestamp, 1h)
| render timechart
```

**例外トップ 10**:

```kusto
exceptions
| where timestamp > ago(7d)
| summarize Count = count() by type, outerMessage
| top 10 by Count desc
```

### アラート設定

```json
{
  "name": "High Error Rate Alert",
  "description": "エラー率が5%を超えた場合にアラート",
  "severity": 2,
  "enabled": true,
  "condition": {
    "allOf": [
      {
        "query": "requests | where success == false | summarize ErrorRate = count() * 100.0 / count()",
        "timeAggregation": "Average",
        "operator": "GreaterThan",
        "threshold": 5
      }
    ]
  },
  "actions": {
    "actionGroups": ["devops-team-action-group"],
    "emailSubject": "【重要】エラー率が5%を超えました"
  }
}
```

---

**次のファイル**: [11-cicd-deployment.md](./11-cicd-deployment.md) →
