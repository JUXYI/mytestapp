# 保险类 App 及管理工具 技术架构设计书

## 1. 摘要

### 1.1 项目背景

本项目旨在开发一套适配 10 万日活用户的保险类数字化系统，包含 React Native+TypeScript 移动应用（App）、React+TypeScript 管理工具及 Spring Boot 后端服务，依托 Microsoft Azure 云服务实现部署与运维。App 核心以 WebView 组件加载已有保险 Web 端接口内容，仅保留少量原生交互逻辑（e-ninsho 公共个人认证、集章抽奖、家族连携 SSO、Push 通知接收）；管理工具聚焦内容管理、Push 送信管理核心功能；后端服务无需实现完整业务逻辑，仅需支撑家族连携、SSO 令牌生成等少数核心交互场景，复用已有保险 Web 端接口资源，简化开发成本，保障系统高可用、高安全、易维护。

### 1.2 项目目的

1.  提供便捷的移动端入口，通过 WebView 无缝复用已有保险 Web 端内容，实现用户随时随地查看保险合同、完成身份认证等操作；
2.  实现核心业务场景落地，包括 e-ninsho 公共个人认证、家族连携（绑定家人保险账户并通过 SSO 单点登录至 Web 端查看合同）、集章抽奖、Push 通知推送与接收；
3.  提供高效的管理工具，支持运营人员完成内容管理、Push 通知发送与数据统计；
4.  基于 Azure 云服务构建高可用、可扩展的系统架构，适配 10 万日活用户规模，保障数据安全与业务连续性；
5.  贴合团队技术背景（熟悉但不精通相关技术栈），采用极简架构设计，降低开发与落地难度，缩短项目周期。

## 2. 高层架构

本系统采用“前端-网关-应用服务-数据存储-基础设施”五层架构，以 Azure 云服务为支撑，实现客户端统一接入、路由转发、业务处理、数据存储与运维监控的全链路覆盖，核心聚焦“轻量业务、高可用、易扩展”，整体架构如下：

### 2.1 客户端入口

- 移动应用（RN App）：面向终端用户，核心通过 WebView 组件加载已有保险 Web 端接口内容，提供少量原生交互模块（e-ninsho 认证、集章抽奖、家族连携、Push 接收、基础设置与登出）；
- React 管理工具（Web 端）：面向运营人员，用于内容创建与管理、Push 通知任务管理与发送、推送数据查看；
- 已有保险 Web 端：核心保险合同数据存储与展示载体，通过 SSO 单点登录对接 App 端，实现用户无需重复登录即可查看家人保险合同。

### 2.2 路由与网关

- 核心组件：Azure Front Door Premium + WAF
- 核心功能：
  1.  全局统一入口，负责路由转发：将 App 端、管理工具端的请求分别转发至对应 App Service 实例；
  2.  WAF 防护：启用 OWASP Top 10 防护规则，拦截 SQL 注入、XSS、CSRF 等恶意请求，限制高频恶意访问，放行 e-ninsho 认证回调 IP；
  3.  流量控制与健康检查：单用户 QPS 限制，定期检查主副 App Service 健康状态，故障时自动切换流量；
  4.  CDN 加速：对接 Azure CDN，实现静态资源、视频资源的快速加载，降低客户端访问延迟。

### 2.3 静态与视频资源

- 存储组件：Azure Blob Storage（通用 Blob + 视频专用 Blob）
- 核心设计：
  1.  通用 Blob Storage：存储 App 端、管理工具端的静态资源（图片、样式文件、配置文件），采用热存储层级，启用私有访问权限，仅允许后端服务与 Front Door 访问；
  2.  视频 Blob Storage：存储系统所需视频资源，采用冷存储层级（访问频率低），启用匿名读权限，通过 CDN 加速加载；
  3.  资源加密：所有资源均启用 Azure 自动加密（传输加密+存储加密），保障资源安全。

### 2.4 整体链路流转

客户端请求 → Azure Front Door Premium（路由转发+WAF 防护+CDN 加速） → 主/副 App Service（业务处理） → 主/副 Azure SQL Database（数据存储）/Blob Storage（资源存储） → 响应返回至客户端。

## 3. 技术栈

### 3.1 前端技术栈

#### 3.1.1 React Native App（移动端）

- 核心框架：React Native 0.73+、TypeScript
- 核心组件/工具：
  - 页面渲染：React Native 原生组件 + WebView 组件
  - 状态管理：Redux Toolkit（极简使用，仅管理轻量状态）
  - 路由管理：React Navigation 6.x
  - 网络请求：Axios（TS 封装，统一处理请求拦截、响应拦截）
  - 原生交互：React Native Modules/TurboMod（对接 e-ninsho SDK、Push 通知）
  - 本地存储：AsyncStorage（轻量存储）、MMKV（高性能缓存）
  - UI 组件库：React Native Paper/NativeBase（轻量化，支持主题定制）
  - 其他工具：ESLint、Prettier（代码规范）、EAS Build（打包发布）

#### 3.1.2 React 管理工具（Web 端）

- 核心框架：React 18+、TypeScript、Vite（构建工具）
- 核心组件/工具：
  - UI 组件库：Ant Design Pro（适配管理端场景，开箱即用）
  - 状态管理：Zustand（轻量无样板，简化状态管理）
  - 路由管理：React Router 6.x（路由守卫、嵌套路由）
  - 网络请求：Axios（与 App 端统一封装，复用接口类型定义）
  - 数据可视化：ECharts（Push 推送数据统计、内容访问统计）
  - 其他工具：ESLint、Prettier、Azure Static Web Apps（部署）

### 3.2 后端技术栈

- 核心框架：Spring Boot 3.x、Java 17
- 核心组件/工具：
  - 接口开发：Spring MVC（RESTful API 设计）
  - 持久层：MyBatis-Plus（简化 CRUD 操作）、Spring Data JDBC
  - 鉴权认证：Spring Security、JWT（SSO 令牌生成与校验）
  - 接口文档：Swagger3（SpringDoc，自动生成 API 文档）
  - 缓存：Spring Cache + Redis（Azure Redis Cache，存储 SSO 令牌、高频数据）
  - 异常处理：全局异常处理器（@RestControllerAdvice）
  - 其他工具：Maven（依赖管理）、Lombok（简化代码）

### 3.3 Azure 云服务技术栈

- 网关与安全：Azure Front Door Premium + WAF
- 应用服务：App Service（Primary 主实例、Secondary 副实例）
- 数据存储：Azure SQL Database（Primary 主库、Secondary 副库）、Azure Blob Storage（通用+视频）、Azure Cache for Redis
- 消息推送：Azure Notification Hubs（App 端 Push 通知分发）
- 监控与日志：Application Insights（全链路监控）、Log Analytics（日志收集与分析）、Microsoft Sentinel（安全分析与告警）
- 安全防护：Defender for Cloud（云资源安全防护）、Azure Key Vault（敏感信息托管）
- 备份与容灾：Azure Backup（数据备份）
- DevOps：Azure DevOps（CI/CD 流水线、代码仓库）

### 3.4 其他工具

- 代码仓库：Azure Repos/GitHub
- 测试工具：JMeter（压力测试）、JUnit（后端单元测试）
- 安全工具：OWASP Dependency Check（依赖包安全检测）

## 4. 前端架构

前端采用**极简版 MVVM 架构**，抛弃复杂分层与冗余代码，仅保留“View-ViewModel-Model”核心三层，贴合“App 以 WebView 为主、业务逻辑简单”的场景，同时保证代码可维护性，避免面条代码。

### 4.1 React Native App 架构（极简 MVVM）

#### 4.1.1 架构分层

1.  View 层（视图层）：核心为 WebView 组件，加载已有保险 Web 端接口内容；少量原生页面（e-ninsho 认证页面、集章抽奖页面、家族连携页面、设置页面），仅负责 UI 渲染与用户行为采集（点击、输入等），不包含任何业务逻辑。
2.  ViewModel 层（视图模型层）：作为 View 与 Model 的中间层，管理轻量状态（WebView 加载状态、e-ninsho 认证状态、集章数、Push 通知状态），接收 View 层的用户行为，调度 Model 层的 API 调用，将处理结果反馈给 View 层，驱动 UI 更新；无复杂业务逻辑，仅负责状态流转与请求调度。
3.  Model 层（数据层）：封装 API 调用（已有保险 Web 端接口、后端新增核心接口<家族连携、SSO 令牌生成等>）、本地存储操作（AsyncStorage/MMKV）、e-ninsho SDK 调用，提供统一的数据访问入口；无需拆分仓库、数据源等复杂模块，极简设计。

#### 4.1.2 核心模块设计

- WebView 模块：核心模块，负责加载已有保险 Web 端 URL，携带 SSO 令牌实现单点登录，处理 WebView 与原生的简单通信（如跳转原生集章页面）；
- 认证模块：集成 e-ninsho SDK，实现公共个人认证，对接后端认证接口，管理登录状态与 JWT 令牌；
- 家族连携模块：对接后端家族连携接口，实现家人保险账户绑定、SSO 令牌获取，跳转 WebView 查看家人保险合同；
- 集章抽奖模块：对接后端接口，记录用户集章行为、查询集章数，实现满 20 章解锁抽奖功能；
- Push 通知模块：集成 Azure Notification Hubs SDK，接收 Push 通知，处理通知点击事件（跳转对应 WebView 页面）；
- 设置模块：提供常规设置、登出等功能，对接后端登出接口，清除本地缓存与登录状态。

#### 4.1.3 核心设计原则

- 极简优先：仅保留核心分层，不添加冗余模块，降低开发与维护成本；
- WebView 为主：最大化复用已有保险 Web 端内容，减少原生开发工作量；
- 状态轻量：仅管理必要状态，避免状态冗余，简化调试；
- 复用性：API 封装、通用组件（按钮、弹窗）全局复用，减少重复开发。

#### 4.1.4 代码目录结构

```
src/
├── assets/                  # 静态资源：图片、字体、样式文件
│   ├── images/              # 图片资源（图标、背景图）
│   └── styles/              # 全局样式（主题、通用样式）
├── components/              # 通用组件：按钮、弹窗、加载框等（全局复用）
│   ├── Button/              # 自定义按钮组件
│   ├── Loading/             # 加载组件
│   └── Modal/               # 弹窗组件
├── view/                    # View层：页面与组件（仅渲染，无业务逻辑）
│   ├── webviews/            # WebView核心页面
│   │   ├── InsuranceWebView.tsx  # 保险合同WebView页面
│   │   └── BaseWebView.tsx       # 通用WebView封装页面
│   └── native/              # 少量原生交互页面
│       ├── auth/            # e-ninsho认证相关页面
│       │   └── ENinshoAuthPage.tsx
│       ├── familyLink/      # 家族连携相关页面
│       │   ├── FamilyBindPage.tsx
│       │   └── FamilyContractPage.tsx
│       ├── stamp/           # 集章抽奖相关页面
│       │   ├── StampListPage.tsx
│       │   └── LotteryPage.tsx
│       ├── push/            # Push通知相关页面
│       │   └── PushDetailPage.tsx
│       └── settings/        # 设置页面
│           └── SettingsPage.tsx
├── viewModel/               # ViewModel层：轻量状态与请求调度
│   ├── WebViewVM.ts         # WebView相关状态管理
│   ├── AuthVM.ts            # 认证相关状态管理
│   ├── FamilyLinkVM.ts      # 家族连携相关状态管理
│   ├── StampVM.ts           # 集章抽奖相关状态管理
│   ├── PushVM.ts            # Push通知相关状态管理
│   └── SettingsVM.ts        # 设置相关状态管理
├── model/                   # Model层：数据访问（API/存储/SDK）
│   ├── api/                 # API封装
│   │   ├── index.ts         # API请求拦截/响应拦截封装
│   │   ├── authApi.ts       # 认证相关API
│   │   ├── familyLinkApi.ts # 家族连携相关API
│   │   ├── stampApi.ts      # 集章抽奖相关API
│   │   └── pushApi.ts       # Push通知相关API
│   ├── storage/             # 本地存储封装
│   │   ├── AsyncStorageUtil.ts
│   │   └── MMKVUtil.ts
│   └── sdk/                 # 第三方SDK封装
│       ├── ENinshoSDK.ts    # e-ninsho SDK封装
│       └── NotificationHubsSDK.ts # Push SDK封装
├── navigation/              # 路由配置：React Navigation
│   └── AppNavigator.tsx
├── utils/                   # 通用工具类
│   ├── request.ts           # 网络请求工具
│   ├── format.ts            # 数据格式化工具
│   └── device.ts            # 设备相关工具
└── types/                   # TS类型定义
    ├── auth.types.ts
    ├── familyLink.types.ts
    └── stamp.types.ts
```

### 4.2 React 管理工具 架构（极简 MVVM）

#### 4.2.1 架构分层

1.  View 层（视图层）：React 组件与页面，包括登录页面、内容管理页面（创建、编辑、发布）、Push 送信管理页面（创建、发送、统计），仅负责 UI 渲染与用户操作采集，依赖 ViewModel 层的状态更新 UI。
2.  ViewModel 层（视图模型层）：管理页面状态（表单状态、列表分页状态、Push 发送状态、加载状态），接收 View 层的操作指令，调度 Model 层的 API 调用，处理简单的状态流转，无复杂业务逻辑。
3.  Model 层（数据层）：封装后端接口调用（内容管理、Push 送信、登录认证），提供统一的数据访问入口，简化 ViewMode 层的调用逻辑。

#### 4.2.2 核心模块设计

- 登录认证模块：对接后端登录接口，实现管理员登录、权限校验，管理登录状态（JWT 令牌）；
- 内容管理模块：对接后端内容接口，实现内容创建、编辑、发布、删除，支持内容列表查询与筛选；
- Push 送信管理模块：对接后端 Push 接口与 Azure Notification Hubs，实现 Push 通知内容创建、推送范围选择（全部/指定用户）、推送任务提交、推送结果统计（送达率、点击率）；
- 系统设置模块：提供简单的系统配置（如 Push 推送参数、内容审核规则）。

#### 4.2.3 核心设计原则

- 贴合管理端场景：基于 Ant Design Pro 组件库，提升开发效率，保证 UI 一致性；
- 极简分层：避免复杂状态管理与分层，降低开发难度，适配团队技术背景；
- 高效交互：优化表单操作、列表查询等高频场景，提升运营人员工作效率。

#### 4.2.4 代码目录结构

```
src/
├── assets/                  # 静态资源：图片、样式、图标
│   ├── images/
│   └── styles/
├── components/              # 通用组件：表格、表单、统计卡片等
│   ├── Table/               # 通用表格组件（带分页、筛选）
│   ├── Form/                # 通用表单组件
│   └── StatCard/            # 数据统计卡片组件
├── view/                    # View层：页面与组件（仅渲染）
│   ├── login/               # 登录页面
│   │   └── LoginPage.tsx
│   ├── content/             # 内容管理相关页面
│   │   ├── ContentListPage.tsx   # 内容列表页
│   │   └── ContentEditPage.tsx   # 内容编辑页
│   ├── push/                # Push送信管理相关页面
│   │   ├── PushListPage.tsx      # Push任务列表页
│   │   ├── PushCreatePage.tsx    # Push任务创建页
│   │   └── PushStatPage.tsx      # Push数据统计页
│   └── settings/            # 系统设置页面
│       └── SettingsPage.tsx
├── viewModel/               # ViewModel层：状态与请求调度
│   ├── LoginVM.ts           # 登录相关状态管理
│   ├── ContentVM.ts         # 内容管理相关状态管理
│   ├── PushVM.ts            # Push送信相关状态管理
│   └── SettingsVM.ts        # 系统设置相关状态管理
├── model/                   # Model层：数据访问
│   ├── api/                 # API封装
│   │   ├── index.ts         # 请求拦截/响应拦截
│   │   ├── loginApi.ts      # 登录相关API
│   │   ├── contentApi.ts    # 内容管理相关API
│   │   └── pushApi.ts       # Push送信相关API
│   └── storage/             # 本地存储（token、用户信息）
│       └── LocalStorageUtil.ts
├── router/                  # 路由配置：React Router
│   └── index.tsx
├── utils/                   # 通用工具类
│   ├── request.ts           # 网络请求工具
│   ├── format.ts            # 时间/数据格式化工具
│   └── auth.ts              # 权限校验工具
└── types/                   # TS类型定义
    ├── content.types.ts
    └── push.types.ts
```

### 4.3 前端通用设计

- 接口统一封装：App 端与管理工具端统一封装 Axios 请求，处理请求拦截（添加 JWT 令牌）、响应拦截（统一错误处理、状态码判断），复用接口类型定义（TS），避免类型不一致；
- 代码规范：采用 ESLint+Prettier 统一代码风格，通过 Git Hooks（husky+lint-staged）保证提交代码符合规范；
- 权限控制：App 端基于 JWT 令牌实现登录权限控制，管理工具端实现页面、按钮级别的简单权限控制；
- 兼容性：App 端支持 iOS 14.0+、Android 8.0+；管理工具端支持 Chrome、Firefox、Edge 等主流浏览器最新版前 2 个版本。

## 5. 后端架构

后端采用**轻量版 Clean Architecture**，抛弃纯 Clean Architecture 的复杂内层设计，仅保留“接口层-业务服务层-数据访问层”核心三层，聚焦家族连携、SSO 令牌生成等少数核心业务逻辑，复用已有保险 Web 端接口资源，简化开发与落地难度，同时保证代码可维护性与扩展性。

### 5.1 架构分层

#### 5.1.1 接口层（Controller）

- 核心职责：接收前端（App 端、管理工具端）请求，进行参数校验（请求体、请求参数合法性校验），调用业务服务层的方法，返回标准化响应（统一成功/失败格式、状态码）；
- 核心模块：家族连携接口模块、SSO 令牌接口模块、内容管理接口模块、Push 送信接口模块、登录认证接口模块；
- 设计原则：无任何业务逻辑，仅负责请求接收与响应返回，接口命名规范、路径清晰，适配 RESTful API 设计规范。

#### 5.1.2 业务服务层（Service）

- 核心职责：系统核心业务逻辑处理，仅实现家族连携、SSO 令牌生成、Push 推送调度、内容管理等少数必要业务逻辑，复用已有保险 Web 端接口资源；
- 核心模块：
  1.  家族连携服务：实现家人保险账户绑定校验、亲属关系验证、家族权限控制；
  2.  SSO 服务：实现 SSO 令牌生成、校验、过期管理，支撑 App 端到已有保险 Web 端的单点登录；
  3.  Push 服务：对接 Azure Notification Hubs，实现 Push 通知调度、批量推送、推送结果统计；
  4.  内容服务：实现内容创建、编辑、发布、删除的简单业务逻辑，支撑管理工具端操作；
  5.  认证服务：实现 App 端用户、管理工具端管理员的登录认证、JWT 令牌生成与校验；
- 设计原则：业务逻辑简洁清晰，避免复杂事务与冗余代码；采用接口+实现类的方式，便于后续扩展；核心业务逻辑做日志记录，便于故障定位。

#### 5.1.3 数据访问层（Repository）

- 核心职责：负责数据持久化操作，对接 Azure SQL Database、Azure Cache for Redis、Azure Blob Storage 等数据存储组件，提供统一的数据访问入口；
- 核心模块：家族连携数据访问模块、用户数据访问模块、内容数据访问模块、Push 推送数据访问模块、SSO 令牌数据访问模块；
- 设计原则：无任何业务逻辑，仅负责 CRUD 操作；基于 MyBatis-Plus 简化代码开发，针对高频查询场景添加索引；对接 Azure 服务采用 SDK 调用，简化数据访问逻辑。

#### 5.1.4 基础支撑层（Common/Config）

- 核心职责：提供全局通用支撑能力，为其他三层提供服务；
- 核心模块：
  1.  通用组件：异常处理（全局异常处理器）、响应结果封装（标准化响应）、工具类（时间、加密、UUID 生成等）、常量定义；
  2.  配置模块：Azure 服务配置（App Service、SQL、Notification Hubs 等）、Redis 配置、JWT 配置、跨域配置（由 Front Door 统一处理，后端仅做辅助配置）；
  3.  安全模块：敏感信息加密、权限校验辅助、e-ninsho SDK 集成配置；
- 设计原则：通用化、标准化，避免重复开发，支撑系统各模块正常运行。

#### 5.1.5 代码目录结构

```
src/main/java/com/insurance/
├── controller/              # 接口层：接收请求、返回响应
│   ├── AuthController.java      # 认证相关接口
│   ├── FamilyLinkController.java # 家族连携相关接口
│   ├── SSOController.java       # SSO令牌相关接口
│   ├── ContentController.java   # 内容管理相关接口
│   └── PushController.java      # Push送信相关接口
├── service/                 # 业务服务层：核心业务逻辑
│   ├── impl/                # 服务实现类
│   │   ├── AuthServiceImpl.java
│   │   ├── FamilyLinkServiceImpl.java
│   │   ├── SSOServiceImpl.java
│   │   ├── ContentServiceImpl.java
│   │   └── PushServiceImpl.java
│   ├── AuthService.java     # 认证服务接口
│   ├── FamilyLinkService.java # 家族连携服务接口
│   ├── SSOService.java      # SSO服务接口
│   ├── ContentService.java  # 内容管理服务接口
│   └── PushService.java     # Push送信服务接口
├── repository/              # 数据访问层：CRUD操作
│   ├── impl/                # 仓库实现类
│   │   ├── UserRepositoryImpl.java
│   │   ├── FamilyLinkRepositoryImpl.java
│   │   ├── ContentRepositoryImpl.java
│   │   └── PushRepositoryImpl.java
│   ├── UserRepository.java  # 用户数据访问接口
│   ├── FamilyLinkRepository.java # 家族连携数据访问接口
│   ├── ContentRepository.java # 内容数据访问接口
│   └── PushRepository.java  # Push数据访问接口
├── model/                   # 数据模型
│   ├── entity/              # 数据库实体类
│   │   ├── User.java
│   │   ├── FamilyLink.java
│   │   ├── Content.java
│   │   └── PushTask.java
│   └── dto/                 # 前后端交互DTO
│       ├── request/         # 请求DTO
│       │   ├── AuthRequest.java
│       │   └── FamilyBindRequest.java
│       └── response/        # 响应DTO
│           ├── BaseResponse.java
│           └── StampResponse.java
├── common/                  # 基础支撑层-通用组件
│   ├── exception/           # 异常处理
│   │   ├── BusinessException.java
│   │   └── GlobalExceptionHandler.java
│   ├── util/                # 通用工具类
│   │   ├── DateUtil.java
│   │   ├── EncryptUtil.java
│   │   └── RedisUtil.java
│   └── constant/            # 常量定义
│       ├── AuthConstants.java
│       └── RedisConstants.java
├── config/                  # 基础支撑层-配置模块
│   ├── AzureConfig.java     # Azure服务配置
│   ├── RedisConfig.java     # Redis配置
│   ├── SecurityConfig.java  # 安全配置（JWT/Spring Security）
│   └── WebConfig.java       # Web配置（跨域等）
└── Application.java         # Spring Boot启动类

src/main/resources/
├── application.yml          # 全局配置文件
├── application-dev.yml      # 开发环境配置
├── application-test.yml     # 测试环境配置
├── application-prod.yml     # 生产环境配置
├── mybatis/                 # MyBatis映射文件
│   ├── UserMapper.xml
│   └── FamilyLinkMapper.xml
└── static/                  # 静态资源（备用）
```

### 5.2 核心业务流程支撑

- e-ninsho 认证支撑：后端接收 App 端传递的 e-ninsho 认证令牌，调用 e-ninsho 官方接口校验令牌有效性，校验通过后生成系统 JWT 令牌，返回给 App 端，完成登录状态绑定；
- 家族连携支撑：后端接收 App 端的家族绑定请求，校验用户与家人的亲属关系及保险账户关联性，绑定成功后存储绑定关系；接收 App 端的 SSO 令牌请求，校验绑定关系有效性后，生成短时效 SSO 令牌，支撑 App 端跳转至已有保险 Web 端；
- Push 推送支撑：后端接收管理工具端的 Push 推送任务，调度 Azure Notification Hubs 进行批量推送（每批 1 万用户，避免限流），记录推送日志，统计推送结果（送达率、点击率），供管理工具端查询；
- 内容管理支撑：后端接收管理工具端的内容操作请求，完成内容的持久化存储，同步更新至 Blob Storage（如需存储图片/视频），供 App 端 WebView 加载展示。

### 5.3 设计原则

1.  轻量简洁：抛弃复杂分层与冗余代码，仅实现必要业务逻辑，降低开发与落地难度，适配团队技术背景；
2.  复用优先：最大化复用已有保险 Web 端接口资源，减少后端开发工作量；
3.  可维护性：核心业务逻辑与数据访问分离，接口与实现分离，便于后续故障定位与功能扩展；
4.  高可用适配：对接 Azure 双活服务（主副 App Service、主副 SQL），确保业务服务连续可用；
5.  安全合规：贴合保险业务需求，实现敏感数据加密、权限控制、日志审计，保障数据安全与合规。

## 6. 基础设施与安全

本系统的基础设施完全基于 Microsoft Azure 云服务构建，聚焦“高可用、高安全、易运维”，结合保险业务的安全需求，整合 Azure 各类安全服务，形成完整的基础设施与安全防护体系。

### 6.1 Azure 基础设施部署

#### 6.1.1 网关与接入层

- 组件：Azure Front Door Premium + WAF
- 部署配置：
  1.  路由规则：按请求路径转发至对应服务，App 端请求转发至 App Service（Primary/Secondary），管理工具端静态资源请求转发至 Azure Static Web Apps，静态/视频资源请求转发至 Blob Storage+CDN；
  2.  WAF 配置：启用 OWASP Top 10 防护规则，拦截 SQL 注入、XSS、CSRF 等恶意请求；配置高频请求限制（单 IP 1 分钟 ≤100 次），放行 e-ninsho 认证回调 IP；限制请求体大小 ≤10MB，防护接口滥用；
  3.  健康检查：配置健康检查接口（后端提供），检查间隔 30 秒，连续 3 次失败则自动将流量切换至副实例；
  4.  缓存配置：静态资源（图片、CSS、JS）缓存 TTL=1 小时，接口非敏感响应缓存 TTL=5 分钟，降低后端服务压力。

#### 6.1.2 应用服务层

- 组件：App Service（Primary 主实例、Secondary 副实例）
- 部署配置：
  1.  定价层：Primary 实例采用 Standard S3（4 核 8G），适配 10 万日活并发需求；Secondary 实例采用 Standard S2（2 核 4G），用于灾备与流量分担；
  2.  弹性伸缩：Primary 实例启用自动伸缩规则，CPU 使用率>70%时增加实例（最大 4 个），CPU 使用率<30%时减少实例，适配流量波动；Secondary 实例与 Primary 同步配置，仅在 Primary 故障时启用；
  3.  部署模式：采用蓝绿部署策略，避免部署过程中服务中断，便于版本回滚；
  4.  网络配置：加入 Azure Virtual Network（VNet），仅允许 Front Door 访问，禁止公网直接访问，提升安全性；
  5.  日志配置：开启应用日志、HTTP 日志，输出至 Log Analytics，便于故障定位与分析。

#### 6.1.3 数据存储层

1.  Azure SQL Database（Primary 主库、Secondary 副库）

    - 部署配置：均采用 General Purpose 定价层（GP_Gen5_4，4 核 16G），启用异地复制功能，实现主副库数据实时同步；
    - 高可用配置：启用自动故障转移，故障发生后 1 分钟内自动将 Secondary 副库提升为 Primary 主库，保障数据连续性；
    - 索引配置：针对用户表、家族绑定表、内容表、集章表等核心表，根据高频查询场景创建索引，优化查询性能；
    - 安全配置：启用 Defender for Cloud 防护，检测 SQL 注入攻击、弱密码等安全风险；启用数据加密（传输+存储），保障数据安全。

2.  Azure Blob Storage（通用+视频）

    - 部署配置：创建两个容器，分别用于存储通用静态资源（热存储层级）、视频资源（冷存储层级）；
    - 权限配置：通用静态资源容器设为私有权限，仅后端服务与 Front Door 可访问；视频资源容器设为匿名读权限，通过 CDN 加速访问；
    - 冗余配置：启用异地冗余存储，保障资源在区域故障时可恢复；
    - 加密配置：启用 Azure 自动加密，传输过程采用 HTTPS 加密，存储过程采用 Azure 内置加密算法。

3.  Azure Cache for Redis
    - 部署配置：采用 Standard 定价层，主从架构，用于存储 SSO 令牌、用户登录状态、高频查询数据（集章数等）；
    - 缓存策略：SSO 令牌缓存有效期 10 分钟，高频查询数据缓存有效期 5 分钟，避免缓存冗余与数据不一致；
    - 安全配置：启用密码认证，限制访问 IP，仅允许 App Service 访问，保障缓存安全。

#### 6.1.4 消息推送层

- 组件：Azure Notification Hubs
- 部署配置：
  1.  推送配置：上传 iOS/Android 推送证书至 Azure Key Vault，后端通过 SDK 动态获取，配置推送通道；
  2.  推送策略：批量推送（每批 1 万用户），重试次数 3 次，避免推送失败；启用推送日志，同步至 Log Analytics；
  3.  安全配置：启用访问密钥认证，仅后端服务可调用推送接口，防止滥用。

#### 6.1.5 备份与容灾层

- 组件：Azure Backup
- 部署配置：
  1.  备份范围：Azure SQL Database（主库+副库）、Blob Storage、App Service 配置、后端代码配置；
  2.  备份策略：每日凌晨 2 点执行全量备份，每 4 小时执行一次增量备份，备份保留期 30 天；
  3.  恢复配置：支持任意时间点恢复（30 天内），配置恢复测试流程，每月执行一次恢复演练，保障备份有效性。

### 6.2 安全体系设计

#### 6.2.1 网络安全

- 边界防护：通过 Azure Front Door Premium + WAF 构建网络边界防护，拦截恶意请求，限制非法访问；
- 网络隔离：所有核心服务（App Service、SQL、Redis）均加入 VNet，配置网络安全组（NSG），仅开放必要端口（443/80），禁止公网直接访问；
- 传输加密：所有网络传输均采用 HTTPS 加密，包括客户端与 Front Door、Front Door 与 App Service、App Service 与 SQL/Redis/Blob Storage 之间的通信，避免数据传输过程中泄露。

#### 6.2.2 数据安全

- 存储加密：Azure SQL、Blob Storage、Redis 均启用 Azure 自动加密功能，对数据进行静态加密，保障数据存储安全；
- 敏感信息管理：所有敏感信息（数据库密码、JWT 密钥、Push 证书、e-ninsho API 密钥）均托管在 Azure Key Vault，后端通过 SDK 动态获取，避免硬编码；
- 数据脱敏：后端返回保险合同、用户身份信息等敏感数据时，对敏感字段（身份证号、手机号）进行脱敏处理，避免敏感信息泄露；
- 数据访问控制：基于 Azure RBAC（基于角色的访问控制），为每个开发者、运维人员分配最小权限，仅允许访问其负责的环境与服务；核心数据（保险合同、用户认证信息）的访问的操作均记录审计日志。

#### 6.2.3 应用安全

- 认证授权：采用 JWT 无状态鉴权，实现 App 端、管理工具端的登录认证；家族连携功能实现精细化权限控制，仅允许查看绑定的家人保险合同；
- 输入校验：所有前端请求均经过后端参数校验，防止非法参数注入、SQL 注入等攻击；
- SDK 安全：e-ninsho SDK 进行签名校验，防止 SDK 被篡改；定期更新 SDK 版本，修复安全漏洞；
- 漏洞防护：通过 Defender for Cloud 定期扫描云资源、应用依赖包，检测安全漏洞，提供修复建议，及时修复高危漏洞。

#### 6.2.4 安全监控与审计

- 安全监控：通过 Microsoft Sentinel 整合所有安全日志（WAF 日志、SQL 审计日志、应用安全日志），配置安全告警规则（异常登录、敏感数据批量访问、接口失败率异常等），触发告警后通过邮件、短信推送通知运维人员；
- 日志审计：所有核心操作（用户登录、e-ninsho 认证、保险合同查看、Push 推送、内容管理）均记录详细日志，包括用户 ID、操作时间、IP 地址、操作结果，日志保留 90 天，便于安全审计与故障追溯；
- 合规检查：通过 Defender for Cloud 进行合规检查，适配保险行业数据安全合规要求，及时整改不合规项。

## 7. DevOps & CI/CD（基于 Azure DevOps）

结合团队技术背景与项目特点，采用 Azure DevOps 构建完整的 DevOps 体系，实现代码管理、持续集成（CI）、持续部署（CD）、环境管理的全流程自动化，提升开发效率，保障部署质量，适配 10 万日活用户的部署需求。

### 7.1 代码管理

- 代码仓库：采用 Azure Repos（Git）作为代码仓库，按模块划分代码目录（App 前端、管理工具前端、后端服务），实现代码隔离与统一管理；
- 分支管理策略：
  1.  主分支（main）：仅存储生产环境代码，禁止直接提交，仅允许通过合并请求（MR）从开发分支、测试分支合并；
  2.  开发分支（develop）：存储开发环境代码，所有开发人员在开发分支进行代码开发与提交；
  3.  测试分支（test）：从开发分支合并代码，用于测试环境部署与测试，测试通过后合并至主分支；
  4.  特性分支（feature/\*）：开发新功能时，从开发分支创建特性分支，功能开发完成后合并至开发分支，删除特性分支；
- 代码质量控制：配置 Git Hooks（husky+lint-staged），提交代码前自动执行 ESLint、Prettier 代码检查，确保代码符合规范；后端代码执行 Java 代码规范检查（Alibaba Java Coding Guidelines），禁止不合规代码提交。

### 7.2 持续集成（CI）流水线

基于 Azure DevOps Pipelines 构建 CI 流水线，实现代码提交后的自动构建、测试、打包，确保代码质量，流水线分为前端（App+管理工具）、后端两条独立流水线，同步执行。

#### 7.2.1 前端 CI 流水线（App+管理工具）

1.  触发条件：开发分支、测试分支、主分支有代码提交或合并请求时，自动触发流水线；
2.  核心步骤：
    1.  代码拉取：从 Azure Repos 拉取最新代码；
    2.  依赖安装：执行 npm install 安装前端依赖包，缓存依赖包，提升构建速度；
    3.  代码检查：执行 ESLint、Prettier 检查代码规范，检查失败则终止流水线；
    4.  单元测试：执行前端单元测试（Jest），测试覆盖率需达到 60%以上，否则终止流水线；
    5.  构建打包：App 端执行 EAS Build 打包，生成 iOS/Android 安装包；管理工具端执行 Vite 构建，生成静态资源包；
    6.  产物上传：将构建产物（安装包、静态资源包）上传至 Azure Artifacts，作为 CD 流水线的部署源。

#### 7.2.2 后端 CI 流水线

1.  触发条件：与前端流水线一致，开发分支、测试分支、主分支有代码提交或合并请求时触发；
2.  核心步骤：
    1.  代码拉取：从 Azure Repos 拉取最新后端代码；
    2.  依赖安装：通过 Maven 安装后端依赖包，缓存依赖包；
    3.  代码检查：执行 Java 代码规范检查、依赖包安全检测（OWASP Dependency Check），检查失败则终止流水线；
    4.  单元测试：执行 JUnit 单元测试，测试覆盖率需达到 70%以上，否则终止流水线；
    5.  打包构建：通过 Maven 打包生成 Spring Boot 可执行 JAR 包；
    6.  产物上传：将 JAR 包上传至 Azure Artifacts，作为 CD 流水线的部署源。

### 7.3 持续部署（CD）流水线

基于 Azure DevOps Pipelines 构建 CD 流水线，实现构建产物的自动部署，按环境（开发、测试、生产）分阶段部署，确保部署过程安全、可控，适配主副 App Service 的双活部署需求。

#### 7.3.1 环境管理

- 环境划分：分为开发环境、测试环境、生产环境，三个环境采用独立的 Azure 资源组（Resource Group），实现环境隔离，避免相互影响；
  1.  开发环境：用于开发人员日常调试，部署配置简化，资源规格较低；
  2.  测试环境：用于功能测试、性能测试、安全测试，部署配置与生产环境一致；
  3.  生产环境：面向终端用户，采用主副双活部署（App Service、SQL），保障高可用，资源规格适配 10 万日活。

#### 7.3.2 部署策略

- 开发/测试环境：采用自动部署策略，CI 流水线构建成功后，自动触发 CD 流水线，将产物部署至对应环境；
- 生产环境：采用蓝绿部署策略，避免部署过程中服务中断，核心步骤：
  1.  先将新版本部署至 App Service Secondary（副实例），部署完成后执行冒烟测试，验证服务可用性；
  2.  冒烟测试通过后，通过 Azure Front Door 将流量逐步切换至 Secondary 实例，监控服务运行状态；
  3.  确认服务运行正常后，将新版本部署至 App Service Primary（主实例），执行冒烟测试；
  4.  Primary 实例部署完成并验证正常后，将流量切换回 Primary 实例，Secondary 实例作为灾备，保留新版本，便于回滚；
  5.  部署完成后，执行健康检查与性能测试，确保系统正常运行。

#### 7.3.3 核心部署步骤

1.  产物拉取：从 Azure Artifacts 拉取 CI 流水线生成的构建产物（App 安装包、管理工具静态资源包、后端 JAR 包）；
2.  部署准备：检查目标环境 Azure 资源（App Service、SQL、Blob Storage）运行状态，确认环境可用；
3.  后端部署：将 JAR 包部署至 App Service（Primary/Secondary），重启服务，执行健康检查；
4.  前端部署：将管理工具静态资源包部署至 Azure Static Web Apps；将 App 安装包部署至 Azure DevOps，供测试人员、运营人员下载，或提交至应用商店；
5.  配置更新：同步更新环境配置（如数据库连接、Azure 服务配置），确保系统正常运行；
6.  测试验证：执行冒烟测试、接口测试，验证部署后的功能可用性；生产环境额外执行性能测试，确认适配流量需求；
7.  日志记录：记录部署过程、部署版本、部署结果，便于后续追溯与回滚。

### 7.4 回滚策略

- 触发条件：部署后出现功能异常、性能瓶颈、服务不可用等问题时，触发回滚；
- 回滚流程：
  1.  生产环境：通过 Azure Front Door 将流量快速切换至未部署新版本的实例（蓝绿部署备用实例），恢复服务正常运行；
  2.  执行回滚流水线，将构建产物回滚至前一个稳定版本，部署至对应 App Service 实例；
  3.  回滚完成后，执行冒烟测试、接口测试，确认服务恢复正常；
  4.  记录回滚原因、回滚过程、回滚结果，后续分析问题并优化。

### 7.5 DevOps 工具集成

- 代码管理：Azure Repos + Git
- 流水线构建：Azure DevOps Pipelines
- 产物管理：Azure Artifacts
- 测试工具：JUnit（后端）、Jest（前端）、JMeter（压力测试）
- 漏洞扫描：OWASP Dependency Check、Defender for Cloud
- 监控告警：Application Insights、Microsoft Sentinel（部署过程告警）

## 8. 监视和扩展性

本系统基于 Azure 云服务的监控工具，构建全链路、多维度的监视体系，实现性能、日志、安全的实时监控；同时针对 10 万日活用户规模，设计可扩展的架构，适配流量波动、业务扩展需求，保障系统稳定运行。

### 8.1 监视体系设计

#### 8.1.1 性能监控（基于 Application Insights）

- 监控范围：实现前端（App 端、管理工具端）、后端服务、Azure 云服务的全链路性能监控；
  1.  前端性能监控：监控 App 端 WebView 加载速度、原生页面渲染速度、接口请求耗时、前端异常（JS 错误、组件渲染错误）、用户交互延迟；监控管理工具端页面加载速度、表单提交速度、接口请求耗时、前端异常；
  2.  后端性能监控：监控接口响应时间、请求吞吐量（QPS）、CPU 使用率、内存使用率、数据库查询耗时、Redis 缓存命中率、Azure 服务调用耗时（Notification Hubs、Blob Storage）；
  3.  云服务性能监控：监控 App Service（主副实例）的 CPU、内存、磁盘使用率、网络带宽；监控 Azure SQL Database 的查询性能、连接数、锁等待时间；监控 Redis 缓存的内存使用率、命中率、响应时间；监控 Front Door 的路由延迟、请求成功率。
- 监控指标与阈值（适配 10 万日活）：
  1.  接口响应时间：平均响应时间 ≤500ms，95 分位响应时间 ≤1s，超过 2s 标记为慢请求，触发告警；
  2.  请求吞吐量：峰值 QPS≤1000，超过阈值则触发弹性伸缩；
  3.  错误率：接口错误率 ≤0.5%，前端异常率 ≤0.1%，超过阈值触发告警；
  4.  资源使用率：App Service CPU 使用率 ≤70%、内存使用率 ≤80%；SQL 连接数 ≤500；Redis 内存使用率 ≤85%；
- 告警策略：配置分级告警（警告、严重），通过邮件、短信、钉钉推送告警信息；慢请求、错误率异常、资源使用率超标触发警告告警；服务不可用、数据库故障、缓存穿透触发严重告警，立即通知运维人员处理。

#### 8.1.2 日志分析（基于 Log Analytics + Microsoft Sentinel）

- 日志收集范围：
  1.  应用日志：前端（App 端、管理工具端）的操作日志、错误日志、接口请求日志；后端服务的业务日志、异常日志、接口调用日志、SQL 执行日志；
  2.  云服务日志：App Service 日志、SQL 审计日志、Front Door 日志、WAF 防护日志、Notification Hubs 推送日志、Blob Storage 访问日志、Redis 日志；
  3.  安全日志：用户登录日志、e-ninsho 认证日志、敏感数据访问日志、权限校验日志、WAF 拦截日志；
- 日志管理：
  1.  日志存储：所有日志统一收集至 Log Analytics，按日志类型分类存储，日志保留期 90 天，超过保留期自动归档至 Azure Blob Storage（冷存储），归档保留期 180 天；
  2.  日志分析：通过 Log Analytics 自定义查询，分析接口失败原因、用户操作行为、Push 推送效果（送达率、点击率）、集章抽奖数据、安全事件；通过 Microsoft Sentinel 整合安全日志，分析安全威胁，识别异常行为（异地登录、恶意攻击）；
- 日志可视化：通过 Azure Dashboard 创建日志分析仪表盘，实时展示核心日志指标（接口错误率、Push 送达率、安全事件数量），便于运维人员快速查看与分析。

#### 8.1.3 业务监控

- 核心业务监控指标：
  1.  用户相关：日活用户数、登录成功率、e-ninsho 认证成功率、家族连携绑定数量；
  2.  业务相关：集章数、抽奖次数、中奖率、SSO 跳转成功率、保险合同查看次数；
  3.  管理端相关：内容创建数量、内容发布数量、Push 推送次数、Push 送达率、Push 点击率；
- 监控实现：通过后端业务日志统计核心业务指标，同步至 Log Analytics，创建业务监控仪表盘，实时展示业务运行状态；配置业务指标异常告警（如登录成功率 ≤95%、Push 送达率 ≤80%），及时发现业务异常。

### 8.2 扩展性设计（适配 10 万日活，支持未来扩展）

#### 8.2.1 流量扩展性（应对 10 万日活及流量波动）

1.  弹性伸缩：App Service（Primary 实例）启用自动伸缩规则，根据 CPU 使用率、请求吞吐量自动增加/减少实例数量，峰值时最大扩展至 4 个实例，低谷时减少至 1 个实例，适配流量波动；Secondary 实例作为备用，可根据需求手动扩展；
2.  缓存优化：针对高频查询场景（集章数查询、用户信息查询、内容列表查询），通过 Redis 缓存降低数据库压力；静态资源、视频资源通过 Azure CDN+Front Door 缓存，减少源站请求；
3.  接口优化：核心接口采用分页查询、异步处理（如 Push 推送、集章记录更新），减少接口阻塞；对高频接口进行压缩（Gzip），减少数据传输量；
4.  数据库扩展：Azure SQL Database 支持按需扩容（CPU、内存、存储），未来用户规模增长至 10 万以上时，可直接升级定价层、增加实例规格，无需修改代码；
5.  Push 推送优化：采用分批推送策略（每批 1 万用户），避免 Notification Hubs 限流；未来用户规模增长时，可增加推送批次，或升级 Notification Hubs 定价层，提升推送能力。

#### 8.2.2 业务扩展性（支持未来业务扩展）

1.  前端扩展性：采用组件化、模块化设计，App 端新增原生功能时，可基于现有极简 MVVM 架构快速开发新模块，复用通用组件与 API 封装；管理工具端新增功能时，可复用现有页面模板、状态管理逻辑，快速扩展；
2.  后端扩展性：采用轻量分层架构，接口层、业务服务层、数据访问层分离，新增业务逻辑时，可快速开发新的接口、服务与数据访问模块，无需修改现有代码；核心业务逻辑与框架、数据源解耦，便于后续替换或扩展；
3.  云服务扩展性：Azure 云服务支持按需扩展，未来新增功能（如多语言支持、第三方集成）时，可快速集成 Azure 相关服务（如 Azure Translator、Azure Event Hub），无需重构基础设施；
4.  数据存储扩展性：Blob Storage 支持无限存储扩展，未来新增视频、图片等资源时，可直接扩容存储，无需担心存储不足；Azure SQL Database 支持异地扩展，未来用户分布广泛时，可新增只读副本，提升查询性能。

#### 8.2.3 技术扩展性（适配团队技术提升与技术迭代）

1.  架构预留扩展点：前端极简 MVVM 架构可后续逐步升级为完整 MVVM+轻量 Clean Architecture，后端轻量 Clean Architecture 可后续拆分微服务，预留架构扩展点；
2.  技术栈兼容性：前端采用 RN+TS、React+TS，后端采用 Spring Boot，均为行业主流技术栈，社区生态完善，便于技术迭代与版本升级；Azure SDK 支持多种语言与框架，便于后续技术栈扩展；
3.  代码扩展性：采用标准化、通用化设计，代码复用性高，后续技术迭代、功能扩展时，可减少重复开发，提升开发效率。

## 9. 可用性与灾难恢复

本系统基于 Azure 云服务的双活部署、异地复制、备份恢复能力，构建高可用的系统架构，制定完善的灾难恢复策略，保障系统可用性，降低灾难造成的损失，适配保险业务对服务连续性的需求。

### 9.1 可用性设计（目标：系统可用性 ≥99.9%）

#### 9.1.1 主副 App Service 双活部署

1.  部署架构：App Service 采用 Primary（主实例）、Secondary（副实例）双活部署，两个实例位于不同的可用区，避免单可用区故障导致服务中断；
2.  流量分配：正常情况下，所有流量通过 Azure Front Door 转发至 Primary 实例，Secondary 实例处于备用状态，同步 Primary 实例的代码与配置；
3.  故障切换：Azure Front Door 定期对两个实例进行健康检查（检查间隔 30 秒），当 Primary 实例出现故障（服务不可用、接口调用失败），连续 3 次健康检查失败后，自动将所有流量切换至 Secondary 实例，切换时间 ≤1 分钟，保障服务连续性；
4.  实例同步：通过 Azure DevOps CD 流水线，确保 Primary 与 Secondary 实例的代码、配置、版本完全一致，故障切换后服务无差异。

#### 9.1.2 主副 Azure SQL Database 双活部署

1.  部署架构：Azure SQL Database 采用 Primary（主库）、Secondary（副库）双活部署，启用异地复制功能，两个数据库位于不同的可用区，数据实时同步（同步延迟 ≤1 秒）；
2.  故障转移：启用自动故障转移功能，当 Primary 主库出现故障（数据库崩溃、网络中断），Azure 自动将 Secondary 副库提升为 Primary 主库，故障转移时间 ≤1 分钟，保障数据连续性与可用性；
3.  读写分离：正常情况下，所有写操作（如家族绑定、内容创建、集章记录更新）指向 Primary 主库，读操作（如合同查看、内容查询）可根据需求指向 Secondary 副库，实现读写分离，提升数据库性能与可用性；
4.  数据一致性：通过 Azure SQL 的异地复制功能，确保主副库数据实时同步，故障转移后无数据丢失，保障数据一致性。

#### 9.1.3 其他服务可用性保障

1.  Azure Front Door：采用多可用区部署，本身具备高可用性，避免网关单点故障；
2.  Blob Storage：启用异地冗余存储，数据多区域备份，即使单个区域故障，也可从其他区域恢复资源；
3.  Redis Cache：采用主从架构，主节点故障后自动切换至从节点，保障缓存服务可用性；
4.  Notification Hubs：采用多可用区部署，保障 Push 推送服务连续可用，避免推送失败。

### 9.2 灾难恢复设计

#### 9.2.1 灾难分级（基于 Azure 云服务故障场景）

1.  一级灾难：单个服务实例故障（如 Primary App Service 实例故障、Primary SQL 实例故障），影响部分服务或部分用户；
2.  二级灾难：单个可用区故障（如 Primary 实例所在可用区故障），影响主实例服务；
3.  三级灾难：区域级故障（如主区域故障），影响所有主副实例服务；
4.  四级灾难：数据丢失/篡改（如数据库数据误删、恶意篡改），影响业务正常运行。

#### 9.2.2 灾难恢复策略（对应不同灾难级别）

##### 9.2.2.1 一级灾难恢复（单个服务实例故障）

- 恢复触发：Azure Front Door 健康检查发现 Primary App Service 实例故障，或 Azure SQL 自动检测到 Primary 主库故障；
- 恢复流程：
  1.  App Service 故障：Front Door 自动将流量切换至 Secondary 实例，运维人员排查 Primary 实例故障（如服务崩溃、配置异常），修复后将流量切回 Primary 实例；
  2.  SQL 故障：Azure 自动将 Secondary 副库提升为 Primary 主库，运维人员排查原 Primary 主库故障，修复后重新配置为 Secondary 副库，同步数据；
- 恢复目标：RTO（恢复时间目标）≤5 分钟，RPO（恢复点目标）≤1 分钟，无数据丢失，用户无明显感知。

##### 9.2.2.2 二级灾难恢复（单个可用区故障）

- 恢复触发：Primary 实例所在可用区故障，导致 Primary App Service、Primary SQL 实例不可用；
- 恢复流程：
  1.  Front Door 自动将所有流量切换至 Secondary 实例（位于其他可用区），保障服务正常运行；
  2.  Azure SQL 自动将 Secondary 副库提升为 Primary 主库，继续提供数据服务；
  3.  运维人员监控可用区故障状态，待可用区恢复后，重新部署 Primary 实例、Primary SQL 主库，同步数据与配置，恢复双活部署；
- 恢复目标：RTO≤10 分钟，RPO≤1 分钟，无数据丢失，用户无明显感知。

##### 9.2.2.3 三级灾难恢复（区域级故障）

- 恢复触发：主区域故障，导致所有主副实例、数据库、云服务不可用；
- 恢复流程：
  1.  启用异地备份，在备用区域部署临时 App Service 实例、Azure SQL 数据库，恢复备份数据（从 Azure Backup 恢复）；
  2.  修改 DNS 解析，将流量切换至备用区域的临时服务，保障服务可用性；
  3.  待主区域恢复后，将临时服务的数据同步至主区域，重新部署双活架构，切换流量回主区域；
- 恢复目标：RTO≤1 小时，RPO≤1 小时，最小化数据丢失，保障核心业务可用。

##### 9.2.2.4 四级灾难恢复（数据丢失/篡改）

- 恢复触发：数据库数据误删、恶意篡改，或 Blob Storage 资源丢失；
- 恢复流程：
  1.  停止相关服务（避免数据进一步损坏），从 Azure Backup 恢复指定时间点的数据（30 天内任意时间点），恢复至临时数据库；
  2.  验证恢复数据的完整性与一致性，确认数据无误后，替换生产环境数据；
  3.  恢复相关服务，执行冒烟测试、接口测试，确认服务正常运行；
  4.  排查数据丢失/篡改原因，加固安全防护，避免再次发生；
- 恢复目标：RTO≤30 分钟，RPO≤1 小时，恢复丢失/篡改的数据，保障业务正常运行。

### 9.3 备份与恢复策略（通用模板）

#### 9.3.1 备份策略

| 数据类型              | 备份方式                       | 备份频率               | 保留期 | 备份存储位置                |
| --------------------- | ------------------------------ | ---------------------- | ------ | --------------------------- |
| Azure SQL Database    | Azure Backup 自动备份          | 每日全量+每 4 小时增量 | 30 天  | Azure Backup 专用存储       |
| Blob Storage（资源）  | Azure Blob 快照+异地复制       | 每日快照               | 7 天   | 异地 Blob Storage           |
| App Service 配置/代码 | Azure DevOps 代码仓库+配置备份 | 每次部署自动备份       | 90 天  | Azure Repos+Azure Artifacts |
| 日志数据              | Log Analytics 自动归档         | 每日归档               | 180 天 | 异地 Blob Storage（冷存储） |

#### 9.3.2 恢复测试

- 测试频率：每月执行一次恢复测试，每季度执行一次灾难恢复演练（模拟一级、二级灾难场景）；
- 测试内容：验证备份数据的完整性、恢复流程的可行性、恢复时间是否满足 RTO/RPO 目标；
- 测试流程：从 Azure Backup 恢复数据至测试环境，验证数据一致性，执行功能测试，记录恢复时间与测试结果，优化恢复流程。

### 9.4 可用性监控与保障

1.  实时监控：通过 Application Insights、Azure Monitor 实时监控 App Service、SQL、Front Door 等核心服务的运行状态，配置服务不可用告警，及时发现可用性问题；
2.  定期巡检：运维人员每日巡检系统可用性，查看监控仪表盘、日志，排查潜在问题；每周检查备份状态，确认备份正常；
3.  故障预案：制定详细的故障处理预案（针对不同灾难级别），明确责任人、处理步骤、恢复流程，确保故障发生时可快速响应；
4.  冗余保障：所有核心服务均采用双活部署、异地备份，避免单点故障；敏感数据多副本存储，保障数据安全与可用性。
