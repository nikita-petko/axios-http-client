import { ClientRequest } from './Models/ClientRequest';
import { ClientResponse } from './Models/ClientResponse';
import QueryString from 'querystring';
import { HttpRequestMethodEnum } from './Enumeration/HttpRequestMethodEnum';
import Http, { Method } from 'axios';
import SSL from 'https';
import { lookup as LookupDNS } from 'dns';
import { hostname as GetCurrentMachineName, networkInterfaces } from 'os';

export class HttpClient {
	private static async GetLocalIPAsync() {
		return new Promise((resumeFunction) => {
			LookupDNS(GetCurrentMachineName(), (_e, ip) => {
				const nets = networkInterfaces();
				const results = Object.create(null); // or just '{}', an empty object

				for (const name of Object.keys(nets)) {
					for (const net of nets[name]) {
						// skip over non-ipv4 and internal (i.e. 127.0.0.1) addresses
						if (net.family === 'IPv4' && !net.internal) {
							if (!results[name]) {
								results[name] = [];
							}

							results[name].push(net.address);
						}
					}
				}
				return resumeFunction(results['eth0'][0]);
			});
		});
	}

	private static GetMachineID() {
		return process.env.ARC_MACHINE_ID || GetCurrentMachineName();
	}

	private request: ClientRequest;
	public constructor(request: ClientRequest) {
		this.request = request;
	}

	public UpdateConfiguration(request: ClientRequest) {
		if (this.request !== request) this.request = request;
	}

	public ClearConfiguration() {
		if (this.request !== null) this.request = null;
	}

	public async ClearCacheAsync(): Promise<void> {
		return new Promise((resumeFunction) => {
			return resumeFunction();
		});
	}

	public async ExecuteAsync<TResponse = any>(): Promise<[boolean, ClientResponse<TResponse>, Error]> {
		return new Promise<[boolean, ClientResponse, Error]>(async (resumeFunction) => {
			if (!this.request)
				return resumeFunction([false, null, new TypeError("The request was null, please update it via 'UpdateConfiguration'.")]);

			const parsedQs = QueryString.stringify(this.request.QueryString);
			const requestUrl = `${this.request.Url}?${parsedQs}`;
			let requestMethod: Method = 'GET';
			switch (this.request.Method) {
				case HttpRequestMethodEnum.GET:
					requestMethod = 'GET';
					break;
				case HttpRequestMethodEnum.POST:
					requestMethod = 'POST';
					break;
				case HttpRequestMethodEnum.DELETE:
					requestMethod = 'DELETE';
					break;
				case HttpRequestMethodEnum.HEAD:
					requestMethod = 'HEAD';
					break;
				case HttpRequestMethodEnum.OPTIONS:
					requestMethod = 'OPTIONS';
					break;
				case HttpRequestMethodEnum.PATCH:
					requestMethod = 'PATCH';
					break;
				case HttpRequestMethodEnum.PUT:
					requestMethod = 'PUT';
					break;
			}

			console.log(
				`${requestMethod} request on ${requestUrl} from MFDLABS/ServiceClient ${
					process.version
				} (http://base1-jadax.2.eu-west.34-122-94-29.arcmach.mfdlabs.local+v2.8) (NoRouter->NoLoadbalancer) (ARCH+${
					process.arch
				}) (NOTICE: IF YOU SEE THIS REQUEST ON YOUR SERVER, PLEASE REPORT IT TO ROGUE@MFDLABS.COM) (${await HttpClient.GetLocalIPAsync()}+${HttpClient.GetMachineID()})`,
			);
			Http.request({
				url: requestUrl,
				method: requestMethod,
				httpsAgent: new SSL.Agent({ rejectUnauthorized: false }),
				headers: {
					...this.request.AdditionalHeaders,
					'User-Agent': `MFDLABS/ServiceClient ${
						process.version
					} (http://base1-jadax.2.eu-west.34-122-94-29.arcmach.mfdlabs.local+v2.8) (NoRouter->NoLoadbalancer) (ARCH+${
						process.arch
					}) (${await HttpClient.GetLocalIPAsync()}+${HttpClient.GetMachineID()}) (NOTICE: IF YOU SEE THIS REQUEST ON YOUR SERVER, PLEASE REPORT IT TO ROGUE@MFDLABS.COM)`,
					'X-MFDLABS-MachineID': HttpClient.GetMachineID(),
					'X-Grid-Machine-IP': await HttpClient.GetLocalIPAsync(),
					'X-MFDLABS-ChannelName': 'Automated Routing Controller namely JADAX-2',
					'X-Routed-From': 'Null',
					'X-Was-Originally-LoadBalanced': 'False',
					'X-Was-BadCast': 'False',
					'X-Next-LoadBalancer': 'Null',
					'X-AccessKey': process.env.ACCESS_KEY,
				},
				data: this.request.Payload,
			})
				.then((response) => {
					resumeFunction([
						true,
						{
							Url: requestUrl,
							Method: this.request.Method,
							ResponsePayload: response.data,
							Headers: response.headers,
							StatusCode: response.status,
							StatusMessage: response.statusText,
						},
						null,
					]);
				})
				.catch((err) => {
					if (err.response) {
						return resumeFunction([
							false,
							{
								Url: requestUrl,
								Method: this.request.Method,
								ResponsePayload: err.response.data,
								Headers: err.response.headers,
								StatusCode: err.response.status,
								StatusMessage: err.response.statusText,
							},
							err,
						]);
					}
					return resumeFunction([
						false,
						{
							Url: requestUrl,
							Method: this.request.Method,
							ResponsePayload: null,
							Headers: null,
							StatusCode: 0,
							StatusMessage: err.message,
						},
						err,
					]);
				});
		});
	}
}
