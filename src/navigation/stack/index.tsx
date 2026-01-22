import { createStackNavigator } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import MainTabNavigator from '../tab';
import DetailScreen from '../../screens/Detail';
import LoginScreen from '../../screens/Login';
import WebViewScreen from '../../screens/WebView';
import WebViewNavigation from '../../screens/WebView2';

const Stack = createStackNavigator<RootStackParamList>();

const RootStackNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      {/* 登录页 */}
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ title: '登录' }}
      />
      {/* Tab 导航作为 Stack 的一个页面 */}
      <Stack.Screen
        name="MainTab"
        component={MainTabNavigator}
        options={{ headerShown: false }}
      />
      {/* 详情页 */}
      <Stack.Screen
        name="Detail"
        component={DetailScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
      {/* WebView 页 */}
      <Stack.Screen
        name="WebView"
        component={WebViewScreen}
        options={{ title: 'WebView 示例' }}
      />
      {/* WebView2 页 */}
      <Stack.Screen
        name="WebView2"
        component={WebViewNavigation}
        options={{ title: 'WebView2 示例' }}
      />
    </Stack.Navigator>
  );
};

export default RootStackNavigator;
