import React, { useRef } from 'react';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import { Button, StyleSheet, View } from 'react-native';
import { RootNavigationProp } from '../../navigation/types';
import { useNavigation } from '@react-navigation/native';

const WebViewNavigation = () => {
  const navigation = useNavigation<RootNavigationProp>();
  const webViewRef = useRef<WebView>(null);
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      console.log('收到消息:', data);
      switch (data.type) {
        case 'LINK_CLICK':
          handleLinkClick(data.url);
          break;
        case 'NAVIGATION':
          handleJsNavigation(data.method, data.url);
          break;
        case 'NAVIGATE_TO_WEBVIEW':
          handleWebViewNavigation(data.url);
          break;
      }
    } catch (error) {
      console.error('解析消息失败', error);
    }
  };
  const handleLinkClick = (url: string) => {
    if (url.startsWith('https://yourdomain.com')) {
      //webViewRef.current?.loadUrl(url);
      webViewRef.current?.injectJavaScript(
        `window.location.href='${url}'; true;`,
      );
    } else {
      console.log('链接被拦截:', url);
      // 可以显示提示或执行其他操作
    }
  };
  const handleJsNavigation = (method: string, url: string) => {
    if (url.startsWith('https://yourdomain.com')) {
      //webViewRef.current?.loadUrl(url);
      webViewRef.current?.injectJavaScript(
        `window.location.href='${url}'; true;`,
      );
    } else {
      console.log('JavaScript导航被拦截:', url);
    }
  };
  const handleWebViewNavigation = (url: string) => {
    if (url === 'myapp://webview2') {
      // 这里可以导航到第二个WebView
      // 例如：navigation.navigate('SecondWebViewScreen');
      navigation.navigate('WebView');
      console.log('导航到第二个WebView');
    }
  };
  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        source={{
          html: `
	            <!DOCTYPE html>
	            <html>
	            <head>
	              <title>WebView交互示例</title>
                  <style>
                    body { font-family: sans-serif; padding: 20px; text-align: center; }
                    button { font-size: 50px; padding: 10px 20px; font-size: 16px; margin-top: 20px; background-color: #007AFF; color: white; border: none; border-radius: 5px; }
                    p { font-size: 36px; color: #333; }
                    h1 { font-size: 72px; color: #007AFF; }
                    h2 { font-size: 60px; color: #333; margin-top: 20px; }
                    a { font-size: 48px; color: #007AFF; }
                  </style>
	              <script>
	                document.addEventListener('click', function(e) {
	                  if (e.target.tagName === 'A') {
	                    e.preventDefault();
	                    window.ReactNativeWebView.postMessage(JSON.stringify({
	                      type: 'LINK_CLICK',
	                      url: e.target.href
	                    }));
	                  }
	                }, true);
	                window.history.pushState = function() {
	                  const url = arguments[2];
	                  window.ReactNativeWebView.postMessage(JSON.stringify({
	                    type: 'NAVIGATION',
	                    method: 'pushState',
	                    url: url
	                  }));
	                };
	                function navigateToSecondWebView() {
	                  window.ReactNativeWebView.postMessage(JSON.stringify({
	                    type: 'NAVIGATE_TO_WEBVIEW',
	                    url: 'myapp://webview2'
	                  }));
	                }
	              </script>
	            </head>
	            <body>
	              <h1>WebView交互示例</h1>
	              <h2>普通链接</h2>
	              <a href="https://external-site.com">外部链接（会被拦截）</a>
	              <a href="https://yourdomain.com/page2">内部链接（会被允许）</a>
	              <h2>JavaScript导航</h2>
	              <button onclick="history.pushState({}, '', '/new-page')">使用pushState跳转</button>
	              <h2>WebView间跳转</h2>
	              <button onclick="navigateToSecondWebView()">跳转到第二个WebView</button>
	            </body>
	            </html>
	          `,
        }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
});

export default WebViewNavigation;
