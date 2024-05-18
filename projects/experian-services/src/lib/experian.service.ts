import { HttpClient } from '@angular/common/http';
import { Injectable, Injector, Signal, computed, inject, isSignal, signal } from '@angular/core';
import { lastValueFrom, map } from 'rxjs';
import { OPEN_UTILITY_EXPERIAN_SERVICE_CONFIG_TK, OPEN_UTILITY_EXPERIAN_SERVICE_ADDRESS_PARSERS_TK, ExperianServiceConfig,  } from './config';
import { ExperianSearchRequest, ExperianSearchResultData, ResultWrapper, ExperianFormatResultData, ExperianFormatRequest, ExperianSearchAddressSuggestion } from './models';
import { LinkedEffect, createLinkedEffect } from './util';
import { ExperianServiceConfig_BASE } from './config/experian-service-config-base';

const DEFAULTOPTIONS: ExperianServiceConfig_BASE = {
  baseUrl: 'https://api.experianaperture.io/',
  searchUrl: 'address/search/v1',
  formatUrl: 'address/format/v1',
  useCurrentLocation: false,
	maxResults: 10,
	dataSets: ["us-address"],
  country: "USA",
  debounce: 700,
  searchOptions: [{
    name: "search_type",
    value: "singleline"
  },
  {
    name: "prompt_set",
    value: "default"
  },
  {
    name: "flatten",
    value: "true"
  },
  {
    name: "intensity",
    value: "close"
  }],
}

@Injectable({
  providedIn: 'root'
})
export class ExperianService {
  private readonly injectedConfig = inject(OPEN_UTILITY_EXPERIAN_SERVICE_CONFIG_TK);
  private readonly addressParsers = inject(OPEN_UTILITY_EXPERIAN_SERVICE_ADDRESS_PARSERS_TK, { optional: true });
  private readonly system_config: Signal<ExperianServiceConfig>;
  private readonly injector = inject(Injector);
  private readonly _http = inject(HttpClient);

  constructor() {
    // find/create the default config signal
    if (isSignal(this.injectedConfig)) {
        this.system_config = computed(() => {
          const conf = (this.injectedConfig as Signal<ExperianServiceConfig>)();
          return { ...DEFAULTOPTIONS, ...conf };
        })
    } else {
      this.system_config = signal({ ...DEFAULTOPTIONS, ...(this.injectedConfig ?? {})}).asReadonly();
    }
  }

  
  private figureoutConfig(config?: ExperianServiceConfig) {
    return { ...this.system_config(), ...(config ?? {}) };
  }
  
  //#region <!-- lookup -->
  private apiLookupCall(content: ExperianSearchRequest, _?: AbortSignal, config?: ExperianServiceConfig): Promise<ExperianSearchResultData> {
    const __conf = this.figureoutConfig(config);
    let _url = (__conf.baseUrl ?? '') + (__conf.searchUrl ?? '');
    if (!__conf.token) {
      throw new Error("Missing Token");
    }
    return lastValueFrom(
      this._http.post<ResultWrapper<ExperianSearchResultData>>(_url, content, { headers: { "Auth-Token": __conf.token } }).pipe(
        map(d => d.result)
      ));
  }
  
  generateLookupService(
    source: Signal<string | ExperianSearchRequest | null>,
    config?: ExperianServiceConfig): LinkedEffect<ExperianSearchResultData> { 
      
      return createLinkedEffect(source, (source, b) => {
        if (!source) {
          return Promise.resolve(undefined);
      }
      let content = source;
      if (typeof content === 'string') {
        content = this.generateLookupRequest(content, config);
      }
    
      return this.apiLookupCall(content, b, config);
    }, { debounceTimeout: this.system_config().debounce ?? 700 }, this.injector);
  }


  private generateLookupRequest(query: string, config?: ExperianServiceConfig): ExperianSearchRequest {
    const __conf = this.figureoutConfig(config);
    
    return {
      country_iso: __conf.country!,
      datasets: __conf.dataSets!,
      max_suggestions: __conf.maxResults!,
      components: {
        unspecified: [query]
      },
      options: __conf?.searchOptions ?? []
    };
  }
  //#endregion 


  //#region <!-- format service -->
  private apiFormatProcessParsers(data: ExperianFormatResultData): ExperianFormatResultData | unknown[] {
    let returnDta: unknown[] | ExperianFormatResultData = data;
    if (Array.isArray(data.addresses_formatted) && this.addressParsers) {
      this.addressParsers.forEach(p => {
        data.addresses_formatted!.forEach(af => {
          if (p.layout === af.layout_name) {
            try {
              let result = p.parse(af);
              if (result) {
                // make sure returnData is now an array.
                if (!Array.isArray(returnDta)) {
                  returnDta = [];
                }
                returnDta.push(result);
              }
            } catch (ex: unknown) { 
              console.error(`Unable to parse [${p.layout}]`, ex);
            }
            
          }
        })
        
      })
    }
    return returnDta;
  }

  private apiFormatCall(key: string, content: ExperianFormatRequest, _?: AbortSignal, config?: ExperianServiceConfig): Promise<ExperianFormatResultData | unknown[]> {
    const __conf = this.figureoutConfig(config);
    let _url = (__conf.baseUrl ?? '') + (__conf.formatUrl ?? ''); 
    _url += (_url.endsWith("/") ? '' : '/') + key;
    if (!__conf.token) {
      throw new Error("Missing Token");
    }
    return lastValueFrom(this._http.post<ResultWrapper<ExperianFormatResultData>>(_url, content, { headers: { "Auth-Token": __conf.token } }).pipe(
      map(d => d.result),
      map(d => this.apiFormatProcessParsers(d))
    ));
  }

  generateFormatService(
    source: Signal<string | ExperianSearchAddressSuggestion | null>,
    config?: ExperianServiceConfig): LinkedEffect<unknown> { 
    return createLinkedEffect(source, (source, abort) => {
      if (!source) {
        return Promise.resolve(undefined);
      }
      const [key, content] = this.generateFormatRequest(source, undefined, config);
      return this.apiFormatCall(key, content, abort, config);
    }, {}, this.injector);
  }

  private generateFormatRequest(
    request: string | ExperianSearchAddressSuggestion,
    content?: ExperianFormatRequest,
    config?: ExperianServiceConfig): [string, ExperianFormatRequest] {
    
    let returnKey = request;
    if (typeof returnKey !== 'string') {
      returnKey = returnKey.global_address_key;
    }
    let body = content;
    if (!body) {
      let __conf = this.figureoutConfig(config);
      body = {
        layout_format: 'default',
        layouts: (__conf.formatLayouts ?? []) as [string?]
      }
    }
    return [returnKey, body];
  }
  //#endregion


}
