const Flora = require('./lib/Flora');
const flora = new Flora();

flora.on('data', function (data) {
	  console.log('data\n', data);
});

flora.on('history', function (data) {
	  console.log('history\n', data);
});

flora.on('firmware', function (data) {
	  console.log('firmware\n', data);
});

flora.listenDevice('C4:7C:8D:6A:59:82')
	.then(()=> {
		process.exit(0);
	})
	.catch((err) => {
		debug('error', err);
		process.exit(1);
	});
