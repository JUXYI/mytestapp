# 第 12 章：CI/CD・デプロイメント（Azure DevOps）

**前のファイル**: [10-monitoring-logging.md](./10-monitoring-logging.md)  
**次のファイル**: [12-appendix.md](./12-appendix.md) →

---

## 目次

- [12.1 CI/CD 戦略](#121-cicd-戦略)
- [12.2 バックエンド Pipeline](#122-バックエンド-pipeline)
- [12.3 Web フロントエンド Pipeline](#123-web-フロントエンド-pipeline)
- [12.4 モバイル Pipeline](#124-モバイル-pipeline)
- [12.5 CodePush（OTA 更新）](#125-codepushota-更新)

---

## 12.1 CI/CD 戦略

### ブランチ戦略（Git Flow）

```
main (本番)
  │
  ├─► develop (開発)
  │     │
  │     ├─► feature/auth-implementation
  │     ├─► feature/content-management
  │     └─► feature/push-notification
  │
  └─► hotfix/security-patch
```

### デプロイメントフロー

```
[開発者] ─► [Git Push] ─► [Azure DevOps]
                              │
                              ├─► ビルド（CI）
                              │   ├─ コード品質チェック
                              │   ├─ ユニットテスト
                              │   └─ ビルドアーティファクト生成
                              │
                              └─► デプロイ（CD）
                                  ├─ 開発環境（develop branch）
                                  ├─ ステージング環境（release branch）
                                  └─ 本番環境（main branch、手動承認）
```

---

## 12.2 バックエンド Pipeline

### CMS API Pipeline

```yaml name=.azure/pipelines/backend-cms-api-pipeline.yml
trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - backend/cms-api/**

pool:
  vmImage: 'ubuntu-latest'

variables:
  - group: juxyi-cms-variables

stages:
  - stage: Build
    jobs:
      - job: BuildJob
        steps:
          - task: Gradle@3
            inputs:
              workingDirectory: 'backend/cms-api'
              tasks: 'clean build'
              jdkVersionOption: '1.21'

          - task: PublishTestResults@2
            inputs:
              testResultsFormat: 'JUnit'
              testResultsFiles: '**/TEST-*.xml'

          - task: PublishCodeCoverageResults@1
            inputs:
              codeCoverageTool: 'JaCoCo'
              summaryFileLocation: '**/jacoco.xml'

          - task: PublishBuildArtifacts@1
            inputs:
              PathtoPublish: 'backend/cms-api/build/libs'
              ArtifactName: 'cms-api-jar'

  - stage: DeployDev
    condition: eq(variables['Build.SourceBranch'], 'refs/heads/develop')
    dependsOn: Build
    jobs:
      - deployment: DeployToDevJob
        environment: 'dev'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'Azure-Connection'
                    appName: 'juxyi-cms-api-dev'
                    package: '$(Pipeline.Workspace)/cms-api-jar/*.jar'

  - stage: DeployProd
    condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
    dependsOn: Build
    jobs:
      - deployment: DeployToProdJob
        environment: 'prod'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureWebApp@1
                  inputs:
                    azureSubscription: 'Azure-Connection'
                    appName: 'juxyi-cms-api-prod'
                    package: '$(Pipeline.Workspace)/cms-api-jar/*.jar'
                    appSettings: |
                      -JWT_SECRET $(JWT_SECRET)
                      -DB_PASSWORD $(DB_PASSWORD)
```

---

## 12.3 Web フロントエンド Pipeline

```yaml name=.azure/pipelines/frontend-pipeline.yml
trigger:
  branches:
    include:
      - main
      - develop
  paths:
    include:
      - frontend/**

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Build
    jobs:
      - job: BuildJob
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'

          - script: |
              cd frontend
              npm ci
              npm run lint
              npm run test
              npm run build
            displayName: 'Build React App'

          - task: PublishBuildArtifacts@1
            inputs:
              PathtoPublish: 'frontend/dist'
              ArtifactName: 'frontend-dist'

  - stage: DeployDev
    condition: eq(variables['Build.SourceBranch'], 'refs/heads/develop')
    dependsOn: Build
    jobs:
      - deployment: DeployToDevJob
        environment: 'dev'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureStaticWebApp@0
                  inputs:
                    app_location: '$(Pipeline.Workspace)/frontend-dist'
                    api_token: $(STATIC_WEB_APP_TOKEN_DEV)

  - stage: DeployProd
    condition: eq(variables['Build.SourceBranch'], 'refs/heads/main')
    dependsOn: Build
    jobs:
      - deployment: DeployToProdJob
        environment: 'prod'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AzureStaticWebApp@0
                  inputs:
                    app_location: '$(Pipeline.Workspace)/frontend-dist'
                    api_token: $(STATIC_WEB_APP_TOKEN_PROD)
```

---

## 12.4 モバイル Pipeline

### iOS Pipeline

```yaml name=.azure/pipelines/mobile-ios-pipeline.yml
trigger:
  branches:
    include:
      - main
  paths:
    include:
      - mobile/**

pool:
  vmImage: 'macOS-latest'

stages:
  - stage: Build
    jobs:
      - job: BuildJob
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'

          - script: |
              cd mobile
              npm ci
              cd ios
              pod install
            displayName: 'Install Dependencies'

          - task: InstallAppleCertificate@2
            inputs:
              certSecureFile: 'ios_distribution.p12'
              certPwd: $(CERT_PASSWORD)

          - task: InstallAppleProvisioningProfile@1
            inputs:
              provProfileSecureFile: 'juxyi_mobile_appstore.mobileprovision'

          - task: Xcode@5
            inputs:
              actions: 'build archive'
              scheme: 'JuxyiMobile'
              configuration: 'Release'
              xcWorkspacePath: 'mobile/ios/JuxyiMobile.xcworkspace'
              exportPath: '$(Build.ArtifactStagingDirectory)/output'

          - task: PublishBuildArtifacts@1
            inputs:
              PathtoPublish: '$(Build.ArtifactStagingDirectory)/output'
              ArtifactName: 'ios-ipa'

  - stage: Deploy
    dependsOn: Build
    jobs:
      - deployment: DeployToAppStoreJob
        environment: 'appstore'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: AppStoreRelease@1
                  inputs:
                    serviceEndpoint: 'App Store Connect'
                    appIdentifier: 'com.juxyi.mobile'
                    ipaPath: '$(Pipeline.Workspace)/ios-ipa/*.ipa'
```

### Android Pipeline

```yaml name=.azure/pipelines/mobile-android-pipeline.yml
trigger:
  branches:
    include:
      - main
  paths:
    include:
      - mobile/**

pool:
  vmImage: 'ubuntu-latest'

stages:
  - stage: Build
    jobs:
      - job: BuildJob
        steps:
          - task: NodeTool@0
            inputs:
              versionSpec: '20.x'

          - script: |
              cd mobile
              npm ci
            displayName: 'Install Dependencies'

          - task: Gradle@3
            inputs:
              workingDirectory: 'mobile/android'
              tasks: 'assembleRelease'
              jdkVersionOption: '1.17'

          - task: AndroidSigning@3
            inputs:
              apkFiles: 'mobile/android/app/build/outputs/apk/release/*.apk'
              apksignerKeystoreFile: 'android_keystore.jks'
              apksignerKeystorePassword: $(KEYSTORE_PASSWORD)
              apksignerKeystoreAlias: $(KEY_ALIAS)

          - task: PublishBuildArtifacts@1
            inputs:
              PathtoPublish: 'mobile/android/app/build/outputs/apk/release'
              ArtifactName: 'android-apk'

  - stage: Deploy
    dependsOn: Build
    jobs:
      - deployment: DeployToPlayStoreJob
        environment: 'playstore'
        strategy:
          runOnce:
            deploy:
              steps:
                - task: GooglePlayRelease@4
                  inputs:
                    serviceConnection: 'Google Play Console'
                    applicationId: 'com.juxyi.mobile'
                    apkFile: '$(Pipeline.Workspace)/android-apk/*.apk'
                    track: 'production'
```

---

## 12.5 CodePush（OTA 更新）

### CodePush 設定

```bash
# CodePush CLI インストール
npm install -g appcenter-cli

# ログイン
appcenter login

# アプリ作成
appcenter apps create -d JuxyiMobile-iOS -o iOS -p React-Native
appcenter apps create -d JuxyiMobile-Android -o Android -p React-Native

# Deployment作成
appcenter codepush deployment add -a juxyi/JuxyiMobile-iOS Staging
appcenter codepush deployment add -a juxyi/JuxyiMobile-iOS Production
```

### CodePush リリース

```bash
# iOS リリース
appcenter codepush release-react \
  -a juxyi/JuxyiMobile-iOS \
  -d Production \
  -m \
  --description "Bug fixes and improvements"

# Android リリース
appcenter codepush release-react \
  -a juxyi/JuxyiMobile-Android \
  -d Production \
  -m \
  --description "Bug fixes and improvements"
```

### React Native 統合

```typescript name=mobile/src/App.tsx
import codePush from 'react-native-code-push';

const App: React.FC = () => {
  useEffect(() => {
    codePush.sync({
      updateDialog: {
        title: '更新があります',
        optionalUpdateMessage:
          'アプリの更新が利用可能です。今すぐ更新しますか？',
        optionalInstallButtonLabel: '更新',
        optionalIgnoreButtonLabel: '後で',
      },
      installMode: codePush.InstallMode.IMMEDIATE,
    });
  }, []);

  return <RootNavigator />;
};

export default codePush({
  checkFrequency: codePush.CheckFrequency.ON_APP_RESUME,
  installMode: codePush.InstallMode.ON_NEXT_RESUME,
})(App);
```

---

**次のファイル**: [12-appendix.md](./12-appendix.md) →
