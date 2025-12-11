import { Component, OnInit, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { PlaywrightService, PlaySummary, PlayDaily, PlayFailure, PlayResult } from '../../core/playwright.service';
import { PostmanService, PostmanExecutionRequest, PostmanExecutionResponse, PostmanResultWithAssertions, PostmanResult } from '../../core/postman.service';
import { AuthService } from '../../core/auth.service';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

// Interfaces para la nueva funcionalidad
interface ProjectInfo {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  testSuites: number;
  lastExecution: Date;
  status: 'active' | 'maintenance';
  featured?: boolean;
}

interface TestTypeStats {
  total: number;
  passed: number;
  failed: number;
  successRate: number;
}

// Interface extendida para resultados con assertion info
interface PostmanResultExtended extends PostmanResult {
  assertion_name?: string;
  error_message?: string;
}

// Interface para datos de tendencias
interface TrendData {
  date: string;
  passed: number;
  failed: number;
  total: number;
  successRate: number;
}

// Interface para assertions populares
interface AssertionSummary {
  name: string;
  passed: number;
  failed: number;
  total: number;
  successRate: number;
}

// 📊 Nuevas interfaces para el dashboard completo
interface GlobalStats {
  totalTests: number;
  totalAssertions: number;
  totalFails: number;
  successRate: number;
  lastExecution: Date;
}

interface TopError {
  message: string;
  count: number;
  percentage: number;
}

interface TemporalData {
  date: string;
  passed: number;
  failed: number;
}

interface AssertionTypeData {
  name: string;
  passed: number;
  failed: number;
}

interface ExecutionPerformanceData {
  id: string;
  name: string;
  successRate: number;
  total: number;
}

interface CumulativeFailureData {
  date: string;
  cumulativeFails: number;
}

interface ProjectDistributionData {
  project: string;
  assertionType: string;
  passed: number;
  failed: number;
}

// Registrar Chart.js
Chart.register(...registerables);

@Component({
  selector: 'app-grafica-pruebas',
  templateUrl: './grafica-pruebas.component.html',
  styleUrls: ['./grafica-pruebas.component.scss']
})
export class GraficaPruebasComponent implements OnInit, AfterViewInit, OnDestroy {
  
  // ViewChild para los canvas de las gráficas
  @ViewChild('pieChart') pieChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barChart') barChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lineChart') lineChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('playwrightPieChart') playwrightPieChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('dailyChart') dailyChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('failuresChart') failuresChart!: ElementRef<HTMLCanvasElement>;
  
  // 📊 Nuevos ViewChild para el dashboard completo
  @ViewChild('generalStatusChart') generalStatusChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('temporalTrendChart') temporalTrendChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('assertionTypeChart') assertionTypeChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('executionPerformanceChart') executionPerformanceChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('cumulativeFailuresChart') cumulativeFailuresChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('projectDistributionChart') projectDistributionChart!: ElementRef<HTMLCanvasElement>;
  
  // Instancias de Chart.js
  private pieChartInstance?: Chart;
  private barChartInstance?: Chart;
  private lineChartInstance?: Chart;
  private playwrightPieChartInstance?: Chart;
  private dailyChartInstance?: Chart;
  private failuresChartInstance?: Chart;
  
  // 📊 Nuevas instancias de Chart.js para el dashboard
  private generalStatusChartInstance?: Chart;
  private temporalTrendChartInstance?: Chart;
  private assertionTypeChartInstance?: Chart;
  private executionPerformanceChartInstance?: Chart;
  private cumulativeFailuresChartInstance?: Chart;
  private projectDistributionChartInstance?: Chart;

  // 🤖 ViewChild para Playwright dashboard
  @ViewChild('playwrightGeneralStatusChart') playwrightGeneralStatusChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('playwrightTemporalTrendChart') playwrightTemporalTrendChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('playwrightTestDistributionChart') playwrightTestDistributionChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('playwrightExecutionPerformanceChart') playwrightExecutionPerformanceChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('playwrightCumulativeFailuresChart') playwrightCumulativeFailuresChart!: ElementRef<HTMLCanvasElement>;
  @ViewChild('playwrightSuiteDistributionChart') playwrightSuiteDistributionChart!: ElementRef<HTMLCanvasElement>;

  // 🤖 Instancias de Chart.js para Playwright
  private playwrightGeneralStatusChartInstance?: Chart;
  private playwrightTemporalTrendChartInstance?: Chart;
  private playwrightTestDistributionChartInstance?: Chart;
  private playwrightExecutionPerformanceChartInstance?: Chart;
  private playwrightCumulativeFailuresChartInstance?: Chart;
  private playwrightSuiteDistributionChartInstance?: Chart;
  
  // Estados de navegación
  selectedProject: ProjectInfo | null = null;
  selectedTestType: 'contract' | 'response' | 'automation' | null = null;
  
  // Datos de proyectos disponibles (se cargarán dinámicamente desde la BD)
  availableProjects: ProjectInfo[] = [];
  
  // Iconos y colores predefinidos por proyecto (opcional)
  projectStyles: { [key: string]: { icon: string; color: string; description: string } } = {
    'yamaha': { icon: 'fas fa-motorcycle', color: '#0066cc', description: 'Proyecto preproducción Yamaha' },
    'haceb': { icon: 'fas fa-university', color: '#005eb8', description: 'Proyecto Haceb' },
    'coomultrasan': { icon: 'fas fa-shipping-fast', color: '#ff6b35', description: 'Proyecto Comultrasan' },
    'default': { icon: 'fas fa-project-diagram', color: '#6c757d', description: 'Proyecto de automatización' }
  };

  // Estadísticas por tipo de prueba
  contractStats: TestTypeStats = { total: 0, passed: 0, failed: 0, successRate: 0 };
  responseStats: TestTypeStats = { total: 0, passed: 0, failed: 0, successRate: 0 };
  automationStats: TestTypeStats = { total: 0, passed: 0, failed: 0, successRate: 0 };
  currentStats: TestTypeStats = { total: 0, passed: 0, failed: 0, successRate: 0 };

  // Datos para mostrar en las tablas
  filteredPostmanResults: PostmanResultExtended[] = [];
  filteredPlaywrightResults: PlayResult[] = [];
  lastExecutionResults: PostmanResultExtended[] = [];
  lastExecutionDate: Date | null = null;
  
  // Progreso de ejecución en tiempo real
  executionProgress = {
    isExecuting: false,
    current: 0,
    total: 0,
    percentage: 0,
    currentTest: '',
    timeRemaining: '0s',
    elapsedTime: '0s',
    avgTestTime: '0s',
    startTime: 0
  };
  
  private progressCheckInterval: any = null;
  
  // Datos para gráficas
  trendData: TrendData[] = [];
  topAssertions: AssertionSummary[] = [];
  
  // Filtros
  statusFilter: string = '';
  searchFilter: string = '';
  
  // Estados de carga
  loading = false;
  
  // 📊 Nuevas propiedades para el dashboard completo
  globalStats: GlobalStats = {
    totalTests: 0,
    totalAssertions: 0,
    totalFails: 0,
    successRate: 0,
    lastExecution: new Date()
  };
  
  topErrors: TopError[] = [];
  topFailedRequests: Array<{requestName: string, failCount: number, totalCount: number, failRate: number}> = [];
  temporalData: TemporalData[] = [];
  assertionTypeData: AssertionTypeData[] = [];
  executionPerformanceData: ExecutionPerformanceData[] = [];
  cumulativeFailureData: CumulativeFailureData[] = [];
  projectDistributionData: ProjectDistributionData[] = [];

  // 🤖 Propiedades para el dashboard de Playwright
  playwrightGlobalStats: GlobalStats = {
    totalTests: 0,
    totalAssertions: 0,
    totalFails: 0,
    successRate: 0,
    lastExecution: new Date()
  };
  
  playwrightTopFailures: Array<{testName: string, count: number, percentage: number}> = [];
  playwrightTemporalData: TemporalData[] = [];
  playwrightTestDistribution: AssertionTypeData[] = [];
  playwrightExecutionPerformance: ExecutionPerformanceData[] = [];
  playwrightCumulativeFailures: CumulativeFailureData[] = [];
  playwrightSuiteDistribution: ProjectDistributionData[] = [];
  
  // Resultado seleccionado para modal
  selectedResult: PostmanResult | null = null;

  // Propiedades existentes para compatibilidad
  summary: PlaySummary | null = null;
  daily: PlayDaily[] = [];
  topFailures: PlayFailure[] = [];
  results: PlayResult[] = [];

  constructor(
    private playwrightService: PlaywrightService,
    private postmanService: PostmanService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.loadInitialData();
    this.setupSocketListeners();
  }

  ngAfterViewInit() {
    // Las gráficas se crearán cuando se seleccione un tipo de prueba
  }

  setupSocketListeners() {
    const socket = this.authService.getSocket();
    
    // Verificar conexión del socket
    
    socket.on('connect', () => {
      console.log('✅ Socket.IO conectado exitosamente');
    });
    
    socket.on('disconnect', () => {
      console.log('❌ Socket.IO desconectado');
    });
    
    socket.on('connect_error', (error: any) => {
      console.error('❌ Error de conexión Socket.IO:', error);
    });
    
    // �🔥 Escuchar eventos de progreso de Postman en tiempo real
    socket.on('postman:progress', (data: any) => {
      this.executionProgress.isExecuting = data.status !== 'completed';
      this.executionProgress.current = data.current;
      this.executionProgress.total = data.total;
      this.executionProgress.percentage = data.percentage;
      this.executionProgress.currentTest = data.currentTest;
      
      // Si el proceso está completado, refrescar resultados
      if (data.status === 'completed') {
        this.stopExecutionProgress();
        setTimeout(() => {
          this.refreshResults();
          this.loading = false;
        }, 1000);
      }
    });
    
  }

  async loadInitialData() {
    try {
      // 🔥 Cargar proyectos disponibles dinámicamente desde la BD
      await this.loadAvailableProjects();
      
      // Cargar estadísticas iniciales para cada proyecto
      await this.loadProjectStats();
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  }

  async loadAvailableProjects() {
    try {
      const projects = await this.playwrightService.getAvailableProjects().toPromise() || [];
      
      // Mapear proyectos con estilos personalizados
      this.availableProjects = projects.map(project => {
        const projectId = project.id.toLowerCase();
        const style = this.projectStyles[projectId] || this.projectStyles['default'];
        
        // Validar y convertir el status a los valores permitidos
        const validStatus: 'active' | 'maintenance' = 
          project.status === 'maintenance' ? 'maintenance' : 'active';
        
        return {
          ...project,
          status: validStatus,
          icon: style.icon,
          color: style.color,
          description: style.description,
          featured: projectId === 'yamaha' // Destacar Yamaha por defecto
        };
      });
      
    } catch (error) {
      console.error('❌ Error cargando proyectos disponibles:', error);
      this.availableProjects = [];
    }
  }

  async updateProjectInfo() {
    // Este método ya no es necesario porque los proyectos se cargan dinámicamente
    // con toda la información desde el backend
  }

  async loadProjectStats() {
    try {
      // Cargar estadísticas reales desde la API
      // Para cada proyecto, obtener estadísticas reales
      for (const project of this.availableProjects) {
        
        const projectName = project.name.toUpperCase().replace(/\s+/g, '');
        
        // Cargar estadísticas de pruebas de contrato
        try {
          const contractResponse = await this.postmanService.getContractResults(projectName).toPromise();
          const contractResults = contractResponse?.results || [];
          
          this.contractStats = {
            total: contractResults.length,
            passed: contractResults.filter((r: any) => r.status === 'PASS').length,
            failed: contractResults.filter((r: any) => r.status === 'FAIL').length,
            successRate: contractResults.length > 0 ? 
              Math.round((contractResults.filter((r: any) => r.status === 'PASS').length / contractResults.length) * 100) : 0
          };
          
        } catch (error) {
          console.warn(`Error cargando estadísticas de contrato para ${projectName}:`, error);
          this.contractStats = { total: 0, passed: 0, failed: 0, successRate: 0 };
        }

        // Cargar estadísticas de pruebas de respuesta controlada
        try {
          const responseResponse = await this.postmanService.getControlledResponseResults(projectName).toPromise();
          const responseResults = responseResponse?.results || [];
          
          this.responseStats = {
            total: responseResults.length,
            passed: responseResults.filter((r: any) => r.status === 'PASS').length,
            failed: responseResults.filter((r: any) => r.status === 'FAIL').length,
            successRate: responseResults.length > 0 ? 
              Math.round((responseResults.filter((r: any) => r.status === 'PASS').length / responseResults.length) * 100) : 0
          };
          
        } catch (error) {
          console.warn(`Error cargando estadísticas de respuesta para ${projectName}:`, error);
          this.responseStats = { total: 0, passed: 0, failed: 0, successRate: 0 };
        }

        // Cargar estadísticas de automatización (Playwright)
        try {
          const playwrightSummary = await this.playwrightService.getSummary().toPromise();
          
          this.automationStats = {
            total: playwrightSummary?.total || 0,
            passed: playwrightSummary?.passed || 0,
            failed: playwrightSummary?.failed || 0,
            successRate: playwrightSummary?.pass_rate || 0
          };
          
        } catch (error) {
          console.warn('Error cargando estadísticas de Playwright:', error);
          this.automationStats = { total: 0, passed: 0, failed: 0, successRate: 0 };
        }

        // Solo procesar el primer proyecto por ahora (Yamaha)
        break;
      }

    } catch (error) {
      console.error('Error cargando estadísticas del proyecto:', error);
      // Fallback a estadísticas vacías si falla todo
      this.contractStats = { total: 0, passed: 0, failed: 0, successRate: 0 };
      this.responseStats = { total: 0, passed: 0, failed: 0, successRate: 0 };
      this.automationStats = { total: 0, passed: 0, failed: 0, successRate: 0 };
    }
  }

  // ===== NAVEGACIÓN =====
  
  selectProject(project: ProjectInfo) {
    this.selectedProject = project;
    this.selectedTestType = null;
  }

  selectTestType(type: 'contract' | 'response' | 'automation') {
    this.selectedTestType = type;
    this.loadTestResults(type);
    
    // Configurar estadísticas actuales
    switch (type) {
      case 'contract':
        this.currentStats = { ...this.contractStats };
        break;
      case 'response':
        this.currentStats = { ...this.responseStats };
        break;
      case 'automation':
        this.currentStats = { ...this.automationStats };
        break;
    }
    
  }

  goBack() {
    this.selectedProject = null;
    this.selectedTestType = null;
  }

  goToProjects() {
    this.selectedProject = null;
    this.selectedTestType = null;
  }

  goToTestTypes() {
    this.selectedTestType = null;
  }

  // ===== CARGA DE DATOS =====

  async loadTestResults(testType: 'contract' | 'response' | 'automation') {
    this.loading = true;
    
    try {
      if (testType === 'contract' || testType === 'response') {
        await this.loadPostmanResults();
      } else if (testType === 'automation') {
        await this.loadPlaywrightResults();
      }
    } catch (error) {
      console.error('Error cargando resultados:', error);
    } finally {
      this.loading = false;
    }
  }

  async loadPostmanResults() {
    try {
      if (!this.selectedProject) {
        console.error('No hay proyecto seleccionado');
        return;
      }
      
      const projectName = this.selectedProject.name.toUpperCase();
      let results: any;
      
      if (this.selectedTestType === 'contract') {
        // Cargar solo resultados de pruebas de contrato
        const response = await this.postmanService.getContractResults(projectName).toPromise();
        results = response?.results || [];
      } else if (this.selectedTestType === 'response') {
        // Cargar solo resultados de respuesta controlada
        const response = await this.postmanService.getControlledResponseResults(projectName).toPromise();
        results = response?.results || [];
      } else {
        // Fallback a otros resultados
        const response = await this.postmanService.getOtherResponseResults(projectName).toPromise();
        results = response?.results || [];
      }
      
      // Transformar los resultados para mostrar en la tabla
      this.filteredPostmanResults = this.transformPostmanResults(results);
      this.applyFilters();
      
    } catch (error) {
      console.error('Error cargando resultados de Postman:', error);
    }
  }

  async loadPlaywrightResults() {
    try {
      if (!this.selectedProject) {
        console.error('No hay proyecto seleccionado para Playwright');
        return;
      }

      // El suite corresponde al nombre del proyecto en MAYÚSCULAS (como está en la BD)
      const suite = this.selectedProject.name.toUpperCase();
      
      // 🔥 Pasar el parámetro suite a TODOS los métodos para filtrar las gráficas
      this.summary = await this.playwrightService.getSummary(suite).toPromise() || null;
      this.daily = await this.playwrightService.getDaily(30, suite).toPromise() || [];
      this.topFailures = await this.playwrightService.getTopFailures(10, suite).toPromise() || [];
      
      // Cargar resultados filtrados por suite (proyecto)
      this.results = await this.playwrightService.getResults(200, suite).toPromise() || [];
      this.filteredPlaywrightResults = [...this.results];
      this.applyFilters();
      
      // Preparar datos para el dashboard de Playwright
      this.preparePlaywrightDashboardData();
      
    } catch (error) {
      console.error('Error cargando resultados de Playwright:', error);
    }
  }

  preparePlaywrightDashboardData() {
    // 1️⃣ Generar métricas globales
    this.generatePlaywrightGlobalStats();
    
    // 2️⃣-8️⃣ Generar datos para todas las gráficas
    this.generatePlaywrightTemporalData();
    this.generatePlaywrightTestDistribution();
    this.generatePlaywrightExecutionPerformance();
    this.generatePlaywrightTopFailures();
    this.generatePlaywrightCumulativeFailures();
    this.generatePlaywrightSuiteDistribution();
    
    // Crear gráficas después de un breve delay
    setTimeout(() => {
      this.createPlaywrightDashboardCharts();
    }, 100);
  }

  generatePlaywrightGlobalStats() {
    const totalTests = this.summary?.total || 0;
    const totalFails = this.summary?.failed || 0;
    const passRate = this.summary?.pass_rate || 0;
    
    let lastExecution = new Date(0);
    if (this.results.length > 0) {
      const dates = this.results.map(r => new Date(r.run_date));
      lastExecution = new Date(Math.max(...dates.map(d => d.getTime())));
    }

    this.playwrightGlobalStats = {
      totalTests,
      totalAssertions: totalTests,
      totalFails,
      successRate: Math.round(passRate),
      lastExecution
    };
  }

  generatePlaywrightTemporalData() {
    if (!this.daily || this.daily.length === 0) return;
    
    this.playwrightTemporalData = this.daily.map(day => ({
      date: day.day,
      passed: day.passed,
      failed: day.failed
    })).slice(-14); // Últimos 14 días
  }

  generatePlaywrightTestDistribution() {
    const testStats = new Map<string, { passed: number; failed: number }>();
    
    this.results.forEach(result => {
      const testName = result.test_name || 'Sin nombre';
      if (!testStats.has(testName)) {
        testStats.set(testName, { passed: 0, failed: 0 });
      }
      
      if (result.status === 'passed') {
        testStats.get(testName)!.passed++;
      } else if (result.status === 'failed') {
        testStats.get(testName)!.failed++;
      }
    });

    this.playwrightTestDistribution = Array.from(testStats.entries())
      .map(([name, stats]) => ({
        name: name.length > 30 ? name.substring(0, 30) + '...' : name,
        passed: stats.passed,
        failed: stats.failed
      }))
      .sort((a, b) => (b.passed + b.failed) - (a.passed + a.failed))
      .slice(0, 8); // Top 8
  }

  generatePlaywrightExecutionPerformance() {
    // Agrupar por fecha de ejecución
    const dateStats = new Map<string, { passed: number; failed: number; total: number }>();
    
    this.results.forEach(result => {
      const date = new Date(result.run_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' });
      if (!dateStats.has(date)) {
        dateStats.set(date, { passed: 0, failed: 0, total: 0 });
      }
      
      dateStats.get(date)!.total++;
      if (result.status === 'passed') {
        dateStats.get(date)!.passed++;
      } else if (result.status === 'failed') {
        dateStats.get(date)!.failed++;
      }
    });

    this.playwrightExecutionPerformance = Array.from(dateStats.entries())
      .map(([date, stats]) => ({
        id: date,
        name: `Ejecución ${date}`,
        successRate: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0,
        total: stats.total
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10); // Top 10
  }

  generatePlaywrightTopFailures() {
    if (!this.topFailures || this.topFailures.length === 0) return;
    
    const totalFailures = this.topFailures.reduce((sum, f) => sum + f.failures, 0);
    
    this.playwrightTopFailures = this.topFailures.map(failure => ({
      testName: failure.test_name,
      count: failure.failures,
      percentage: totalFailures > 0 ? Math.round((failure.failures / totalFailures) * 100) : 0
    })).slice(0, 10);
  }

  generatePlaywrightCumulativeFailures() {
    if (!this.daily || this.daily.length === 0) return;
    
    let cumulativeFails = 0;
    this.playwrightCumulativeFailures = this.daily
      .sort((a, b) => a.day.localeCompare(b.day))
      .map(day => {
        cumulativeFails += day.failed;
        return {
          date: day.day,
          cumulativeFails
        };
      })
      .slice(-30); // Últimos 30 días
  }

  generatePlaywrightSuiteDistribution() {
    // Agrupar tests por suite (usando prefijo del test_name)
    const suiteStats = new Map<string, { passed: number; failed: number }>();
    
    this.results.forEach(result => {
      // Extraer el nombre de la suite (primer segmento antes de ›)
      const suiteName = result.test_name.split('›')[0].trim() || 'General';
      
      if (!suiteStats.has(suiteName)) {
        suiteStats.set(suiteName, { passed: 0, failed: 0 });
      }
      
      if (result.status === 'passed') {
        suiteStats.get(suiteName)!.passed++;
      } else if (result.status === 'failed') {
        suiteStats.get(suiteName)!.failed++;
      }
    });

    this.playwrightSuiteDistribution = Array.from(suiteStats.entries())
      .map(([suite, stats]) => ({
        project: suite,
        assertionType: suite,
        passed: stats.passed,
        failed: stats.failed
      }))
      .sort((a, b) => (b.passed + b.failed) - (a.passed + a.failed))
      .slice(0, 10);
  }

  // ===== TRANSFORMACIÓN DE DATOS =====

  transformPostmanResults(results: any[]): any[] {
    const transformed = results.map(result => {
      // Extraer la primera assertion para mostrar en la tabla
      let assertionInfo = { assertion_name: '', error_message: '' };
      
      if (result.contract_assertions && result.contract_assertions.length > 0) {
        const firstAssertion = result.contract_assertions[0];
        assertionInfo = {
          assertion_name: firstAssertion.assertion_name,
          error_message: firstAssertion.error_message || ''
        };
      } else if (result.controlled_response_assertions && result.controlled_response_assertions.length > 0) {
        const firstAssertion = result.controlled_response_assertions[0];
        assertionInfo = {
          assertion_name: firstAssertion.assertion_name,
          error_message: firstAssertion.error_message || ''
        };
      } else if (result.response_assertions && result.response_assertions.length > 0) {
        const firstAssertion = result.response_assertions[0];
        assertionInfo = {
          assertion_name: firstAssertion.assertion_name,
          error_message: firstAssertion.error_message || ''
        };
      }

      return {
        ...result,
        ...assertionInfo
      };
    });

    // Preparar datos para gráficas
    this.prepareChartData(results);
    
    return transformed;
  }

  prepareChartData(results: any[]) {
    // 1️⃣ Generar métricas globales
    this.generateGlobalStats(results);
    
    // 2️⃣ Generar resumen de assertions (para pie chart)
    this.generateAssertionsSummary(results);
    
    // 3️⃣ Generar datos temporales
    this.generateTemporalData(results);
    
    // 4️⃣ Generar datos por tipo de aserción
    this.generateAssertionTypeData(results);
    
    // 5️⃣ Generar datos de rendimiento por ejecución
    this.generateExecutionPerformanceData(results);
    
    // 6️⃣ Generar top errores frecuentes
    this.generateTopErrors(results);
    
    // 🔥 Generar top requests fallidos
    this.generateTopFailedRequests(results);
    
    // 📅 Extraer resultados de la última ejecución
    this.extractLastExecutionResults(results);
    
    // 7️⃣ Generar datos de fallas acumuladas
    this.generateCumulativeFailureData(results);
    
    // 8️⃣ Generar distribución por proyecto/entorno
    this.generateProjectDistributionData(results);
    
    // Crear gráficas después de un breve delay para asegurar que el DOM esté listo
    setTimeout(() => {
      this.createDashboardCharts();
    }, 100);
  }

  generateGlobalStats(results: any[]) {
    let totalTests = results.length;
    let totalAssertions = 0;
    let totalFails = 0;
    let lastExecution = new Date(0);

    results.forEach(result => {
      const assertions = result.contract_assertions || result.controlled_response_assertions || result.response_assertions || [];
      totalAssertions += assertions.length;
      
      assertions.forEach((assertion: any) => {
        if (assertion.assertion_status === 'FAIL') {
          totalFails++;
        }
      });

      const resultDate = new Date(result.created_at);
      if (resultDate > lastExecution) {
        lastExecution = resultDate;
      }
    });

    this.globalStats = {
      totalTests,
      totalAssertions,
      totalFails,
      successRate: totalAssertions > 0 ? Math.round(((totalAssertions - totalFails) / totalAssertions) * 100) : 0,
      lastExecution
    };
  }

  generateTemporalData(results: any[]) {
    const dailyData = new Map<string, { passed: number; failed: number }>();
    
    results.forEach(result => {
      const date = new Date(result.created_at).toISOString().split('T')[0];
      const assertions = result.contract_assertions || result.controlled_response_assertions || result.response_assertions || [];
      
      if (!dailyData.has(date)) {
        dailyData.set(date, { passed: 0, failed: 0 });
      }
      
      assertions.forEach((assertion: any) => {
        if (assertion.assertion_status === 'PASS') {
          dailyData.get(date)!.passed++;
        } else {
          dailyData.get(date)!.failed++;
        }
      });
    });

    this.temporalData = Array.from(dailyData.entries())
      .map(([date, stats]) => ({
        date,
        passed: stats.passed,
        failed: stats.failed
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // Últimos 14 días
  }

  generateAssertionTypeData(results: any[]) {
    const typeData = new Map<string, { passed: number; failed: number }>();
    
    results.forEach(result => {
      const assertions = result.contract_assertions || result.controlled_response_assertions || result.response_assertions || [];
      
      assertions.forEach((assertion: any) => {
        const type = assertion.assertion_name || 'Sin tipo';
        if (!typeData.has(type)) {
          typeData.set(type, { passed: 0, failed: 0 });
        }
        
        if (assertion.assertion_status === 'PASS') {
          typeData.get(type)!.passed++;
        } else {
          typeData.get(type)!.failed++;
        }
      });
    });

    this.assertionTypeData = Array.from(typeData.entries())
      .map(([name, stats]) => ({
        name: name.length > 30 ? name.substring(0, 30) + '...' : name,
        passed: stats.passed,
        failed: stats.failed
      }))
      .sort((a, b) => (b.passed + b.failed) - (a.passed + a.failed))
      .slice(0, 8); // Top 8
  }

  generateExecutionPerformanceData(results: any[]) {
    const executionData = new Map<string, { passed: number; failed: number; total: number }>();
    
    results.forEach(result => {
      const executionId = result.postman_result_id || result.id || 'Unknown';
      const assertions = result.contract_assertions || result.controlled_response_assertions || result.response_assertions || [];
      
      if (!executionData.has(executionId)) {
        executionData.set(executionId, { passed: 0, failed: 0, total: 0 });
      }
      
      assertions.forEach((assertion: any) => {
        executionData.get(executionId)!.total++;
        if (assertion.assertion_status === 'PASS') {
          executionData.get(executionId)!.passed++;
        } else {
          executionData.get(executionId)!.failed++;
        }
      });
    });

    this.executionPerformanceData = Array.from(executionData.entries())
      .map(([id, stats]) => ({
        id,
        name: `Ejecución ${id}`,
        successRate: stats.total > 0 ? Math.round((stats.passed / stats.total) * 100) : 0,
        total: stats.total
      }))
      .sort((a, b) => b.successRate - a.successRate)
      .slice(0, 10); // Top 10
  }

  generateTopErrors(results: any[]) {
    const errorCounts = new Map<string, number>();
    let totalErrors = 0;
    
    results.forEach(result => {
      const assertions = result.contract_assertions || result.controlled_response_assertions || result.response_assertions || [];
      
      assertions.forEach((assertion: any) => {
        if (assertion.assertion_status === 'FAIL' && assertion.error_message) {
          const error = assertion.error_message.substring(0, 100); // Limitar longitud
          errorCounts.set(error, (errorCounts.get(error) || 0) + 1);
          totalErrors++;
        }
      });
    });

    this.topErrors = Array.from(errorCounts.entries())
      .map(([message, count]) => ({
        message,
        count,
        percentage: totalErrors > 0 ? Math.round((count / totalErrors) * 100) : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 errores
  }

  generateTopFailedRequests(results: any[]) {
    const requestStats = new Map<string, {failCount: number, totalCount: number}>();
    
    results.forEach(result => {
      const requestName = result.test_name;
      const assertions = result.contract_assertions || result.controlled_response_assertions || result.response_assertions || [];
      
      if (!requestStats.has(requestName)) {
        requestStats.set(requestName, { failCount: 0, totalCount: 0 });
      }
      
      const stats = requestStats.get(requestName)!;
      stats.totalCount++;
      
      // Contar si el request tiene alguna aserción fallida
      const hasFails = assertions.some((assertion: any) => assertion.assertion_status === 'FAIL');
      if (hasFails) {
        stats.failCount++;
      }
    });

    this.topFailedRequests = Array.from(requestStats.entries())
      .map(([requestName, stats]) => ({
        requestName,
        failCount: stats.failCount,
        totalCount: stats.totalCount,
        failRate: stats.totalCount > 0 ? Math.round((stats.failCount / stats.totalCount) * 100) : 0
      }))
      .filter(item => item.failCount > 0) // Solo mostrar los que tienen fallas
      .sort((a, b) => b.failCount - a.failCount)
      .slice(0, 15); // Top 15 requests más fallidos
  }

  extractLastExecutionResults(results: any[]) {
    if (results.length === 0) {
      this.lastExecutionResults = [];
      this.lastExecutionDate = null;
      return;
    }

    // Encontrar la fecha más reciente
    const dates = results.map(r => new Date(r.created_at).getTime());
    const latestTimestamp = Math.max(...dates);
    this.lastExecutionDate = new Date(latestTimestamp);

    // Crear un rango de tiempo de 5 minutos desde la última fecha
    // (asumiendo que una ejecución completa toma máximo 5 minutos)
    const timeWindow = 5 * 60 * 1000; // 5 minutos en milisegundos
    const earliestTimestamp = latestTimestamp - timeWindow;

    // Filtrar resultados dentro de esta ventana de tiempo
    this.lastExecutionResults = results
      .filter(result => {
        const resultTime = new Date(result.created_at).getTime();
        return resultTime >= earliestTimestamp && resultTime <= latestTimestamp;
      })
      .map(result => {
        const assertions = result.contract_assertions || result.controlled_response_assertions || result.response_assertions || [];
        return {
          ...result,
          assertion_name: assertions[0]?.assertion_name || 'N/A',
          error_message: assertions.find((a: any) => a.assertion_status === 'FAIL')?.error_message || null
        };
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  generateCumulativeFailureData(results: any[]) {
    const dailyFails = new Map<string, number>();
    
    results.forEach(result => {
      const date = new Date(result.created_at).toISOString().split('T')[0];
      const assertions = result.contract_assertions || result.controlled_response_assertions || result.response_assertions || [];
      
      let dayFails = 0;
      assertions.forEach((assertion: any) => {
        if (assertion.assertion_status === 'FAIL') {
          dayFails++;
        }
      });
      
      dailyFails.set(date, (dailyFails.get(date) || 0) + dayFails);
    });

    let cumulativeFails = 0;
    this.cumulativeFailureData = Array.from(dailyFails.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, dayFails]) => {
        cumulativeFails += dayFails;
        return {
          date,
          cumulativeFails
        };
      })
      .slice(-30); // Últimos 30 días
  }

  generateProjectDistributionData(results: any[]) {
    // Para este ejemplo, asumimos que estamos en el proyecto seleccionado
    // En una implementación real, esto vendría de múltiples proyectos
    const distributionData: ProjectDistributionData[] = [];
    
    if (this.selectedProject) {
      const contractData = this.assertionTypeData.slice(0, 5); // Top 5 assertions
      
      contractData.forEach(assertion => {
        distributionData.push({
          project: this.selectedProject!.name,
          assertionType: assertion.name,
          passed: assertion.passed,
          failed: assertion.failed
        });
      });
    }
    
    this.projectDistributionData = distributionData;
  }

  generateAssertionsSummary(results: any[]) {
    const assertionsMap = new Map<string, { passed: number; failed: number }>();
    
    results.forEach(result => {
      const assertions = result.contract_assertions || result.controlled_response_assertions || result.response_assertions || [];
      
      assertions.forEach((assertion: any) => {
        const name = assertion.assertion_name;
        if (!assertionsMap.has(name)) {
          assertionsMap.set(name, { passed: 0, failed: 0 });
        }
        
        if (assertion.assertion_status === 'PASS') {
          assertionsMap.get(name)!.passed++;
        } else {
          assertionsMap.get(name)!.failed++;
        }
      });
    });

    this.topAssertions = Array.from(assertionsMap.entries())
      .map(([name, stats]) => ({
        name,
        passed: stats.passed,
        failed: stats.failed,
        total: stats.passed + stats.failed,
        successRate: stats.passed + stats.failed > 0 ? Math.round((stats.passed / (stats.passed + stats.failed)) * 100) : 0
      }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5); // Top 5
  }

  // ===== FUNCIONES DE GRÁFICAS DEL DASHBOARD =====

  createDashboardCharts() {
    if (this.selectedTestType === 'contract' || this.selectedTestType === 'response') {
      this.createDashboardPostmanCharts();
    } else if (this.selectedTestType === 'automation') {
      this.createPlaywrightDashboardCharts();
    }
  }

  createPlaywrightDashboardCharts() {
    // 2️⃣ Estado General - Pie Chart
    this.createPlaywrightGeneralStatusChart();
    
    // 3️⃣ Tendencia Temporal - Line Chart
    this.createPlaywrightTemporalTrendChart();
    
    // 4️⃣ Por Test - Grouped Bar Chart
    this.createPlaywrightTestDistributionChart();
    
    // 5️⃣ Rendimiento por Ejecución - Horizontal Bar Chart
    this.createPlaywrightExecutionPerformanceChart();
    
    // 7️⃣ Fallas Acumuladas - Area Chart
    this.createPlaywrightCumulativeFailuresChart();
    
    // 8️⃣ Distribución por Suite - Stacked Bar Chart
    this.createPlaywrightSuiteDistributionChart();
  }

  createPlaywrightGeneralStatusChart() {
    if (!this.playwrightGeneralStatusChart?.nativeElement) return;

    const ctx = this.playwrightGeneralStatusChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.playwrightGeneralStatusChartInstance) {
      this.playwrightGeneralStatusChartInstance.destroy();
    }

    const passed = this.summary?.passed || 0;
    const failed = this.summary?.failed || 0;
    const skipped = this.summary?.skipped || 0;

    this.playwrightGeneralStatusChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Pasaron', 'Fallaron', 'Omitidos'],
        datasets: [{
          data: [passed, failed, skipped],
          backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
          borderColor: ['#ffffff', '#ffffff', '#ffffff'],
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        cutout: '60%'
      }
    });
  }

  createPlaywrightTemporalTrendChart() {
    if (!this.playwrightTemporalTrendChart?.nativeElement || this.playwrightTemporalData.length === 0) return;

    const ctx = this.playwrightTemporalTrendChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.playwrightTemporalTrendChartInstance) {
      this.playwrightTemporalTrendChartInstance.destroy();
    }

    this.playwrightTemporalTrendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.playwrightTemporalData.map(d => new Date(d.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Pasaron',
          data: this.playwrightTemporalData.map(d => d.passed),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: true,
          tension: 0.4
        }, {
          label: 'Fallaron',
          data: this.playwrightTemporalData.map(d => d.failed),
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createPlaywrightTestDistributionChart() {
    if (!this.playwrightTestDistributionChart?.nativeElement || this.playwrightTestDistribution.length === 0) return;

    const ctx = this.playwrightTestDistributionChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.playwrightTestDistributionChartInstance) {
      this.playwrightTestDistributionChartInstance.destroy();
    }

    this.playwrightTestDistributionChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.playwrightTestDistribution.map(d => d.name),
        datasets: [{
          label: 'Pasaron',
          data: this.playwrightTestDistribution.map(d => d.passed),
          backgroundColor: '#28a745',
          borderColor: '#28a745',
          borderWidth: 1
        }, {
          label: 'Fallaron',
          data: this.playwrightTestDistribution.map(d => d.failed),
          backgroundColor: '#dc3545',
          borderColor: '#dc3545',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            stacked: false
          },
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createPlaywrightExecutionPerformanceChart() {
    if (!this.playwrightExecutionPerformanceChart?.nativeElement || this.playwrightExecutionPerformance.length === 0) return;

    const ctx = this.playwrightExecutionPerformanceChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.playwrightExecutionPerformanceChartInstance) {
      this.playwrightExecutionPerformanceChartInstance.destroy();
    }

    this.playwrightExecutionPerformanceChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.playwrightExecutionPerformance.map(d => d.name),
        datasets: [{
          label: '% Éxito',
          data: this.playwrightExecutionPerformance.map(d => d.successRate),
          backgroundColor: this.playwrightExecutionPerformance.map(d => d.successRate > 80 ? '#28a745' : d.successRate > 60 ? '#ffc107' : '#dc3545'),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  createPlaywrightCumulativeFailuresChart() {
    if (!this.playwrightCumulativeFailuresChart?.nativeElement || this.playwrightCumulativeFailures.length === 0) return;

    const ctx = this.playwrightCumulativeFailuresChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.playwrightCumulativeFailuresChartInstance) {
      this.playwrightCumulativeFailuresChartInstance.destroy();
    }

    this.playwrightCumulativeFailuresChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.playwrightCumulativeFailures.map(d => new Date(d.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Fallas Acumuladas',
          data: this.playwrightCumulativeFailures.map(d => d.cumulativeFails),
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.2)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createPlaywrightSuiteDistributionChart() {
    if (!this.playwrightSuiteDistributionChart?.nativeElement || this.playwrightSuiteDistribution.length === 0) return;

    const ctx = this.playwrightSuiteDistributionChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.playwrightSuiteDistributionChartInstance) {
      this.playwrightSuiteDistributionChartInstance.destroy();
    }

    const labels = this.playwrightSuiteDistribution.map(d => d.project);

    this.playwrightSuiteDistributionChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Pasaron',
          data: this.playwrightSuiteDistribution.map(d => d.passed),
          backgroundColor: '#28a745',
          borderWidth: 1
        }, {
          label: 'Fallaron',
          data: this.playwrightSuiteDistribution.map(d => d.failed),
          backgroundColor: '#dc3545',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            beginAtZero: true
          }
        }
      }
    });
  }

  createDashboardPostmanCharts() {
    // 2️⃣ Estado General - Pie Chart
    this.createGeneralStatusChart();
    
    // 3️⃣ Tendencia Temporal - Line Chart
    this.createTemporalTrendChart();
    
    // 4️⃣ Por Tipo de Aserción - Grouped Bar Chart
    this.createAssertionTypeChart();
    
    // 5️⃣ Rendimiento por Ejecución - Horizontal Bar Chart
    this.createExecutionPerformanceChart();
    
    // 7️⃣ Fallas Acumuladas - Area Chart
    this.createCumulativeFailuresChart();
    
    // 8️⃣ Distribución por Proyecto - Stacked Bar Chart
    this.createProjectDistributionChart();
  }

  createGeneralStatusChart() {
    if (!this.generalStatusChart?.nativeElement) return;

    const ctx = this.generalStatusChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.generalStatusChartInstance) {
      this.generalStatusChartInstance.destroy();
    }

    const passedAssertions = this.globalStats.totalAssertions - this.globalStats.totalFails;

    this.generalStatusChartInstance = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Exitosas', 'Fallidas'],
        datasets: [{
          data: [passedAssertions, this.globalStats.totalFails],
          backgroundColor: ['#28a745', '#dc3545'],
          borderColor: ['#ffffff', '#ffffff'],
          borderWidth: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        },
        cutout: '60%'
      }
    });
  }

  createTemporalTrendChart() {
    if (!this.temporalTrendChart?.nativeElement || this.temporalData.length === 0) return;

    const ctx = this.temporalTrendChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.temporalTrendChartInstance) {
      this.temporalTrendChartInstance.destroy();
    }

    this.temporalTrendChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.temporalData.map(d => new Date(d.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Exitosas',
          data: this.temporalData.map(d => d.passed),
          borderColor: '#28a745',
          backgroundColor: 'rgba(40, 167, 69, 0.1)',
          fill: true,
          tension: 0.4
        }, {
          label: 'Fallidas',
          data: this.temporalData.map(d => d.failed),
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createAssertionTypeChart() {
    if (!this.assertionTypeChart?.nativeElement || this.assertionTypeData.length === 0) return;

    const ctx = this.assertionTypeChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.assertionTypeChartInstance) {
      this.assertionTypeChartInstance.destroy();
    }

    this.assertionTypeChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.assertionTypeData.map(d => d.name),
        datasets: [{
          label: 'Exitosas',
          data: this.assertionTypeData.map(d => d.passed),
          backgroundColor: '#28a745',
          borderColor: '#28a745',
          borderWidth: 1
        }, {
          label: 'Fallidas',
          data: this.assertionTypeData.map(d => d.failed),
          backgroundColor: '#dc3545',
          borderColor: '#dc3545',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            stacked: false
          },
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createExecutionPerformanceChart() {
    if (!this.executionPerformanceChart?.nativeElement || this.executionPerformanceData.length === 0) return;

    const ctx = this.executionPerformanceChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.executionPerformanceChartInstance) {
      this.executionPerformanceChartInstance.destroy();
    }

    this.executionPerformanceChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: this.executionPerformanceData.map(d => d.name),
        datasets: [{
          label: '% Éxito',
          data: this.executionPerformanceData.map(d => d.successRate),
          backgroundColor: this.executionPerformanceData.map(d => d.successRate > 80 ? '#28a745' : d.successRate > 60 ? '#ffc107' : '#dc3545'),
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y', // Barras horizontales
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            max: 100
          }
        }
      }
    });
  }

  createCumulativeFailuresChart() {
    if (!this.cumulativeFailuresChart?.nativeElement || this.cumulativeFailureData.length === 0) return;

    const ctx = this.cumulativeFailuresChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.cumulativeFailuresChartInstance) {
      this.cumulativeFailuresChartInstance.destroy();
    }

    this.cumulativeFailuresChartInstance = new Chart(ctx, {
      type: 'line',
      data: {
        labels: this.cumulativeFailureData.map(d => new Date(d.date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })),
        datasets: [{
          label: 'Fallas Acumuladas',
          data: this.cumulativeFailureData.map(d => d.cumulativeFails),
          borderColor: '#dc3545',
          backgroundColor: 'rgba(220, 53, 69, 0.2)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createProjectDistributionChart() {
    if (!this.projectDistributionChart?.nativeElement || this.projectDistributionData.length === 0) return;

    const ctx = this.projectDistributionChart.nativeElement.getContext('2d');
    if (!ctx) return;

    if (this.projectDistributionChartInstance) {
      this.projectDistributionChartInstance.destroy();
    }

    const labels = [...new Set(this.projectDistributionData.map(d => d.assertionType))];

    this.projectDistributionChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Exitosas',
          data: labels.map(label => {
            const item = this.projectDistributionData.find(d => d.assertionType === label);
            return item ? item.passed : 0;
          }),
          backgroundColor: '#28a745',
          borderWidth: 1
        }, {
          label: 'Fallidas',
          data: labels.map(label => {
            const item = this.projectDistributionData.find(d => d.assertionType === label);
            return item ? item.failed : 0;
          }),
          backgroundColor: '#dc3545',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          x: {
            stacked: true
          },
          y: {
            stacked: true,
            beginAtZero: true
          }
        }
      }
    });
  }

  createPlaywrightCharts() {
    this.createPlaywrightPieChart();
    this.createDailyChart();
    if (this.topFailures.length > 0) {
      this.createFailuresChart();
    }
  }

  createPieChart() {
    if (!this.pieChart?.nativeElement) return;

    const ctx = this.pieChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // Limpiar gráfica anterior
    if (this.pieChartInstance) {
      this.pieChartInstance.destroy();
    }

    const data = {
      labels: ['Exitosas', 'Fallidas'],
      datasets: [{
        data: [this.currentStats.passed, this.currentStats.failed],
        backgroundColor: ['#28a745', '#dc3545'],
        borderColor: ['#ffffff', '#ffffff'],
        borderWidth: 2
      }]
    };

    this.pieChartInstance = new Chart(ctx, {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          },
          title: {
            display: false
          }
        }
      }
    });
  }

  createBarChart() {
    if (!this.barChart?.nativeElement) return;

    const ctx = this.barChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // Limpiar gráfica anterior
    if (this.barChartInstance) {
      this.barChartInstance.destroy();
    }

    const data = {
      labels: ['Exitosas', 'Fallidas'],
      datasets: [{
        label: 'Pruebas',
        data: [this.currentStats.passed, this.currentStats.failed],
        backgroundColor: ['#28a745', '#dc3545'],
        borderColor: ['#28a745', '#dc3545'],
        borderWidth: 1
      }]
    };

    this.barChartInstance = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }

  createPlaywrightPieChart() {
    if (!this.playwrightPieChart?.nativeElement || !this.summary) return;

    const ctx = this.playwrightPieChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // Limpiar gráfica anterior
    if (this.playwrightPieChartInstance) {
      this.playwrightPieChartInstance.destroy();
    }

    const data = {
      labels: ['Pasaron', 'Fallaron', 'Omitidos'],
      datasets: [{
        data: [this.summary.passed, this.summary.failed, this.summary.skipped],
        backgroundColor: ['#28a745', '#dc3545', '#ffc107'],
        borderColor: ['#ffffff', '#ffffff', '#ffffff'],
        borderWidth: 2
      }]
    };

    this.playwrightPieChartInstance = new Chart(ctx, {
      type: 'pie',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    });
  }

  createDailyChart() {
    if (!this.dailyChart?.nativeElement || this.daily.length === 0) return;

    const ctx = this.dailyChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // Limpiar gráfica anterior
    if (this.dailyChartInstance) {
      this.dailyChartInstance.destroy();
    }

    const data = {
      labels: this.daily.map(d => d.day),
      datasets: [{
        label: 'Pasaron',
        data: this.daily.map(d => d.passed),
        borderColor: '#28a745',
        backgroundColor: 'rgba(40, 167, 69, 0.1)',
        fill: true
      }, {
        label: 'Fallaron',
        data: this.daily.map(d => d.failed),
        borderColor: '#dc3545',
        backgroundColor: 'rgba(220, 53, 69, 0.1)',
        fill: true
      }]
    };

    this.dailyChartInstance = new Chart(ctx, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createFailuresChart() {
    if (!this.failuresChart?.nativeElement || this.topFailures.length === 0) return;

    const ctx = this.failuresChart.nativeElement.getContext('2d');
    if (!ctx) return;

    // Limpiar gráfica anterior
    if (this.failuresChartInstance) {
      this.failuresChartInstance.destroy();
    }

    const data = {
      labels: this.topFailures.map(f => f.test_name.substring(0, 20) + '...'),
      datasets: [{
        label: 'Fallos',
        data: this.topFailures.map(f => f.failures),
        backgroundColor: '#dc3545',
        borderColor: '#dc3545',
        borderWidth: 1
      }]
    };

    this.failuresChartInstance = new Chart(ctx, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        indexAxis: 'y', // Barras horizontales
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          x: {
            beginAtZero: true
          }
        }
      }
    });
  }

  // ===== FILTROS Y BÚSQUEDAS =====

  applyFilters() {
    if (this.selectedTestType === 'contract' || this.selectedTestType === 'response') {
      this.filteredPostmanResults = this.filteredPostmanResults.filter(result => {
        const matchesStatus = !this.statusFilter || result.status === this.statusFilter;
        const matchesSearch = !this.searchFilter || 
          result.test_name.toLowerCase().includes(this.searchFilter.toLowerCase());
        return matchesStatus && matchesSearch;
      });
    } else if (this.selectedTestType === 'automation') {
      this.filteredPlaywrightResults = this.results.filter(result => {
        const matchesStatus = !this.statusFilter || result.status === this.statusFilter;
        const matchesSearch = !this.searchFilter || 
          result.test_name.toLowerCase().includes(this.searchFilter.toLowerCase());
        return matchesStatus && matchesSearch;
      });
    }
  }

  // ===== ACCIONES =====

  async executeTests() {
    if (!this.selectedProject) return;
    
    this.startExecutionProgress();
    
    try {
      if (this.selectedTestType === 'contract' || this.selectedTestType === 'response') {
        // 🔥 Ya NO simulamos progreso - se recibirá en tiempo real vía Socket.IO
        // Ejecutar pruebas de Postman (esto puede tardar varios minutos)
        this.postmanService.runWithRetry({
          projectName: this.selectedProject.name.toUpperCase(),
          maxRetries: 2
        }).then(response => {
          // El progreso se actualizará vía Socket.IO automáticamente
        }).catch(err => {
          console.error('❌ Error iniciando ejecución:', err);
          this.stopExecutionProgress();
          this.loading = false;
          alert('Error al iniciar las pruebas. Revisa la consola para más detalles.');
        });
        
      } else if (this.selectedTestType === 'automation') {
        // Ejecutar pruebas de Playwright
        alert('Funcionalidad de ejecución de Playwright en desarrollo');
        this.stopExecutionProgress();
        this.loading = false;
      }
    } catch (error) {
      console.error('Error ejecutando pruebas:', error);
      alert('Error al ejecutar las pruebas. Revisa la consola para más detalles.');
      this.stopExecutionProgress();
      this.loading = false;
    }
  }

  startExecutionProgress() {
    this.executionProgress = {
      isExecuting: true,
      current: 0,
      total: 0, // 🔥 Se actualizará con el valor real desde Socket.IO
      percentage: 0,
      currentTest: 'Conectando con el servidor...',
      timeRemaining: 'Calculando...',
      elapsedTime: '0s',
      avgTestTime: '0s',
      startTime: Date.now()
    };
  }

  stopExecutionProgress() {
    this.executionProgress.isExecuting = false;
    this.executionProgress.percentage = 100;
    this.executionProgress.currentTest = 'Completado';
    
    if (this.progressCheckInterval) {
      clearInterval(this.progressCheckInterval);
      this.progressCheckInterval = null;
    }
  }

  // 🔥 MÉTODO DEPRECADO - El progreso ahora viene en tiempo real vía Socket.IO
  // Ya no es necesario simular el progreso basado en tiempo

  formatTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      return `${hours}h ${mins}m`;
    }
  }

  async refreshResults() {
    if (this.selectedTestType) {
      await this.loadTestResults(this.selectedTestType);
    }
  }

  exportResults() {
    if (this.selectedTestType === 'contract' || this.selectedTestType === 'response') {
      this.exportPostmanResults();
    } else if (this.selectedTestType === 'automation') {
      this.exportPlaywrightResults();
    }
  }

  exportPostmanResults() {
    const csvData = this.convertPostmanToCSV(this.filteredPostmanResults);
    this.downloadCSV(csvData, `${this.selectedProject?.name}_${this.selectedTestType}_results.csv`);
  }

  exportPlaywrightResults() {
    const csvData = this.convertPlaywrightToCSV(this.filteredPlaywrightResults);
    this.downloadCSV(csvData, `${this.selectedProject?.name}_automation_results.csv`);
  }

  // ===== UTILIDADES =====

  getStatusLabel(status: string): string {
    switch (status) {
      case 'active': return 'Activo';
      case 'maintenance': return 'Mantenimiento';
      default: return status;
    }
  }

  getTestTypeTitle(): string {
    switch (this.selectedTestType) {
      case 'contract': return 'Pruebas de Contrato';
      case 'response': return 'Respuesta Controlada';
      case 'automation': return 'Ticket Automático';
      default: return '';
    }
  }

  getTestTypeDescription(): string {
    switch (this.selectedTestType) {
      case 'contract': return 'Validación de contratos API y estructura de respuestas';
      case 'response': return 'Verificación de códigos de estado y tiempo de respuesta';
      case 'automation': return 'Creación y procesamiento automático de tickets';
      default: return '';
    }
  }

  getTestTypeIcon(): string {
    switch (this.selectedTestType) {
      case 'contract': return 'fas fa-file-contract';
      case 'response': return 'fas fa-check-circle';
      case 'automation': return 'fas fa-robot';
      default: return 'fas fa-vial';
    }
  }

  getTestTypeIconClass(): string {
    switch (this.selectedTestType) {
      case 'contract': return 'contract-tests';
      case 'response': return 'response-tests';
      case 'automation': return 'automation-tests';
      default: return '';
    }
  }

  // ===== MODALES Y DETALLES =====

  viewAssertionDetails(result: PostmanResultExtended) {
    this.selectedResult = result;
    // Abrir modal (se puede usar Bootstrap modal o similar)
  }

  viewPlaywrightDetails(result: PlayResult) {
    // Implementar modal para detalles de Playwright
  }

  // ===== FUNCIONES DE EXPORTACIÓN =====

  convertPostmanToCSV(results: PostmanResultExtended[]): string {
    const headers = ['Nombre', 'Estado HTTP', 'Tiempo (ms)', 'Estado', 'Assertion', 'Error'];
    const rows = results.map(result => [
      result.test_name,
      result.http_code?.toString() || '',
      result.response_time?.toString() || '',
      result.status,
      result.assertion_name || '',
      result.error_message || ''
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  convertPlaywrightToCSV(results: PlayResult[]): string {
    const headers = ['Suite', 'Nombre del Test', 'Estado', 'Duración (ms)', 'Fecha'];
    const rows = results.map(result => [
      result.suite || '',
      result.test_name,
      result.status,
      result.duration_ms?.toString() || '',
      result.run_date || ''
    ]);

    return [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
  }

  downloadCSV(csvData: string, filename: string) {
    const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  // ===== FUNCIONES LEGACY PARA COMPATIBILIDAD =====

  refresh() {
    this.refreshResults();
  }

  exportData() {
    this.exportResults();
  }

  ngOnDestroy() {
    // Limpiar intervalo de progreso
    if (this.progressCheckInterval) {
      clearInterval(this.progressCheckInterval);
    }
    
    // Limpiar instancias de Chart.js para evitar memory leaks
    if (this.pieChartInstance) {
      this.pieChartInstance.destroy();
    }
    if (this.barChartInstance) {
      this.barChartInstance.destroy();
    }
    if (this.lineChartInstance) {
      this.lineChartInstance.destroy();
    }
    if (this.playwrightPieChartInstance) {
      this.playwrightPieChartInstance.destroy();
    }
    if (this.dailyChartInstance) {
      this.dailyChartInstance.destroy();
    }
    if (this.failuresChartInstance) {
      this.failuresChartInstance.destroy();
    }
    
    // 📊 Limpiar nuevas instancias del dashboard
    if (this.generalStatusChartInstance) {
      this.generalStatusChartInstance.destroy();
    }
    if (this.temporalTrendChartInstance) {
      this.temporalTrendChartInstance.destroy();
    }
    if (this.assertionTypeChartInstance) {
      this.assertionTypeChartInstance.destroy();
    }
    if (this.executionPerformanceChartInstance) {
      this.executionPerformanceChartInstance.destroy();
    }
    if (this.cumulativeFailuresChartInstance) {
      this.cumulativeFailuresChartInstance.destroy();
    }
    if (this.projectDistributionChartInstance) {
      this.projectDistributionChartInstance.destroy();
    }

    // 🤖 Limpiar instancias del dashboard de Playwright
    if (this.playwrightGeneralStatusChartInstance) {
      this.playwrightGeneralStatusChartInstance.destroy();
    }
    if (this.playwrightTemporalTrendChartInstance) {
      this.playwrightTemporalTrendChartInstance.destroy();
    }
    if (this.playwrightTestDistributionChartInstance) {
      this.playwrightTestDistributionChartInstance.destroy();
    }
    if (this.playwrightExecutionPerformanceChartInstance) {
      this.playwrightExecutionPerformanceChartInstance.destroy();
    }
    if (this.playwrightCumulativeFailuresChartInstance) {
      this.playwrightCumulativeFailuresChartInstance.destroy();
    }
    if (this.playwrightSuiteDistributionChartInstance) {
      this.playwrightSuiteDistributionChartInstance.destroy();
    }
  }

  // Métodos getter para conteos de última ejecución
  get lastExecutionPassedCount(): number {
    return this.lastExecutionResults.filter(r => !r.error_message).length;
  }

  get lastExecutionFailedCount(): number {
    return this.lastExecutionResults.filter(r => r.error_message).length;
  }

  // ===== FUNCIÓN PARA OBTENER INICIALES DEL PROYECTO =====
  
  getProjectInitials(projectName: string): string {
    if (!projectName) return '';
    
    // Dividir por espacios y tomar la primera letra de cada palabra
    const words = projectName.trim().split(/\s+/);
    
    if (words.length === 1) {
      // Si es una sola palabra, tomar las primeras 2 letras
      return words[0].substring(0, 2).toUpperCase();
    } else {
      // Si son múltiples palabras, tomar la primera letra de cada una (máximo 3)
      return words
        .slice(0, 3)
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase();
    }
  }
}