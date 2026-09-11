import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type IconName =
  | 'mic'
  | 'headphones'
  | 'image'
  | 'cards'
  | 'book'
  | 'chart'
  | 'chat'
  | 'play'
  | 'check'
  | 'arrow'
  | 'flame'
  | 'logout'
  | 'menu'
  | 'shield'
  | 'search'
  | 'sparkles'
  | 'clock'
  | 'pause'
  | 'info'
  | 'eye'
  | 'eye-off';

const PATHS: Record<IconName, string> = {
  mic: 'M12 2a3 3 0 0 0-3 3v6a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zM5 10v1a7 7 0 0 0 14 0v-1M12 18v4M8 22h8',
  headphones: 'M3 18v-6a9 9 0 0 1 18 0v6M21 19a2 2 0 0 1-2 2h-1a1 1 0 0 1-1-1v-4a1 1 0 0 1 1-1h3zM3 19a2 2 0 0 0 2 2h1a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H3z',
  image: 'M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2zM8 9h.01M4 17l4.5-4.5 3.5 3.5 2.5-2.5L20 19',
  cards: 'M3 7a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM8 3h11a2 2 0 0 1 2 2v11',
  book: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V4H6.5A2.5 2.5 0 0 0 4 6.5zM8 7h8M8 11h6',
  chart: 'M3 3v18h18M7 14v3M12 9v8M17 5v12',
  chat: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8z',
  play: 'M5 3l14 9-14 9z',
  check: 'M20 6 9 17l-5-5',
  arrow: 'M5 12h14M12 5l7 7-7 7',
  flame: 'M12 2s4 4 4 9a4 4 0 0 1-8 0c0-1 .5-2 .5-2S8 12 8 14a4 4 0 0 0 8 0c0-5-4-12-4-12z',
  logout: 'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9',
  menu: 'M3 12h18M3 6h18M3 18h18',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  search: 'M21 21l-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15z',
  sparkles: 'M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17l-1.9-5.1L4.5 10l5.6-1.4z',
  clock: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2',
  pause: 'M8 5v14M16 5v14',
  info: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 16v-4M12 8h.01',
  eye: 'M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  'eye-off': 'M3 3l18 18M10.6 10.6A3 3 0 0 0 13.4 13.4M9.9 4.2A10.6 10.6 0 0 1 12 4c6.5 0 10 8 10 8a17.4 17.4 0 0 1-4 5.1M6.1 6.1C3.5 7.8 2 12 2 12s3.5 8 10 8a10.8 10.8 0 0 0 5.9-1.8',
};

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [CommonModule],
  template: `
    <svg
      [attr.width]="size"
      [attr.height]="size"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.9"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path [attr.d]="path"></path>
    </svg>
  `,
  styles: [`:host { display: inline-flex; }`],
})
export class IconComponent {
  @Input({ required: true }) name!: IconName | string;
  @Input() size = 20;

  get path(): string {
    return PATHS[this.name as IconName] ?? '';
  }
}
