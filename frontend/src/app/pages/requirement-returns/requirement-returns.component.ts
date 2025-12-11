import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RequirementReturnService, RequirementReturn, RequirementReturnStatistics } from '../../core/requirement-return.service';

@Component({
  selector: 'app-requirement-returns',
  templateUrl: './requirement-returns.component.html',
  styleUrls: ['./requirement-returns.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class RequirementReturnsComponent implements OnInit {
  returns: RequirementReturn[] = [];
  statistics: RequirementReturnStatistics[] = [];
  form: Partial<RequirementReturn> = { po_name: '', task_code: '', return_reason: '' };
  editingId: number | null = null;
  activeTab: 'form' | 'list' | 'stats' = 'form';

  // Lista de POs disponibles
  pos: string[] = [
    'Juan David Jimenez',
    'Alejandro Suarez',
    'Sebastian Chaves',
    'Jonnatan Torres',
    'Adalberto Salas'
  ];

  // Filtros
  filterPoName: string = '';
  filterTaskCode: string = '';
  selectedMonth: { year: number; month: number } | null = null;

  constructor(private requirementReturnService: RequirementReturnService) {}

  ngOnInit() {
    this.load();
    this.loadStatistics();
  }

  load() {
    const filters: any = {};
    if (this.filterPoName) filters.po_name = this.filterPoName;
    if (this.filterTaskCode) filters.task_code = this.filterTaskCode;

    this.requirementReturnService.list(filters).subscribe({
      next: (response) => {
        this.returns = response.data || [];
      },
      error: (err) => {
        console.error('Error cargando devoluciones:', err);
        alert('Error al cargar devoluciones');
      }
    });
  }

  loadStatistics() {
    let year: number | undefined;
    let month: number | undefined;

    if (this.selectedMonth) {
      year = this.selectedMonth.year;
      month = this.selectedMonth.month;
    }

    this.requirementReturnService.getStatisticsByMonth(year, month).subscribe({
      next: (response) => {
        this.statistics = response.data || [];
      },
      error: (err) => {
        console.error('Error cargando estadísticas:', err);
      }
    });
  }

  save() {
    if (!this.form.po_name || !this.form.task_code || !this.form.return_reason) {
      alert('Por favor completa todos los campos');
      return;
    }

    if (this.editingId) {
      // Actualizar
      this.requirementReturnService.update(this.editingId, this.form).subscribe({
        next: () => {
          alert('Devolución actualizada exitosamente');
          this.resetForm();
          this.load();
        },
        error: (err) => {
          console.error('Error actualizando devolución:', err);
          alert('Error al actualizar devolución');
        }
      });
    } else {
      // Crear
      this.requirementReturnService.create(this.form as RequirementReturn).subscribe({
        next: () => {
          alert('Devolución registrada exitosamente');
          this.resetForm();
          this.load();
          this.activeTab = 'list';
        },
        error: (err) => {
          console.error('Error creando devolución:', err);
          alert('Error al registrar devolución');
        }
      });
    }
  }

  edit(item: RequirementReturn) {
    this.form = { ...item };
    this.editingId = item.id || null;
    this.activeTab = 'form';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  delete(id: number) {
    if (confirm('¿Estás seguro de que deseas eliminar esta devolución?')) {
      this.requirementReturnService.delete(id).subscribe({
        next: () => {
          alert('Devolución eliminada exitosamente');
          this.load();
        },
        error: (err) => {
          console.error('Error eliminando devolución:', err);
          alert('Error al eliminar devolución');
        }
      });
    }
  }

  resetForm() {
    this.form = { po_name: '', task_code: '', return_reason: '' };
    this.editingId = null;
  }

  applyFilters() {
    this.load();
  }

  clearFilters() {
    this.filterPoName = '';
    this.filterTaskCode = '';
    this.load();
  }

  selectMonth(year: number, month: number) {
    this.selectedMonth = { year, month };
    this.loadStatistics();
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  getCurrentMonth(): number {
    return new Date().getMonth() + 1;
  }

  getMonthName(month: number): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months[month - 1] || '';
  }

  formatDate(date: string | undefined): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getTotalReturns(): number {
    return this.statistics.reduce((sum, s) => sum + s.total_returns, 0);
  }

  getAveragePerPO(): string {
    if (this.statistics.length === 0) return '0';
    const total = this.statistics.reduce((sum, s) => sum + s.total_returns, 0);
    return (total / this.statistics.length).toFixed(1);
  }
}
