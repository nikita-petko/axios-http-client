import { ClientRequest } from './Models/ClientRequest';
import { ClientResponse } from './Models/ClientResponse';
import QueryString from 'querystring';
import { HttpRequestMethodEnum } from './Enumeration/HttpRequestMethodEnum';
import Http, { Method } from 'axios';
import SSL from 'https';
import { lookup as LookupDNS } from 'dns';
import { hostname as GetCurrentMachineName, networkInterfaces as NAT } from 'os';

export class HttpClient {
	private statc LocalIP;
	private static MachineName = GetMachineID();
	private static async GetLocalIPAsync() {
		return new Promise((resumeFunction) => {
			LookupDNS(HttpClient.MachineName, (_e, ip) => {
				const nets = NAT();
				const results = Object.create(null);

				for (const name of Object.keys(nets)) {
					for (const net of nets[name]) {
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
			if (HttpClient.LocalIP === undefined) HttpClient.LocalIP = await HttpClient.GetLocalIPAsync();
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

			Http.request({
				url: requestUrl,
				method: requestMethod,
				httpsAgent: new SSL.Agent({ rejectUnauthorized: false }), // Set this to true if you want to verify SSL certficates.
				headers: {
					...this.request.AdditionalHeaders,
					'User-Agent': `Axios/ServiceClient ${
						process.version
					} (axios+0.21.1) (ARCH+${
						process.arch
					}) (${HttpClient.LocalIP}+${HttpClient.MachineName})`,
					'X-MachineID': HttpClient.MachineName,
					'X-MachineIP': HttpClient.LocalIP
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
