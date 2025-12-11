
import { Component, OnInit } from '@angular/core';
import { QaItemsService, Board, QAStatisticsResponse, QAStatisticsByMonth, QAGeneralStatistics, DevolutionsByMonth } from '../../core/qa-items.service';

type QAStatField = 'name' | 'tareas' | 'promedioTareas' | 'devoluciones' | 'promedioDevoluciones';

// Utilidad para formatear mes en español
function formatMesAnio(iso: string): string {
  if (!iso || iso.length < 7) return 'Sin fecha';
  const [anio, mes] = iso.split('-');
  const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const mesNum = parseInt(mes, 10);
  return `${meses[mesNum - 1]} ${anio}`;
}

export interface QAMesStat {
  month: string;
  qa: string;
  total: number;
}

interface TablasPorMesData {
  mes: string;
  mesIndex: number;
  anio: number;
  rows: { qa: string, tareas: number, devoluciones: number }[];
}

@Component({
  selector: 'app-estadisticas',
  templateUrl: './estadisticas.component.html',
  styleUrls: ['./estadisticas.component.scss']
})
export class EstadisticasComponent implements OnInit {
  activeTab: 'qa' | 'dev' = 'qa';
  openMes: number | null = 0;
  tablasPorMes: TablasPorMesData[] = [];
  
  // Tabla unificada de QA
  qaStats: { name: string, tareas: number, promedioTareas: number, devoluciones: number, promedioDevoluciones: number }[] = [];
  qaStatsSorted: { name: string, tareas: number, promedioTareas: number, devoluciones: number, promedioDevoluciones: number }[] = [];
  qaSortField: 'name' | 'tareas' | 'promedioTareas' | 'devoluciones' | 'promedioDevoluciones' = 'tareas';
  qaSortDir: 'asc' | 'desc' = 'desc';
  
  tareasPorQAPorMes: QAMesStat[] = [];
  devolucionesPorQAPorMes: QAMesStat[] = [];

  devStats: { name: string, total: number, promedio: number }[] = [];
  devStatsSorted: { name: string, total: number, promedio: number }[] = [];
  devSortField: 'total' | 'promedio' = 'total';
  devSortDir: 'asc' | 'desc' = 'desc';

  // Datos de las nuevas estadísticas
  estadisticasPorMes: QAStatisticsByMonth[] = [];
  estadisticasGenerales: QAGeneralStatistics[] = [];
  devolucionesPorMes: DevolutionsByMonth[] = [];

  constructor(private qaItemsService: QaItemsService) {}

  ngOnInit(): void {
    // Cargar las nuevas estadísticas basadas en fechas de prueba reales
    this.qaItemsService.getQAStatistics().subscribe({
      next: (stats) => {
        this.estadisticasPorMes = stats.estadisticasPorMes;
        this.estadisticasGenerales = stats.estadisticasGenerales;
        this.devolucionesPorMes = stats.devolucionesPorMes;
        
        this.procesarTablasPorMes();
        this.procesarEstadisticasGenerales();
      },
      error: (error) => {
        console.error('Error al cargar estadísticas:', error);
        // Fallback al método anterior
        this.cargarEstadisticasAnteriores();
      }
    });

    // Mantener el método anterior para desarrolladores
    this.qaItemsService.getBoardsBySprint().subscribe((sprints) => {
      this.procesarDatosDesarrolladores(sprints);
    });
  }

  private procesarTablasPorMes(): void {
    // Agrupar estadísticas por mes usando los datos correctos
    const mesQAMap = new Map<string, Map<string, { tareas: number, devoluciones: number }>>();
    
    this.estadisticasPorMes.forEach(stat => {
      const mes = stat.mes_prueba;
      if (!mesQAMap.has(mes)) mesQAMap.set(mes, new Map());
      const qaMap = mesQAMap.get(mes)!;
      
      if (!qaMap.has(stat.qa_name)) {
        qaMap.set(stat.qa_name, { tareas: 0, devoluciones: 0 });
      }
      
      const qaData = qaMap.get(stat.qa_name)!;
      qaData.tareas += stat.tareas_probadas;
      qaData.devoluciones += stat.total_devoluciones;
    });

    // Convertir a estructura para la vista y ordenar por mes real
    const mesesOrden = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    this.tablasPorMes = Array.from(mesQAMap.entries()).map(([mes, qaMap]) => {
      const [anio, mesNum] = mes.split('-');
      const mesNombre = mesesOrden[parseInt(mesNum, 10) - 1] || 'Sin fecha';
      return {
        mes: `${mesNombre} ${anio}`,
        mesIndex: parseInt(mesNum, 10) || 0,
        anio: parseInt(anio, 10) || 0,
        rows: Array.from(qaMap.entries()).map(([qa, stat]) => ({ 
          qa, 
          tareas: stat.tareas, 
          devoluciones: stat.devoluciones 
        }))
      };
    }).sort((a, b) => a.anio !== b.anio ? b.anio - a.anio : b.mesIndex - a.mesIndex);
  }

  private procesarDatosDesarrolladores(sprints: any[]): void {
    // Por desarrollador: unificar total y promedio
    const allBoards: Board[] = sprints.flatMap(s => s.boards);
    const mapDev = new Map<string, { total: number, count: number }>();
    
    allBoards.forEach(item => {
      if (item.developer_name) {
        const entry = mapDev.get(item.developer_name) || { total: 0, count: 0 };
        entry.total += item.returns || 0;
        entry.count += 1;
        mapDev.set(item.developer_name, entry);
      }
    });
    
    this.devStats = Array.from(mapDev.entries()).map(([name, obj]) => ({
      name,
      total: obj.total,
      promedio: obj.count ? obj.total / obj.count : 0
    }));
    
    this.sortDevTable('total', false); // Orden inicial por total desc
  }

  private cargarEstadisticasAnteriores(): void {
    // Método anterior como fallback
    this.qaItemsService.getBoardsBySprint().subscribe((sprints) => {
      // Agrupar por mes de created_at de cada board y QA
      const mesQAMap = new Map<string, Map<string, { tareas: number, devoluciones: number }>>();
      sprints.forEach(sprint => {
        sprint.boards.forEach(item => {
          if (!item.owner_name) return;
          const mes = item.created_at ? item.created_at.substring(0,7) : 'Sin fecha';
          if (!mesQAMap.has(mes)) mesQAMap.set(mes, new Map());
          const qaMap = mesQAMap.get(mes)!;
          if (!qaMap.has(item.owner_name)) qaMap.set(item.owner_name, { tareas: 0, devoluciones: 0 });
          const stat = qaMap.get(item.owner_name)!;
          stat.tareas += 1;
          stat.devoluciones += item.returns || 0;
        });
      });
      
      // Convertir a estructura para la vista
      const mesesOrden = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
      this.tablasPorMes = Array.from(mesQAMap.entries()).map(([mes, qaMap]) => {
        const [anio, mesNum] = mes.split('-');
        const mesNombre = mesesOrden[parseInt(mesNum, 10) - 1] || 'Sin fecha';
        return {
          mes: `${mesNombre} ${anio}`,
          mesIndex: parseInt(mesNum, 10) || 0,
          anio: parseInt(anio, 10) || 0,
          rows: Array.from(qaMap.entries()).map(([qa, stat]) => ({ qa, tareas: stat.tareas, devoluciones: stat.devoluciones }))
        };
      }).sort((a, b) => a.anio !== b.anio ? a.anio - b.anio : a.mesIndex - b.mesIndex);
      
      // Procesar estadísticas generales
      const allBoards: Board[] = sprints.flatMap(s => s.boards);
      const mapQA = new Map<string, { count: number, totalDevoluciones: number, exitosas: number, devueltas: number }>();
      allBoards.forEach(item => {
        if (item.owner_name) {
          const entry = mapQA.get(item.owner_name) || { count: 0, totalDevoluciones: 0, exitosas: 0, devueltas: 0 };
          entry.count += 1;
          entry.totalDevoluciones += item.returns || 0;
          entry.exitosas += item.state === 'Listo' ? 1 : 0;
          entry.devueltas += item.state === 'Devuelta' ? 1 : 0;
          mapQA.set(item.owner_name, entry);
        }
      });
      
      this.estadisticasGenerales = Array.from(mapQA.entries()).map(([qa_name, obj]) => ({
        qa_name,
        qa_id: 0, // No disponible en fallback
        total_tareas: obj.count,
        total_devoluciones: obj.totalDevoluciones,
        promedio_devoluciones: obj.count ? obj.totalDevoluciones / obj.count : 0,
        tareas_exitosas: obj.exitosas,
        tareas_devueltas: obj.devueltas
      }));
      
      this.procesarEstadisticasGenerales();
    });
  }

  private procesarEstadisticasGenerales(): void {
    // Calcular el total de tareas de todos los QA para los porcentajes
    const totalTareasGlobal = this.estadisticasGenerales.reduce((sum, qa) => sum + qa.total_tareas, 0);
    
    this.qaStats = this.estadisticasGenerales.map(qa => ({
      name: qa.qa_name,
      tareas: qa.total_tareas,
      promedioTareas: totalTareasGlobal > 0 ? (qa.total_tareas / totalTareasGlobal) : 0,
      devoluciones: qa.total_devoluciones,
      promedioDevoluciones: qa.promedio_devoluciones
    }));
    
    this.sortQATable('tareas', false);
  }

  sortQATable(field: QAStatField, toggle: boolean = true): void {
    if (toggle) {
      if (this.qaSortField === field) {
        this.qaSortDir = this.qaSortDir === 'desc' ? 'asc' : 'desc';
      } else {
        this.qaSortField = field;
        this.qaSortDir = 'desc';
      }
    } else {
      this.qaSortField = field;
      this.qaSortDir = 'desc';
    }
    this.qaStatsSorted = [...this.qaStats].sort((a, b) => {
      const dir = this.qaSortDir === 'desc' ? -1 : 1;
      const aValue = a[this.qaSortField];
      const bValue = b[this.qaSortField];
      if (aValue < bValue) return 1 * dir;
      if (aValue > bValue) return -1 * dir;
      return 0;
    });
  }

  sortDevTable(field: 'total' | 'promedio', toggle: boolean = true): void {
    if (toggle) {
      if (this.devSortField === field) {
        this.devSortDir = this.devSortDir === 'desc' ? 'asc' : 'desc';
      } else {
        this.devSortField = field;
        this.devSortDir = 'desc';
      }
    } else {
      this.devSortField = field;
      this.devSortDir = 'desc';
    }
    this.devStatsSorted = [...this.devStats].sort((a, b) => {
      const dir = this.devSortDir === 'desc' ? -1 : 1;
      if (a[this.devSortField] < b[this.devSortField]) return 1 * dir;
      if (a[this.devSortField] > b[this.devSortField]) return -1 * dir;
      return 0;
    });
  }

  getTotalTareasDelMes(): number {
    if (this.tablasPorMes.length === 0) return 0;
    return this.tablasPorMes[0].rows.reduce((total, row) => total + row.tareas, 0);
  }

  getTotalDevolucionesDelMes(): number {
    if (this.tablasPorMes.length === 0) return 0;
    return this.tablasPorMes[0].rows.reduce((total, row) => total + row.devoluciones, 0);
  }
}
