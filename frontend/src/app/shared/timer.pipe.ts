import { Pipe, PipeTransform, NgZone, ChangeDetectorRef, OnDestroy } from '@angular/core';

@Pipe({
  name: 'timer',
  pure: false // Impuro para que se actualice automáticamente
})
export class TimerPipe implements PipeTransform, OnDestroy {
  private timer: any = null;
  private lastValue: string | null = null;
  private lastResult: string = '';

  constructor(private ref: ChangeDetectorRef, private zone: NgZone) {}

  transform(value: string | Date | null | undefined): string {
    if (!value) return '';
    if (this.lastValue !== value) {
      this.lastValue = value as string;
      this.clearTimer();
      this.startTimer();
    }
    this.lastResult = this.formatDiff(value);
    return this.lastResult;
  }

  private startTimer() {
    this.zone.runOutsideAngular(() => {
      this.timer = setInterval(() => {
        this.ref.markForCheck();
      }, 1000);
    });
  }

  private clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private formatDiff(value: string | Date): string {
    const start = new Date(value).getTime();
    if (isNaN(start)) return '';
    let diff = Math.floor((Date.now() - start) / 1000);
    if (diff < 0) diff = 0;
    const days = Math.floor(diff / 86400);
    diff = diff % 86400;
    const hours = Math.floor(diff / 3600);
    diff = diff % 3600;
    const minutes = Math.floor(diff / 60);
    const seconds = diff % 60;
    if (days > 0) {
      return `${days}d ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  ngOnDestroy() {
    this.clearTimer();
  }
}
