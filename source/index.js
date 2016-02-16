import {EventEmitter} from 'events';

export class Patcher extends EventEmitter {
	constructor (options) {
		super();
		this.options = Object.assign({
			events: false
		}, options);
		this.formats = [];

		this.updateFormats();
		this.sortFormats();
	}

	updateFormats () {
		for (let version in this.options.formats) {
			let actions = this.options.formats[version];
			this.formats.push({
				version: version,
				actions: actions
			});
		}
	}

	sortFormats () {
		this.formats.sort(this.versionCompare);
	}

	versionCompare (a, b) {
		if (!a || !a.version) return -1;
		if (!b || !b.version) return 1;

		let _a = a.version.split('.');
		let _b = b.version.split('.');

		let length = Math.max(_a.length, _b.length);

		for (let i = 0; i < length; i++) {
			let intA = parseInt(_a[i], 10);
			let intB = parseInt(_b[i], 10);
			if (intA < intB) {
				return -1;
			} else if (intA > intB) {
				return 1;
			}
		}

		return 0;
	}

	run (preset) {
		this.formats.forEach((format, formatIndex) => {
			if (this.versionCompare(preset, format) !== 1) {
				format.actions.forEach((action, actionIndex) => {
					preset = this.applyAction(preset, action);
				});

				let update = {
					from: preset.version,
					to: format.version
				};

				preset.version = format.version;

				update.preset = Object.assign({}, preset);

				if (this.options.events) {
					this.emit('update', update);
				}
			}
		});

		return preset;
	}

	applyAction (preset, action) {
		let _keyArray;
		let _keys;
		let _pointer;

		switch (action.type) {
			case 'move':
				let fromKeys = action.from.split('.');   // from is in format key.key.key
				let remember = preset;                   // trying to find the data to move

				fromKeys.forEach((key, index) => {       // iterating through the keys
					let save = remember[key];            // saving data
					if (index === fromKeys.length - 1) { // if last step
						delete remember[key];            // delete original data
					}
					remember = save;                     // swap values
				});

				let toKeys = action.to.split('.');       // to is in format key.key.key
				let find = preset;                       // trying to find the spot to insert

				toKeys.forEach((key, index) => {         // iterating through the keys
					if (index === toKeys.length - 1) {   // if it's the last step
						find[key] = remember;            // overwrite key
					} else {                             // if it's not the last step
						if (find[key] == null) {         // if the key doesn't exist
							find[key] = {};              // create an object
						}
						find = find[key];                // remember next position
					}
				});
			break;
			case 'remove':
				_keys = action.key.split('.');
				_pointer = preset;

				_keys.forEach((key, index) => {
					let save = _pointer[key];
					if (save == null) {
						return;
					}
					if (index === _keys.length - 1) {
						delete _pointer[key];
					}
					_pointer = save;
				});
			break;
			case 'create':
				_keyArray = action.keys;
				if (!_keyArray) {
					_keyArray = {};
					_keyArray[action.key] = action.value;
				}

				for (let actionKey in _keyArray) {
					_keys = actionKey.split('.');
					_pointer = preset;

					_keys.forEach((key, index) => {
						if (index === _keys.length - 1) {
							_pointer[key] = _keyArray[actionKey] || {};
						} else {
							if (_pointer[key] == null) {
								_pointer[key] = {};
							}
							_pointer = _pointer[key];
						}
					});
				}
			break;
			case 'add-to-array':
				_keyArray = action.keys;
				if (!_keyArray) {
					_keyArray = {};
					_keyArray[action.key] = action.value;
				}

				for (let actionKey in _keyArray) {
					_keys = actionKey.split('.');
					_pointer = preset;

					_keys.forEach((key, index) => {
						if (index === _keys.length - 1) {
							if (_pointer[key]) {
								if (!_pointer[key].length) {
									_pointer[key].push(_keyArray[actionKey]);
								}
							} else {
								_pointer[key] = [_keyArray[actionKey]];
							}
						} else {
							if (_pointer[key] == null) {
								_pointer[key] = {};
							}
							_pointer = _pointer[key];
						}
					});
				}
			break;
			case 'custom':
				preset = action.run(preset);
			break;
			default:
				console.log(action.type);
		}

		return preset;
	}
}
