import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IconComponent } from '../../components/icon.component';
import { ChatMessage } from '../../models';
import { AiQuotaService, AiQuotaStatus } from '../../services/ai-quota.service';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <header class="page-head">
      <div>
        <span class="eyebrow">AI chat tutor</span>
        <h1>Practise a conversation</h1>
        <p class="text-muted">
          Chat in Luxembourgish with your coach. It replies and gently corrects you.
        </p>
      </div>
    </header>

    <section class="chat card">
      <div class="messages">
        @for (m of messages(); track m.id) {
          <div class="msg" [class.user]="m.role === 'user'">
            @if (m.role === 'coach') {
              <span class="avatar"><app-icon name="sparkles" [size]="16"></app-icon></span>
            }
            <div class="bubble-group">
              <div class="bubble">{{ m.text }}</div>
              @if (m.correction) {
                <div class="correction">
                  <app-icon name="check" [size]="13"></app-icon>
                  {{ m.correction }}
                </div>
              }
            </div>
          </div>
        }
        @if (typing()) {
          <div class="msg">
            <span class="avatar"><app-icon name="sparkles" [size]="16"></app-icon></span>
            <div class="bubble typing"><span></span><span></span><span></span></div>
          </div>
        }
      </div>

      <div class="suggestions">
        @for (s of suggestions; track s) {
          <button class="suggestion" [disabled]="quotaBlocked()" (click)="send(s)">
            {{ s }}
          </button>
        }
      </div>

      @if (quotaMessage()) {
        <div class="form-error" role="alert">{{ quotaMessage() }}</div>
      }

      <form class="composer" (submit)="$event.preventDefault(); send(draft)">
        <input
          [(ngModel)]="draft"
          name="draft"
          placeholder="Schreift eppes op Lëtzebuergesch..."
          autocomplete="off"
        />
        <button
          type="submit"
          class="send-btn"
          [disabled]="!draft.trim() || quotaBlocked()"
          aria-label="Send message"
        >
          <app-icon name="arrow" [size]="20"></app-icon>
        </button>
      </form>
    </section>
  `,
  styleUrl: './chat.component.css',
})
export class ChatComponent implements OnInit {
  private aiQuota = inject(AiQuotaService);

  draft = '';
  typing = signal(false);
  quota = signal<AiQuotaStatus | null>(null);

  suggestions = [
    'Moien! Wéi geet et?',
    'Wat hutt Dir um Weekend gemaach?',
    'Ech wunnen zu Lëtzebuerg.',
  ];

  messages = signal<ChatMessage[]>([
    {
      id: 'c0',
      role: 'coach',
      text: 'Moien! Ech sinn Äre Letz speak Coach. Loosst eis op Lëtzebuergesch schwätzen. Wéi heescht Dir?',
    },
  ]);

  private replies: { text: string; correction?: string }[] = [
    {
      text: 'Flott! Freet mech, Iech kennenzeléieren. Wou wunnt Dir genau?',
      correction: 'Tip: “Ech heeschen...” is the natural way to say your name.',
    },
    {
      text: 'Ah, interessant! A wat maacht Dir am Liewen — schafft Dir oder studéiert Dir?',
    },
    {
      text: 'Super gemaach! Probéiert d’nächst Kéier e längere Saz mat “well” (because).',
      correction: 'Small fix: word order after “well” puts the verb at the end.',
    },
    {
      text: 'Ganz gutt! Dir maacht richteg Fortschrëtter. Loosst eis weidermaachen.',
    },
  ];
  private replyIndex = 0;

  ngOnInit(): void {
    this.loadQuota();
  }

  send(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || this.quotaBlocked()) {
      return;
    }

    this.messages.update((messages) => [
      ...messages,
      { id: 'u' + Date.now(), role: 'user', text: trimmed },
    ]);
    this.draft = '';
    this.typing.set(true);

    const reply = this.replies[this.replyIndex % this.replies.length];
    this.replyIndex++;

    setTimeout(() => {
      this.typing.set(false);
      this.messages.update((messages) => [
        ...messages,
        {
          id: 'c' + Date.now(),
          role: 'coach',
          text: reply.text,
          correction: reply.correction,
        },
      ]);
    }, 900);
  }

  quotaBlocked(): boolean {
    return this.aiQuota.isExhausted(this.quota(), 'CHAT');
  }

  quotaMessage(): string {
    return this.quotaBlocked()
      ? this.aiQuota.blockedMessage(this.quota(), 'CHAT')
      : '';
  }

  private loadQuota(refresh = false): void {
    this.aiQuota.getMyQuota(refresh).subscribe({
      next: (quota) => this.quota.set(quota),
      error: () => undefined,
    });
  }
}
