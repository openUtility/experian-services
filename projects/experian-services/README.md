# Experian Angular Service

This serviuce will generate a Linked Effect tided to an Experian Search and Format request. 

## BASIC SETUP

install the library

```bash
npm install @openUtility/experian-angular-services
```

inject the token

```ts
import { OPEN_UTILITY_EXPERIAN_SERVICE_CONFIG_TK } from '@openutility/experian-services';

export const config: ApplicationConfig = {
  providers: [
    { provide: OPEN_UTILITY_EXPERIAN_SERVICE_CONFIG_TK, useValue: {token: '{EXPERIAN_TOKEN_HERE}' } },
  ],
};
```

the configuration can also accept a signal;
NOTE: updating the configuration signal will NOT trigger a refresh event on the Linked Effect (IE a new search will not be triggered).

```ts
import { OPEN_UTILITY_EXPERIAN_SERVICE_CONFIG_TK, ExperianServiceConfig } from '@openutility/experian-services';

function ExperianLookupConfigFactory() {
    const _http = inject(HttpClient);
    const rply = signal<ExperianServiceConfig>({token: ''});
    lastValueFrom(_http.get('API_URL')).then(d => rply.update(f => ({...f, token: d.token})));
    return rply.asReadonly();
}

export const config: ApplicationConfig = {
  providers: [
    { provide: OPEN_UTILITY_EXPERIAN_SERVICE_CONFIG_TK, useFactory: ExperianLookupConfigFactory, deps: [HttpClient] },
  ],
};
```

You can then consume the content with some code like the following

```ts
import { ExperianService } from '@openutility/experian-services';
import { JsonPipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, signal, OnDestroy, computed } from '@angular/core';
import { MatInputModule } from '@angular/material/input';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';

@Component({
    selector: 'field-address',
    standalone: true,
    imports: [
        JsonPipe,
        MatInputModule,
        MatAutocompleteModule,
        MatFormFieldModule,
    ],
    template: `
        <mat-form-field
        [color]="'primary'"
        >
        <input type='text' matInput #input [value]="source()" (input)="source.set(input.value)"
        [matAutocomplete]="autoGroup">
        <mat-autocomplete #autoGroup="matAutocomplete" [displayWith]="displayFn" (optionSelected)="optionSelected($event)">
            @for (item of suggestions(); track item.global_address_key) {
                <mat-option [value]="item">{{item.text}}</mat-option>
            }
        
        </mat-autocomplete>
        <mat-label>Lookup</mat-label>
        </mat-form-field>
        
        <code><pre>
        {{expLookUp.result() | json}}
        </pre></code>
        <code><pre>
        {{this.frm.result() | json}}
        </pre></code>
  `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SearchAddressComponent implements OnDestroy {
    private readonly expSrv = inject(ExperianService);

    source = signal<string>('');
    selected = signal<string | null>(null);
    
    public readonly expLookUp = this.expSrv.generateLookupService(this.source);
    public readonly expformat = this.expSrv.generateFormatService(this.selected);
    
    suggestions = computed(() => this.expLookUp.result().object?.suggestions ?? []);

    ngOnDestroy(): void {
        this.expLookUp.destroy();
        this.expformat.destroy();
    }

    displayFn(itemValue: any): string {
        return itemValue.text.split(',')[0];
    }

    optionSelected(ev: MatAutocompleteSelectedEvent) {
        this.selected.set(ev.option.value.global_address_key)
    }
}
```

## CONFIGRUATION

The Experian Service config will allow you to set various settings


| Name               | Type                        | Default                                   | Description                                                                 |
|--------------------|-----------------------------|-------------------------------------------|-----------------------------------------------------------------------------|
| `baseUrl`          | `string`                    | `'https://api.experianaperture.io/'`      | The base URL for the Experian API.                                          |
| `searchUrl`        | `string`                    | `'address/search/v1'`                     | The endpoint URL for address search.                                        |
| `formatUrl`        | `string`                    | `'address/format/v1'`                     | The endpoint URL for address formatting.                                    |
| `useCurrentLocation` | `boolean`                   | `false`                                   | Determines whether to use the current location for searches.                |
| `maxResults`       | `number`                    | `10`                                      | The maximum number of results to return from a search.                      |
| `dataSets`         | `string[]`                  | `["us-address"]`                          | Specifies the datasets to use for the search.                               |
| `country`          | `string`                    | `'USA'`                                   | The default country for the address search.                                 |
| `formatLayouts`    | `string[]`                  | `[]`                                      | Layouts used for address formatting.                                        |
| `debounce`         | `number`                    | `700`                                     | The debounce time in milliseconds to wait for additional input before triggering a search.                     |
| `searchOptions`    | `ExperianServiceSearchOptions[]` | `[ { name: "search_type", value: "singleline" }, { name: "prompt_set", value: "default" }, { name: "flatten", value: "true" }, { name: "intensity", value: "close" } ]` | Additional options for configuring the search behavior. |

## FORMAT parser

Note: I don't suspect many systems will need this feature, but if for some reason the descision was made to utalize Experian Layouts and through no lack of trying you end up with an address model that looks like the JSON below, this feature will allow you to clean that up before it's output by the LinkedEffect

```json
{
    "LINE_1": "{ADDR LINE 1}",
    "LINE_2": "{ADDR LINE 2}",
    "City name": "{CITY}",
    "State code": "{STATE}",
    "LINE_5": "{ZIP CODE}",
    "Three character ISO country code": "USA"
}
```

```ts
import { OPEN_UTILITY_EXPERIAN_SERVICE_CONFIG_TK, ExperianServiceAddressFormatParser, DefaultAddressFormat, ExperianFormatedAddress } from '@openutility/experian-services';

const expAddressParser: ExperianServiceAddressFormatParser = {
    layout: '{LAYOUT NAME}',
    parse<DefaultAddressFormat>(source: ExperianFormatedAddress) {
      return {
        address_line_1: source.address["LINE_1"],
        address_line_2: source.address["LINE_2"],
        locality: source.address["City name"],
        region: source.address["State code"],
        postal_code: source.address["LINE_5"],
        country: source.address["Three character ISO country code"],
      } as DefaultAddressFormat;
    }
};

export const config: ApplicationConfig = {
  providers: [
    { provide: OPEN_UTILITY_EXPERIAN_SERVICE_CONFIG_TK, useValue: {
        token: '{EXPERIAN_TOKEN_HERE}',
        formatLayouts: ['{LAYOUT NAME}'], 
        } 
    },
  ],
};
```