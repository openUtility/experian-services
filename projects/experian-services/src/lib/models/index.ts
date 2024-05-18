
type ExperianAddressAddionalAttributeTypeScore = { name: 'score', value: string };
type ExperianAddressAddionalAttributeTypeFullAddressFlag = { name: 'full_address', value: 'true' | 'false' };
type ExperianAddressAddionalAttributeTypePostalCode = { name: 'postcode', value: string };

export type ExperianAddressAddionalAttributeTypes = ExperianAddressAddionalAttributeTypeScore |
  ExperianAddressAddionalAttributeTypeFullAddressFlag |
  ExperianAddressAddionalAttributeTypePostalCode |
{ name: string, value: string };

export interface ExperianSearchRequest {
  country_iso: string;
  datasets: string[];
  max_suggestions: number;
  components: {
    unspecified: string[]
  };
  options: { name: string, value: string }[];
  location?: string;
}

export interface ExperianFormatRequest {
  layouts?: [string?],
  layout_format: 'default' | 'address_lines';
}

export interface ExperianSearchAddressSuggestion {
  global_address_key: string;
  text: string;
  format: string;
  additional_attributes: ExperianAddressAddionalAttributeTypes[]
}

export interface ExperianSearchResultData {
  more_results_available: boolean;
  confidence: 'Verified match' | string;
  suggestions_key: string;
  suggestions_prompt: string;
  suggestions: ExperianSearchAddressSuggestion[]
}

export type ExperianFormatAddressBaseType = { [key: string]: string };

export interface ExperianFormatedAddress {
  layout_name: string;
  address: ExperianFormatAddressBaseType
}

export interface ExperianFormatResultData {
  global_address_key: string;
  confidence: 'Verified match' | string;
  address?: DefaultAddressFormat;
  addresses_formatted?: ExperianFormatedAddress[]
}

export interface DefaultAddressFormat {
  address_line_1: string;
  address_line_2: string;
  address_line_3: string;
  locality: string;
  region: string;
  postal_code: string;
  country: string;
}

export interface ResultWrapper<T> {
  result: T
}