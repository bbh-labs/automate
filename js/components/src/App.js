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
	styles: {
		container: {
			display: 'flex',
			flexDirection: 'row',
			maxHeight: '100%',
		},
		innerContainer: {
			display: 'flex',
			flex: '1 1',
			padding: '16px',
		},
		wrapper: {
			display: 'flex',
			flex: '0 0 50%',
			flexDirection: 'column',
		},
	},
	render: function() {
		return (
			<div style={this.styles.container}>
				<div style={this.styles.innerContainer}>
					<div style={this.styles.wrapper}>
						<App.Banner />
						<App.Menu />
					</div>
					<div style={this.styles.wrapper}>
						<App.List actions={this.state.actions} />
						<App.Buttons />
					</div>
				</div>
			</div>
		)
	},
	getInitialState: function() {
		return { actions: [] };
	},
	componentDidMount: function() {
		this.listenerID = dispatcher.register(function(payload) {
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
		}.bind(this));
	},
	componentWillUnmount: function() {
		dispatcher.unregister(this.listenerID);
	},
});

App.Banner = React.createClass({
	styles: {
		container: {
			flex: '0 0 33.3333%',
		},
		title: {
			fontFamily: 'Oswald',
		},
	},
	render: function() {
		return (
			<div style={this.styles.container}>
				<h1 style={this.styles.title}>AUTOMATE</h1>
				<h4>TAKE OVER CONTROL YOUR SCREEN</h4>
			</div>
		)
	},
});

App.Menu = React.createClass({
	styles: {
		container: {
			display: 'flex',
			flex: '1 1 33.3333%',
			flexDirection: 'column',
			maxWidth: '80%',
		},
		buttonsContainer: {
			display: 'flex',
			flex: '1 1',
			flexDirection: 'row',
			flexWrap: 'wrap',
			justifyContent: 'center',
		},
	},
	render: function() {
		return (
			<div style={this.styles.container}>
				<h3 className='text-center'>ACTIONS MENU</h3>
				<div style={this.styles.buttonsContainer}>
					<App.Menu.Button type='MouseClick' style={{ background: '#2e96df' }} shortcut='control + shift + 1'>MOUSE CLICK</App.Menu.Button>
					<App.Menu.Button type='KeyType' style={{ background: '#41c2ae' }} shortcut='control + shift + 2'>KEY TYPE</App.Menu.Button>
					<App.Menu.Button type='MouseDoubleClick' style={{ background: '#2e96df' }} shortcut='control + shift + 3'>MOUSE DOUBLE CLICK</App.Menu.Button>
					<App.Menu.Button type='KeyPress' style={{ background: '#41c2ae' }} shortcut='control + shift + 4'>KEY PRESS</App.Menu.Button>
					<App.Menu.Button type='MouseDrag' style={{ background: '#2e96df' }} shortcut='control + shift + 5'>MOUSE DRAG</App.Menu.Button>
					<App.Menu.Button type='Loop' style={{ background: '#31475c' }} shortcut=''>LOOP</App.Menu.Button>
				</div>
			</div>
		)
	},
});

App.Menu.Button = React.createClass({
	styles: {
		container: {
			display: 'flex',
			flex: '0 0 50%',
			flexDirection: 'column',
			justifyContent: 'center',
		},
		innerContainer: {
			flex: '1 1',
			margin: '0 8px',
		},
		shortcut: {
			margin: 0,
		},
	},
	render: function() {
		return (
			<div style={this.styles.container}>
				<div style={this.styles.innerContainer}>
					<button className='btn-action' draggable='true' style={this.props.style} onDragStart={this.handleDragStart}>{ this.props.children }</button>
					<h5 className='text-center' style={this.styles.shortcut}>{this.props.shortcut}</h5>
				</div>
			</div>
		)
	},
	handleDragStart: function(evt) {
		evt.dataTransfer.setData('text/plain', this.props.type);
	},
});

App.Actions = React.createClass({
	styles: {
		container: {
			flex: '1 1 50%',
		},
	},
	render: function() {
		return (
			<div style={this.styles.container}>
				<button onClick={this.handleClick}>Click Me!</button>
			</div>
		)
	},
	handleClick: function() {
	},
});

App.List = React.createClass({
	styles: {
		container: {
			display: 'flex',
			flex: '0 1 80%',
			flexDirection: 'column',
			overflowY: 'scroll',
			background: 'white',
			border: '1px solid #a0a0a0',
		},
	},
	render: function() {
		return (
			<div style={this.styles.container}>
			{
				this.props.actions.map(function(action, i) {
					return <App.List.Item key={i} index={i} action={action} />
				})
			}
				<App.List.Item />
			</div>
		)
	},
});

App.List.Item = React.createClass({
	styles: {
		container: {
			flex: '1 0 128px',
			borderBottom: '1px solid #c0c0c0',
			padding: '16px 0',
			textAlign: 'center',
		},
		text: {
			color: '#a0a0a0',
		},
		action: {
			padding: '8px 32px',
			marginBottom: '16px',
			border: 'none',
			borderRadius: '8px',
			color: 'white',
		},
		delete: {
			display: 'block',
			background: '#ea4b35',
			border: 'none',
			margin: '0 auto',
			color: 'white',
		},
		plus: {
			display: 'inline-block',
			width: '16px',
			height: '16px',
			border: '1px solid #c0c0c0',
			borderRadius: '20px',
			padding: '4px',
			color: 'grey',
			cursor: 'pointer',
		},
	},
	render: function() {
		if (this.props.action) {
			return (
				<div onDragOver={this.handleDragOver} onDrop={this.handleDrop} style={this.styles.container}>
					<h5 style={this.styles.text}>Action {this.props.index + 1}</h5>
					{ this.renderLabel() }
					<button style={this.styles.delete}>DELETE</button>
				</div>
			)
		}
		return (
			<div style={this.styles.container}>
				<h5 style={this.styles.plus} onClick={this.handleAddEmpty}>+</h5>
			</div>
		)
	},
	renderLabel: function() {
		var elem;

		switch (this.props.action.type) {
		case 'MouseClick':
			elem = <button style={m(this.styles.action, {background: '#2e96df'})}>Mouse Click</button>; break;
		case 'MouseDoubleClick':
			elem = <button style={m(this.styles.action, {background: '#2e96df'})}>Mouse Double Click</button>; break;
		case 'MouseDrag':
			elem = <button style={m(this.styles.action, {background: '#2e96df'})}>Mouse Drag</button>; break;
		case 'KeyType':
			elem = <button style={m(this.styles.action, {background: '#41c2ae'})}>Key Type</button>; break;
		case 'KeyPress':
			elem = <button style={m(this.styles.action, {background: '#41c2ae'})}>Key Press</button>; break;
		case 'Loop':
			elem = <button style={m(this.styles.action, {background: ''})}>Loop</button>; break;
		default:
			elem = <h5 style={this.styles.text}>Drag and drop the action here</h5>; break;
		}

		return elem;
	},
	handleDragOver: function(evt) {
		evt.preventDefault();
	},
	handleDrop: function(evt) {
		var type = evt.dataTransfer.getData('text/plain');
		dispatcher.dispatch({ index: this.props.index, type: 'update' + type });
	},
	handleAddEmpty: function() {
		dispatcher.dispatch({ type: 'addEmpty' });
	}
});

App.Buttons = React.createClass({
	styles: {
		container: {
			flex: '1 0 20%',
			padding: '16px 0',
		},
		button: {
			display: 'block',
			background: '#ea4b35',
			padding: '8px 64px',
			border: 'none',
			borderRadius: '8px',
			margin: '0 auto',
			color: 'white',
		},
	},
	render: function() {
		return (
			<div style={this.styles.container}>
				<button style={this.styles.button}>RECORD</button>
			</div>
		)
	},
});

ReactDOM.render(<App />, document.getElementById('root'));
