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

  // 处理来自 WebView 的消息（双向通信）
  const handleWebViewMessage = (event: WebViewMessageEvent) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      if (message.type === 'HIDE_ELEMENTS_FAILED') {
        // 如果网页端检测到元素仍可见，React Native 端重新注入
        console.log('Elements still visible, re-injecting CSS...');
        setTimeout(() => {
          injectCustomCSS();
        }, 200);
      }
    } catch (e) {
      console.error('Failed to parse WebView message:', e);
    }
  };

  // 封装注入 CSS 的通用函数 - 混合 CSS 和 DOM 操作
  const injectCustomCSS = (): void => {
    if (webViewRef.current) {
      const injectJS = `
        (function() {
          function ensureElementsHidden() {
            // 直接操作 DOM：查找并隐藏目标元素
            const selectors = ['header', '#header', '#header.cf', '.header_inner', 'footer', '#footer', '.footer_inner'];
            
            selectors.forEach(selector => {
              try {
                const elements = document.querySelectorAll(selector);
                elements.forEach(el => {
                  el.style.display = 'none !important';
                  el.style.visibility = 'hidden';
                  el.style.height = '0';
                  el.style.overflow = 'hidden';
                  el.style.margin = '0';
                  el.style.padding = '0';
                });
              } catch (e) {}
            });
          }
          
          function injectStyle() {
            const oldStyle = document.getElementById('custom-rn-style');
            if (oldStyle) oldStyle.remove();
            
            const style = document.createElement('style');
            style.id = 'custom-rn-style';
            style.type = 'text/css';
            style.innerHTML = \`${injectCSS}\`;
            
            if (document.head) {
              document.head.appendChild(style);
            } else if (document.documentElement) {
              document.documentElement.appendChild(style);
            }
          }
          
          // 立即执行
          injectStyle();
          ensureElementsHidden();
          
          // 等待 DOM 完全加载后再次执行
          if (document.readyState !== 'complete') {
            window.addEventListener('load', function() {
              injectStyle();
              ensureElementsHidden();
            });
          }
          
          // 持续监听：定期检查目标元素是否被恢复，如果被恢复则再次隐藏
          let checkCount = 0;
          const continuousCheck = setInterval(function() {
            const header = document.querySelector('header');
            const footer = document.querySelector('footer');
            const headerById = document.getElementById('header');
            
            const isHeaderVisible = (header && header.offsetHeight > 0) || 
                                    (headerById && headerById.offsetHeight > 0);
            const isFooterVisible = (footer && footer.offsetHeight > 0);
            
            if (isHeaderVisible || isFooterVisible) {
              ensureElementsHidden();
              // 通知 React Native 端仍有元素可见
              if (window.ReactNativeWebView && checkCount < 3) {
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'HIDE_ELEMENTS_FAILED',
                  header: isHeaderVisible,
                  footer: isFooterVisible
                }));
                checkCount++;
              }
            }
            
            // 10 秒后停止检查
            if (checkCount > 10) {
              clearInterval(continuousCheck);
            }
          }, 500);
          
          // 监听 DOM 变化
          const observer = new MutationObserver(function(mutations) {
            const style = document.getElementById('custom-rn-style');
            if (!style) {
              injectStyle();
            }
            ensureElementsHidden();
          });
          
          observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['style', 'class', 'id']
          });
        })();
        true;
    `;
      webViewRef.current.injectJavaScript(injectJS);
    }
  };

  // 监听页面导航状态变化
  const handleNavigationStateChange = (navState: WebViewNavigation) => {
    // navState.loading 为 false 表示页面加载完成
    // navState.url 可以过滤只对目标域名生效
    if (!navState.loading && navState.url.includes(targetDomain)) {
      // 分多次尝试注入，确保 CSS 被正确应用
      // 第一次：延迟 100ms
      setTimeout(() => {
        injectCustomCSS();
      }, 100);

      // 第二次：延迟 500ms（等待可能的异步加载）
      setTimeout(() => {
        injectCustomCSS();
      }, 500);

      // 第三次：延迟 1000ms（确保所有动态加载完成）
      setTimeout(() => {
        injectCustomCSS();
      }, 1000);
    }
  };

  // 初始注入（页面首次加载）
  const initialInjectJS = `
    (function() {
      function ensureElementsHidden() {
        const selectors = ['header', '#header', '#header.cf', '.header_inner', 'footer', '#footer', '.footer_inner'];
        selectors.forEach(selector => {
          try {
            const elements = document.querySelectorAll(selector);
            elements.forEach(el => {
              el.style.display = 'none !important';
              el.style.visibility = 'hidden';
              el.style.height = '0';
              el.style.overflow = 'hidden';
              el.style.margin = '0';
              el.style.padding = '0';
            });
          } catch (e) {}
        });
      }
      
      function injectStyle() {
        const oldStyle = document.getElementById('custom-rn-style');
        if (oldStyle) oldStyle.remove();
        
        const style = document.createElement('style');
        style.id = 'custom-rn-style';
        style.type = 'text/css';
        style.innerHTML = \`${injectCSS}\`;
        
        if (document.head) {
          document.head.appendChild(style);
        } else if (document.documentElement) {
          document.documentElement.appendChild(style);
        }
      }
      
      // 立即注入
      injectStyle();
      ensureElementsHidden();
      
      // 等待 DOM 完全加载
      if (document.readyState !== 'complete') {
        window.addEventListener('load', function() {
          injectStyle();
          ensureElementsHidden();
        });
      }
      
      // 监听 DOM 变化
      const observer = new MutationObserver(function(mutations) {
        const style = document.getElementById('custom-rn-style');
        if (!style) {
          injectStyle();
        }
        ensureElementsHidden();
      });
      
      observer.observe(document.documentElement, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['style', 'class', 'id']
      });
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
        // 网页加载完成后自动注入 CSS
        injectedJavaScript={initialInjectJS}
        // 启用 JS（必须开启，否则无法执行注入的代码）
        javaScriptEnabled={true}
        // 允许修改网页内容（Android 需开启）
        domStorageEnabled={true}
        // 监听页面跳转
        onNavigationStateChange={handleNavigationStateChange}
        // 双向通信：接收来自网页的消息
        onMessage={handleWebViewMessage}
        // 调试用：开启 WebView 调试（Chrome devtools 可调试）
        // debugMode={true}
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
