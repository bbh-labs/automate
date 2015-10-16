'use strict';

var React = require('react');
var ReactDOM = require('react-dom');
var update = require('react-addons-update');
var Flux = require('flux');

var robot = remote.require('robotjs');

var dispatcher = new Flux.Dispatcher();

function m(a, b) {
	if (!a) {
		a = {};
	}

	if (!b) {
		return a;
	}

	return update(a, { $merge: b });
}

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
					React.createElement(App.List, { actions: this.state.actions }),
					React.createElement(App.Buttons, null)
				)
			)
		);
	},
	getInitialState: function getInitialState() {
		return { actions: [] };
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
				case 'addLoop':
					var type = payload.type.substring(3, payload.type.length);
					actions.push({ type: type });
					break;
				case 'updateEmpty':
				case 'updateMouseClick':
				case 'updateMouseDoubleClick':
				case 'updateMouseDrag':
				case 'updateKeyType':
				case 'updateKeyPress':
				case 'updateLoop':
					if (actions.length < payload.index) {
						return;
					}

					payload.type = payload.type.substring(6, payload.type.length);
					actions[payload.index] = payload;
					break;
				case 'removeEmpty':
				case 'removeMouseClick':
				case 'removeMouseDoubleClick':
				case 'removeMouseDrag':
				case 'removeKeyType':
				case 'removeKeyPress':
				case 'removeLoop':
					if (actions.length < payload.index) {
						return;
					}

					actions.splice(payload.index, 1);
					break;
				default:
					return;
			}
			this.setState({ actions: actions });
		}).bind(this));
	},
	componentWillUnmount: function componentWillUnmount() {
		dispatcher.unregister(this.listenerID);
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
			flex: '1 1',
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'center'
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
					{ type: 'MouseClick', style: { background: '#2e96df' }, shortcut: 'control + shift + 1' },
					'MOUSE CLICK'
				),
				React.createElement(
					App.Menu.Button,
					{ type: 'KeyType', style: { background: '#41c2ae' }, shortcut: 'control + shift + 2' },
					'KEY TYPE'
				),
				React.createElement(
					App.Menu.Button,
					{ type: 'MouseDoubleClick', style: { background: '#2e96df' }, shortcut: 'control + shift + 3' },
					'MOUSE DOUBLE CLICK'
				),
				React.createElement(
					App.Menu.Button,
					{ type: 'KeyPress', style: { background: '#41c2ae' }, shortcut: 'control + shift + 4' },
					'KEY PRESS'
				),
				React.createElement(
					App.Menu.Button,
					{ type: 'MouseDrag', style: { background: '#2e96df' }, shortcut: 'control + shift + 5' },
					'MOUSE DRAG'
				),
				React.createElement(
					App.Menu.Button,
					{ type: 'Loop', style: { background: '#31475c' }, shortcut: '' },
					'LOOP'
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
		return React.createElement(
			'div',
			{ style: this.styles.container },
			React.createElement(
				'div',
				{ style: this.styles.innerContainer },
				React.createElement(
					'button',
					{ className: 'btn-action', draggable: 'true', style: this.props.style, onDragStart: this.handleDragStart },
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

App.Actions = React.createClass({
	displayName: 'Actions',

	styles: {
		container: {
			flex: '1 1 50%'
		}
	},
	render: function render() {
		return React.createElement(
			'div',
			{ style: this.styles.container },
			React.createElement(
				'button',
				{ onClick: this.handleClick },
				'Click Me!'
			)
		);
	},
	handleClick: function handleClick() {}
});

App.List = React.createClass({
	displayName: 'List',

	styles: {
		container: {
			display: 'flex',
			flex: '0 1 80%',
			flexDirection: 'column',
			overflowY: 'scroll',
			background: 'white',
			border: '1px solid #a0a0a0'
		}
	},
	render: function render() {
		return React.createElement(
			'div',
			{ style: this.styles.container },
			this.props.actions.map(function (action, i) {
				return React.createElement(App.List.Item, { key: i, index: i, action: action });
			}),
			React.createElement(App.List.Item, null)
		);
	}
});

App.List.Item = React.createClass({
	displayName: 'Item',

	styles: {
		container: {
			flex: '1 0 128px',
			borderBottom: '1px solid #c0c0c0',
			padding: '16px 0',
			textAlign: 'center'
		},
		text: {
			color: '#a0a0a0'
		},
		action: {
			padding: '8px 32px',
			marginBottom: '16px',
			border: 'none',
			borderRadius: '8px',
			color: 'white'
		},
		'delete': {
			display: 'block',
			background: '#ea4b35',
			border: 'none',
			margin: '0 auto',
			color: 'white'
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
		}
	},
	render: function render() {
		if (this.props.action) {
			return React.createElement(
				'div',
				{ onDragOver: this.handleDragOver, onDrop: this.handleDrop, style: this.styles.container },
				React.createElement(
					'h5',
					{ style: this.styles.text },
					'Action ',
					this.props.index + 1
				),
				this.renderLabel(),
				React.createElement(
					'button',
					{ style: this.styles['delete'] },
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
	renderLabel: function renderLabel() {
		var elem;

		switch (this.props.action.type) {
			case 'MouseClick':
				elem = React.createElement(
					'button',
					{ style: m(this.styles.action, { background: '#2e96df' }) },
					'Mouse Click'
				);break;
			case 'MouseDoubleClick':
				elem = React.createElement(
					'button',
					{ style: m(this.styles.action, { background: '#2e96df' }) },
					'Mouse Double Click'
				);break;
			case 'MouseDrag':
				elem = React.createElement(
					'button',
					{ style: m(this.styles.action, { background: '#2e96df' }) },
					'Mouse Drag'
				);break;
			case 'KeyType':
				elem = React.createElement(
					'button',
					{ style: m(this.styles.action, { background: '#41c2ae' }) },
					'Key Type'
				);break;
			case 'KeyPress':
				elem = React.createElement(
					'button',
					{ style: m(this.styles.action, { background: '#41c2ae' }) },
					'Key Press'
				);break;
			case 'Loop':
				elem = React.createElement(
					'button',
					{ style: m(this.styles.action, { background: '' }) },
					'Loop'
				);break;
			default:
				elem = React.createElement(
					'h5',
					{ style: this.styles.text },
					'Drag and drop the action here'
				);break;
		}

		return elem;
	},
	handleDragOver: function handleDragOver(evt) {
		evt.preventDefault();
	},
	handleDrop: function handleDrop(evt) {
		var type = evt.dataTransfer.getData('text/plain');
		dispatcher.dispatch({ index: this.props.index, type: 'update' + type });
	},
	handleAddEmpty: function handleAddEmpty() {
		dispatcher.dispatch({ type: 'addEmpty' });
	}
});

App.Buttons = React.createClass({
	displayName: 'Buttons',

	styles: {
		container: {
			flex: '1 0 20%',
			padding: '16px 0'
		},
		button: {
			display: 'block',
			background: '#ea4b35',
			padding: '8px 64px',
			border: 'none',
			borderRadius: '8px',
			margin: '0 auto',
			color: 'white'
		}
	},
	render: function render() {
		return React.createElement(
			'div',
			{ style: this.styles.container },
			React.createElement(
				'button',
				{ style: this.styles.button },
				'RECORD'
			)
		);
	}
});

ReactDOM.render(React.createElement(App, null), document.getElementById('root'));