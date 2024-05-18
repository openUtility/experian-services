import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ExperianService } from '@openutility/experian-angular-services';
import { JsonPipe } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, JsonPipe],
  template: `
  <div>
    <label  for="test" >Address</label>
    <input #inpt type="text" id="test" [value]="source()" (input)="source.set(inpt.value)" />
  </div>
  <fieldset>
    <legend>Options</legend>
    <ul>
      @for(item of suggestions(); track item.global_address_key; let idx = $index) {
        <li>
        <input type="radio"
          name="test_selection"
          [id]="'test_selection_' + idx"
          (click)="selected.set(item.global_address_key)"
        />
          <label [for]="'test_selection_' + idx">{{item.text}}</label>
        </li>
      }
    </ul>
  </fieldset>

  <code><pre>
{{expLookUp.result() | json}}
  </pre></code>
  <code><pre>
{{expformat.result() | json}}
  </pre></code>
  <router-outlet />
  `,
  styles: ``
})
export class AppComponent implements OnDestroy {
  private readonly expSrv = inject(ExperianService);

  source = signal<string>('');
  selected = signal<string | null>(null);
  
  public readonly expLookUp = this.expSrv.generateLookupService(this.source);
  public readonly expformat = this.expSrv.generateFormatService(this.selected);
  
  suggestions = computed(() => this.expLookUp.result().object?.suggestions ?? []);

  constructor() {}

  ngOnDestroy(): void {
      this.expLookUp.destroy();
      this.expformat.destroy();
  }
}