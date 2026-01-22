import { useRoute } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation/types';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { RouteProp } from '@react-navigation/native';
import { StyleSheet } from 'react-native';
import { useRef, useState } from 'react';
import { Text, TextInput, View, Button } from 'react-native';

// 简单的 HTML 页面代码，实际开发中通常加载远程 URL 或本地 HTML 文件
const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>WebView Demo</title>
        <style>
          body { font-family: sans-serif; padding: 20px; text-align: center; }
          button { padding: 10px 20px; font-size: 16px; margin-top: 20px; background-color: #007AFF; color: white; border: none; border-radius: 5px; }
          p { font-size: 18px; color: #333; }
        </style>
      </head>
      <body>
        <h2>WebView H5 页面</h2>
        <p id="log">等待 RN 消息...</p>
        <input id="inputText" type="text" value="Hello from WebView!" />
        <br />
        <button onclick="sendToRN(document.getElementById('inputText').value)">发送消息给 RN</button>
        <br />
        <p id="message">等待 RN 消息...</p>
        <input id="inputText2" type="text" value="Hello from WebView2!" />
        <br />
        <button onclick="sendToRN(document.getElementById('inputText2').value)">发送消息给 RN 2</button>
        <br />
        <a id="link" href="https://zh.javascript.info">点击跳转</a>
 
        <script>
          // 1. 接收来自 RN 的消息
          window.receiveMessageFromRN = function(data) {
            const logElement = document.getElementById('log');
            logElement.innerText = '收到 RN: ' + data.payload;
            logElement.style.color = 'green';
          };
 
          // 接收来自原生的消息 2
          document.addEventListener('message', function(event) {
            const logElement = document.getElementById('message');
            logElement.innerText = '收到 RN: ' + JSON.parse(event.data).payload;
            logElement.style.color = 'blue';
          });

          // 2. 向 RN 发送消息
          function sendToRN(str) {
            const data = { type: 'RN_MESSAGE', payload: str, timestamp: Date.now() };
            // 注意：必须使用 ReactNativeWebView.postMessage,而不是标准的 window.postMessage
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify(data));
            } else {
              console.log('ReactNativeWebView not found');
            }
          }

          // 3. 点击跳转
          document.getElementById('link').addEventListener('click', function(e) {
            e.preventDefault(); // 阻止默认跳转行为
            if (window.ReactNativeWebView) {
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'OPEN_URL', payload: this.href }));
            } else {
              console.log('ReactNativeWebView not found');
            }
          }, true);
            
        </script>
      </body>
    </html>
  `;

const WebViewScreen = () => {
  //const route = useRoute<RouteProp<RootStackParamList, 'WebView'>>();

  const webViewRef = useRef<WebView>(null);
  const [receivedData, setReceivedData] = useState<string>('暂无消息');
  const [inputText, setInputText] = useState<string>('Hello from React Native');
  const [inputText2, setInputText2] = useState<string>(
    'Hello from React Native 2',
  );

  // WebView 向 RN 发送消息的处理函数
  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      // WebView 发送的数据必须是字符串，通常需要 JSON.parse
      const data = JSON.parse(event.nativeEvent.data);
      console.log('收到 WebView 消息:', data);
      if (data.type === 'RN_MESSAGE') {
        setReceivedData(data.payload || data);
      } else if (data.type === 'OPEN_URL') {
        const url = data.payload + 'js';
        console.log('URL:', url);
        if (shouldAllowNavigation(url)) {
          webViewRef.current?.injectJavaScript(
            `window.location.href='${url}'; true;`,
          );
        } else {
          console.error('不允许导航到该 URL:', url);
        }
      }
    } catch (error) {
      console.error('解析消息失败', error);
      setReceivedData(event.nativeEvent.data);
    }
  };

  // RN 向 WebView 发送消息
  const sendDataToWebView = () => {
    const message = JSON.stringify({ type: 'RN_MESSAGE', payload: inputText });

    // 方法一：使用 injectJavaScript 执行 JS 代码 (推荐用于即时调用)
    // 这里我们调用 web 端挂载在 window 上的函数 receiveMessageFromRN
    const script = `if (window.receiveMessageFromRN) { window.receiveMessageFromRN(${message}); } true;`;
    webViewRef.current?.injectJavaScript(script);
  };

  // RN 向 WebView 发送消息 2
  const sendDataToWebView2 = () => {
    const message = JSON.stringify({ type: 'RN_MESSAGE', payload: inputText2 });

    // 方法二：使用 postMessage 发送消息 (推荐用于长期通信)
    webViewRef.current?.postMessage(message);
  };

  const shouldAllowNavigation = (url: string) => {
    // 实现你的业务逻辑
    return url;
  };

  return (
    <View style={styles.container}>
      <View style={styles.controlPanel}>
        <Text style={styles.label}>RN 发送给 WebView:</Text>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
        />
        <Button title="发送到 WebView" onPress={sendDataToWebView} />

        <View style={styles.separator} />

        <TextInput
          style={styles.input}
          value={inputText2}
          onChangeText={setInputText2}
        />
        <Button title="发送到 WebView 2" onPress={sendDataToWebView2} />

        <View style={styles.separator} />

        <Text style={styles.label}>WebView 发送给 RN:</Text>
        <Text style={styles.result}>{receivedData}</Text>
      </View>

      <WebView
        ref={webViewRef}
        source={{ html: htmlContent }}
        onMessage={handleMessage}
        style={styles.webview}
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
  controlPanel: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    marginTop: 10,
  },
  input: {
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 15,
  },
  result: {
    fontSize: 16,
    color: '#333',
    minHeight: 20,
  },
  webview: {
    flex: 1,
    marginTop: 10,
  },
});

export default WebViewScreen;
