/*
 * @name: Page
 * @desc: A component for our notes app
 * @author: dongyan
 * */

import React, {Component} from 'react';
import {
	AppRegistry, Platform, StyleSheet, FlatList, TextInput,
	Button, Text, View, ImagePickerIOS, Image,
} from 'react-native';
import ImagePicker from 'react-native-image-picker';
import Icon from 'react-native-vector-icons/MaterialIcons';

var rnfs = require('react-native-fs');

function TopBar(props) {
	return (
		<View style={props.style}>
			<Icon.Button
				name="arrow-back"
				size={30}
				style={styles.button}
				iconStyle={styles.iconStyle}
				backgroundColor="transparent"
				color='#553300'
				onPress={() => props.onPressReturn()}
			/>
			<Icon.Button
				name="save"
				size={30}
				style={styles.button}
				iconStyle={styles.iconStyle}
				backgroundColor="transparent"
				color='#553300'
				onPress={() => props.onPressSave()}
			/>
			<Icon.Button
				size={50}
				style={{...styles.button, flex: 3}}
				iconStyle={styles.iconStyle}
				backgroundColor="transparent"
				color='#553300'
			>
				{props.name}
			</Icon.Button>

			<View style={styles.rightSideButtons}>
				<Icon.Button
					name="undo"
					size={25}
					style={styles.button}
					iconStyle={styles.iconStyle}
					backgroundColor="transparent"
					onPress={() => props.onPressUndo()}
				>
				</Icon.Button>

				<Icon.Button
					name="redo"
					size={25}
					style={styles.button}
					iconStyle={styles.iconStyle}
					backgroundColor="transparent"
					onPress={() => props.onPressRedo()}
				>
				</Icon.Button>

				<Icon.Button
					name="photo"
					size={25}
					style={styles.button}
					iconStyle={styles.iconStyle}
					backgroundColor="transparent"
					onPress={() => props.onPressAddImage()}
				>
				</Icon.Button>
			</View>
		</View>
	);
}

function RichText(props) {
	return (
		<FlatList 
			constentContainerStyle={props.style}
			data={props.content.items}
			keyExtractor = {(item, index) => ('' + index)}
			renderItem={
				({item, index}) => {
					const items = props.content.items;
					const view1 = (item.type == 'text') ? (
						<TextInput
							style={styles.text}
							onFocus={ ({}) => props.onFocus(index) }
							onChangeText={ (text) => props.onChangeText(index, text) }
							multiline={true}
							value={items[index].value}
						/>
					) : (
						<Image
							style={styles.image}
							source={items[index].value}
						/>
					);

					let canDelete = (index > 0 && items[index - 1].type == 'text') ||
						(index < items.length - 1 && items[index + 1].type == 'text');
					const view2 = (item.type == 'text' && !canDelete) ? (
						<Icon.Button
							style={styles.deleteButton}
							name='clear'
							size={25}
							iconStyle={styles.iconStyle}
							backgroundColor="transparent"
							onPress={() => props.onPressClear(index)}
						/>
					) : (
						<Icon.Button
							style={styles.deleteButton}
							name='delete'
							size={25}
							iconStyle={styles.iconStyle}
							backgroundColor="transparent"
							onPress={() => props.onPressDelete(index)}
						/>
					);

					return (
						<View style={styles.item}>
							{view1}
							{view2}
						</View>
					);
				}
			}
		/>
	);
}

export default class Page extends Component {
	constructor(props) {
		super(props);
		const content = addTimeStamp({
			pos: 0,
			items:[{ type:'text', value:'', }],
		});
		this.initContent = content;
		this.state = {
			step: 0,
			history: [content],
		};
		this.loadFile();
	}

  render() {
		return (
			<View style={styles.container}>
				<View style={styles.blank} />

				<TopBar
					name={this.props.name}
					style={styles.topbar}
					onPressReturn={() => this.onPressReturn()}
					onPressUndo={() => this.onPressUndo()}
					onPressRedo={() => this.onPressRedo()}
					onPressAddImage={() => this.onPressAddImage()}
					onPressSave={() => this.saveFile()}
				/>

				<View style={styles.mainContent}>
					<RichText
						content={this.state.history[this.state.step]}
						onFocus={(i) => this.onFocus(i)}
						onChangeText={(i, text) => this.onChangeText(i, text)}
						onPressDelete={(i) => this.onPressDelete(i)}
						onPressClear={(i) => this.onChangeText(i, '')}
					/>
				</View>

      </View>
    );
  }

	loadFile() {
		const path = `${rnfs.DocumentDirectoryPath}/${this.props.id}.rtxt`;
		rnfs.readFile(path, 'utf8')
			.then((content) => {
				this.setState({history: [JSON.parse(content)]});
			})
			.catch((error) => {
				console.log(error);
			});
	}

	saveFile() {
		const content = JSON.stringify(this.state.history[this.state.step]);
		const path = `${rnfs.DocumentDirectoryPath}/${this.props.id}.rtxt`;
		rnfs.writeFile(path, content, 'utf8')
			.then((success) => console.log('FILE WRITTEN'))
			.catch((error) => {
				console.log(error)
				alert(error);
			});
	}

	setHistory(content) {
		let history = this.state.history.slice(0, this.state.step + 1);
		let step = this.state.step + 1;
		if (content.timestamp - history[this.state.step].timestamp < 200) {
			step = this.state.step;
			history[this.state.step] = content;
		} else {
			history = history.concat([content]);
			if (history.length > 500) {
				step -= history.length - 500;
				history = history.slice(history.length - 500, history.length);
			}
		}
		this.setState({step, history});
	}

	onPressReturn() {
		this.saveFile();
		this.props.onPressReturn();
	}

	onPressUndo() {
		const step = this.state.step;
		if (step > 0) {
			this.setState({ step: step - 1});
		}
	}

	onPressRedo() {
		const step = this.state.step;
		if (step + 1 < this.state.history.length) {
			this.setState({ step: step + 1});
		}
	}

	addImage(imageUri) {
		const history = this.state.history.slice(0, this.state.step + 1);
		const content = history[this.state.step];
		const items = content.items.slice();
		items.splice(content.pos + 1, 0, 
			{ type: 'image', value: {uri: imageUri}},
			{ type: 'text', value: ''}
		);
		const new_content = {pos: content.pos + 2, items: items};
		this.setHistory(addTimeStamp(new_content));
	}

	onPressAddImage() {
		const options = {
			title: 'Select Image',
			storageOptions: {
				path: 'images',
			},
		};

		ImagePicker.showImagePicker(options,
			(response) => {
				if (response.didCancel) {
					console.log('T_T');
				} else if (response.error) {
					console.log('Error: ', response.error);
				} else {
					this.addImage(response.uri);
				}
			}
		);
	}

	onPressDelete(i) {
		const history = this.state.history.slice(0, this.state.step + 1);
		const content = history[this.state.step];
		const items = content.items.slice();
		this.setHistory(
			addTimeStamp({...content, items: items.slice(0, i).concat(items.slice(i + 1)),})
		);
	}

	onFocus(i) {
		const history = this.state.history;
		history[this.state.step].pos = i;
		this.setState({history});
	}

	onChangeText(i, text) {
		const history = this.state.history.slice(0, this.state.step + 1);
		const content = history[this.state.step];
		const items = content.items.slice();
		items[i] = {...items[i], value: text,};
		this.setHistory(addTimeStamp({...content, items: items}));
	}
}

function addTimeStamp(content) {
	return {...content, timestamp: new Date().getTime()};
}

const styles = StyleSheet.create({
  container: {
		flex: 1,
		flexDirection: 'column',
    justifyContent: 'flex-start',
		alignItems: 'stretch',
    backgroundColor: '#E5E5BB',
  },

	blank: {
		flex: 1,
	},

	topbar: {
		flex: 2,
		flexDirection: 'row',
		justifyContent: 'center',
		alignItems: 'stretch',
	},

	mainContent: {
		flex: 20,
		paddingLeft: 25,
		paddingRight: 10,
		justifyContent: 'flex-start',
		alignItems: 'stretch',
		marginBottom: 30,
	},

	button: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: 'transparent',
		color: '#553300',
		textAlign: 'center',
		fontSize: 50,
		fontFamily: 'consolas',
	},

	rightSideButtons: {
		flex: 1,
		flexDirection: 'row',
		justifyContent: 'flex-end',
	},

	iconStyle: {
		color: '#553300',
		justifyContent: 'center',
		alignItems: 'center',
		marginLeft: 5,
		marginRight: 5,
		textAlign: 'center',
	},

	item: {
		flex: 1,
		flexDirection: 'row',
	},

	text: {
		flex: 9,
		width: 240,
		marginRight: 10,
		marginTop: 10,
		marginBottom: 10,
		fontSize: 16,
	},

	image: {
		flex: 9,
		width: 240,
		height: 240,
		marginRight: 10,
		marginTop: 10,
		marginBottom: 10,
	},

	deleteButton: {
		flex: 1,
		justifyContent: 'center',
		alignItems: 'center',
		backgroundColor: '#D0D095',
		marginTop: 10,
		marginBottom: 10,
		marginLeft: 10,
		marginRight: 10,
		borderRadius: 25,
		textAlign: 'center',
		width: 50,
	},
});

AppRegistry.registerComponent('Page', () => Page);
