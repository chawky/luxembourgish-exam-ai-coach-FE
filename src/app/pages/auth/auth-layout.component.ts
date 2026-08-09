import { Component } from '@angular/core';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  template: `
    <div class="auth">
      <div class="auth-form">
        <div class="auth-form-inner">
          <ng-content></ng-content>
        </div>
      </div>
      <aside class="auth-panel" aria-hidden="true">
        <div class="panel-content">
          <span class="eyebrow light">Official language exam prep</span>
          <h2>Your path to Luxembourgish citizenship starts with the language.</h2>
          <p>
            Practice speaking, listening, vocabulary and full mock exams with an
            AI coach modelled on the real Sproochentest.
          </p>
          <ul class="checklist">
            <li>Guided speaking drills with instant feedback</li>
            <li>Authentic listening exercises</li>
            <li>Timed mock exams to build confidence</li>
          </ul>
          <div class="stat-row">
            <div>
              <strong>4</strong>
              <span>practice modes</span>
            </div>
            <div>
              <strong>200+</strong>
              <span>exam-style items</span>
            </div>
            <div>
              <strong>1</strong>
              <span>friendly coach</span>
            </div>
          </div>
        </div>
      </aside>
    </div>
  `,
  styles: [
    `
      .auth {
        min-height: 100vh;
        display: grid;
        grid-template-columns: 1fr;
      }
      .auth-form {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 40px 24px;
        background: var(--background);
      }
      .auth-form-inner {
        width: 100%;
        max-width: 400px;
      }
      .auth-panel {
        display: none;
        background: linear-gradient(160deg, var(--blue-900), var(--blue-700));
        color: #fff;
        padding: 56px;
        position: relative;
        overflow: hidden;
      }
      .auth-panel::after {
        content: '';
        position: absolute;
        inset: 0;
        background:
          radial-gradient(
            520px 320px at 100% 0%,
            rgba(0, 159, 223, 0.35),
            transparent 60%
          );
      }
      .panel-content {
        position: relative;
        z-index: 1;
        max-width: 440px;
        margin: auto 0;
      }
      .eyebrow.light {
        color: var(--sky);
      }
      .panel-content h2 {
        color: #fff;
        font-size: 30px;
        margin: 16px 0;
        text-wrap: balance;
      }
      .panel-content p {
        color: rgba(255, 255, 255, 0.82);
        font-size: 16px;
      }
      .checklist {
        list-style: none;
        padding: 0;
        margin: 24px 0;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .checklist li {
        position: relative;
        padding-left: 30px;
        color: rgba(255, 255, 255, 0.92);
        font-size: 15px;
      }
      .checklist li::before {
        content: '✓';
        position: absolute;
        left: 0;
        top: -1px;
        width: 20px;
        height: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--sky);
        color: #002b40;
        border-radius: 50%;
        font-size: 12px;
        font-weight: 700;
      }
      .stat-row {
        display: flex;
        gap: 28px;
        margin-top: 36px;
        border-top: 1px solid rgba(255, 255, 255, 0.18);
        padding-top: 24px;
      }
      .stat-row strong {
        display: block;
        font-family: var(--font-serif);
        font-size: 26px;
      }
      .stat-row span {
        font-size: 13px;
        color: rgba(255, 255, 255, 0.7);
      }
      @media (min-width: 920px) {
        .auth {
          grid-template-columns: 1fr 1fr;
        }
        .auth-panel {
          display: flex;
          flex-direction: column;
        }
      }
    `,
  ],
})
export class AuthLayoutComponent {}
