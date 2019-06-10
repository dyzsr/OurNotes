import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View,
  Button,
  FlatList,
  SectionList,
  PixelRatio,
  Dimensions,
  Platform,
  SafeAreaView,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Alert,
	AlertIOS,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Swipeable from 'react-native-swipeable';
import Page from './Page';

// 分辨率适配
const px2dp = px => PixelRatio.roundToNearestPixel(px);
// 获取屏幕宽度
const screenWidth = require('Dimensions').get('window').width;

const rnfs = require('react-native-fs');

// 文本列表，show 为 true 时返回列表页，否则返回编辑页
export default class notes extends Component {
  state = {
    currentlyOpenSwipeable: null,
  };

  handleScroll = () => {
    const {currentlyOpenSwipeable} = this.state;
    if (currentlyOpenSwipeable) {
      currentlyOpenSwipeable.recenter();
    }
  };

  constructor(props) {
    super(props);
		console.disableYellowBox = true;
		this.array = [];
    this.state = {
      data: [],
      show: true,
      id: 0,
      title: '',
    }
		const path = `${rnfs.DocumentDirectoryPath}/list.txt`;
		rnfs.readFile(path, 'utf8')
			.then((content) => {
				this.array = JSON.parse(content);
				this.setState({data: [...this.array]});
				//alert('jsijfids' + this.state.data.length);
				this.cnt = 0;
				for (var i = 0; i < this.state.data.length; i ++) {
					this.cnt = (this.cnt > this.array[i].id ? this.cnt : this.array[i].id);
					//	alert('aaaa');
				}
			})
			.catch((error) => {
				console.log(error);
				//alert(error);
			});
		//this.loadFile();
		//alert(this.state.data.length);
		this.cnt++;
  }

  componentDidMount() {
    this.setState({data: [...this.array]});
  }

  render() {
    return (
      this.state.show == true
      
      ?

      (<SafeAreaView style = {styles.container} onScroll = {this.handleScroll} >

        <SectionList
          sections = {[{
            renderItem: this.renderItem,
            key: 'a',
            data: this.state.data
          }]}
          renderSectionHeader = {this.renderSectionHeader}
          ItemSeparatorComponent = {this.itemSeparator}
          SectionSeparatorComponent = {this.sectionSeparator}
          ListHeaderComponent = {this.listHeader}
          ListFooterComponent = {this.listHeader}
          keyExtractor = {(item,index) => {return '' + index}}
        />

      </SafeAreaView>)

      :

      (<Page
        id = {this.state.id}
        name = {this.state.title}
        onPressReturn = {() => {
          const show = this.state.show;
          this.setState({show: !show});
        }}
      />)
    );
  }

  renderSectionHeader = () => {
    return (
      <View style= {styles.renderSectionHeader} >

        <Text style = {styles.title} >
          记事本
        </Text>
        
        <Icon
          name = {'plus-circle'}
          size = {45}
          style = {styles.iconAdd}
          onPress = {this.newText}
        />

      </View>
    )
  }

	loadFile() {
		const path = `${rnfs.DocumentDirectoryPath}/list.txt`;
		rnfs.readFile(path, 'utf8')
			.then((content) => {
				this.array = JSON.parse(content);
				this.setState({data: [...this.array]});
				//alert('jsijfids' + this.array.length);
			})
			.catch((error) => {
				console.log(error);
				alert(error);
			});
	}

	newText = () => {
		const newcnt = this.cnt + 1;
		this.cnt = newcnt;
		this.array.unshift({id: newcnt, title: '未命名' + this.cnt, content: '', time: new Date().toLocaleString()});
		this.setState({data: [...this.array]});

		const datalist = JSON.stringify(this.array);
		const path = `${rnfs.DocumentDirectoryPath}/list.txt`;
		rnfs.writeFile(path, datalist, 'utf8')
			.then((success) => console.log('LIST UPDATED'))
			.catch((error) => {
				console.log(error)
				alert(error);
			});
		//alert(this.cnt);
	}

  editText = (item) => {
    const show = this.state.show;
    const id = item.id;
    const title = item.title;
    this.setState({show: !show, id: id, title: title});
		//alert(id);
  }

  itemSeparator() {
    return (
      <View style = {styles.itemSeparator} >
      </View>
    )
  }

	renameItem = (item) => {
    AlertIOS.prompt('重命名', '请输入新名称', [
      {text: '取消', onPress: () => {}, style: 'cancel'},
      {
        text: '确定', onPress: (text) => {
          const title = text;
          //alert(this.array.length);
					//alert(item.id);
          for (i = 0; i < this.array.length; i ++) {
            //alert(this.array[i].id);
            if (this.array[i].id == item.id) {
							//     alert(title);
              this.array[i].title = title;
              break;
            }
          }
          this.setState({data: [...this.array]});


					const datalist = JSON.stringify(this.array);
					const path = `${rnfs.DocumentDirectoryPath}/list.txt`;
					rnfs.writeFile(path, datalist, 'utf8')
						.then((success) => console.log('LIST UPDATED'))
						.catch((error) => {
							console.log(error)
							alert(error);
						});
				}
        , style: 'default'}
    ], 'plain-text', item.title);
  }

  renderItem = ({item, index}) => {
    const {currentlyOpenSwipeable} = this.state;
    return (
      <ListItemModule
        item = {item}
				onPressItem = {() => this.editText(item)}
				onLongPressItem = {() => this.renameItem(item)}
        onPressDeleteItem = {(item) => {
          Alert.alert(item.title, '你正在删除这一条目',
            [
              {
                text:"删除",
                onPress: () => {
									const filepath = `${rnfs.DocumentDirectoryPath}/${item.id}.rtxt`;
									rnfs.unlink(filepath)
										.then(() => {
											console.log('FILE DELETED');
										})
										.catch((error) => {
											console.log(error);
										});

                  currentlyOpenSwipeable.recenter();
                  this.setState({currentlyOpenSwipeable: null});
                  setTimeout(() => {
										this.array = this.array.filter(i => i.id !== item.id);
										this.setState({data: [...this.array]});

										const datalist = JSON.stringify(this.state.data);
										const path = `${rnfs.DocumentDirectoryPath}/list.txt`;
										rnfs.writeFile(path, datalist, 'utf8')
											.then((success) => console.log('LIST UPDATED'))
											.catch((error) => {
												console.log(error)
												alert(error);
											});
                  }, 300);

                }
              },
              {
                text:"算了",
                onPress: () => { currentlyOpenSwipeable.recenter(); }
              },
            ]
          );
        }}
        onOpen = {(event, gestureState, swipeable) => {
          if (currentlyOpenSwipeable && currentlyOpenSwipeable !== swipeable) {
            currentlyOpenSwipeable.recenter();
          }
          this.setState({currentlyOpenSwipeable: swipeable});
        }}
        onClose = {() => { this.setState({currentlyOpenSwipeable: null}); }}
      />
    )
  };

  listHeader = () => {
    return (
      <View style = {styles.listHeader} >
      </View>
    )
  }

  sectionSeparator = () => {
    return (
      <View style = {styles.sectionSeparator} >
      </View>
    )
  }

}

function ListItemModule({item, onPressItem, onLongPressItem, onPressDeleteItem, onOpen, onClose}) {
  return (
    <Swipeable
      rightButtons = {[
        <TouchableWithoutFeedback onPress = {() => {
          onPressDeleteItem(item);
        }}>
          <View style = {styles.deleteButton} >
            <Text style = {styles.deleteWord} >
              删除
            </Text>
          </View>
        </TouchableWithoutFeedback>
      ]}
      onRightButtonsOpenRelease = {onOpen}
      onRightButtonsCloseRelease = {onClose}
    >

		<TouchableOpacity onPress = {onPressItem}
			onLongPress = {onLongPressItem}>

        <View style = {styles.listItem} >

          <View style = {styles.listContent} >

            <View style = {styles.listItemTop} >
              <Text style = {styles.itemTitle} key = {item.name} >
                {item.title}
              </Text>
              <Text style = {styles.itemTime} >
                {item.time}
              </Text>
            </View>

            <Text style = {styles.itemBottom} numberOfLines = {1} >
              {item.content}
            </Text>

          </View>

        </View>

      </TouchableOpacity>

    </Swipeable>
  );
}

// 样式
const styles = StyleSheet.create({
  container: {
		flex: 1,
		flexDirection: 'column',
    justifyContent: 'flex-start',
		alignItems: 'stretch',
    backgroundColor: '#E5E5BB',
  },
  title: {
    fontSize: px2dp(30),
  },
  iconAdd: {
    color: "skyblue",
  },
  listItem: {
    width: screenWidth,
    height: px2dp(130),
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: px2dp(20),
    paddingVertical: px2dp(20),
    marginLeft: px2dp(0),
    flex: 1,
  },
  listContent: {
    marginLeft: px2dp(0),
    flex: 1,
    height: px2dp(100),
  },
  listItemTop: {
    marginHorizontal: 0,
    marginTop: 0,
    height: px2dp(45),
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemSeparator: {
    height: px2dp(1),
    width: screenWidth,
    backgroundColor: '#553300',
  },
  listHeader: {
    backgroundColor: '#999977',
    height: px2dp(10),
  },
  renderSectionHeader: {
    paddingHorizontal: px2dp(20),
    height: px2dp(80),
    borderBottomColor: 'gray',
    borderBottomWidth: px2dp(1),
    backgroundColor: '#F5F5F0',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionSeparator: {
    height: px2dp(10),
    backgroundColor: '#999977',
    borderTopColor: 'gray',
    borderTopWidth: px2dp(1),
  },
  itemTitle: {
    fontSize: px2dp(30),
  },
  itemTime: {
    color: 'gray',
    fontSize: px2dp(15),
    marginRight: 0,
  },
  itemBottom: {
    marginTop: px2dp(20),
    marginLeft: px2dp(20),
    marginRight: px2dp(30),
    height: px2dp(30),
    fontSize: px2dp(20),
    color: 'gray',
  },
  deleteButton: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 20,
    backgroundColor: 'red',
  },
  deleteWord: {
    color: '#fff',
    fontSize: 20,
  }
});

AppRegistry.registerComponent('OurNotes', () => notes);
