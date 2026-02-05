import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RootNavigationProp } from '../../navigation/types';
import { useNavigation } from '@react-navigation/native';

const SettingsScreen = () => {
  const navigation = useNavigation<RootNavigationProp>();

  const openBingWebView = () => {
    navigation.navigate('BingWebView');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>SettingsScreen</Text>

      <TouchableOpacity style={styles.button} onPress={openBingWebView}>
        <Text style={styles.buttonText}>Open Bing Website</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsScreen;
