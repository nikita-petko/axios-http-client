import { ClientRequest } from './Models/ClientRequest';
import { ClientResponse } from './Models/ClientResponse';
import QueryString from 'querystring';
import { HttpRequestMethodEnum } from './Enumeration/HttpRequestMethodEnum';
import Http, { Method } from 'axios';
import SSL from 'https';
import { hostname as GetCurrentMachineName, networkInterfaces } from 'os';

export class HttpClient {
	private static async GetLocalIPAsync() {
		return new Promise((resumeFunction) => {
			const nets = networkInterfaces();
			const results = Object.create(null); // Or just '{}', an empty object

			for (const name of Object.keys(nets)) {
				for (const net of nets[name]) {
					// Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
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

			console.log(`${requestMethod} request on ${requestUrl}`);

			Http.request({
				url: requestUrl,
				method: requestMethod,
				httpsAgent: new SSL.Agent({ rejectUnauthorized: false }),
				headers: {
					...this.request.AdditionalHeaders,
					'User-Agent': `MFDLABS/ServiceClient 4.8.4210.0 (http://base1-jadax.2.eu-west.34-122-94-29.arcmach.mfdlabs.local+v2.8) (JADAX-RR12->ZAK-LB4) (ARCH+AMD64) (NOTICE: IF YOU SEE THIS REQUEST ON YOUR SERVER, PLEASE REPORT IT TO ROGUE@MFDLABS.COM)`,
					'X-MFDLABS-MachineID': HttpClient.GetMachineID(),
					'X-Grid-Machine-IP': await HttpClient.GetLocalIPAsync(),
					'X-MFDLABS-ChannelName': 'Automated Routing Controller namely JADAX-2',
					'X-Routed-From': 'JADAX-RR2',
					'X-Was-Originally-LoadBalanced': 'False',
					'X-Was-BadCast': 'False',
					'X-Next-LoadBalancer': 'ZAK-LB4',
					'X-AccessKey':
						'NDlmNTYzMGEyNzQ2NDE5M2NBOGRlNzNGMUY3MDM0OThGNDUwYmVDOTEyOTRGOTQ2QTMzMTQwRjZEYzRBRDdhOTM4ZjREOTNjNTQ4RjIyNzhDNEEyNkJDYkEwM0I1NTVDYzRCMEFkN2YzRDk5YzE2QzUzRUZhMURhNWZEZmZFQ0UwZTc4ZjE1QTJhNGY3MjdDYTA4MWE3NTU1REVGQjlBMmUxMGY3YzQzNzBmMDExNWQxQ0VBNzM2MDM3MUViMTQ5MGQ5NjRGZjQwRjgxZTU2MzM5OUFGMTAxNjAxMjUxYTQ0MTNhY2I0YjJiMTZCOTYwMTE1NTE3YmUwNGJjODQ3MTNFZTI2NDhkOTYwZkQzZWZCM2Q0NTZmYkIwRTdmNkRGMmRlOENDQThhZmNhODAwOUUxNzkwYTczZUEzNTY2OENENmEzRTRmZUNkZDMzNDIxOUFkNTUzNDhGOWEyMzFBZTZhYUVhOTJkMGYyYzMzODZBMTdiQTFBY0NjZDAxYWEwNmZFMGYxNUI0NzgyMzJjZjYyNEI0OTIwNTc3MjUzMkE5OThGOTc5RWRlZjdlMUE4ZTA1NzAyQWYwNTc2RERkRWYwQ2RjODk3Qjg3ZWI3YkNEYWQ3MjI0ZjI3MTUzODA5MDMyYWJhNzcxODU5QjgxMEUwODMxMjc1YTlCNzFlOTg0RUJkZjYxNDQzMENkQTI2NDlhMWRERWIyOGJhZjY1QmFCMWUwMzY0N2Y5MEYyMTRhOWNFM0Y1NEYyYmYyMzE3MWMzMDhkMDkwMzMzMkI1RTA5OGE2NWVkMDdBOTZFQWE2MmFCNTRmMTUwYzljZTQ1OGJkYjI2OGNkN0NkODQwOWJEZDNlRDMwQzAwMDlGM2JCQmRFOTI2YzhBMThiNmQ4NDY2MzM0NzQyMTBBZjUxNjYwYjY3QWE0RTdjYUQ1ZDMwZjBiMzc3NjFhYUYxZmNFNDk0ODRGMjhENjU0MUI5NjRhYjFmNkI5MzIxOTIxOGQ0MGQyMzJkMDE4Y2FFMURCOTJGODE0MTUzMTQ1MUU2ZDVEZTk1MDc0ZDFmNzRBYjUzQ0IxRUQ5ZWYyZEUyZjAxQjhGY2EzYjY1NDEyNGYzQ2E1ZjlEODM2YkU3N0MyMUY4OTM5OTEwMzA4QTc3OUI4MTIxMkMwMDA5YWJEZDdEYjY5RkU1RTM5ODU1NDY4ODE4QWEwMzMwN0U4QzNBMThkMTk3OTFlNDhGRTBlZWQwNkM3QkQxODI2YkVDY2Q3QkZiZGM1M2Q4QjQ2QUIxRWEzNTgxMjhEZTYyNzhkNjA3N0MyMzY2MzNFMkVBYzg0ZmU2ZjZkZDlEQUVCNGZiNThjODkzRjJkMTcxZGQzODVCNzkxNjZGRmJiMDY4MDA1MUE2MzI1NTU0RERmY2MyMEJFQzYxMjM0N2JFNTQ1Yzc3QjRkNDdiQjRDNjY3QzNBYTg1MzVCN2E4ZEYxNTk3OWQwYUE1N2EyMjVmZmI2RjE5YjI4ODI5MjNEMjRiMDU2NDU0Rjc5NDg2M2ZEOGI4ZDMzMjIyMENhMTIzNWJjN0IwQUE5Qzg4OTgzN2U1ODc5MTc5QzVGZjM3YzFBMkI3ODlmMTgwNjQwMTI5QTNCMkI0MkUwNTE0OTg2OTAyOWVCOENjRmFFYjMzMWQ3M0U0N2E1QjEwOTYyYzMwMTc5RDEyODdFMWFBMGE5MTYxY2M0MDU=',
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
