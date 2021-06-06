import { HttpRequestMethodEnum } from './HttpServiceClient/Enumeration/HttpRequestMethodEnum';
import { HttpClient } from './HttpServiceClient/HttpClient';
import filestream from 'fs';

(async () => {
	let data = filestream.readFileSync(__dirname + '/../large_data.bin', 'base64');
	const ServiceClient = new HttpClient({
		Url: process.argv[2],
		Method: HttpRequestMethodEnum.POST,
		CheckResponseDataForOKStatus: false,
		Payload: data,
		AdditionalHeaders: {
			Host: process.argv[3]
		}
	});
	setInterval(async () => {
		const [_, Response, Exception] = await ServiceClient.ExecuteAsync();
		if (Exception) console.log(Exception ? Exception.stack : Response)
		await ServiceClient.ClearCacheAsync();
	}, 100);
})();
