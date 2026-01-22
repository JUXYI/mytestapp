import { View, Text, StyleSheet, Button } from 'react-native';
import type {
  RootNavigationProp,
  RootStackNavigationProp,
} from '../../navigation/types';
import { useNavigation } from '@react-navigation/native';

const HomeScreen = () => {
  const navigation = useNavigation<RootNavigationProp>();

  // 方式 2：精准指定 Stack 导航类型（只针对跳转到 Detail 页面的场景）
  //const navigation = useNavigation<RootStackNavigationProp<'MainTab'>>();

  return (
    <View style={styles.container}>
      <Text>HomeScreen</Text>
      <Button
        title="跳转到详情页"
        onPress={() =>
          navigation.navigate('Detail', { id: 42, title: '详情页标题' })
        }
      />
      <Button
        title="跳转到我的页面"
        onPress={() => navigation.navigate('Profile')}
      />
      <Button
        title="跳转到登录页"
        onPress={() => navigation.navigate('Login')}
      />
      <Button
        title="跳转到 WebView 页"
        onPress={() =>
          navigation.navigate('WebView', { url: 'https://www.baidu.com' })
        }
      />
      <Button
        title="跳转到 WebView2 页"
        onPress={() =>
          navigation.navigate('WebView2', { url: 'https://www.baidu.com' })
        }
      />
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

export default HomeScreen;
