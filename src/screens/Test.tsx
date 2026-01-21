/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import React, { useEffect } from 'react';
import {
  StatusBar,
  StyleSheet,
  useColorScheme,
  View,
  Text,
  Image,
  TextInput,
  ScrollView,
  Switch,
  FlatList,
  TouchableOpacity,
  SectionList,
  Alert,
  BackHandler,
} from 'react-native';
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

interface MyProps {
  title: string;
  children?: React.ReactNode;
}

const ViewBoxesWithColorAndText = (props: MyProps): React.ReactNode => {
  const safeAreaInsets = useSafeAreaInsets();

  const { title, children } = props;
  const [titleText, setTitleText] = React.useState<string>(title);
  const bodyText = 'This is not really a bird nest.';

  const onPressTitle = () => {
    setTitleText(title + '[Pressed]');
  };

  const [text, onChangeText] = React.useState<string>('Useless Text');
  const [number, onChangeNumber] = React.useState<string>('');
  const [value, onChangeText1] = React.useState<string>(
    'Useless Multiline Placeholder',
  );

  const [isEnabled, setIsEnabled] = React.useState(false);
  const toggleSwitch = () => setIsEnabled(previousState => !previousState);

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: safeAreaInsets.top,
          paddingBottom: safeAreaInsets.bottom,
        },
      ]}
    >
      <Switch
        trackColor={{ false: '#0e773d', true: '#dd111b' }}
        thumbColor={isEnabled ? '#f5d505' : '#1ba9d4'}
        ios_backgroundColor="#3e3e3e"
        onValueChange={toggleSwitch}
        value={isEnabled}
      />
      <Text style={styles.baseText}>
        <Text style={styles.titleText} onPress={onPressTitle}>
          {titleText}
          {'\n'}
          {'\n'}
        </Text>
        <Text ellipsizeMode="tail" numberOfLines={5}>
          {bodyText}
        </Text>
      </Text>
      <Image
        source={{
          uri: 'https://reactnative.dev/docs/assets/p_cat2.png',
        }}
        style={styles.imgLogo}
      />
      <TextInput
        style={styles.textInput}
        onChangeText={onChangeText}
        value={text}
      />
      <TextInput
        style={styles.textInput}
        onChangeText={onChangeNumber}
        value={number}
        placeholder="Type a number"
        keyboardType="numeric"
      />
      <TextInput
        editable
        multiline
        style={{
          padding: 20,
          height: 100,
          borderColor: 'gray',
          borderWidth: 1,
        }}
        value={value}
        onChangeText={onChangeText1}
        maxLength={40}
        numberOfLines={5}
      />
      {children}
    </View>
  );
};
type DataItem = {
  id: string;
  title: string;
};

const DATA: DataItem[] = [
  {
    id: 'bd7acbea-c1b1-46c2-aed5-3ad53abb28ba',
    title: 'First Item',
  },
  {
    id: '3ac68afc-c605-48d3-a4f8-fbd91aa97f63',
    title: 'Second Item',
  },
  {
    id: '58694a0f-3da1-471f-bd96-145571e29d72',
    title: 'Third Item',
  },
];

type ItemProps = {
  item: DataItem;
  onPress: () => void;
  backgroundColor: string;
  textColor: string;
};

const Item = ({ item, onPress, backgroundColor, textColor }: ItemProps) => (
  <TouchableOpacity
    style={[styles.item, { backgroundColor: backgroundColor }]}
    onPress={onPress}
  >
    <Text style={[styles.title, { color: textColor }]}>{item.title}</Text>
  </TouchableOpacity>
);

const FlatListExample = () => {
  const [selectId, setSelectId] = React.useState<string>('');
  const renderItem = ({ item }: { item: DataItem }) => {
    const backgroundColor = item.id === selectId ? '#6e3b6e' : '#f9c2ff';
    const color = item.id === selectId ? 'white' : 'black';

    return (
      <Item
        item={item}
        onPress={() => setSelectId(item.id)}
        backgroundColor={backgroundColor}
        textColor={color}
      />
    );
  };

  return (
    <FlatList
      data={DATA}
      renderItem={renderItem}
      keyExtractor={item => item.id}
      extraData={selectId}
    />
  );
};

const DATA1 = [
  {
    title: 'Main dishes',
    data: ['Pizza', 'Burger', 'Risotto'],
  },
  {
    title: 'Sides',
    data: ['French Fries', 'Onion Rings', 'Fried Shrimps'],
  },
  {
    title: 'Drinks',
    data: ['Water', 'Coke', 'Beer'],
  },
  {
    title: 'Desserts',
    data: ['Cheese Cake', 'Ice Cream'],
  },
];

const SectionListExample = () => {
  return (
    <SectionList
      sections={DATA1}
      keyExtractor={(item, index) => item + index}
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.title}>{item}</Text>
        </View>
      )}
      renderSectionHeader={({ section: { title } }) => (
        <Text style={styles.header}>{title}</Text>
      )}
    />
  );
};

function Test() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <ViewBoxesWithColorAndText title="Sample Text111">
        <Text>Child content</Text>
      </ViewBoxesWithColorAndText>
      <SectionListExample />
    </SafeAreaProvider>
  );
}

const App = () => {
  useEffect(() => {
    const backAction = () => {
      Alert.alert('Hold on!', 'Are you sure you want to go back?', [
        {
          text: 'Cancel',
          onPress: () => null,
          style: 'cancel',
        },
        { text: 'YES', onPress: () => BackHandler.exitApp() },
      ]);
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, []);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <Text style={styles.text}>Click Back button!</Text>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  baseText: {
    fontFamily: 'Cochin',
  },
  titleText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  imgLogo: {
    width: 200,
    height: 200,
  },
  textInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginTop: 20,
    marginBottom: 20,
    width: '80%',
  },
  scrollView: {
    backgroundColor: 'pink',
    marginHorizontal: 20,
  },
  text: {
    fontSize: 42,
  },
  item: {
    backgroundColor: '#f9c2ff',
    padding: 20,
    marginVertical: 8,
    marginHorizontal: 16,
  },
  title: {
    fontSize: 32,
  },
  header: {
    fontSize: 32,
    backgroundColor: '#fff',
  },
});

export default Test;
