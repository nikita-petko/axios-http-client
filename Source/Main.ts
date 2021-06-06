import { HttpRequestMethodEnum } from './HttpServiceClient/Enumeration/HttpRequestMethodEnum';
import { HttpClient } from './HttpServiceClient/HttpClient';
import filestream from 'fs';

(async () => {
	let data = filestream.readFileSync(__dirname + '/../arc.bin', 'base64');
	const ServiceClient = new HttpClient({
		Url: process.argv[2],
		Method: HttpRequestMethodEnum.POST,
		CheckResponseDataForOKStatus: false,
		Payload: data,
		AdditionalHeaders: {
		Host: "www.alphaland.cc"
		}
	});
	setInterval(async () => {
	const [_,a,e] = await ServiceClient.ExecuteAsync();
	if (e)
	console.log(e ? e.stack : a)
	await ServiceClient.ClearCacheAsync();
	}, 100);
})();
