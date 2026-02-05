import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../types';
import HomeScreen from '../../screens/Home';
import ProfileScreen from '../../screens/Profile';
import SettingsScreen from '../../screens/Settings';
import { Text } from 'react-native';

const Tab = createBottomTabNavigator<TabParamList>();

const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: 'red',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#ffffff',
        },
        headerStyle: {
          backgroundColor: '#f8f8f8',
        },
        headerTintColor: '#333',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: '主页',
          tabBarIcon: ({ focused, color, size }) => (
            <Text style={{ fontSize: 24, color }}>{focused ? '🏠' : '🏡'}</Text>
          ),
          tabBarLabel: () => null, // Hide text label
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: '我的',
          tabBarIcon: ({ focused, color, size }) => (
            <Text style={{ fontSize: 24, color }}>{focused ? '👤' : '👤'}</Text>
          ),
          tabBarLabel: () => null, // Hide text label
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: '设置',
          tabBarIcon: ({ focused, color, size }) => (
            <Text style={{ fontSize: 24, color }}>{focused ? '⚙️' : '⚙️'}</Text>
          ),
          tabBarLabel: () => null, // Hide text label
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
