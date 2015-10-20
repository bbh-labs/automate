'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var React = require('react');
var ReactDOM = require('react-dom');
var update = require('react-addons-update');
var Flux = require('flux');
var dispatcher = new Flux.Dispatcher();

var fs = remote.require('fs');
var robot = remote.require('robotjs');
var globalShortcut = remote.require('global-shortcut');

var queueIndex = 0;
var queueTimer = -1;

var App = React.createClass({
	displayName: 'App',

	styles: {
		container: {
			display: 'flex',
			flexDirection: 'row',
			maxHeight: '100%'
		},
		innerContainer: {
			display: 'flex',
			flex: '1 1',
			padding: '16px'
		},
		wrapper: {
			display: 'flex',
			flex: '0 0 50%',
			flexDirection: 'column'
		}
	},
	render: function render() {
		return React.createElement(
			'div',
			{ style: this.styles.container },
			React.createElement(
				'div',
				{ style: this.styles.innerContainer },
				React.createElement(
					'div',
					{ style: this.styles.wrapper },
					React.createElement(App.Banner, null),
					React.createElement(App.Menu, null)
				),
				React.createElement(
					'div',
					{ style: this.styles.wrapper },
					React.createElement(App.List, _extends({}, this.state, { ref: 'list' })),
					React.createElement(App.Button, this.state)
				)
			)
		);
	},
	getInitialState: function getInitialState() {
		return { playing: false, editingActionID: -1 };
	},
	componentDidMount: function componentDidMount() {
		this.listenerID = dispatcher.register((function (payload) {
			switch (payload.type) {
				case 'play':
					this.setState({ playing: true });
					this.refs.list.play();
					break;
				case 'stop':
					this.setState({ playing: false });
					this.refs.list.stop();
					break;
				case 'listen':
					this.setState({ editingActionID: payload.actionID });
					break;
				case 'unlisten':
					this.setState({ editingActionID: -1 });
					break;
			}
		}).bind(this));

		var ret = globalShortcut.register('ctrl+shift+s', (function () {
			var editingActionID = this.state.editingActionID;
			if (editingActionID >= 0) {
				dispatcher.dispatch({
					type: 'setMousePosition',
					editingActionID: editingActionID,
					position: robot.getMousePos()
				});
			}
		}).bind(this));
		if (!ret) {
			alert('Failed to set mouse shortcut: ctrl+shift+s!');
		}

		ret = globalShortcut.register('ctrl+shift+enter', (function () {
			this.togglePlayback();
		}).bind(this));
		if (!ret) {
			alert('Failed to set mouse shortcut: ctrl+shift+enter!');
		}

		ipc.on('new', (function () {
			this.refs.list['new']();
		}).bind(this));

		ipc.on('open', (function (filename) {
			if (!filename) {
				return;
			}

			fs.readFile(filename, 'utf8', (function (err, data) {
				if (!err) {
					this.refs.list.loadJSON(data);
				}
			}).bind(this));
		}).bind(this));

		ipc.on('save', (function (filename) {
			if (!filename) {
				return;
			}

			var data = JSON.stringify(this.refs.list.getJSON());
			fs.writeFile(filename, data, 'utf8');
		}).bind(this));
	},
	componentWillUnmount: function componentWillUnmount() {
		dispatcher.unregister(this.listenerID);
	},
	togglePlayback: function togglePlayback() {
		if (this.state.playing) {
			this.setState({ playing: false });
			this.refs.list.stop();
		} else {
			this.setState({ playing: true });
			this.refs.list.play();
		}
	}
});

App.Banner = React.createClass({
	displayName: 'Banner',

	styles: {
		container: {
			flex: '0 0 33.3333%'
		},
		title: {
			fontFamily: 'Oswald'
		}
	},
	render: function render() {
		return React.createElement(
			'div',
			{ style: this.styles.container },
			React.createElement(
				'h1',
				{ style: this.styles.title },
				'AUTOMATE'
			),
			React.createElement(
				'h4',
				null,
				'TAKE OVER CONTROL YOUR SCREEN'
			)
		);
	}
});

App.Menu = React.createClass({
	displayName: 'Menu',

	styles: {
		container: {
			display: 'flex',
			flex: '1 1 33.3333%',
			flexDirection: 'column',
			maxWidth: '80%'
		},
		buttonsContainer: {
			display: 'flex',
			flex: '0 1',
			flexDirection: 'row',
			flexWrap: 'wrap'
		}
	},
	render: function render() {
		return React.createElement(
			'div',
			{ style: this.styles.container },
			React.createElement(
				'h3',
				{ className: 'text-center' },
				'ACTIONS MENU'
			),
			React.createElement(
				'div',
				{ style: this.styles.buttonsContainer },
				React.createElement(
					App.Menu.Button,
					{ type: 'MouseClick', style: { background: '#2e96df' } },
					'MOUSE CLICK'
				),
				React.createElement(
					App.Menu.Button,
					{ type: 'KeyType', style: { background: '#41c2ae' } },
					'KEY TYPE'
				),
				React.createElement(
					App.Menu.Button,
					{ type: 'MouseDoubleClick', style: { background: '#2e96df' } },
					'MOUSE DOUBLE CLICK'
				),
				React.createElement(
					App.Menu.Button,
					{ type: 'KeyPress', style: { background: '#41c2ae' } },
					'KEY PRESS'
				),
				React.createElement(
					App.Menu.Button,
					{ type: 'MouseDrag', style: { background: '#2e96df' } },
					'MOUSE DRAG'
				)
			)
		);
	}
});

App.Menu.Button = React.createClass({
	displayName: 'Button',

	styles: {
		container: {
			display: 'flex',
			flex: '0 0 50%',
			flexDirection: 'column',
			justifyContent: 'center'
		},
		innerContainer: {
			flex: '1 1',
			margin: '0 8px'
		},
		shortcut: {
			margin: 0
		}
	},
	render: function render() {
		var actionProps = {
			draggable: 'true',
			style: this.props.style,
			onDragStart: this.handleDragStart
		};
		return React.createElement(
			'div',
			{ style: this.styles.container },
			React.createElement(
				'div',
				{ style: this.styles.innerContainer },
				React.createElement(
					'button',
					_extends({ className: 'btn-action' }, actionProps),
					this.props.children
				),
				React.createElement(
					'h5',
					{ className: 'text-center', style: this.styles.shortcut },
					this.props.shortcut
				)
			)
		);
	},
	handleDragStart: function handleDragStart(evt) {
		evt.dataTransfer.setData('text/plain', this.props.type);
	}
});

App.List = React.createClass({
	displayName: 'List',

	queue: [],
	styles: {
		container: {
			overflowY: 'scroll',
			background: 'white',
			border: '1px solid #a0a0a0',
			padding: '16px'
		}
	},
	render: function render() {
		var editingActionID = this.props.editingActionID;
		var inputProps = {
			type: 'number',
			placeholder: 'loops',
			value: this.state.loops,
			onChange: this.handleChangeLoopCount
		};
		return React.createElement(
			'div',
			{ style: this.styles.container },
			React.createElement('input', inputProps),
			this.state.actions.map((function (action, i) {
				var elem;
				var props = {
					key: i,
					action: action,
					actionID: i,
					editingActionID: editingActionID
				};
				switch (action.type) {
					case 'MouseClick':
						elem = React.createElement(App.List.MouseClick, _extends({ text: 'Mouse Click' }, props));break;
					case 'MouseDoubleClick':
						elem = React.createElement(App.List.MouseDoubleClick, _extends({ text: 'Mouse Double Click' }, props));break;
					case 'MouseDrag':
						elem = React.createElement(App.List.MouseDrag, _extends({ text: 'Mouse Drag' }, props));break;
					case 'KeyType':
						elem = React.createElement(App.List.KeyType, _extends({ text: 'Key Type' }, props));break;
					case 'KeyPress':
						elem = React.createElement(App.List.KeyPress, _extends({ text: 'Key Press' }, props));break;
					case 'Empty':
						elem = React.createElement(App.List.Empty, _extends({ text: 'Drag and drop action here' }, props));break;
				}
				return elem;
			}).bind(this)),
			React.createElement(App.List.Item, null)
		);
	},
	getInitialState: function getInitialState() {
		return {
			actions: [],
			loops: 1
		};
	},
	componentDidMount: function componentDidMount() {
		this.listenerID = dispatcher.register((function (payload) {
			var actions = this.state.actions;
			switch (payload.type) {
				case 'addEmpty':
				case 'addMouseClick':
				case 'addMouseDoubleClick':
				case 'addMouseDrag':
				case 'addKeyType':
				case 'addKeyPress':
					var type = payload.type.substring(3, payload.type.length);
					actions.push({ type: type });
					break;
				case 'updateEmpty':
				case 'updateMouseClick':
				case 'updateMouseDoubleClick':
				case 'updateMouseDrag':
				case 'updateKeyType':
				case 'updateKeyPress':
					payload.type = payload.type.substring(6, payload.type.length);
					actions[payload.actionID] = m(actions[payload.actionID], payload.action);
					break;
				case 'removeEmpty':
				case 'removeMouseClick':
				case 'removeMouseDoubleClick':
				case 'removeMouseDrag':
				case 'removeKeyType':
				case 'removeKeyPress':
					actions.splice(payload.actionID, 1);
					break;
				case 'setMousePosition':
					this.updateAction(payload.editingActionID, payload.position);
					break;
				default:
					return;
			}
			this.setState({ actions: actions });
		}).bind(this));
	},
	componentWillUnmount: function componentWillUnmount() {
		dispatcher.unregister(this.listenerID);
	},
	play: function play(actions) {
		if (!actions) {
			actions = this.state.actions;
		}

		this.resetQueue();

		var loops = this.state.loops;
		for (var j = 0; j < loops; j++) {
			for (var i in actions) {
				var action = actions[i];
				switch (action.type) {
					case 'MouseClick':
						this.addToQueue(robot.moveMouse, [action.x, action.y]);
						this.addToQueue(robot.mouseToggle, ['down']);
						this.addToQueue(this.idle);
						this.addToQueue(robot.mouseToggle, ['up']);
						this.addToQueue(this.idle);
						break;
					case 'MouseDoubleClick':
						this.addToQueue(robot.moveMouse, [action.x, action.y]);
						this.addToQueue(robot.mouseClick, ['left', true]);
						this.addToQueue(this.idle);
						break;
					case 'MouseDrag':
						this.addToQueue(robot.moveMouseSmooth, [action.x1, action.y1]);
						this.addToQueue(robot.mouseToggle, ['down']);
						this.addToQueue(robot.moveMouseSmooth, [action.x2, action.y2]);
						this.addToQueue(robot.mouseToggle, ['up']);
						this.addToQueue(this.idle);
						break;
					case 'KeyType':
						var loop = j;
						if (action.isScript) {
							this.addToQueue(robot.typeString, ['' + eval(action.text)]);
						} else {
							this.addToQueue(robot.typeString, [action.text]);
						}
						this.addToQueue(this.idle);
						break;
					case 'KeyPress':
						this.addToQueue(robot.keyToggle, [action.key, 'down']);
						this.addToQueue(robot.keyToggle, [action.key, 'up']);
						this.addToQueue(this.idle);
						break;
				}
			}
		}

		this.playQueue();
	},
	addToQueue: function addToQueue(fn, args) {
		var o = { fn: fn, args: args };
		this.queue.push(o);
	},
	resetQueue: function resetQueue() {
		this.queue = [];
		queueIndex = 0;
	},
	playQueue: function playQueue() {
		var queue = this.queue;
		if (queueIndex < this.queue.length) {
			queueTimer = setTimeout((function () {
				var q = queue[queueIndex++];
				q.fn.apply(this, q.args);
				this.playQueue();
			}).bind(this), 50);
		} else {
			dispatcher.dispatch({ type: 'stop' });
		}
	},
	stop: function stop() {
		clearTimeout(queueTimer);
	},
	'new': function _new() {
		this.setState({ playing: false, loops: 1, actions: [] });
	},
	loadJSON: function loadJSON(data) {
		data = JSON.parse(data);
		this.setState({ playing: false, loops: data.loops, actions: data.actions });
	},
	getJSON: function getJSON() {
		return { loops: this.state.loops, actions: this.state.actions };
	},
	idle: function idle() {},
	updateAction: function updateAction(editingActionID, action) {
		if (typeof editingActionID != 'number') {
			return;
		}

		var actions = this.state.actions;
		var editAction = actions[editingActionID];
		if (editAction.type == 'MouseDrag') {
			var sameX = typeof editAction.x1 == 'number' && editAction.x1 == editAction.x2;
			var sameY = typeof editAction.y1 == 'number' && editAction.y1 == editAction.y2;
			if (sameX && sameY) {
				editAction.x2 = action.x;
				editAction.y2 = action.y;
			} else {
				editAction.x1 = action.x;
				editAction.y1 = action.y;
				editAction.x2 = action.x;
				editAction.y2 = action.y;
			}
		} else {
			actions[editingActionID] = m(editAction, action);
		}
		this.setState({ actions: actions });
	},
	handleChangeLoopCount: function handleChangeLoopCount(evt) {
		var value = parseInt(evt.target.value);
		if (value != NaN) {
			this.setState({ loops: value });
		}
	}
});

App.List.Item = React.createClass({
	displayName: 'Item',

	styles: {
		container: {
			display: 'flex',
			flex: '1 0 200px',
			flexDirection: 'column',
			borderBottom: '1px solid #c0c0c0',
			padding: '16px 0',
			textAlign: 'center',
			alignItems: 'center'
		},
		text: {
			color: '#a0a0a0'
		},
		action: {
			display: 'flex',
			flex: '1 1',
			background: '#636363',
			padding: '8px 32px',
			marginBottom: '16px',
			border: 'none',
			borderRadius: '8px',
			color: 'white'
		},
		properties: {
			display: 'flex',
			flexDirection: 'row'
		},
		plus: {
			display: 'inline-block',
			width: '16px',
			height: '16px',
			border: '1px solid #c0c0c0',
			borderRadius: '20px',
			padding: '4px',
			color: 'grey',
			cursor: 'pointer'
		},
		'delete': {
			display: 'block',
			background: '#ea4b35',
			border: 'none',
			borderRadius: '8px',
			margin: '16px auto',
			padding: '4px 16px',
			color: 'white'
		}
	},
	render: function render() {
		var containerProps = { style: this.styles.container, onDragOver: this.handleDragOver, onDrop: this.handleDrop };
		var actionProps = { style: m(this.styles.action, this.props.actionStyle) };
		var editing = this.props.editingActionID == this.props.actionID;
		if (this.props.action) {
			return React.createElement(
				'div',
				containerProps,
				React.createElement(
					'h5',
					{ style: this.styles.text },
					'Action ',
					this.props.actionID + 1
				),
				React.createElement(
					'button',
					actionProps,
					editing ? 'Editing..' : this.props.text
				),
				React.createElement(
					'div',
					{ style: this.styles.properties },
					this.props.children
				),
				React.createElement(
					'button',
					{ style: this.styles['delete'], onClick: this.handleDelete },
					'DELETE'
				)
			);
		}
		return React.createElement(
			'div',
			{ style: this.styles.container },
			React.createElement(
				'h5',
				{ style: this.styles.plus, onClick: this.handleAddEmpty },
				'+'
			)
		);
	},
	handleDelete: function handleDelete() {
		dispatcher.dispatch({ type: 'remove' + this.props.action.type, actionID: this.props.actionID });
	},
	handleDragOver: function handleDragOver(evt) {
		evt.preventDefault();
	},
	handleDrop: function handleDrop(evt) {
		var type = evt.dataTransfer.getData('text/plain');
		dispatcher.dispatch({ actionID: this.props.actionID, type: 'update' + type, action: { type: type } });
	},
	handleAddEmpty: function handleAddEmpty() {
		dispatcher.dispatch({ type: 'addEmpty' });
	}
});

App.List.NumberProperty = React.createClass({
	displayName: 'NumberProperty',

	styles: {
		label: { display: 'flex', flex: '0 0 50%' },
		span: { flex: '1 1 50%' },
		input: { flex: '1 1 50%' }
	},
	render: function render() {
		var inputProps = {
			ref: 'input',
			type: 'number',
			name: this.props.name,
			value: this.props.action[this.props.name],
			onChange: this.handleChange,
			onFocus: this.handleFocus,
			onBlur: this.handleBlur
		};
		return React.createElement(
			'label',
			{ style: this.styles.label },
			React.createElement(
				'span',
				{ style: this.styles.span },
				this.props.children
			),
			React.createElement('input', inputProps)
		);
	},
	handleChange: function handleChange(evt) {
		var elem = evt.target;
		var value = parseInt(elem.value);
		if (value == NaN) {
			return;
		}

		var action = this.props.action;
		var actionID = this.props.actionID;
		action[elem.name] = value;
		dispatcher.dispatch({ type: 'update' + action.type, action: action, actionID: actionID });
	},
	handleFocus: function handleFocus(evt) {
		dispatcher.dispatch({ type: 'unlisten', actionID: this.props.actionID });
		dispatcher.dispatch({ type: 'listen', actionID: this.props.actionID });
	}
});

App.List.TextProperty = React.createClass({
	displayName: 'TextProperty',

	render: function render() {
		var inputProps = {
			name: this.props.name,
			type: 'text',
			value: this.props.action[this.props.name],
			placeholder: 'Enter some text.',
			onChange: this.handleChange,
			onFocus: this.handleFocus,
			onBlur: this.handleBlur
		};
		return React.createElement('input', inputProps);
	},
	handleChange: function handleChange(evt) {
		var elem = evt.target;
		var action = this.props.action;
		var actionID = this.props.actionID;
		action[elem.name] = elem.value;
		dispatcher.dispatch({ type: 'update' + action.type, action: action, actionID: actionID });
	},
	handleFocus: function handleFocus(evt) {
		dispatcher.dispatch({ type: 'listen', actionID: this.props.actionID });
	},
	handleBlur: function handleBlur(evt) {
		dispatcher.dispatch({ type: 'unlisten', actionID: this.props.actionID });
	}
});

App.List.TextAreaProperty = React.createClass({
	displayName: 'TextAreaProperty',

	render: function render() {
		var inputProps = {
			name: this.props.name,
			value: this.props.action[this.props.name],
			placeholder: 'Enter some text.',
			rows: 4,
			onChange: this.handleChange,
			onFocus: this.handleFocus,
			onBlur: this.handleBlur
		};
		return React.createElement('textarea', inputProps);
	},
	handleChange: function handleChange(evt) {
		var elem = evt.target;
		var action = this.props.action;
		var actionID = this.props.actionID;
		action[elem.name] = elem.value;
		dispatcher.dispatch({ type: 'update' + action.type, action: action, actionID: actionID });
	},
	handleFocus: function handleFocus(evt) {
		dispatcher.dispatch({ type: 'listen', actionID: this.props.actionID });
	},
	handleBlur: function handleBlur(evt) {
		dispatcher.dispatch({ type: 'unlisten', actionID: this.props.actionID });
	}
});

App.List.CheckBoxProperty = React.createClass({
	displayName: 'CheckBoxProperty',

	styles: {
		label: { display: 'flex', flex: '0 0 50%' },
		span: { flex: '1 1 50%' },
		input: { flex: '1 1 50%' }
	},
	render: function render() {
		var inputProps = {
			name: this.props.name,
			type: 'checkbox',
			checked: this.props.action[this.props.name],
			onChange: this.handleChange,
			onFocus: this.handleFocus,
			onBlur: this.handleBlur
		};
		return React.createElement(
			'label',
			{ style: this.styles.label },
			React.createElement(
				'span',
				{ style: this.styles.span },
				this.props.children
			),
			React.createElement('input', inputProps)
		);
	},
	handleChange: function handleChange(evt) {
		var elem = evt.target;
		var action = this.props.action;
		var actionID = this.props.actionID;
		action[elem.name] = elem.checked;
		dispatcher.dispatch({ type: 'update' + action.type, action: action, actionID: actionID });
	},
	handleFocus: function handleFocus(evt) {
		dispatcher.dispatch({ type: 'listen', actionID: this.props.actionID });
	},
	handleBlur: function handleBlur(evt) {
		dispatcher.dispatch({ type: 'unlisten', actionID: this.props.actionID });
	}
});

App.List.MouseClick = React.createClass({
	displayName: 'MouseClick',

	render: function render() {
		var containerProps = m(this.props, { actionStyle: this.isSet() && { background: '#2d97de' } });
		return React.createElement(
			App.List.Item,
			containerProps,
			React.createElement(
				App.List.NumberProperty,
				_extends({ name: 'x' }, this.props),
				'mouse x '
			),
			React.createElement(
				App.List.NumberProperty,
				_extends({ name: 'y' }, this.props),
				'mouse y '
			)
		);
	},
	isSet: function isSet() {
		var action = this.props.action;
		return typeof action.x === 'number' && typeof action.y === 'number';
	}
});

App.List.MouseDoubleClick = React.createClass({
	displayName: 'MouseDoubleClick',

	render: function render() {
		var containerProps = m(this.props, { actionStyle: this.isSet() && { background: '#2d97de' } });
		return React.createElement(
			App.List.Item,
			containerProps,
			React.createElement(
				App.List.NumberProperty,
				_extends({ name: 'x' }, this.props),
				'mouse x '
			),
			React.createElement(
				App.List.NumberProperty,
				_extends({ name: 'y' }, this.props),
				'mouse y '
			)
		);
	},
	isSet: function isSet() {
		var action = this.props.action;
		return typeof action.x === 'number' && typeof action.y === 'number';
	}
});

App.List.MouseDrag = React.createClass({
	displayName: 'MouseDrag',

	styles: {
		column: { display: 'flex', flex: '0 0 50%', flexDirection: 'column' }
	},
	render: function render() {
		var containerProps = m(this.props, { actionStyle: this.isSet() && { background: '#2d97de' } });
		return React.createElement(
			App.List.Item,
			containerProps,
			React.createElement(
				'div',
				{ style: this.styles.column },
				React.createElement(
					App.List.NumberProperty,
					_extends({ name: 'x1' }, this.props),
					'mouse x '
				),
				React.createElement(
					App.List.NumberProperty,
					_extends({ name: 'y1' }, this.props),
					'mouse y '
				)
			),
			React.createElement(
				'div',
				{ style: this.styles.column },
				React.createElement(
					App.List.NumberProperty,
					_extends({ name: 'x2' }, this.props),
					'mouse x '
				),
				React.createElement(
					App.List.NumberProperty,
					_extends({ name: 'y2' }, this.props),
					'mouse y '
				)
			)
		);
	},
	isSet: function isSet() {
		var action = this.props.action;
		return typeof action.x1 === 'number' && typeof action.y1 === 'number' && typeof action.x2 === 'number' && typeof action.y2 === 'number';
	}
});

App.List.KeyType = React.createClass({
	displayName: 'KeyType',

	styles: {
		checkboxContainer: {
			display: 'flex',
			flex: '1 1'
		}
	},
	render: function render() {
		var containerProps = m(this.props, { actionStyle: { background: '#39c4ac' } });
		return React.createElement(
			App.List.Item,
			containerProps,
			React.createElement(App.List.TextAreaProperty, _extends({ name: 'text' }, this.props)),
			React.createElement(
				App.List.CheckBoxProperty,
				_extends({ name: 'isScript' }, this.props),
				'is script'
			)
		);
	}
});

App.List.KeyPress = React.createClass({
	displayName: 'KeyPress',

	styles: {
		keyInput: {
			display: 'flex',
			flex: '1 1'
		}
	},
	render: function render() {
		var containerProps = m(this.props, { actionStyle: { background: '#39c4ac' } });
		var keyInputProps = { type: 'text', maxLength: '1', placeholder: 'e.g. "A"', style: this.styles.keyInput };
		return React.createElement(
			App.List.Item,
			containerProps,
			React.createElement('input', _extends({}, keyInputProps, { required: true })),
			React.createElement(
				App.List.NumberProperty,
				_extends({ name: 'loops' }, this.props),
				'loops '
			)
		);
	}
});

App.List.Empty = React.createClass({
	displayName: 'Empty',

	render: function render() {
		return React.createElement(App.List.Item, this.props);
	}
});

App.Button = React.createClass({
	displayName: 'Button',

	styles: {
		container: {
			flex: '1 0 20%',
			padding: '16px 0'
		},
		button: {
			display: 'block',
			background: '#2e96de',
			padding: '8px 64px',
			border: 'none',
			borderRadius: '8px',
			margin: '0 auto',
			color: 'white',
			cursor: 'pointer'
		},
		playing: {
			background: '#ea4b35'
		}
	},
	render: function render() {
		var buttonProps = {
			style: m(this.styles.button, this.props.playing && this.styles.playing),
			onClick: this.handlePlay
		};
		return React.createElement(
			'div',
			{ style: this.styles.container },
			React.createElement(
				'button',
				buttonProps,
				this.props.playing ? 'STOP' : 'PLAY'
			)
		);
	},
	handlePlay: function handlePlay(evt) {
		if (this.props.playing) {
			dispatcher.dispatch({ type: 'stop' });
		} else {
			dispatcher.dispatch({ type: 'play' });
		}
	}
});

function m(a, b) {
	if (!a) {
		a = {};
	}

	if (!b) {
		return a;
	}

	return update(a, { $merge: b });
}

ReactDOM.render(React.createElement(App, null), document.getElementById('root'));
/*<App.Menu.Button type='Loop' style={{ background: '#31475c' }}>LOOP</App.Menu.Button>*/