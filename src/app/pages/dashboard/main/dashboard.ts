import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { DailySalesWidgetComponent } from '../widgets/daily-sales-widget.component';
import { DailySalesAmountWidgetComponent } from '../widgets/daily-sales-amount-widget.component';
import { QuickLinksWidgetComponent } from '../widgets/quick-links-widget.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    DailySalesWidgetComponent,
    DailySalesAmountWidgetComponent,
    QuickLinksWidgetComponent
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard {}