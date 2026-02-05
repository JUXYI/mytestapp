# React Native + React + Spring Boot 应用架构设计书

**项目名称**: [待补充]  
**版本**: v1.0  
**最后更新**: 2026-01-26  
**负责人**: JUXYI

---

## 一、系统概述

### 1.1 项目目标

构建一套完整的多端应用系统，包含移动应用（App）和运营管理工具（Admin Panel），共享同一套后台服务，通过 Azure 云平台托管。

### 1.2 系统组成

- **移动端**：React Native + TypeScript（iOS/Android）
- **管理工具**：React + TypeScript（Web 端）
- **后台服务**：Java Spring Boot REST API
- **认证系统**：基于 JWT + e-ninsho SDK
- **云平台**：Microsoft Azure

### 1.3 环境划分

- **开发环境**（Dev）
- **预发布环境**（Staging）
- **生产环境**（Production）

---

## 二、核心业务功能

### 2.1 移动端（App）功能模块

| 模块           | 功能描述                       | 依赖                    |
| -------------- | ------------------------------ | ----------------------- |
| **登录认证**   | 通过 WebView 调用 Web 端登录   | Web 端 SSO              |
| **主页菜单**   | 首页导航，展示核心功能入口     | 后台 API                |
| **通知菜单**   | 接收并展示推送通知             | Notification Hubs       |
| **有用菜单**   | 常用功能快速访问               | 后台 API                |
| **商品栏**     | 商品展示与管理                 | 后台 API + Blob Storage |
| **支持菜单**   | 常规设置、登出等               | 后台 API                |
| **集章->抽奖** | 签到集章系统，满 20 个抽奖     | 后台 API + 数据库       |
| **内容显示**   | 动态内容展示（由管理工具配置） | 后台 API                |
| **个人认证**   | 集成 e-ninsho SDK              | 第三方 SDK              |
| **家族连携**   | 绑定查看家人的保险合同         | Web 端数据 + SSO        |
| **单点登录**   | App -> Web 端无缝切换          | Web 端 + JWT Token      |
| **推送通知**   | 接收服务端推送消息             | Notification Hubs       |

### 2.2 管理工具（Admin）功能模块

| 模块         | 功能描述                 | 依赖              |
| ------------ | ------------------------ | ----------------- |
| **登录认证** | 管理员认证               | JWT Token         |
| **内容管理** | 创建、编辑、删除内容     | 后台 API + 数据库 |
| **内容创建** | 富文本编辑、媒体上传     | Blob Storage      |
| **推送管理** | 创建、调度、监控推送任务 | Notification Hubs |
| **推送服务** | 推送历史、效果统计       | Log Analytics     |

### 2.3 Web 端（现有）功能

- 用户登录
- 保险合同管理
- 家族信息管理

---

## 三、系统架构设计

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                          客户端层                                      │
├──────────────────┬──────────────────┬──────────────────────────────┤
│   React Native   │  React Admin     │   Web (现有)                 │
│   App (iOS/      │  Management      │   (保险合同管理)             │
│   Android)       │  Tool            │                              │
└────────┬─────────┴────────┬─────────┴──────────────┬───────────────┘
         │                  │                        │
         │                  │                        │
         └──────────────────┼────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  API Gateway   │
                    │  Azure Front   │
                    │  Door + WAF    │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼────┐         ┌────▼────┐      ┌──────▼──────┐
   │Spring    │         │Spring    │      │  e-ninsho  │
   │Boot API  │         │Boot API  │      │  SDK       │
   │(Primary) │         │(Secondary)      │  (Third    │
   └────┬────┘         └────┬────┘      │  Party)    │
        │                   │           └────────────┘
        └───────────┬───────┘
                    │
        ┌───────────┼────────────┐
        │           │            │
   ┌────▼────┐ ┌────▼────┐ ┌─────▼──────┐
   │ Azure   │ │ Message │ │  Blob      │
   │ SQL DB  │ │ Queue   │ │  Storage   │
   │(Primary)│ │         │ │ (Video)    │
   │(Replica)│ │         │ │            │
   └─────────┘ └─────────┘ └────────────┘
```

### 3.2 Azure 服务架构

```
Azure Front Door Premium + WAF (最前层 - DDoS防护、地理分发)
        │
        ▼
Application Gateway (可选，用于高级负载均衡)
        │
        ├─────────��───────────────────┐
        │                             │
        ▼                             ▼
Primary App Service          Secondary App Service
(Spring Boot API)            (Spring Boot API)
        │                             │
        └──────────────┬──────────────┘
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
  Azure SQL DB    Message Queue   Blob Storage
  (Primary +      (Service Bus/    (Videos,
   Replica)       Storage Queue)    Images)
        │
        ▼
 Log Analytics
 + Application Insights
 + Sentinel
 + Defender for Cloud
```

---

## 四、API 设计规范

### 4.1 REST API 设计原则

#### 4.1.1 URL 设计规范

```
基础 URL: https://api.example.com/v1

资源端点示例：
GET    /api/v1/users                  # 获取所有用户
POST   /api/v1/users                  # 创建用户
GET    /api/v1/users/{userId}         # 获取特定用户
PUT    /api/v1/users/{userId}         # 更新用户
DELETE /api/v1/users/{userId}         # 删除用户

内容管理 API：
GET    /api/v1/contents               # 获取内容列表
POST   /api/v1/contents               # 创建内容
GET    /api/v1/contents/{contentId}   # 获取内容详情
PUT    /api/v1/contents/{contentId}   # 更新内容
DELETE /api/v1/contents/{contentId}   # 删除内容

推送管理 API：
POST   /api/v1/notifications/send     # 发送推送通知
GET    /api/v1/notifications/history  # 获取推送历史
GET    /api/v1/notifications/stats    # 获取推送统计

用户相关 API：
GET    /api/v1/users/{userId}/profile              # 获取用户信息
POST   /api/v1/users/{userId}/verify               # e-ninsho 认证
GET    /api/v1/users/{userId}/contracts            # 获取保险合同
POST   /api/v1/users/{userId}/family/bind          # 绑定家族成员
GET    /api/v1/users/{userId}/family/members       # 获取家族成员

集章系统 API：
POST   /api/v1/users/{userId}/stamps/check-in      # 签到集章
GET    /api/v1/users/{userId}/stamps/count         # 获取集章数量
POST   /api/v1/users/{userId}/stamps/lottery       # 参加抽奖
GET    /api/v1/users/{userId}/stamps/lottery/history # 抽奖历史
```

#### 4.1.2 请求/响应格式

```json
# 成功响应（HTTP 200）
{
  "code": 200,
  "message": "success",
  "data": {
    "userId": "user123",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "timestamp": "2026-01-26T10:30:00Z"
}

# 分页响应
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [...],
    "pagination": {
      "page": 1,
      "pageSize": 20,
      "total": 100,
      "totalPages": 5
    }
  },
  "timestamp": "2026-01-26T10:30:00Z"
}

# 错误响应（HTTP 4xx/5xx）
{
  "code": 400,
  "message": "Invalid request parameters",
  "errors": [
    {
      "field": "email",
      "message": "Email format is invalid"
    }
  ],
  "timestamp": "2026-01-26T10:30:00Z"
}
```

#### 4.1.3 通用请求头

```
Content-Type: application/json
Authorization: Bearer {JWT_TOKEN}
X-Request-ID: {UUID}  # 用于追踪请求
X-Client-Type: app | admin | web  # 客户端类型
X-Client-Version: 1.0.0  # 客户端版本
Accept-Language: ja-JP  # 语言偏好
```

#### 4.1.4 HTTP 状态码规范

| 状态码 | 含义                  | 说明                 |
| ------ | --------------------- | -------------------- |
| 200    | OK                    | 请求成功             |
| 201    | Created               | 资源创建成功         |
| 204    | No Content            | 操作成功，无返回内容 |
| 400    | Bad Request           | 请求参数错误         |
| 401    | Unauthorized          | 未认证               |
| 403    | Forbidden             | 无权限访问           |
| 404    | Not Found             | 资源不存在           |
| 409    | Conflict              | 资源冲突（如重复）   |
| 422    | Unprocessable Entity  | 业务逻辑验证失败     |
| 429    | Too Many Requests     | 频率限制             |
| 500    | Internal Server Error | 服务器错误           |
| 502    | Bad Gateway           | 网关错误             |
| 503    | Service Unavailable   | 服务不可用           |

### 4.2 共用 API 设计建议

#### 4.2.1 端口区分策略（推荐）

**方案一：通过请求头区分（推荐）**

所有请求都到同一个 API 端点，通过 `X-Client-Type` 请求头区分客户端，后端根据权限、数据字段进行差异化处理。

**优点**：

- API 端点统一，易于维护
- 可以灵活地根据客户端类型返回不同的字段
- 便于权限控制和审计

**缺点**：

- 后端逻辑相对复杂

**方案二：通过 URL 路径区分**

```
/api/v1/app/*       - 移动端 API
/api/v1/admin/*     - 管理工具 API
/api/v1/common/*    - 通用 API
```

**优点**：

- 职责划分清晰
- 易于团队分工

**缺点**：

- 代码重复，维护成本高
- API 文档庞大

**建议**：采用**方案一**，即通过请求头区分，但在需要差异化逻辑较大的地方，可以在路由层面提供不同的 controller。

#### 4.2.2 权限控制（Role-Based Access Control）

```
用户角色定义：
- ROLE_USER          # 普通用户
- ROLE_ADMIN         # 管理员
- ROLE_SUPER_ADMIN   # 超级管理员
- ROLE_OPERATOR      # 运营人员（管理工具）

API 权限示例：
GET /api/v1/contents
  - 需要权限：ROLE_USER（看自己有权限的内容）
           ROLE_ADMIN（看所有内容）

POST /api/v1/notifications/send
  - 需要权限：ROLE_ADMIN, ROLE_OPERATOR

GET /api/v1/admin/statistics
  - 需要权限：ROLE_ADMIN, ROLE_SUPER_ADMIN
```

#### 4.2.3 数据隐藏与字段映射

```javascript
// 根据客户端类型和权限，返回不同的字段

// App 客户端请求用户列表（仅返回必要字段）
{
  "userId": "123",
  "username": "user",
  "contractInfo": { ... }
}

// Admin 客户端请求用户列表（返回更多信息）
{
  "userId": "123",
  "username": "user",
  "email": "user@example.com",
  "contractInfo": { ... },
  "createdAt": "2026-01-20",
  "lastLoginAt": "2026-01-26",
  "status": "active"
}
```

---

## 五、认证与授权设计

### 5.1 JWT Token 设计

#### 5.1.1 Token 结构

```
Header.Payload.Signature

Header: {
  "alg": "HS256",
  "typ": "JWT"
}

Payload: {
  "sub": "user123",                    # 用户 ID
  "username": "john_doe",
  "email": "john@example.com",
  "roles": ["ROLE_USER", "ROLE_ADMIN"],
  "clientType": "app|admin|web",      # 客户端类型
  "iat": 1674750600,                  # 签发时间
  "exp": 1674837000,                  # 过期时间（24小时）
  "aud": "our-api",
  "iss": "auth-service"
}
```

#### 5.1.2 Token 颁发与刷新策略

```
登录流程：
1. 用户输入用户名密码 (或通过 Web 端登录)
2. 后台验证，返回两个 Token：
   - Access Token: 有效期 15 分钟（用于 API 调用）
   - Refresh Token: 有效期 7 天（用于刷新 Access Token）

3. 客户端存储这两个 Token
   - Access Token: 存储在内存中
   - Refresh Token: 存储在 secure storage（App）或 HttpOnly Cookie（Web）

刷新 Token 流程：
1. Access Token 过期时，客户端使用 Refresh Token 请求新的 Access Token
2. 后台验证 Refresh Token，返回新的 Access Token
3. 如果 Refresh Token 也过期，需要重新登录

Token 撤销：
1. 用户登出时，�� Token 加入黑名单
2. 黑名单存储在 Redis（有效期为 Token 过期时间）

登出流程：
1. 客户端发送登出请求，附带 Access Token
2. 后台将该 Token 加入黑名单
3. 返回成功响应
```

#### 5.1.3 JWT 实现示例（Spring Boot）

```java
// Token 生成
public class JwtTokenProvider {
    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expiration}")
    private int jwtExpirationMs;

    public String generateToken(UserDetails userDetails, String clientType) {
        return Jwts.builder()
            .setSubject(userDetails.getUsername())
            .claim("roles", userDetails.getAuthorities())
            .claim("clientType", clientType)
            .setIssuedAt(new Date())
            .setExpiration(new Date(System.currentTimeMillis() + jwtExpirationMs))
            .signWith(SignatureAlgorithm.HS256, jwtSecret)
            .compact();
    }

    public String getUsernameFromToken(String token) {
        return Jwts.parser()
            .setSigningKey(jwtSecret)
            .parseClaimsJws(token)
            .getBody()
            .getSubject();
    }

    public boolean validateToken(String token) {
        try {
            Jwts.parser().setSigningKey(jwtSecret).parseClaimsJws(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
```

### 5.2 三种登录流程

#### 5.2.1 App 端登录流程（通过 Web 端 WebView）

````
1. App 启动时检查本地是否有有效的 JWT Token
   ├─ 有效 → 直接进入主页
   └─ 无效/不存在 → 跳转到登录

2. App 打开 WebView，加载 Web 端登录页面
   └─ Web 端 URL: https://web.example.com/login?redirect=app

3. 用户在 Web 端完成登录
   ├─ Web 端验证用户身份
   └─ Web 端生成 JWT Token

4. Web 端将 Token 传递给 App（通过 JavaScript Bridge）
   ```javascript
   window.ReactNativeWebView.postMessage(JSON.stringify({
     type: 'LOGIN_SUCCESS',
     token: 'jwt_token_here'
   }))
````

5. App 接收 Token，保存到本地存储
   ├─ Access Token: 内存存储
   └─ Refresh Token: 加密存储（Android KeyStore / iOS Keychain）

6. App 关闭 WebView，进入主页

7. 后续 API 调用
   └─ 所有请求的 Header 中携带 JWT Token

````

**WebView 通信配置**（React Native）：

```typescript
// App.tsx
import { WebView } from 'react-native-webview';
import { NativeModules } from 'react-native';

const LoginWebView: React.FC = () => {
  const webViewRef = useRef<WebView>(null);

  const handleMessage = (event: any) => {
    const data = JSON.parse(event.nativeEvent.data);

    if (data.type === 'LOGIN_SUCCESS') {
      // 保存 Token
      storeToken('accessToken', data.token);
      // 导航到主页
      navigation.replace('Home');
    }
  };

  return (
    <WebView
      ref={webViewRef}
      source={{ uri: 'https://web.example.com/login?redirect=app' }}
      onMessage={handleMessage}
    />
  );
};
````

#### 5.2.2 Web 端登录流程

```
1. 用户输入邮箱和密码
2. 后台验证并返回 JWT Token
3. 前端保存 Token 到 HttpOnly Cookie（自动跟随请求）
4. 进入首页
```

#### 5.2.3 Admin 端登录流程

```
1. 管理员输入用户名和密码
2. 后台验证并返回 JWT Token
3. 前端保存 Token 到 localStorage 或 HttpOnly Cookie
4. 进入 Dashboard
```

### 5.3 单点登录（SSO）设计

````
目标：用户在 App 中登录一次，访问 Web 端时无需再次登录

实现方案：

1. 用户在 App 中通过 WebView 登录，获得 JWT Token
2. App 保存 Token

3. 当用户从 App 跳转到 Web 端时（深链接）
   ├─ 携带 Token: https://web.example.com/?token=xxx
   └─ 或通过 App 内 WebView 的 Cookie 共享

4. Web 端接收 Token，验证并设置 Cookie
   ```javascript
   const token = new URLSearchParams(location.search).get('token');
   if (token) {
     // 验证 Token
     await verifyToken(token);
     // 设置 Cookie
     document.cookie = `jwt=${token}; path=/; secure; httponly`;
   }
````

5. Web 端后续请求自动带上 Token（从 Cookie）

建议：使用 Secure 和 HttpOnly Flag 保护 Cookie

- Secure: 仅在 HTTPS 连接中传输
- HttpOnly: JavaScript 无法访问（防止 XSS 攻击）

```

### 5.4 e-ninsho SDK 集成

```

个人认证流程：

1. App 在显示个人认证页面时，调用 e-ninsho SDK

   ```typescript
   const ninShoSDK = require('e-ninsho-sdk');

   ninShoSDK.startVerification({
     userId: 'user123',
     onSuccess: result => {
       // 认证成功
       sendVerificationResult(result.token);
     },
     onError: error => {
       console.error('Verification failed', error);
     },
   });
   ```

2. SDK 打开认证流程，用户完成身份验证

3. 认证完成后，App 获得验证令牌

4. App 将令牌发送到后台进行验证

   ```
   POST /api/v1/users/{userId}/verify
   {
     "ninShoToken": "token_from_sdk"
   }
   ```

5. 后台向 e-ninsho 服务器验证令牌

6. 验证成功，标记用户为已认证

后台 API 实现（Spring Boot）：

```java
@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    @PostMapping("/{userId}/verify")
    public ResponseEntity<?> verifyUser(
            @PathVariable String userId,
            @RequestBody VerifyRequest request) {

        // 调用 e-ninsho 验证服务
        boolean isValid = ninShoService.verifyToken(request.getNinShoToken());

        if (isValid) {
            // 更新用户认证状态
            userService.markAsVerified(userId);
            return ResponseEntity.ok(new VerifyResponse("success"));
        } else {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new ErrorResponse("Verification failed"));
        }
    }
}
```

```

---

## 六、权限管理建议

### 6.1 权限管理策略

#### 6.1.1 基于角色的访问控制（RBAC）

```

角色定义：

1. App 端角色

   - ROLE_USER: 普通用户
     - 可以：查看自己的内容、参加抽奖、查看家族成员
     - 不可以：修改他人数据、删除内容

2. Admin 端角色

   - ROLE_CONTENT_MANAGER: 内容管理员

     - 可以：创建、编辑、删除内容
     - 不可以：发送推送、查看用户数据

   - ROLE_PUSH_MANAGER: 推送管理员

     - 可以：发送推送、查看推送历史
     - 不可以：修改内容、管理用户

   - ROLE_ADMIN: 系统管理员

     - 可以：所有操作

   - ROLE_SUPER_ADMIN: 超级管理员
     - 可以：所有操作，包括角色管理

````

#### 6.1.2 权限控制实现（Spring Boot）

```java
// 使用 @PreAuthorize 注解

@RestController
@RequestMapping("/api/v1")
public class ApiController {

    // 所有认证用户都可以访问
    @GetMapping("/contents")
    @PreAuthorize("hasRole('USER')")
    public ResponseEntity<?> getContents() {
        // ...
    }

    // 仅管理员可以访问
    @PostMapping("/contents")
    @PreAuthorize("hasRole('ADMIN') or hasRole('CONTENT_MANAGER')")
    public ResponseEntity<?> createContent(@RequestBody ContentRequest req) {
        // ...
    }

    // 多角色权限
    @PostMapping("/notifications/send")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PUSH_MANAGER')")
    public ResponseEntity<?> sendNotification(@RequestBody NotificationRequest req) {
        // ...
    }

    // 自定义权限检查
    @GetMapping("/users/{userId}/profile")
    @PreAuthorize("hasRole('USER') and @userService.isCurrentUser(#userId)")
    public ResponseEntity<?> getUserProfile(@PathVariable String userId) {
        // ...
    }
}

// UserService 中的权限检查方法
@Service
public class UserService {

    @Autowired
    private SecurityContext securityContext;

    public boolean isCurrentUser(String userId) {
        String currentUserId = securityContext.getCurrentUserId();
        return currentUserId.equals(userId);
    }
}
````

#### 6.1.3 数据级权限控制

````
场景：用户只能看到自己的数据，但管理员可以看到所有数据

实现方式一：在 Service 层添加权限检查
```java
@Service
public class ContractService {

    public List<Contract> getUserContracts(String userId) {
        User currentUser = getCurrentUser();

        // 如果是管理员，返回所有数据
        if (currentUser.hasRole("ROLE_ADMIN")) {
            return contractRepository.findAll();
        }

        // 普通用户只能看到自己的数据
        return contractRepository.findByUserId(userId);
    }
}
````

实现方式二：使用数据库级权限（推荐用于大数据量）

```sql
-- 创建视图，自动过滤用户权限范围内的数据
CREATE VIEW user_contracts_view AS
SELECT c.* FROM contracts c
JOIN users u ON c.user_id = u.id
WHERE c.user_id = CURRENT_USER_ID()
  OR u.role = 'ADMIN';
```

```

### 6.2 App 端与 Admin 端的权限隔离建议

```

1. 使用不同的 JWT Secret 密钥（可选，增强安全性）

   - appJwtSecret: 用于 App 端 Token
   - adminJwtSecret: 用于 Admin 端 Token

2. 在 JWT Payload 中标记客户端类型

   ```json
   {
     "sub": "user123",
     "clientType": "app", // 或 "admin"
     "roles": ["ROLE_USER"]
   }
   ```

3. 在后台 API 中验证客户端类型

   ```java
   @Component
   public class ClientTypeValidator {

       public boolean isAppClient(String clientType) {
           return "app".equals(clientType);
       }

       public boolean isAdminClient(String clientType) {
           return "admin".equals(clientType);
       }
   }

   @RestController
   public class NotificationController {

       @PostMapping("/notifications/send")
       public ResponseEntity<?> sendNotification(
               @RequestBody NotificationRequest req,
               @RequestAttribute String clientType) {

           // 仅 Admin 端可以发送推送
           if (!clientTypeValidator.isAdminClient(clientType)) {
               return ResponseEntity.status(HttpStatus.FORBIDDEN)
                   .body("Only admin clients can send notifications");
           }

           // 处理请求
           return notificationService.send(req);
       }
   }
   ```

4. 在 API 网关（Azure Front Door）层面做限制（可选）
   - 某些 URL 只允许特定客户端访问

````

---

## 七、Azure 服务配置

### 7.1 服务清单与配置

| 服务 | 用途 | 配置建议 |
|-----|------|--------|
| **Azure Front Door Premium + WAF** | API 网关、DDoS 防护、地理分布 | 启用 WAF Rules，限制地区访问 |
| **App Service (Primary)** | Spring Boot 后端（主实例） | Standard S1 及以上，启用自动扩展 |
| **App Service (Secondary)** | Spring Boot 后端（备份实例） | 同 Primary 配置 |
| **Azure SQL Database (Primary)** | 主数据库 | Standard S1+ 或 Premium，启用复制 |
| **Azure SQL Database (Secondary)** | 数据库副本 | 同 Primary，用于故障转移 |
| **Blob Storage** | 视频、图片等静态资源 | Hot Tier，启用 CDN |
| **Service Bus / Storage Queue** | 消息队列 | 用于异步任务（推送通知、日志处理） |
| **Notification Hubs** | 推送通知服务 | 配置 APNs（iOS）、GCM/FCM（Android） |
| **Log Analytics** | 日志分析 | 保留期 30+ 天 |
| **Application Insights** | 应用性能监控 | 配置告警规则 |
| **Microsoft Sentinel** | 安全信息与事件管理 | 监控异常登录、数据访问 |
| **Azure Backup** | 数据备份 | 每日备份，保留 30 天 |
| **Defender for Cloud** | 安全防护 | 启用威胁检测 |
| **Data Transfer (Egress)** | 数据出站流量 | 需估算，优化 CDN 使用 |

### 7.2 Azure App Service 部署配置

```yaml
# app-service-config.yaml

appServiceName: "insurance-app-api-primary"
resourceGroup: "insurance-app-rg"
region: "East Asia"
plan: "AppServicePlan"
runtime: "JAVA|17-java17"

configuration:
  instances: 2
  autoScale:
    minInstances: 2
    maxInstances: 10
    targetCpuUtilization: 70%
    targetMemoryUtilization: 80%

deployment:
  method: "CI/CD Pipeline"
  source: "GitHub"
  branch: "main"
  runtimeStack: "java-17"

networking:
  vnet: "insurance-app-vnet"
  subnet: "app-subnet"
  privateEndpoint: true  # 使用私有端点连接数据库

monitoring:
  applicationInsights: true
  diagnosticLogs: true
  logLevel: "INFO"

security:
  https: true
  tlsVersion: "1.2"
  corsOrigins:
    - "https://app.example.com"
    - "https://admin.example.com"
    - "https://web.example.com"

database:
  connectionString: "${DB_CONNECTION_STRING}"  # 从 Key Vault 读取
  maxPoolSize: 100
  minPoolSize: 10
````

### 7.3 Azure SQL Database 配置

```sql
-- 数据库用户和权限设置

-- 创建应用用户（具有有限权限）
CREATE USER app_user WITH PASSWORD = 'SecurePassword123!@#';

-- 为应用用户授予权限
GRANT SELECT, INSERT, UPDATE, DELETE ON dbo.* TO app_user;

-- 创建备份用户（仅读权限）
CREATE USER backup_user WITH PASSWORD = 'SecureBackupPassword!@#';
GRANT SELECT ON dbo.* TO backup_user;

-- 启用透明数据加密（TDE）
ALTER DATABASE [insurance_app_db] SET ENCRYPTION ON;

-- 启用行级安全（RLS）- 用户只能看到自己的数据
CREATE SCHEMA security;
GO

CREATE FUNCTION security.fn_securitypredicate(@UserId NVARCHAR(MAX))
  RETURNS TABLE
  WITH SCHEMABINDING
AS
RETURN SELECT 1 as fn_securitypredicate
WHERE DATABASE_PRINCIPAL_ID() = DATABASE_PRINCIPAL_ID('dbo')
  OR USER_NAME() = @UserId;

CREATE SECURITY POLICY UserDataPolicy
  ADD FILTER PREDICATE security.fn_securitypredicate(UserId)
    ON dbo.Users,
  ADD BLOCK PREDICATE security.fn_securitypredicate(UserId)
    ON dbo.Users AFTER INSERT, UPDATE, DELETE;
```

### 7.4 存储和 CDN 配置

```bash
# 创建 Blob Storage 容器和 CDN

# 1. 创建 Blob 容器
az storage container create \
  --name videos \
  --account-name insuranceappsa \
  --public-access blob

az storage container create \
  --name images \
  --account-name insuranceappsa \
  --public-access blob

# 2. 启用 Azure CDN
az cdn endpoint create \
  --resource-group insurance-app-rg \
  --profile-name insurance-app-cdn \
  --name insurance-app-cdn-endpoint \
  --origin insuranceappsa.blob.core.windows.net

# 3. 配置缓存规则
az cdn endpoint rule add \
  --resource-group insurance-app-rg \
  --profile-name insurance-app-cdn \
  --name insurance-app-cdn-endpoint \
  --order 1 \
  --selector-match-operator IsFile \
  --selector-match-value "*.jpg" "*.png" "*.mp4" \
  --cache-behavior SetIfMissing \
  --cache-duration "7.00:00:00"  # 7 天
```

### 7.5 消息队列配置

```java
// 使用 Azure Service Bus 进行异步任务处理

@Configuration
public class ServiceBusConfig {

    @Value("${azure.service-bus.connection-string}")
    private String connectionString;

    @Bean
    public ServiceBusClientBuilder serviceBusClientBuilder() {
        return new ServiceBusClientBuilder()
            .connectionString(connectionString);
    }

    @Bean
    public ServiceBusSenderClient notificationSenderClient(
            ServiceBusClientBuilder builder) {
        return builder
            .sender()
            .queueName("notification-queue")
            .buildClient();
    }

    @Bean
    public ServiceBusReceiverClient notificationReceiverClient(
            ServiceBusClientBuilder builder) {
        return builder
            .receiver()
            .queueName("notification-queue")
            .buildClient();
    }
}

// 发送推送通知到队列
@Service
public class NotificationService {

    @Autowired
    private ServiceBusSenderClient senderClient;

    public void sendNotification(Notification notification) {
        ServiceBusMessage message = new ServiceBusMessage(
            objectMapper.writeValueAsBytes(notification)
        );

        // 设置自定义属性
        message.getProperties().put("type", "notification");
        message.getProperties().put("priority", "high");

        senderClient.sendMessage(message);
    }
}

// 接收和处理消息
@Service
public class NotificationConsumer {

    @Autowired
    private ServiceBusReceiverClient receiverClient;

    @Scheduled(fixedDelay = 1000)
    public void consumeMessages() {
        receiverClient.receiveMessages(10).forEach(message -> {
            try {
                Notification notification = objectMapper
                    .readValue(message.getBody(), Notification.class);

                // 处理推送逻辑
                processNotification(notification);

                // 完成消息
                receiverClient.completeMessage(message);
            } catch (Exception e) {
                // 死信队列处理
                receiverClient.deadLetterMessage(message);
            }
        });
    }
}
```

### 7.6 Notification Hubs 配置

```java
// 配置 Azure Notification Hubs

@Configuration
public class NotificationHubsConfig {

    @Value("${azure.notification-hub.connection-string}")
    private String connectionString;

    @Value("${azure.notification-hub.hub-name}")
    private String hubName;

    @Bean
    public NotificationHub notificationHub() {
        return new NotificationHub(connectionString, hubName);
    }
}

// 发送推送通知
@Service
public class PushNotificationService {

    @Autowired
    private NotificationHub notificationHub;

    public void sendPushToUsers(List<String> userIds, String message)
            throws NotificationHubsException {

        // Android 推送（使用 FCM）
        String androidPayload = "{ \"data\" : {\"message\":\"" + message + "\"}}";

        // iOS 推送（使用 APNs）
        String iosPayload = "{\"aps\":{\"alert\":\"" + message + "\"}}";

        // 为每个用户发送推送
        for (String userId : userIds) {
            notificationHub.sendNotification(
                new Notification(androidPayload),
                "userId:" + userId
            );
        }
    }
}
```

### 7.7 监控和告警

```yaml
# 告警规则配���

alerts:
  - name: 'HighErrorRate'
    condition: 'errorRate > 5%'
    severity: 'Critical'
    action: 'Send email notification'

  - name: 'DatabaseConnectionPoolExhausted'
    condition: 'activeConnections > 90'
    severity: 'High'
    action: 'Auto-scale App Service'

  - name: 'HighLatency'
    condition: 'responseTime > 3000ms'
    severity: 'Medium'
    action: 'Send alert'

  - name: 'AbnormalLoginAttempts'
    condition: 'failedLogins > 10 in 5 minutes from single IP'
    severity: 'High'
    action: 'Block IP, alert admin'

# 日志配置
logging:
  level:
    root: 'INFO'
    com.company.insurance: 'DEBUG'

  appInsights:
    enabled: true
    sampleRate: 100 # 收集所有请求

  logAnalytics:
    enabled: true
    retention: '30 days'
```

---

## 八、安全设计

### 8.1 数据安全

```
1. 传输层安全
   - 使用 HTTPS/TLS 1.2+
   - 启用 HSTS (HTTP Strict Transport Security)
   - 使用 Azure Front Door 的 WAF 防护

2. 存储层安全
   - 数据库启用透明加密（TDE）
   - Blob Storage 启用加密
   - 敏感数据（密钥、密码）存储在 Azure Key Vault

3. 应用层安全
   - 输入验证和消毒
   - SQL 注入防护（使用 Prepared Statement）
   - XSS 防护（CSP Header）
   - CSRF 防护（Token）
```

### 8.2 认证与授权安全

```
1. 密码策略
   - 最小长度：12 字符
   - 包含：大小写字母、数字、特殊字符
   - 密码过期时间：90 天
   - 禁止重复使用过去 5 个密码

2. 登录安全
   - 多次失败登录后锁定账户
   - 异常登录检测（不同 IP、地区等）
   - 登录日志记录和审计

3. Token 安全
   - JWT 使用 HS256 算法，定期更换密钥
   - Access Token 有效期：15 分钟
   - Refresh Token 有效期：7 天
   - Token 黑名单（登出后）
```

### 8.3 API 安全

````
1. 速率限制（Rate Limiting）
   ```java
   @Configuration
   public class RateLimitingConfig {

       @Bean
       public RateLimitingFilter rateLimitingFilter() {
           return new RateLimitingFilter();
       }
   }

   @Component
   public class RateLimitingFilter extends OncePerRequestFilter {

       private final LoadingCache<String, AtomicInteger> cache =
           CacheBuilder.newBuilder()
               .expireAfterWrite(1, TimeUnit.MINUTES)
               .build(new CacheLoader<String, AtomicInteger>() {
                   @Override
                   public AtomicInteger load(String key) {
                       return new AtomicInteger(0);
                   }
               });

       private static final int REQUESTS_PER_MINUTE = 60;

       @Override
       protected void doFilterInternal(HttpServletRequest request,
               HttpServletResponse response, FilterChain chain)
               throws ServletException, IOException {

           String key = getClientIdentifier(request);
           int currentCount = cache.getUnchecked(key).getAndIncrement();

           if (currentCount >= REQUESTS_PER_MINUTE) {
               response.setStatus(HttpServletResponse.SC_TOO_MANY_REQUESTS);
               response.getWriter().write("Rate limit exceeded");
               return;
           }

           chain.doFilter(request, response);
       }

       private String getClientIdentifier(HttpServletRequest request) {
           String clientIp = request.getRemoteAddr();
           String userId = request.getHeader("X-User-Id");
           return userId != null ? userId : clientIp;
       }
   }
````

2. CORS 安全配置

   ```java
   @Configuration
   public class CorsConfig {

       @Bean
       public CorsConfigurationSource corsConfigurationSource() {
           CorsConfiguration configuration = new CorsConfiguration();
           configuration.setAllowedOrigins(Arrays.asList(
               "https://app.example.com",
               "https://admin.example.com",
               "https://web.example.com"
           ));
           configuration.setAllowedMethods(Arrays.asList(
               "GET", "POST", "PUT", "DELETE", "OPTIONS"
           ));
           configuration.setAllowedHeaders(Arrays.asList("*"));
           configuration.setAllowCredentials(true);
           configuration.setMaxAge(3600L);

           UrlBasedCorsConfigurationSource source =
               new UrlBasedCorsConfigurationSource();
           source.registerCorsConfiguration("/**", configuration);
           return source;
       }
   }
   ```

3. 请求验证
   ```java
   @RestController
   @RequestMapping("/api/v1")
   public class ApiController {

       @PostMapping("/notifications/send")
       public ResponseEntity<?> sendNotification(
               @Valid @RequestBody NotificationRequest request,
               HttpServletRequest httpRequest) {

           // 验证请求头
           String requestId = httpRequest.getHeader("X-Request-ID");
           if (requestId == null || requestId.isEmpty()) {
               return ResponseEntity.badRequest()
                   .body("Missing X-Request-ID header");
           }

           // 验证请求体
           if (request.getMessage() == null ||
               request.getMessage().length() > 500) {
               return ResponseEntity.badRequest()
                   .body("Invalid message");
           }

           return ResponseEntity.ok().build();
       }
   }
   ```

```

### 8.4 第三方集成安全（e-ninsho SDK）

```

1. SDK 集成安全

   - 仅从官方渠道下载 SDK
   - 定期更新 SDK 到最新版本
   - 在沙箱环境充分测试

2. 认证令牌处理

   - 不在客户端本地存储原始令牌
   - 与后台交互时进行验证
   - 设置令牌过期时间

3. 错误处理
   - 不暴露 SDK 的内部错误信息
   - 记录所有认证失败的尝试

````

---

## 九、数据库设计（概览）

### 9.1 核心表结构

```sql
-- 用户表
CREATE TABLE users (
  id NVARCHAR(36) PRIMARY KEY,
  username NVARCHAR(100) UNIQUE NOT NULL,
  email NVARCHAR(100) UNIQUE NOT NULL,
  password_hash NVARCHAR(255) NOT NULL,
  phone NVARCHAR(20),
  status NVARCHAR(20) DEFAULT 'active',
  is_verified BIT DEFAULT 0,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  last_login_at DATETIME,
  INDEX idx_username (username),
  INDEX idx_email (email)
);

-- 用户角色关联表
CREATE TABLE user_roles (
  id NVARCHAR(36) PRIMARY KEY,
  user_id NVARCHAR(36) NOT NULL,
  role_id NVARCHAR(36) NOT NULL,
  assigned_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (role_id) REFERENCES roles(id),
  UNIQUE(user_id, role_id)
);

-- 角色表
CREATE TABLE roles (
  id NVARCHAR(36) PRIMARY KEY,
  name NVARCHAR(50) UNIQUE NOT NULL,
  description NVARCHAR(255),
  created_at DATETIME DEFAULT GETDATE()
);

-- 内容表
CREATE TABLE contents (
  id NVARCHAR(36) PRIMARY KEY,
  title NVARCHAR(255) NOT NULL,
  description NVARCHAR(MAX),
  image_url NVARCHAR(500),
  video_url NVARCHAR(500),
  status NVARCHAR(20) DEFAULT 'draft',
  created_by NVARCHAR(36) NOT NULL,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  published_at DATETIME,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- 集章记录表
CREATE TABLE stamps (
  id NVARCHAR(36) PRIMARY KEY,
  user_id NVARCHAR(36) NOT NULL,
  stamp_count INT DEFAULT 0,
  last_stamp_date DATETIME,
  created_at DATETIME DEFAULT GETDATE(),
  updated_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  UNIQUE(user_id)
);

-- 抽奖记录表
CREATE TABLE lottery_records (
  id NVARCHAR(36) PRIMARY KEY,
  user_id NVARCHAR(36) NOT NULL,
  prize NVARCHAR(255),
  stamp_count_at_draw INT,
  drawn_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_drawn_at (drawn_at)
);

-- 推送通知表
CREATE TABLE notifications (
  id NVARCHAR(36) PRIMARY KEY,
  title NVARCHAR(255) NOT NULL,
  message NVARCHAR(MAX) NOT NULL,
  target_users NVARCHAR(MAX),
  status NVARCHAR(20) DEFAULT 'pending',
  created_by NVARCHAR(36),
  created_at DATETIME DEFAULT GETDATE(),
  sent_at DATETIME,
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

-- 推送日志表（审计）
CREATE TABLE notification_logs (
  id NVARCHAR(36) PRIMARY KEY,
  notification_id NVARCHAR(36),
  user_id NVARCHAR(36),
  status NVARCHAR(20),
  error_message NVARCHAR(MAX),
  sent_at DATETIME,
  delivered_at DATETIME,
  FOREIGN KEY (notification_id) REFERENCES notifications(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_notification_id (notification_id),
  INDEX idx_user_id (user_id)
);

-- 登出黑名单表（Token 撤销）
CREATE TABLE token_blacklist (
  id NVARCHAR(36) PRIMARY KEY,
  token NVARCHAR(MAX) NOT NULL,
  user_id NVARCHAR(36),
  expires_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT GETDATE(),
  INDEX idx_expires_at (expires_at)
);

-- 审计日志表
CREATE TABLE audit_logs (
  id NVARCHAR(36) PRIMARY KEY,
  user_id NVARCHAR(36),
  action NVARCHAR(100),
  resource_type NVARCHAR(50),
  resource_id NVARCHAR(36),
  old_value NVARCHAR(MAX),
  new_value NVARCHAR(MAX),
  ip_address NVARCHAR(50),
  user_agent NVARCHAR(500),
  created_at DATETIME DEFAULT GETDATE(),
  INDEX idx_user_id (user_id),
  INDEX idx_created_at (created_at),
  INDEX idx_resource_type (resource_type)
);

-- 家族成员关联表
CREATE TABLE family_members (
  id NVARCHAR(36) PRIMARY KEY,
  primary_user_id NVARCHAR(36) NOT NULL,
  member_user_id NVARCHAR(36) NOT NULL,
  relationship NVARCHAR(50),
  bound_at DATETIME DEFAULT GETDATE(),
  FOREIGN KEY (primary_user_id) REFERENCES users(id),
  FOREIGN KEY (member_user_id) REFERENCES users(id),
  UNIQUE(primary_user_id, member_user_id),
  INDEX idx_primary_user_id (primary_user_id)
);
````

### 9.2 性能优化建议

```sql
-- 添加索引优化查询
CREATE INDEX idx_user_created_at ON users(created_at DESC);
CREATE INDEX idx_content_status_published ON contents(status, published_at);
CREATE INDEX idx_stamps_user_count ON stamps(user_id, stamp_count);
CREATE INDEX idx_notification_logs_status ON notification_logs(notification_id, status);

-- 分区优化大表（可选，用于超大规模数据）
CREATE PARTITION FUNCTION pf_audit_logs (DATETIME)
  AS RANGE RIGHT FOR VALUES ('2025-01-01', '2026-01-01', '2027-01-01');

CREATE PARTITION SCHEME ps_audit_logs
  AS PARTITION pf_audit_logs ALL TO ([PRIMARY]);

ALTER TABLE audit_logs
  DROP CONSTRAINT PK_audit_logs;

ALTER TABLE audit_logs
  ADD CONSTRAINT PK_audit_logs PRIMARY KEY (id, created_at)
  ON ps_audit_logs(created_at);
```

---

## 十、部署与 CI/CD

### 10.1 环境配置

```yaml
# 三环境配置示例

development:
  database:
    host: 'insurance-app-dev-db.database.windows.net'
    name: 'insurance_app_dev'
  appService:
    name: 'insurance-app-dev-api'
    instances: 1
  appInsights:
    name: 'insurance-app-dev-insights'

staging:
  database:
    host: 'insurance-app-staging-db.database.windows.net'
    name: 'insurance_app_staging'
  appService:
    name: 'insurance-app-staging-api'
    instances: 2
  appInsights:
    name: 'insurance-app-staging-insights'

production:
  database:
    host: 'insurance-app-prod-db.database.windows.net'
    name: 'insurance_app_prod'
  appService:
    name: 'insurance-app-prod-api-primary'
    instances: 3
    autoScale:
      minInstances: 3
      maxInstances: 10
  appInsights:
    name: 'insurance-app-prod-insights'
  regions:
    - 'East Asia'
    - 'Southeast Asia'
```

### 10.2 GitHub Actions CI/CD 示例

```yaml
# .github/workflows/deploy.yml

name: Deploy to Azure

on:
  push:
    branches:
      - main
      - develop
      - staging
  pull_request:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Java
        uses: actions/setup-java@v3
        with:
          java-version: '17'
          distribution: 'temurin'

      - name: Build with Maven
        run: mvn clean package -DskipTests

      - name: Run Tests
        run: mvn test

      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: app-package
          path: target/*.jar

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'

    steps:
      - uses: actions/checkout@v3

      - name: Download artifacts
        uses: actions/download-artifact@v3
        with:
          name: app-package

      - name: Login to Azure
        uses: azure/login@v1
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}

      - name: Deploy to App Service (Dev)
        if: github.ref == 'refs/heads/develop'
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'insurance-app-dev-api'
          package: '*.jar'

      - name: Deploy to App Service (Staging)
        if: github.ref == 'refs/heads/staging'
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'insurance-app-staging-api'
          package: '*.jar'

      - name: Deploy to App Service (Production)
        if: github.ref == 'refs/heads/main'
        uses: azure/webapps-deploy@v2
        with:
          app-name: 'insurance-app-prod-api-primary'
          package: '*.jar'

      - name: Run smoke tests
        run: |
          curl -f https://insurance-app-api.azurewebsites.net/health || exit 1
```

---

## 十一、监控与告警

### 11.1 关键指标（KPIs）

```
应用性能：
- 平均响应时间 < 500ms
- P99 响应时间 < 2000ms
- 错误率 < 1%
- 可用性 > 99.9%

业务指标：
- 日活跃用户（DAU）
- 内容浏览次数
- 推送送达率 > 90%
- 登录成功率 > 99%

基础设施指标：
- CPU 利用率 < 70%
- 内存利用率 < 80%
- 数据库连接池使用率 < 80%
- 存储容量 < 80%
```

### 11.2 告警 �� 则

```yaml
# 告警配置

alerts:
  - id: 'error_rate_high'
    name: '高错误率告警'
    metric: 'errorRate'
    condition: '> 5%'
    duration: '5 minutes'
    severity: 'critical'
    actions:
      - 'Send email to DevOps team'
      - 'Create incident in Azure DevOps'

  - id: 'response_time_high'
    name: '响应时间过长'
    metric: 'responseTime'
    condition: '> 3000ms (P95)'
    duration: '10 minutes'
    severity: 'high'
    actions:
      - 'Send alert'
      - 'Auto-scale App Service (if enabled)'

  - id: 'database_connections_exhausted'
    name: '数据库连接池耗尽'
    metric: 'activeConnections'
    condition: '> 90% of pool'
    duration: '2 minutes'
    severity: 'critical'
    actions:
      - 'Send immediate alert'
      - 'Check for long-running queries'

  - id: 'abnormal_login_attempts'
    name: '异常登录尝试'
    metric: 'failedLogins'
    condition: '> 10 in 5 minutes from single IP'
    duration: 'immediate'
    severity: 'high'
    actions:
      - 'Block IP temporarily'
      - 'Alert security team'
      - 'Log to Sentinel'
```

---

## 十二、灾难恢复与备份

### 12.1 备份策略

```
数据库备份：
- 频率：每日 3 次（高峰期）或每日 1 次
- 保留期：30 天（运营备份）+ 90 天（归档备份）
- 跨地域：主区域 + 备用地域

应用配置备份：
- 频率：每次部署后
- 存储：Azure Backup + GitHub

日志备份：
- 保留期：30 天（Log Analytics）+ 90 天（存档）
- 索引：按时间、服务、日志级别
```

### 12.2 故障转移计划

```
RTO（恢复时间目标）：< 30 分钟
RPO（恢复点目标）：< 5 分钟

Primary 区域故障时：
1. Application Insights 触发告警（自动故障检测）
2. Azure Front Door 将流量切换到 Secondary 区域
3. 数据库自动故障转移到副本
4. 监控并验证 Secondary 区域服务

恢复步骤：
1. 修复 Primary 区域故障
2. 同步数据（从 Secondary 回写到 Primary）
3. 切换流量回 Primary 区域
4. 监控日志确认无异常
```

---

_文档版本: 1.0_  
_日期: 2026-01-26_
