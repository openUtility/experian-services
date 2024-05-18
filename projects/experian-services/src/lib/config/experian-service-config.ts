import { InjectionToken, Signal } from "@angular/core";
import { ExperianFormatedAddress } from "../models";
import { ExperianServiceConfig_BASE } from "./experian-service-config-base";

export interface ExperianServiceConfig extends ExperianServiceConfig_BASE {
    token: string;
}

export const EXPERIAN_ADDRESS_LOOKUP_CONFIG_TK = new InjectionToken<ExperianServiceConfig | Signal<ExperianServiceConfig>>('ExperianAddressLookupConfig');


export interface ExperianServiceAddressFormatParser {
    layout: string;
    parse<T>(address: ExperianFormatedAddress): T;
}

export const EXPERIAN_ADDRESS_PARSERS_TK = new InjectionToken<ExperianServiceAddressFormatParser[]>('ExperianAddressFormatParsers');;
