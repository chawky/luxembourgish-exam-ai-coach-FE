import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { IconComponent } from '../../components/icon.component';

type CheckoutResult = 'success' | 'cancel';

@Component({
  selector: 'app-payment-return',
  standalone: true,
  imports: [IconComponent],
  template: `
    <main class="payment-return">
      <section class="card card-pad payment-card">
        <span class="payment-icon loading-icon">
          <app-icon name="sparkles" [size]="20"></app-icon>
        </span>
        <div>
          <h1>Returning to your account...</h1>
          <p class="text-muted">Opening your subscription settings.</p>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      .payment-return {
        min-height: 100vh;
        display: grid;
        place-items: center;
        padding: 24px;
      }

      .payment-card {
        display: flex;
        align-items: center;
        gap: 14px;
        max-width: 460px;
      }

      .payment-card h1 {
        font-size: 24px;
      }

      .payment-card p {
        margin: 4px 0 0;
      }

      .payment-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        background: var(--sky-50);
        color: var(--blue-700);
      }
    `,
  ],
})
export class PaymentReturnComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  ngOnInit(): void {
    const checkout = this.checkoutResult();
    this.router.navigate(['/app/profile'], {
      queryParams: { tab: 'subscription', checkout },
      replaceUrl: true,
    });
  }

  private checkoutResult(): CheckoutResult {
    return this.route.snapshot.data['checkout'] === 'success'
      ? 'success'
      : 'cancel';
  }
}
