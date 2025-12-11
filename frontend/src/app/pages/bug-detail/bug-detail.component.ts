import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BugsService, Bug } from '../../core/bugs.service';

@Component({
  selector: 'app-bug-detail',
  templateUrl: './bug-detail.component.html',
  styleUrls: ['./bug-detail.component.scss']
})
export class BugDetailComponent implements OnInit {
  bug: Bug | null = null;
  loading = true;
  error: any = null;

  constructor(private route: ActivatedRoute, private bugsService: BugsService) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id) { this.error = 'ID inválido'; this.loading = false; return; }
    this.bugsService.get(id).subscribe({ next: b => { this.bug = b; this.loading = false; }, error: err => { this.error = err; this.loading = false; } });
  }

  formatError() {
    if (!this.error) return '';
    try { return typeof this.error === 'string' ? this.error : JSON.stringify(this.error); } catch (e) { return String(this.error); }
  }
}
