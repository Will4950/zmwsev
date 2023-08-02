export const config = new Object();

config['isProd'] = process.env.NODE_ENV === 'production' ? true : false;
config['debug'] = process.env.DEBUG === 'true' ? true : false;
config['host'] = process.env.HOST || '0.0.0.0';
config['port'] = process.env.PORT || '8080';
config['heartbeat'] = JSON.stringify({
	module: 'heartbeat'
});
config['delay'] = process.env.delay || 15000;
config['zoomAuth'] = process.env.zoomAuth || 'https://zoom.us/oauth/';
config['wssEndpoint'] = process.env.wssEndpoint;
config['clientID'] = process.env.clientID;
config['clientSecret'] = process.env.clientSecret;
config['accountID'] = process.env.accountID;
config['secretToken'] = process.env.secretToken;

config['elastic'] = process.env.elastic || false;
config['elasticCloudID'] = process.env.elasticCloudID;
config['elasticApiKey'] = process.env.elasticApiKey;
config['elasticIndex'] = process.env.elasticIndex;
config['elasticCloud'] = process.env.elasticCloud;
config['elasticNode'] = process.env.elasticNode;
config['elasticUser'] = process.env.elasticUser;
config['elasticPassword'] = process.env.elasticPassword;
config['elasticTLS'] = process.env.elasticTLS;
