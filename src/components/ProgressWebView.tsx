import { StyleSheet, View } from 'react-native';
import WebView from '../screens/WebView';
import { WebViewProps } from 'react-native-webview';

const ProgressWebView: React.FC<WebViewProps> = props => {
  return (
    <View style={styles.container}>
      <WebView {...props} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingBar: {
    backgroundColor: '#1f99b0',
    height: 2,
  },
});
export default ProgressWebView;
