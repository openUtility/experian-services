type ExperianServiceSearchOption_SearchType = { name: 'search_type', value: 'singleline' | string };
type ExperianServiceSearchOption_PromptSet = { name: 'prompt_set', value: 'default' | string };
type ExperianServiceSearchOption_Flatten = { name: 'flatten', value: 'true' | "false" };
type ExperianServiceSearchOption_Intensity = { name: 'intensity', value: 'close' | string };
export type ExperianServiceSearchOptions = ExperianServiceSearchOption_SearchType |
  ExperianServiceSearchOption_PromptSet |
  ExperianServiceSearchOption_Flatten |
  ExperianServiceSearchOption_Intensity |
{ name: string, value: string };

export interface ExperianServiceConfig_BASE {
    baseUrl?: string;
    searchUrl?: string;
    formatUrl?: string;
    useCurrentLocation?: boolean;
    maxResults?: number;
    dataSets?: string[];
    country?: string;
    formatLayouts?: string[];
    debounce?: number;
    searchOptions?: ExperianServiceSearchOptions[];
}