import { initializeData } from './data';
import { blLog } from './logger';
import { initializeOscServer } from './osc';

initializeData()
	.then(() => {
		import('./http-ws-server.js');
	})
	.then(() => {
		initializeOscServer();
	})
	.catch((err) => {
		blLog.error('Error initializing data:', err);
	});
