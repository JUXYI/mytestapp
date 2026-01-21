import { View, Text, StyleSheet } from 'react-native';
import type { TabParamList /*TabScreenProps*/ } from '../../navigation/types';
import { useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';

const ProfileScreen = () => {
  const route = useRoute<RouteProp<TabParamList, 'Profile'>>();
  //const route = useRoute<TabScreenProps<'Profile'>['route']>();
  const { userId = 'd_123456' } = route.params || {};

  return (
    <View style={styles.container}>
      <Text>ProfileScreen</Text>
      <Text>用户ID: {userId}</Text>
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

export default ProfileScreen;
