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
						<App.List { ...this.state } ref='list' />
						<App.Button { ...this.state } />
					</div>
				</div>
			</div>
		)
	},
	getInitialState: function() {
		return { playing: false, editingActionID: -1 };
	},
	componentDidMount: function() {
		this.listenerID = dispatcher.register(function(payload) {
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
		}.bind(this));

		var ret = globalShortcut.register('ctrl+shift+s', function() {
			var editingActionID = this.state.editingActionID;
			if (editingActionID >= 0) {
				dispatcher.dispatch({
					type: 'setMousePosition',
					editingActionID: editingActionID,
					position: robot.getMousePos(),
				});
			}
		}.bind(this));
		if (!ret) {
			alert('Failed to set mouse shortcut: ctrl+shift+s!');
		}

		ret = globalShortcut.register('ctrl+shift+enter', function() {
			this.togglePlayback();
		}.bind(this));
		if (!ret) {
			alert('Failed to set mouse shortcut: ctrl+shift+enter!');
		}

		ipc.on('new', function() {
			this.refs.list.new();
		}.bind(this));

		ipc.on('open', function(filename) {
			if (!filename) {
				return;
			}

			fs.readFile(filename, 'utf8', function(err, data) {
				if (!err) {
					this.refs.list.loadJSON(data);
				}
			}.bind(this));
		}.bind(this));

		ipc.on('save', function(filename) {
			if (!filename) {
				return;
			}

			var data = JSON.stringify(this.refs.list.getJSON());
			fs.writeFile(filename, data, 'utf8');
		}.bind(this));
	},
	componentWillUnmount: function() {
		dispatcher.unregister(this.listenerID);
	},
	togglePlayback: function() {
		if (this.state.playing) {
			this.setState({ playing: false });
			this.refs.list.stop();
		} else {
			this.setState({ playing: true });
			this.refs.list.play();
		}
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
			flex: '0 1',
			flexDirection: 'row',
			flexWrap: 'wrap',
		},
	},
	render: function() {
		return (
			<div style={this.styles.container}>
				<h3 className='text-center'>ACTIONS MENU</h3>
				<div style={this.styles.buttonsContainer}>
					<App.Menu.Button type='MouseClick' style={{ background: '#2e96df' }}>MOUSE CLICK</App.Menu.Button>
					<App.Menu.Button type='KeyType' style={{ background: '#41c2ae' }}>KEY TYPE</App.Menu.Button>
					<App.Menu.Button type='MouseDoubleClick' style={{ background: '#2e96df' }}>MOUSE DOUBLE CLICK</App.Menu.Button>
					<App.Menu.Button type='KeyPress' style={{ background: '#41c2ae' }}>KEY PRESS</App.Menu.Button>
					<App.Menu.Button type='MouseDrag' style={{ background: '#2e96df' }}>MOUSE DRAG</App.Menu.Button>
					{/*<App.Menu.Button type='Loop' style={{ background: '#31475c' }}>LOOP</App.Menu.Button>*/}
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
		var actionProps = {
			draggable: 'true',
			style: this.props.style,
			onDragStart: this.handleDragStart,
		};
		return (
			<div style={this.styles.container}>
				<div style={this.styles.innerContainer}>
					<button className='btn-action' { ...actionProps }>{ this.props.children }</button>
					<h5 className='text-center' style={this.styles.shortcut}>{this.props.shortcut}</h5>
				</div>
			</div>
		)
	},
	handleDragStart: function(evt) {
		evt.dataTransfer.setData('text/plain', this.props.type);
	},
});

App.List = React.createClass({
	queue: [],
	styles: {
		container: {
			overflowY: 'scroll',
			background: 'white',
			border: '1px solid #a0a0a0',
			padding: '16px',
		},
	},
	render: function() {
		var editingActionID = this.props.editingActionID;
		var inputProps = {
			type: 'number',
			placeholder: 'loops',
			value: this.state.loops,
			onChange: this.handleChangeLoopCount
		};
		return (
			<div style={this.styles.container}>
				<input {...inputProps} />
			{
				this.state.actions.map(function(action, i) {
					var elem;
					var props = {
						key: i,
						action: action, 
						actionID: i,
						editingActionID: editingActionID,
					};
					switch (action.type) {
					case 'MouseClick':
						elem = <App.List.MouseClick text='Mouse Click' {...props} />; break;
					case 'MouseDoubleClick':
						elem = <App.List.MouseDoubleClick text='Mouse Double Click' {...props} />; break;
					case 'MouseDrag':
						elem = <App.List.MouseDrag text='Mouse Drag' {...props} />; break;
					case 'KeyType':
						elem = <App.List.KeyType text='Key Type' {...props} />; break;
					case 'KeyPress':
						elem = <App.List.KeyPress text='Key Press' {...props} />; break;
					case 'Empty':
						elem = <App.List.Empty text='Drag and drop action here' {...props} />; break;
					}
					return elem;
				}.bind(this))
			}
				<App.List.Item />
			</div>
		)
	},
	getInitialState: function() {
		return {
			actions: [],
			loops: 1,
		};
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
		}.bind(this));
	},
	componentWillUnmount: function() {
		dispatcher.unregister(this.listenerID);
	},
	play: function(actions) {
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
					this.addToQueue(robot.moveMouse, [ action.x, action.y ]);
					this.addToQueue(robot.mouseToggle, [ 'down' ]);
					this.addToQueue(this.idle);
					this.addToQueue(robot.mouseToggle, [ 'up' ]);
					this.addToQueue(this.idle);
					break;
				case 'MouseDoubleClick':
					this.addToQueue(robot.moveMouse, [ action.x, action.y ]);
					this.addToQueue(robot.mouseClick, [ 'left', true ]);
					this.addToQueue(this.idle);
					break;
				case 'MouseDrag':
					this.addToQueue(robot.moveMouseSmooth, [ action.x1, action.y1 ]);
					this.addToQueue(robot.mouseToggle, [ 'down' ]);
					this.addToQueue(robot.moveMouseSmooth, [ action.x2, action.y2 ]);
					this.addToQueue(robot.mouseToggle, [ 'up' ]);
					this.addToQueue(this.idle);
					break;
				case 'KeyType':
					var loop = j;
					if (action.isScript) {
						this.addToQueue(robot.typeString, [ '' + eval(action.text) ]);
					} else {
						this.addToQueue(robot.typeString, [ action.text ]);
					}
					this.addToQueue(this.idle);
					break;
				case 'KeyPress':
					this.addToQueue(robot.keyToggle, [ action.key, 'down' ]);
					this.addToQueue(robot.keyToggle, [ action.key, 'up' ]);
					this.addToQueue(this.idle);
					break;
				}
			}
		}

		this.playQueue();
	},
	addToQueue: function(fn, args) {
		var o = { fn: fn, args: args };
		this.queue.push(o);
	},
	resetQueue: function() {
		this.queue = [];
		queueIndex = 0;
	},
	playQueue: function() {
		var queue = this.queue;
		if (queueIndex < this.queue.length) {
			queueTimer = setTimeout(function() {
				var q = queue[queueIndex++];
				q.fn.apply(this, q.args);
				this.playQueue();
			}.bind(this), 50);
		} else {
			dispatcher.dispatch({ type: 'stop' });
		}
	},
	stop: function() {
		clearTimeout(queueTimer);
	},
	new: function() {
		this.setState({ playing: false, loops: 1, actions: [] });
	},
	loadJSON: function(data) {
		data = JSON.parse(data);
		this.setState({ playing: false, loops: data.loops, actions: data.actions });
	},
	getJSON: function() {
		return { loops: this.state.loops, actions: this.state.actions };
	},
	idle: function() {
	},
	updateAction: function(editingActionID, action) {
		if (typeof(editingActionID) != 'number') {
			return;
		}

		var actions = this.state.actions;
		var editAction = actions[editingActionID];
		if (editAction.type == 'MouseDrag') {
			var sameX = (typeof(editAction.x1) == 'number' && editAction.x1 == editAction.x2);
			var sameY = (typeof(editAction.y1) == 'number' && editAction.y1 == editAction.y2);
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
	handleChangeLoopCount: function(evt) {
		var value = parseInt(evt.target.value);
		if (value != NaN) {
			this.setState({ loops: value });
		}
	},
});

App.List.Item = React.createClass({
	styles: {
		container: {
			display: 'flex',
			flex: '1 0 200px',
			flexDirection: 'column',
			borderBottom: '1px solid #c0c0c0',
			padding: '16px 0',
			textAlign: 'center',
			alignItems: 'center',
		},
		text: {
			color: '#a0a0a0',
		},
		action: {
			display: 'flex',
			flex: '1 1',
			background: '#636363',
			padding: '8px 32px',
			marginBottom: '16px',
			border: 'none',
			borderRadius: '8px',
			color: 'white',
		},
		properties: {
			display: 'flex',
			flexDirection: 'row',
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
		delete: {
			display: 'block',
			background: '#ea4b35',
			border: 'none',
			borderRadius: '8px',
			margin: '16px auto',
			padding: '4px 16px',
			color: 'white',
		},
	},
	render: function() {
		var containerProps = { style: this.styles.container, onDragOver: this.handleDragOver, onDrop: this.handleDrop };
		var actionProps = { style: m(this.styles.action, this.props.actionStyle) };
		var editing = this.props.editingActionID == this.props.actionID;
		if (this.props.action) {
			return (
				<div { ...containerProps }>
					<h5 style={ this.styles.text }>Action { this.props.actionID + 1 }</h5>
					<button { ...actionProps }>{ editing ? 'Editing..' : this.props.text }</button>
					<div style={ this.styles.properties }>{ this.props.children }</div>
					<button style={ this.styles.delete } onClick={ this.handleDelete }>DELETE</button>
				</div>
			)
		}
		return (
			<div style={ this.styles.container }>
				<h5 style={ this.styles.plus } onClick={ this.handleAddEmpty }>+</h5>
			</div>
		)
	},
	handleDelete: function() {
		dispatcher.dispatch({ type: 'remove' + this.props.action.type, actionID: this.props.actionID });
	},
	handleDragOver: function(evt) {
		evt.preventDefault();
	},
	handleDrop: function(evt) {
		var type = evt.dataTransfer.getData('text/plain');
		dispatcher.dispatch({ actionID: this.props.actionID, type: 'update' + type, action: { type: type } });
	},
	handleAddEmpty: function() {
		dispatcher.dispatch({ type: 'addEmpty' });
	},
});

App.List.NumberProperty = React.createClass({
	styles: {
		label: { display: 'flex', flex: '0 0 50%' },
		span: { flex: '1 1 50%' },
		input: { flex: '1 1 50%' },
	},
	render: function() {
		var inputProps = {
			ref: 'input',
			type: 'number',
			name: this.props.name,
			value: this.props.action[this.props.name],
			onChange: this.handleChange,
			onFocus: this.handleFocus,
			onBlur: this.handleBlur,
		};
		return (
			<label style={ this.styles.label }>
				<span style={this.styles.span}>{ this.props.children }</span>
				<input { ...inputProps }/>
			</label>
		)
	},
	handleChange: function(evt) {
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
	handleFocus: function(evt) {
		dispatcher.dispatch({ type: 'unlisten', actionID: this.props.actionID });
		dispatcher.dispatch({ type: 'listen', actionID: this.props.actionID });
	},
});

App.List.TextProperty = React.createClass({
	render: function() {
		var inputProps = {
			name: this.props.name,
			type: 'text',
			value: this.props.action[this.props.name],
			placeholder: 'Enter some text.',
			onChange: this.handleChange,
			onFocus: this.handleFocus,
			onBlur: this.handleBlur,
		};
		return <input { ...inputProps } />
	},
	handleChange: function(evt) {
		var elem = evt.target;
		var action = this.props.action;
		var actionID = this.props.actionID;
		action[elem.name] = elem.value;
		dispatcher.dispatch({ type: 'update' + action.type, action: action, actionID: actionID });
	},
	handleFocus: function(evt) {
		dispatcher.dispatch({ type: 'listen', actionID: this.props.actionID });
	},
	handleBlur: function(evt) {
		dispatcher.dispatch({ type: 'unlisten', actionID: this.props.actionID });
	},
});

App.List.TextAreaProperty = React.createClass({
	render: function() {
		var inputProps = {
			name: this.props.name,
			value: this.props.action[this.props.name],
			placeholder: 'Enter some text.',
			rows: 4,
			onChange: this.handleChange,
			onFocus: this.handleFocus,
			onBlur: this.handleBlur,
		};
		return <textarea { ...inputProps }></textarea>
	},
	handleChange: function(evt) {
		var elem = evt.target;
		var action = this.props.action;
		var actionID = this.props.actionID;
		action[elem.name] = elem.value;
		dispatcher.dispatch({ type: 'update' + action.type, action: action, actionID: actionID });
	},
	handleFocus: function(evt) {
		dispatcher.dispatch({ type: 'listen', actionID: this.props.actionID });
	},
	handleBlur: function(evt) {
		dispatcher.dispatch({ type: 'unlisten', actionID: this.props.actionID });
	},
});

App.List.CheckBoxProperty = React.createClass({
	styles: {
		label: { display: 'flex', flex: '0 0 50%' },
		span: { flex: '1 1 50%' },
		input: { flex: '1 1 50%' },
	},
	render: function() {
		var inputProps = {
			name: this.props.name,
			type: 'checkbox',
			checked: this.props.action[this.props.name],
			onChange: this.handleChange,
			onFocus: this.handleFocus,
			onBlur: this.handleBlur,
		};
		return (
			<label style={ this.styles.label }>
				<span style={this.styles.span}>{ this.props.children }</span>
				<input { ...inputProps }/>
			</label>
		)
	},
	handleChange: function(evt) {
		var elem = evt.target;
		var action = this.props.action;
		var actionID = this.props.actionID;
		action[elem.name] = elem.checked;
		dispatcher.dispatch({ type: 'update' + action.type, action: action, actionID: actionID });
	},
	handleFocus: function(evt) {
		dispatcher.dispatch({ type: 'listen', actionID: this.props.actionID });
	},
	handleBlur: function(evt) {
		dispatcher.dispatch({ type: 'unlisten', actionID: this.props.actionID });
	},
});

App.List.MouseClick = React.createClass({
	render: function() {
		var containerProps = m(this.props, { actionStyle: this.isSet() && { background: '#2d97de' } });
		return (
			<App.List.Item { ...containerProps }>
				<App.List.NumberProperty name='x' { ...this.props }>mouse x </App.List.NumberProperty>
				<App.List.NumberProperty name='y' { ...this.props }>mouse y </App.List.NumberProperty>
			</App.List.Item>
		)
	},
	isSet: function() {
		var action = this.props.action;
		return typeof(action.x) === 'number' && typeof(action.y) === 'number';
	},
});

App.List.MouseDoubleClick = React.createClass({
	render: function() {
		var containerProps = m(this.props, { actionStyle: this.isSet() && { background: '#2d97de' } });
		return (
			<App.List.Item { ...containerProps }>
				<App.List.NumberProperty name='x' { ...this.props }>mouse x </App.List.NumberProperty>
				<App.List.NumberProperty name='y' { ...this.props }>mouse y </App.List.NumberProperty>
			</App.List.Item>
		)
	},
	isSet: function() {
		var action = this.props.action;
		return typeof(action.x) === 'number' && typeof(action.y) === 'number';
	},
});

App.List.MouseDrag = React.createClass({
	styles: {
		column: { display: 'flex', flex: '0 0 50%', flexDirection: 'column' },
	},
	render: function() {
		var containerProps = m(this.props, { actionStyle: this.isSet() && { background: '#2d97de' } });
		return (
			<App.List.Item { ...containerProps }>
				<div style={ this.styles.column }>
					<App.List.NumberProperty name='x1' { ...this.props }>mouse x </App.List.NumberProperty>
					<App.List.NumberProperty name='y1' { ...this.props }>mouse y </App.List.NumberProperty>
				</div>
				<div style={ this.styles.column }>
					<App.List.NumberProperty name='x2' { ...this.props }>mouse x </App.List.NumberProperty>
					<App.List.NumberProperty name='y2' { ...this.props }>mouse y </App.List.NumberProperty>
				</div>
			</App.List.Item>
		)
	},
	isSet: function() {
		var action = this.props.action;
		return typeof(action.x1) === 'number' && typeof(action.y1) === 'number' &&
		       typeof(action.x2) === 'number' && typeof(action.y2) === 'number';
	},
});

App.List.KeyType = React.createClass({
	styles: {
		checkboxContainer: {
			display: 'flex',
			flex: '1 1',
		},
	},
	render: function() {
		var containerProps = m(this.props, { actionStyle: { background: '#39c4ac' } });
		return (
			<App.List.Item { ...containerProps }>
				<App.List.TextAreaProperty name='text' { ...this.props } />
				<App.List.CheckBoxProperty name='isScript' { ...this.props }>is script</App.List.CheckBoxProperty>
			</App.List.Item>
		)
	},
});

App.List.KeyPress = React.createClass({
	styles: {
		keyInput: {
			display: 'flex',
			flex: '1 1',
		},
	},
	render: function() {
		var containerProps = m(this.props, { actionStyle: { background: '#39c4ac' } });
		var keyInputProps = { type: 'text', maxLength: '1', placeholder: 'e.g. "A"', style: this.styles.keyInput };
		return (
			<App.List.Item { ...containerProps }>
				<input { ...keyInputProps } required />
				<App.List.NumberProperty name='loops' { ...this.props }>loops </App.List.NumberProperty>
			</App.List.Item>
		)
	},
});

App.List.Empty = React.createClass({
	render: function() {
		return <App.List.Item {...this.props} />
	},
});

App.Button = React.createClass({
	styles: {
		container: {
			flex: '1 0 20%',
			padding: '16px 0',
		},
		button: {
			display: 'block',
			background: '#2e96de',
			padding: '8px 64px',
			border: 'none',
			borderRadius: '8px',
			margin: '0 auto',
			color: 'white',
			cursor: 'pointer',
		},
		playing: {
			background: '#ea4b35',
		},
	},
	render: function() {
		var buttonProps = {
			style: m(this.styles.button, this.props.playing && this.styles.playing),
			onClick: this.handlePlay,
		};
		return (
			<div style={ this.styles.container }>
				<button { ...buttonProps }>
					{ this.props.playing ? 'STOP' : 'PLAY' }
				</button>
			</div>
		)
	},
	handlePlay: function(evt) {
		if (this.props.playing) {
			dispatcher.dispatch({ type: 'stop' });
		} else {
			dispatcher.dispatch({ type: 'play' });
		}
	},
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

ReactDOM.render(<App />, document.getElementById('root'));
