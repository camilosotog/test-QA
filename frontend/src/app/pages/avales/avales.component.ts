import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { AvalesService, Aval, DeployTask, RequiredInput } from './avales.service';

@Component({
  selector: 'app-avales',
  templateUrl: './avales.component.html',
  styleUrls: ['./avales.component.scss']
})
export class AvalesComponent implements OnInit {

  form!: FormGroup;
  avalesList: Aval[] = [];

  // Estados de la UI
  showForm = false;
  editingId: number | null = null;
  loadingList = false;
  saving = false;
  publishing = false;
  publishingId: number | null = null;
  mejorando = false;

  // Diagnóstico Confluence
  showConfigPanel = false;
  testingConfluence = false;
  confluenceTestResult: any = null;

  // Mensajes al usuario
  successMsg = '';
  errorMsg = '';

  readonly DEFAULT_INPUTS: RequiredInput[] = [
    { label: 'Cédulas de prueba', checked: false },
    { label: 'Diagrama de flujo', checked: false },
    { label: 'Números de contrato', checked: false },
    { label: 'Nombres', checked: false },
    { label: 'Fecha de nacimiento y expedición', checked: false },
    { label: 'Usuarios asesores', checked: false }
  ];

  constructor(
    private fb: FormBuilder,
    private avalesService: AvalesService
  ) {}

  ngOnInit(): void {
    this.loadAvales();
    this.initForm();
  }

  // ─── Formulario ──────────────────────────────────────────────────────────────

  initForm(aval?: Aval): void {
    const today = new Date().toISOString().split('T')[0];

    this.form = this.fb.group({
      title: [aval?.title || '', Validators.required],
      project_name: [aval?.project_name || '', Validators.required],
      request_date: [aval?.request_date ? aval.request_date.split('T')[0] : today, Validators.required],
      requester: [aval?.requester || '', Validators.required],
      responsible_team: [aval?.responsible_team || 'Desarrollo', Validators.required],
      current_env: [aval?.current_env || 'Preproduccion', Validators.required],
      target_env: [aval?.target_env || 'Produccion', Validators.required],
      qa_responsible: [aval?.qa_responsible || '', Validators.required],
      observations: [aval?.observations || ''],
      qa_role: [aval?.qa_role || 'Lider de QA'],
      po_name: [aval?.po_name || ''],
      po_role: [aval?.po_role || 'Cargo del PO'],
      deploy_tasks: this.fb.array(
        (aval?.deploy_tasks || [{ jira_key: '', description: '', notes: '' }])
          .map(t => this.buildTaskGroup(t))
      ),
      required_inputs: this.fb.array(
        (aval?.required_inputs?.length ? aval.required_inputs : this.DEFAULT_INPUTS)
          .map(i => this.buildInputGroup(i))
      )
    });
  }

  buildTaskGroup(task?: DeployTask) {
    return this.fb.group({
      jira_key: [task?.jira_key || '', Validators.required],
      description: [task?.description || ''],
      notes: [task?.notes || '']
    });
  }

  buildInputGroup(input?: RequiredInput) {
    return this.fb.group({
      label: [input?.label || '', Validators.required],
      checked: [input?.checked || false]
    });
  }

  get deployTasks() { return this.form.get('deploy_tasks') as FormArray; }
  get requiredInputs() { return this.form.get('required_inputs') as FormArray; }

  addTask(): void {
    this.deployTasks.push(this.buildTaskGroup());
  }

  removeTask(i: number): void {
    if (this.deployTasks.length > 1) this.deployTasks.removeAt(i);
  }

  addInput(): void {
    this.requiredInputs.push(this.buildInputGroup());
  }

  removeInput(i: number): void {
    if (this.requiredInputs.length > 1) this.requiredInputs.removeAt(i);
  }

  // ─── CRUD ─────────────────────────────────────────────────────────────────────

  loadAvales(): void {
    this.loadingList = true;
    this.avalesService.list().subscribe({
      next: (res) => { this.avalesList = res.data || []; this.loadingList = false; },
      error: () => { this.loadingList = false; }
    });
  }

  openNew(): void {
    this.editingId = null;
    this.initForm();
    this.showForm = true;
    this.clearMessages();
  }

  openEdit(aval: Aval): void {
    this.editingId = aval.id!;
    this.initForm(aval);
    this.showForm = true;
    this.clearMessages();
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingId = null;
    this.clearMessages();
  }

  saveAval(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMsg = 'Por favor completa los campos obligatorios.';
      return;
    }

    this.saving = true;
    this.clearMessages();
    const payload: Aval = this.form.value;

    const obs = this.editingId
      ? this.avalesService.update(this.editingId, payload)
      : this.avalesService.create(payload);

    obs.subscribe({
      next: (res) => {
        this.saving = false;
        this.successMsg = res.message || 'Guardado exitosamente';
        this.showForm = false;
        this.loadAvales();
      },
      error: (err) => {
        this.saving = false;
        this.errorMsg = err?.error?.error || 'Error al guardar el aval';
      }
    });
  }

  deleteAval(aval: Aval): void {
    if (!confirm(`¿Eliminar el aval "${aval.title}"?`)) return;
    this.avalesService.delete(aval.id!).subscribe({
      next: () => { this.successMsg = 'Aval eliminado'; this.loadAvales(); },
      error: (err) => { this.errorMsg = err?.error?.error || 'Error al eliminar'; }
    });
  }

  // ─── Publicar en Confluence ───────────────────────────────────────────────────

  mejorarConIA(): void {
    const payload = {
      observations: this.form.get('observations')?.value,
      project_name: this.form.get('project_name')?.value,
      qa_responsible: this.form.get('qa_responsible')?.value,
      request_date: this.form.get('request_date')?.value,
      current_env: this.form.get('current_env')?.value,
      target_env: this.form.get('target_env')?.value,
      deploy_tasks: this.form.get('deploy_tasks')?.value
    };
    this.mejorando = true;
    this.clearMessages();
    this.avalesService.mejorarObservaciones(payload).subscribe({
      next: (res) => {
        this.mejorando = false;
        if (res.success) {
          this.form.get('observations')?.setValue(res.data.improved_text);
          this.successMsg = 'Observaciones mejoradas con IA ✨';
        }
      },
      error: (err) => {
        this.mejorando = false;
        this.errorMsg = err?.error?.error || 'Error al mejorar con IA';
      }
    });
  }

  publish(aval: Aval): void {
    if (!confirm(`¿Publicar el aval "${aval.title}" en Confluence?`)) return;
    this.publishing = true;
    this.publishingId = aval.id!;
    this.clearMessages();

    this.avalesService.publishToConfluence(aval.id!).subscribe({
      next: (res) => {
        this.publishing = false;
        this.publishingId = null;
        this.successMsg = res.message;
        this.loadAvales();
        // Descargar PDF automáticamente al publicar exitosamente
        this.downloadPDF(aval);
      },
      error: (err) => {
        this.publishing = false;
        this.publishingId = null;
        this.errorMsg = err?.error?.error || 'Error al publicar en Confluence';
      }
    });
  }

  openConfluencePage(url: string): void {
    window.open(url, '_blank');
  }

  // ─── Descarga PDF ─────────────────────────────────────────────────────────────

  async downloadPDF(aval: Aval): Promise<void> {
    const pdfMake = (await import('pdfmake/build/pdfmake')).default;
    const pdfFonts = (await import('pdfmake/build/vfs_fonts')).default;
    if (pdfFonts?.pdfMake?.vfs) pdfMake.vfs = pdfFonts.pdfMake.vfs;
    else if (pdfFonts?.vfs)     pdfMake.vfs = pdfFonts.vfs;

    // Cargar firma como base64
    let firmaBase64: string | null = null;
    try {
      const resp = await fetch('/assets/firma_camilo.png');
      if (resp.ok) {
        const blob = await resp.blob();
        firmaBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }
    } catch { /* sin firma, se deja espacio en blanco */ }

    const fecha = this.formatDate(aval.request_date);
    const tasks: DeployTask[] = aval.deploy_tasks || [];
    const inputs: RequiredInput[] = aval.required_inputs || [];
    const jiraBase = 'https://coxti.atlassian.net';

    // Tabla de tareas de despliegue
    const taskRows: any[][] = tasks.map(t => [
      { text: t.jira_key, bold: true, color: '#0052CC', link: `${jiraBase}/browse/${t.jira_key}`, decoration: 'underline' },
      { text: t.description || '' },
      { text: t.notes || '' }
    ]);

    // Checklist de insumos
    const inputItems: any[] = inputs.map(i => ({
      text: `${i.checked ? '☑' : '☐'}  ${i.label}`,
      margin: [0, 2, 0, 2]
    }));

    const GREEN  = '#1B6B3A';
    const HEADER_BG = '#1B6B3A';
    const LIGHT_GREEN = '#E8F5E9';

    // Helper: encabezado de sección con fondo verde
    const section = (label: string) => ({
      table: { widths: ['*'], body: [[{ text: label, bold: true, color: '#fff', fontSize: 11, margin: [4, 3, 0, 3] }]] },
      layout: { hLineWidth: () => 0, vLineWidth: () => 0, fillColor: () => GREEN },
      margin: [0, 12, 0, 6]
    });

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [40, 40, 40, 50],
      footer: (currentPage: number, pageCount: number) => ({
        text: `Página ${currentPage} de ${pageCount}`,
        alignment: 'center', fontSize: 8, color: '#888', margin: [0, 10, 0, 0]
      }),
      content: [
        // ── Encabezado ──
        {
          columns: [
            {
              stack: [
                { text: 'AVAL DE CALIDAD QA', style: 'mainTitle' },
                { text: aval.title, style: 'subTitle' }
              ]
            },
            {
              stack: [
                { text: 'FECHA', style: 'labelSmall' },
                { text: fecha, style: 'valueSmall' }
              ],
              alignment: 'right',
              width: 180
            }
          ],
          margin: [0, 0, 0, 4]
        },
        { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 3, lineColor: GREEN }], margin: [0, 0, 0, 16] },

        // ── Información General ──
        section('Información General'),
        {
          style: 'infoTable',
          table: {
            widths: [160, '*'],
            body: [
              [{ text: 'Proyecto', style: 'cellLabel' },           { text: aval.project_name || '' }],
              [{ text: 'Fecha de solicitud', style: 'cellLabel' }, { text: fecha }],
              [{ text: 'Solicitante', style: 'cellLabel' },        { text: aval.requester || '' }],
              [{ text: 'Equipo responsable', style: 'cellLabel' }, { text: aval.responsible_team || '' }],
              [{ text: 'Ambiente actual', style: 'cellLabel' },    { text: aval.current_env || '' }],
              [{ text: 'Ambiente destino', style: 'cellLabel' },   { text: aval.target_env || '' }]
            ]
          },
          layout: 'lightHorizontalLines'
        },

        // ── Responsable QA ──
        section('Responsable QA'),
        { text: aval.qa_responsible || '', margin: [0, 0, 0, 12] },

        // ── Observaciones ──
        section('Observaciones'),
        {
          ul: [
            {
              text: [
                `Yo, `, { text: aval.qa_responsible, bold: true },
                `, en nombre del equipo de QA, el día ${fecha} doy mi aval para la salida a producción de las tareas `,
                ...tasks.map((t, i) => ([
                  { text: t.jira_key, bold: true, color: '#0052CC', link: `${jiraBase}/browse/${t.jira_key}`, decoration: 'underline' },
                  { text: i < tasks.length - 1 ? ', ' : '' }
                ])).flat(),
                `. Este aval se fundamenta en:\n`,
                `    a. Pruebas funcionales: Se han ejecutado todas las pruebas funcionales y todos los casos han sido validados exitosamente.`
              ]
            },
            { text: 'El equipo de aseguramiento de la calidad ha completado la validación funcional de los requisitos y los criterios de aceptación establecidos para las historias de usuario, garantizando que el comportamiento esperado del sistema se cumpla en el entorno de preproducción. Sin embargo, el alcance de estas pruebas no incluye la verificación de la infraestructura subyacente, por lo que aspectos como la configuración de la red, los recursos del servidor y la monitorización de la capa de plataforma no fueron objeto de cobertura. En consecuencia, la estabilidad del servicio a lo largo del tiempo, especialmente frente a variaciones en la carga y a posibles incidentes de infraestructura, queda fuera de la garantía que brinda el proceso de QA. Se recomienda complementar este aval con auditorías de arquitectura y pruebas de resiliencia para asegurar la continuidad operativa en producción.', margin: [0, 4, 0, 0] },
            { text: aval.observations || 'Por lo tanto, las tareas descritas están listas para ser implementadas en producción.', margin: [0, 4, 0, 0] }
          ],
          margin: [0, 0, 0, 12]
        },

        // ── Lista de despliegue ──
        section('Lista de despliegue'),
        tasks.length ? {
          table: {
            headerRows: 1,
            widths: [90, '*', 120],
            body: [
              [
                { text: 'Tarea (Jira)', style: 'tableHeader' },
                { text: 'Descripción', style: 'tableHeader' },
                { text: 'Notas', style: 'tableHeader' }
              ],
              ...taskRows
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0,
            hLineColor: () => '#CCCCCC',
            fillColor: (row: number) => row === 0 ? HEADER_BG : (row % 2 === 0 ? LIGHT_GREEN : null)
          },
          margin: [0, 0, 0, 12]
        } : { text: 'Sin tareas registradas.', italics: true, color: '#888', margin: [0, 0, 0, 12] },

        // ── Insumos requeridos ──
        section('Insumos requeridos para validación en producción'),
        {
          text: [
            { text: 'IMPORTANTE: ', bold: true, color: '#7B3F00' },
            'Los insumos listados a continuación son ',
            { text: 'requisitos indispensables', bold: true },
            ' para dar inicio a las pruebas en el ambiente de producción. La disponibilidad oportuna de estos elementos es responsabilidad directa de ',
            { text: aval.requester || 'el solicitante', bold: true, color: '#5D3A00' },
            ', infraestructura y negocio. ',
            { text: 'De no contar con la totalidad de los insumos marcados, las pruebas en producción no podrán iniciar', bold: true },
            ', lo que podría generar retrasos en el despliegue y comprometer los tiempos de entrega acordados.'
          ],
          fontSize: 9,
          color: '#5D3A00',
          fillColor: '#FFF3CD',
          margin: [6, 6, 6, 10],
          lineHeight: 1.4
        },
        ...inputItems,
        { text: '', margin: [0, 0, 0, 12] },

        // ── Constancia / Firmas ──
        section('Constancia'),
        {
          table: {
            widths: ['*', '*', '*', '*'],
            body: [
              [
                { text: 'Firma (QA)', style: 'tableHeader' },
                { text: 'Rol en la empresa', style: 'tableHeader' },
                { text: 'Firma (PO)', style: 'tableHeader' },
                { text: 'Rol en la empresa', style: 'tableHeader' }
              ],
              [
                firmaBase64
                  ? { image: firmaBase64, width: 80, height: 40, margin: [10, 8, 10, 8], alignment: 'center' }
                  : { text: ' ', margin: [0, 20, 0, 20] },
                { text: aval.qa_role || 'Líder de QA', margin: [0, 20, 0, 20] },
                { text: aval.po_name || '', margin: [0, 20, 0, 20] },
                { text: aval.po_role || '', margin: [0, 20, 0, 20] }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
            hLineColor: () => '#CCCCCC',
            vLineColor: () => '#CCCCCC',
            fillColor: (row: number) => row === 0 ? HEADER_BG : null
          }
        }
      ],
      styles: {
        mainTitle:     { fontSize: 18, bold: true, color: GREEN },
        subTitle:      { fontSize: 11, color: '#444', margin: [0, 2, 0, 0] },
        labelSmall:    { fontSize: 8, color: '#666', bold: true },
        valueSmall:    { fontSize: 10, color: '#222' },
        cellLabel:     { bold: true, color: '#333', fontSize: 10 },
        tableHeader:   { bold: true, color: '#fff', fontSize: 10 },
        infoTable:     { fontSize: 10, margin: [0, 0, 0, 12] }
      },
      defaultStyle: { font: 'Roboto', fontSize: 10, color: '#222' }
    };

    const fileName = `${(aval.title || 'aval').replace(/[\/:*?"<>|]/g, '_')}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
  }

  testConfluenceConnection(): void {
    this.testingConfluence = true;
    this.confluenceTestResult = null;
    this.avalesService.testConfluence().subscribe({
      next: (res) => {
        this.testingConfluence = false;
        this.confluenceTestResult = res;
      },
      error: (err) => {
        this.testingConfluence = false;
        this.confluenceTestResult = err?.error || { success: false, error: err?.message || 'Error de conexión' };
      }
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────────

  clearMessages(): void {
    this.successMsg = '';
    this.errorMsg = '';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
  }

  autoTitle(): void {
    const project = this.form.get('project_name')?.value;
    const date = this.form.get('request_date')?.value;
    if (project && date) {
      const d = new Date(date + 'T12:00:00');
      const formatted = d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '/');
      this.form.get('title')?.setValue(`Aval ${project} - ${formatted}`);
    }
  }
}
