import { View, Text, StyleSheet, Button } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  RootNavigationProp,
  RootStackParamList,
  //RootStackScreenProps,
} from '../../navigation/types';
import type { RouteProp } from '@react-navigation/native';

const DetailScreen = () => {
  // 给 useRoute 指定类型：获取 Detail 页面的参数
  //const route = useRoute<RootStackScreenProps<'Detail'>['route']>();
  const route = useRoute<RouteProp<RootStackParamList, 'Detail'>>();
  const navigation = useNavigation<RootNavigationProp>();

  const { id, title } = route.params;
  return (
    <View style={styles.container}>
      <Text>Detail Screen: {title}</Text>
      <Text>ID: {id}</Text>
      <Button title="返回" onPress={() => navigation.goBack()} />
      <Button
        title="跳转到我的页面"
        onPress={() =>
          navigation.navigate('MainTab', {
            screen: 'Profile',
            params: { userId: '12345' },
          })
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

export default DetailScreen;
