import { NavigationContainer } from '@react-navigation/native';
import RootStackNavigator from './stack';

const AppNavigator = () => {
  return (
    <NavigationContainer>
      <RootStackNavigator />
    </NavigationContainer>
  );
};
export default AppNavigator;
