import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { SalesService } from '../../../core/services/sales.service';
import { Sale } from '../../../model/sale.model';
import { NgxChartsModule, LegendPosition } from '@swimlane/ngx-charts';

interface ChartData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-daily-sales-amount-widget',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, NgxChartsModule],
  providers: [CurrencyPipe], // Make CurrencyPipe available for injection
  templateUrl: './daily-sales-amount-widget.component.html',
  styleUrl: './daily-sales-amount-widget.component.scss'
})
export class DailySalesAmountWidgetComponent implements OnInit {
  dailySalesAmount: ChartData[] = [];
  legendPosition: LegendPosition = LegendPosition.Below;

  constructor(
    private salesService: SalesService,
    private currencyPipe: CurrencyPipe
  ) {}

  // Formatting function for the chart values
  tooltipText = (data: { data: { name: string, value: number } }): string => {
    const { name, value } = data.data;
    return `${name}<br />${this.currencyPipe.transform(value, 'INR', 'symbol')}`;
  };

  ngOnInit(): void {
    this.salesService.getSales().subscribe(sales => {
      this.processDailySales(sales);
    });
  }

  private processDailySales(sales: Sale[]): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const productSalesMap = new Map<string, { totalQuantity: number; totalAmount: number }>();

    sales
      .filter(sale => sale.date.toDate().setHours(0, 0, 0, 0) === today.getTime())
      .flatMap(sale => sale.items)
      .forEach(item => {
        const existing = productSalesMap.get(item.productName) ?? { totalQuantity: 0, totalAmount: 0 };
        existing.totalQuantity += item.quantity;
        existing.totalAmount += item.total;
        productSalesMap.set(item.productName, existing);
      });

    this.dailySalesAmount = Array.from(productSalesMap.entries()).map(([productName, data]) => ({
      name: productName,
      value: data.totalAmount
    }));
  }
}