import React from 'react';
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { RootNavigationProp } from '../../navigation/types';
import { useNavigation } from '@react-navigation/native';

const BingWebView = () => {
  const navigation = useNavigation<RootNavigationProp>();

  const handleClose = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* Semi-transparent background layer */}
      <View style={styles.backgroundLayer} />

      {/* WebView container that covers the app but not status bar */}
      <View style={styles.webViewContainer}>
        {/* Close button */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
        </View>

        {/* WebView showing Bing website */}
        <WebView
          source={{ uri: 'https://www.bing.com' }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15A372 Safari/604.1"
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black
    zIndex: 1,
  },
  webViewContainer: {
    position: 'absolute',
    top: StatusBar.currentHeight || 0, // Account for status bar height
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: '#f0f0f0',
    zIndex: 3,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ccc',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  webView: {
    flex: 1,
  },
});

export default BingWebView;
