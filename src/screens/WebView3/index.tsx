import React, { useRef, useState } from 'react';
import {
  WebView,
  WebViewMessageEvent,
  WebViewNavigation,
} from 'react-native-webview';
import { StyleSheet, View } from 'react-native';

const WebViewScreen3 = () => {
  const webViewRef = useRef<WebView>(null);

  const [progress, setProgress] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 目标域名
  const targetDomain = 'asahi-life.co.jp';

  // 拼接注入的 JS 代码：创建 style 标签并插入 CSS
  const injectCSS = `
    header { display: none !important; }
    #header { display: none !important; }
    #header.cf { display: none !important; }
    .header_inner { display: none !important; }

    footer { display: none !important; }
    #footer { display: none !important; }
    .footer_inner { display: none !important; }
  `;

  // 封装注入 CSS 的通用函数
  const injectCustomCSS = (): void => {
    if (webViewRef.current) {
      const injectJS = `
        (function() {
        // 先移除已存在的自定义样式，避免重复注入
        const oldStyle = document.getElementById('custom-rn-style');
        if (oldStyle) oldStyle.remove();
          
        // 创建新的 style 标签并注入 CSS
        var style = document.createElement('style');
        style.id = 'custom-rn-style'; // 加唯一 ID 方便管理
        style.type = 'text/css';
        style.innerHTML = \`${injectCSS}\`;
        document.head.appendChild(style);
        })();
        true; // 必须返回一个值，否则 iOS 会报错
    `;
      // 动态注入 JS/CSS
      webViewRef.current.injectJavaScript(injectJS);
    }
  };

  // 监听页面导航状态变化
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    // navState.loading 为 false 表示页面加载完成
    // navState.url 可以过滤只对目标域名生效
    if (!navState.loading && navState.url.includes(targetDomain)) {
      // 延迟一点执行，确保页面 DOM 已完全加载
      setTimeout(() => {
        injectCustomCSS();
      }, 100);
    }
  };

  // 初始注入（页面首次加载）
  const initialInjectJS = `
    (function() {
      const style = document.createElement('style');
      style.id = 'custom-rn-style';
      style.type = 'text/css';
      style.innerHTML = \`${injectCSS}\`;
      document.head.appendChild(style);
    })();
    true;
  `;

  const ProgressBar = () => {
    if (!isLoading) return null;
    return <View style={[styles.loadingBar, { width: `${progress}%` }]} />;
  };

  return (
    <View style={styles.container}>
      <ProgressBar />
      <WebView
        style={styles.webview}
        ref={webViewRef}
        source={{
          uri: 'https://www.asahi-life.co.jp/',
          //uri: 'https://zh-hans.react.dev/learn',
        }}
        // 方式1：网页加载完成后自动注入 CSS
        injectedJavaScript={initialInjectJS}
        // 启用 JS（必须开启，否则无法执行注入的代码）
        javaScriptEnabled={true}
        // 允许修改网页内容（Android 需开启）
        domStorageEnabled={true}
        // 监听页面跳转
        onNavigationStateChange={handleNavigationStateChange}
        // 调试用：开启 WebView 调试（Chrome devtools 可调试）
        // debugMode={true}
        // 方式2：手动触发注入（比如按钮点击时）
        // onMessage={(e) => { /* 可接收网页返回的信息 */ }}
        // 可选：禁用第三方 cookies 等，视需求配置
        //thirdPartyCookiesEnabled={true}
        startInLoadingState={true}
        onLoadProgress={e => {
          setProgress(e.nativeEvent.progress * 100);
          setIsLoading(e.nativeEvent.progress < 1);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  webview: {
    flex: 1,
    marginTop: 10,
  },
  loadingBar: {
    backgroundColor: '#1f99b0',
    height: 2,
  },
});

export default WebViewScreen3;
