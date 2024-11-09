import { initializeData } from './data';
import { blLog } from './logger';

initializeData()
	.then(() => {
		import('./http-ws-server.js');
	})
	.catch((err) => {
		blLog.error('Error initializing data:', err);
	});
