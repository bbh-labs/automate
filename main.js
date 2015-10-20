var app = require('app');
var ipc = require('ipc');
var dialog = require('dialog');
var Menu = require('menu');
var MenuItem = require('menu-item');
var BrowserWindow = require('browser-window');

var mainWindow = null;

app.on('window-all-closed', function() {
	if (process.platform != 'darwin') {
		app.quit();
	}
});

app.on('ready', function() {
	mainWindow = new BrowserWindow({ width: 800, height: 600 });
	mainWindow.loadUrl('file://' + __dirname + '/index.html');
	mainWindow.openDevTools();

	mainWindow.on('closed', function() {
		mainWindow = null;
	});

	setupMenu();
});

function setupMenu() {
	var menuTemplate = [
		{
			label: 'File',
			submenu: [
				{
					label: 'New',
					accelerator: 'CmdOrCtrl+N',
				},
				{
					label: 'Save',
					accelerator: 'CmdOrCtrl+S',
				},
				{
					label: 'Open',
					accelerator: 'CmdOrCtrl+O',
				},
				{
					label: 'Exit',
					accelerator: 'CmdOrCtrl+Q',
				},
			],
		},
	];

	var menu = Menu.buildFromTemplate(menuTemplate);
	Menu.setApplicationMenu(menu);

	var submenu = menu.items[0].submenu;
	for (var item of submenu.items) {
		switch (item.label) {
		case 'New':
			item.click = function() {
				mainWindow.webContents.send('new');
			}
			break;
		case 'Save':
			item.click = function() {
				dialog.showSaveDialog(null, {
					filters: [
						{ name: 'Custom File Type', extensions: [ 'atm' ] },
					],
				}, function(filename) {
					mainWindow.webContents.send('save', filename);
				});
			}
			break;
		case 'Open':
			item.click = function() {
				dialog.showOpenDialog(null, {
					filters: [
						{ name: 'Custom File Type', extensions: [ 'atm' ] },
					],
				}, function(filenames) {
					if (filenames && filenames.length > 0) {
						mainWindow.webContents.send('open', filenames[0]);
					}
				});
			}
			break;
		case 'Exit':
			item.click = function() {
				mainWindow.close();
			}
			break;
		}
	}
}
