import { Component, OnInit } from '@angular/core';
import { Return, ReturnService, ReturnStatistics } from '../../core/return.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-returns',
  standalone: false,
  templateUrl: './returns.component.html',
  styleUrls: ['./returns.component.scss']
})
export class ReturnsComponent implements OnInit {
  returns: Return[] = [];
  statistics: ReturnStatistics[] = [];
  form: Partial<Return> = {};
  editingId: number | null = null;
  activeTab: 'form' | 'list' | 'stats' = 'form';

  pos: string[] = [
    'Juan David Jimenez',
    'Alejandro Suarez',
    'Sebastian Chaves',
    'Jonnatan Torres',
    'Adalberto Salas',
    'Daniel Rojas'
  ];

  filterPoName: string = '';
  filterTaskCode: string = '';
  selectedMonth: { year: number; month: number } | null = null;

  constructor(private returnService: ReturnService) { }

  ngOnInit(): void {
    this.load();
    this.loadStatistics();
  }

  load(): void {
    const filters: any = {};
    if (this.filterPoName) filters.po_name = this.filterPoName;
    if (this.filterTaskCode) filters.task_code = this.filterTaskCode;

    this.returnService.list(filters).subscribe({
      next: (response: any) => {
        this.returns = response.data || [];
      },
      error: (error) => {
        console.error('Error cargando devoluciones:', error);
        alert('Error al cargar las devoluciones');
      }
    });
  }

  loadStatistics(year?: number, month?: number): void {
    this.returnService.getStatisticsByMonth(year, month).subscribe({
      next: (response: any) => {
        this.statistics = response.data || [];
      },
      error: (error) => {
        console.error('Error cargando estadísticas:', error);
      }
    });
  }

  save(): void {
    if (!this.form.po_name || !this.form.task_code || !this.form.return_reason) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (this.editingId) {
      this.returnService.update(this.editingId, this.form).subscribe({
        next: () => {
          alert('Devolución actualizada correctamente');
          this.load();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error actualizando devolución:', error);
          alert('Error al actualizar la devolución');
        }
      });
    } else {
      this.returnService.create(this.form as Return).subscribe({
        next: () => {
          alert('Devolución registrada correctamente');
          this.load();
          this.resetForm();
        },
        error: (error) => {
          console.error('Error creando devolución:', error);
          alert('Error al registrar la devolución');
        }
      });
    }
  }

  edit(item: Return): void {
    this.form = { ...item };
    this.editingId = item.id || null;
    this.activeTab = 'form';
    window.scrollTo(0, 0);
  }

  delete(id: number): void {
    if (!confirm('¿Estás seguro de que deseas eliminar esta devolución?')) {
      return;
    }

    this.returnService.delete(id).subscribe({
      next: () => {
        alert('Devolución eliminada correctamente');
        this.load();
      },
      error: (error) => {
        console.error('Error eliminando devolución:', error);
        alert('Error al eliminar la devolución');
      }
    });
  }

  resetForm(): void {
    this.form = {};
    this.editingId = null;
  }

  applyFilters(): void {
    this.load();
  }

  clearFilters(): void {
    this.filterPoName = '';
    this.filterTaskCode = '';
    this.load();
  }

  selectMonth(year: number, month: number): void {
    this.selectedMonth = { year, month };
    this.loadStatistics(year, month);
  }

  getCurrentYear(): number {
    return new Date().getFullYear();
  }

  getCurrentMonth(): number {
    return new Date().getMonth() + 1;
  }

  getMonthName(month: number): string {
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
                    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    return months[month - 1] || '';
  }

  formatDate(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
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
