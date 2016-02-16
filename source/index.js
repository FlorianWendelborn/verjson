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
	}

	applyAction (preset, action) {
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
				let _keys = action.key.split('.');
				let pointer = preset;

				_keys.forEach((key, index) => {
					let save = pointer[key];
					if (save == null) {
						return;
					}
					if (index === _keys.length - 1) {
						delete pointer[key];
					}
					pointer = save;
				});
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
