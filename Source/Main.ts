import { HttpRequestMethodEnum } from './HttpServiceClient/Enumeration/HttpRequestMethodEnum';
import { HttpClient } from './HttpServiceClient/HttpClient';
import filestream from 'fs';

(async () => {
	let data = filestream.readFileSync(__dirname + '/../arc.bin', 'base64');
	const ServiceClient = new HttpClient({
		Url: process.argv[2],
		QueryString: {
			ApiKey: '5D948561-4957-4A0F-A85B-FA31D9301F3F',
		},
		Method: HttpRequestMethodEnum.POST,
		CheckResponseDataForOKStatus: false,
		Payload: data,
	});
	// setInterval(async () => {
	await ServiceClient.ExecuteAsync();
	await ServiceClient.ClearCacheAsync();
	// }, 100);
})();
