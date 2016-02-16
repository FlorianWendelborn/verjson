var verjson = require('./source');

var patcher = new verjson.Patcher({
	formats: {
		'1.0.5': [
			{
				type: 'create',
				value: 'NEW',
				key: 'something.new'
			}, {
				type: 'create',
				keys: {
					woah: {
						info: 'Objects!'
					}
				}
			}
		],
		'2.0.0': [
			{
				type: 'add-to-array',
				keys: {
					array: 'arrayData'
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
	array: [],
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
