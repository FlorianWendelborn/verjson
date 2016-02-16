var verjson = require('./source');

var patcher = new verjson.Patcher({
	formats: {
		'1.0.5': [
			{
				type: 'custom',
				run: function (old) {
					return old;
				}
			}
		],
		'0.0.2': [
			{
				type: 'move',
				from: 'key',
				to: 'name'
			}, {
				type: 'move',
				from: 'value',
				to: 'action'
			}
		],
		'0.0.3': [
			{
				type: 'move',
				from: 'complexData.key',
				to: 'simple.example.data'
			}
		],
		'1.0.0': [
			{
				type: 'remove',
				key: 'complexData'
			}
		]
	},
	events: true
});

var oldJSON = {
	version: '0.0.1',
	key: 'A',
	value: 'attack',
	complexData: {
		key: {
			value: "test"
		}
	}
};

patcher.on('update', function (data) {
	console.log(data.from + ' -> ' + data.to, JSON.stringify(data.preset, null, '\t'));
});

var newJSON = patcher.run(oldJSON);
