import { Component, OnInit } from '@angular/core';

import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { SalesService } from '../../../core/services/sales.service';
import { Sale } from '../../../model/sale.model';
import { NgxChartsModule } from '@swimlane/ngx-charts';

interface ChartData {
  name: string;
  value: number;
}

@Component({
  selector: 'app-daily-sales-widget',
  standalone: true,
  // Note: You will need to run 'npm install @swimlane/ngx-charts'
  imports: [MatCardModule, MatIconModule, NgxChartsModule],
  templateUrl: './daily-sales-widget.component.html',
  styleUrl: './daily-sales-widget.component.scss'
})
export class DailySalesWidgetComponent implements OnInit {
  dailyProductSales: ChartData[] = [];

  constructor(private salesService: SalesService) {}

  ngOnInit(): void {
    this.salesService.getSales().subscribe(sales => {
      this.processDailySales(sales);
    });
  }

  private processDailySales(sales: Sale[]): void {
    const today = new Date(); // Note: For testing, you can use a fixed date like new Date('2024-01-25')
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

    this.dailyProductSales = Array.from(productSalesMap.entries()).map(([productName, data]) => ({
      name: productName,
      value: data.totalQuantity
    }));
  }
}