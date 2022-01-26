import * as React from 'react';
import {
  StatusBar,
  Image,
  FlatList,
  Dimensions,
  Animated,
  Text,
  View,
  StyleSheet,
  SafeAreaView,
  LogBox,
} from 'react-native';
const {width} = Dimensions.get('screen');
import {
  FlingGestureHandler,
  Directions,
  State,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import {getMovies} from './src/themoviedb/api';

LogBox.ignoreLogs(['react-native-gesture-handler']);
const OVERFLOW_HEIGHT = 80;
const SPACING = 11;
const ITEM_WIDTH = width * 0.76;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;
const VISIBLE_ITEMS = 3;

const Loading = () => (
  <View style={styles.loadingContainer}>
    <Text style={styles.paragraph}>Loading...</Text>
  </View>
);

const OverflowItems = ({data, scrollXAnimated}) => {
  const inputRange = [-1, 0, 1];
  const translateY = scrollXAnimated.interpolate({
    inputRange,
    outputRange: [OVERFLOW_HEIGHT, 0, -OVERFLOW_HEIGHT],
  });
  return (
    <View style={styles.overflowContainer}>
      <Animated.View style={{transform: [{translateY}]}}>
        {data.map((item, index) => {
          return (
            <View key={index} style={styles.itemContainer}>
              <Text style={[styles.title]} numberOfLines={1}>
                {item.title}
              </Text>
              <View style={styles.itemContainerRow}>
                <Text style={[styles.location]}>{item.description}</Text>
                <Text style={[styles.date]}>{item.releaseDate}</Text>
              </View>
            </View>
          );
        })}
      </Animated.View>
    </View>
  );
};

export default function App() {
  const [data, setData] = React.useState([]);
  const scrollXIndex = React.useRef(new Animated.Value(0)).current;
  const scrollXAnimated = React.useRef(new Animated.Value(0)).current;
  const [index, setIndex] = React.useState(0);
  const setActiveIndex = React.useCallback(activeIndex => {
    scrollXIndex.setValue(activeIndex);
    setIndex(activeIndex);
  });

  React.useEffect(() => {
    Animated.spring(scrollXAnimated, {
      toValue: scrollXIndex,
      useNativeDriver: true,
    }).start();

    const fetchData = async () => {
      const data = await getMovies();
      setData(data);
    };
    if (data.length === 0) {
      fetchData(data);
    }
  });

  if (data.length === 0) {
    return <Loading />;
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <FlingGestureHandler
        key="left"
        direction={Directions.LEFT}
        onHandlerStateChange={ev => {
          if (ev.nativeEvent.state === State.END) {
            if (index === data.length - 1) {
              return;
            }
            setActiveIndex(index + 1);
          }
        }}>
        <FlingGestureHandler
          key="right"
          direction={Directions.RIGHT}
          onHandlerStateChange={ev => {
            if (ev.nativeEvent.state === State.END) {
              if (index === 0) {
                return;
              }
              setActiveIndex(index - 1);
            }
          }}>
          <SafeAreaView style={styles.container}>
            <StatusBar hidden />
            <OverflowItems data={data} scrollXAnimated={scrollXAnimated} />
            <FlatList
              data={data}
              keyExtractor={(_, index) => String(index)}
              horizontal
              inverted
              contentContainerStyle={{
                flex: 1,
                justifyContent: 'center',
                padding: SPACING * 2,
                marginTop: 50,
              }}
              scrollEnabled={false}
              removeClippedSubviews={false}
              CellRendererComponent={({
                item,
                index,
                children,
                style,
                ...props
              }) => {
                const newStyle = [style, {zIndex: data.length - index}];
                return (
                  <View style={newStyle} index={index} {...props}>
                    {children}
                  </View>
                );
              }}
              renderItem={({item, index}) => {
                const inputRange = [index - 1, index, index + 1];
                const translateX = scrollXAnimated.interpolate({
                  inputRange,
                  outputRange: [50, 0, -100],
                });
                const scale = scrollXAnimated.interpolate({
                  inputRange,
                  outputRange: [0.8, 1, 1.3],
                });
                const opacity = scrollXAnimated.interpolate({
                  inputRange,
                  outputRange: [1 - 1 / VISIBLE_ITEMS, 1, 0],
                });

                return (
                  <Animated.View
                    style={{
                      position: 'absolute',
                      left: -ITEM_WIDTH / 2,
                      opacity,
                      transform: [
                        {
                          translateX,
                        },
                        {scale},
                      ],
                    }}>
                    <Image
                      source={{uri: item.poster}}
                      style={{
                        width: ITEM_WIDTH,
                        height: ITEM_HEIGHT,
                        borderRadius: 14,
                      }}
                    />
                  </Animated.View>
                );
              }}
            />
          </SafeAreaView>
        </FlingGestureHandler>
      </FlingGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: -1,
  },
  location: {
    fontSize: 10,
    width: ITEM_WIDTH,
  },
  date: {
    fontSize: 12,
  },
  itemContainer: {
    height: OVERFLOW_HEIGHT,
    padding: SPACING * 2,
    paddingTop: 20,
    paddingBottom: 30,
  },
  itemContainerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  overflowContainer: {
    marginTop: 20,
    height: OVERFLOW_HEIGHT,
    overflow: 'hidden',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paragraph: {
    margin: 24,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
