import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span class="logo" [class.logo-light]="light">
      <span class="mark" aria-hidden="true">
        <span class="bubble main">L</span>
        <span class="bubble small">s</span>
      </span>
      <span class="name">
        Letz <span class="accent">speak</span>
        <small>AI Coach</small>
      </span>
    </span>
  `,
  styles: [
    `
      .logo {
        display: inline-flex;
        align-items: center;
        gap: 12px;
      }
      .mark {
        position: relative;
        width: 38px;
        height: 34px;
        flex: 0 0 auto;
      }
      .bubble {
        position: absolute;
        display: grid;
        place-items: center;
        font-family: var(--font-sans);
        font-weight: 800;
        line-height: 1;
      }
      .bubble.main {
        left: 0;
        top: 0;
        width: 30px;
        height: 30px;
        border-radius: 10px 10px 10px 3px;
        background: linear-gradient(145deg, var(--blue-700), var(--sky));
        color: var(--white);
        box-shadow: 0 8px 18px rgba(0, 159, 223, 0.22);
      }
      .bubble.small {
        right: 0;
        bottom: 0;
        width: 18px;
        height: 18px;
        border-radius: 7px 7px 2px 7px;
        background: var(--red);
        color: var(--white);
        font-size: 11px;
        border: 2px solid var(--background);
      }
      .name {
        display: grid;
        grid-template-columns: auto auto;
        column-gap: 4px;
        font-family: var(--font-serif);
        font-weight: 700;
        font-size: 19px;
        line-height: 1;
        color: var(--blue-900);
      }
      .name .accent {
        color: var(--sky);
      }
      .name small {
        grid-column: 1 / -1;
        font-family: var(--font-sans);
        font-weight: 600;
        font-size: 10.5px;
        letter-spacing: 0.06em;
        text-transform: uppercase;
        color: var(--slate-500);
        margin-top: 3px;
      }
      .logo-light .name {
        color: #fff;
      }
      .logo-light .name small {
        color: rgba(255, 255, 255, 0.8);
      }
      .logo-light .bubble.small {
        border-color: var(--blue-900);
      }
    `,
  ],
})
export class LogoComponent {
  @Input() light = false;
}
