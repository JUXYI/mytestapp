import { View, Text, StyleSheet, Button } from 'react-native';
import { RootNavigationProp } from '../../navigation/types';
import { useNavigation } from '@react-navigation/native';

const LoginScreen = () => {
  const navigation = useNavigation<RootNavigationProp>();
  return (
    <View style={styles.container}>
      <Text>LoginScreen111</Text>
      <Button title="登录" onPress={() => navigation.navigate('MainTab')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LoginScreen;
