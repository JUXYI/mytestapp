import {
  BottomTabNavigationProp,
  BottomTabScreenProps,
} from '@react-navigation/bottom-tabs';
import { NavigationProp, ParamListBase } from '@react-navigation/native';
import { StackNavigationProp, StackScreenProps } from '@react-navigation/stack';

// 所有导航参数类型的集中定义
export type TabParamList = {
  Home: undefined;
  Profile: { userId: string };
  Settings: undefined;
};

export type RootStackParamList = {
  MainTab: undefined;
  Detail: { id: number; title: string };
  Login: undefined;
  WebView: undefined;
  WebView2: undefined;
  WebView3: undefined;
};

// Stack 导航的 navigation 类型（比如 Login/Detail 页面的 navigation）
export type RootStackNavigationProp<T extends keyof RootStackParamList> =
  StackNavigationProp<RootStackParamList, T>;

// Tab 导航的 navigation 类型（比如 Home/Profile 页面的 navigation）
export type TabNavigationProp<T extends keyof TabParamList> =
  BottomTabNavigationProp<TabParamList, T>;

// // Stack 页面的完整 Props 类型（包含 route 和 navigation）
// export type RootStackScreenProps<T extends keyof RootStackParamList> =
//   StackScreenProps<RootStackParamList, T>;

// // Tab 页面的完整 Props 类型（包含 route 和 navigation）
// export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<
//   TabParamList,
//   T
// >;

// 全局通用的 Navigation 类型（适配 useNavigation）
export type RootNavigationProp = NavigationProp<ParamListBase> &
  RootStackNavigationProp<keyof RootStackParamList> &
  TabNavigationProp<keyof TabParamList>;
