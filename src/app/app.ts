import { Component, signal } from '@angular/core';
import { LayoutComponent } from  './layout/fullLayout/layout.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('kisko-app');
}
