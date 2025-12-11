# 🔧 Ejemplos de Código - PDF Export Implementation

## 1. Función Principal de Exportación

```typescript
async exportToPDF(): Promise<void> {
  
  try {
    // Cargar pdfMake dinámicamente
    const pdfMake = await import('pdfmake/build/pdfmake');
    const pdfFonts = await import('pdfmake/build/vfs_fonts');
    pdfMake.vfs = pdfFonts.pdfMake.vfs;

    // Crear caché de imágenes
    const imageCache = new Map<string, string>();
    
    let successCount = 0;
    let failCount = 0;

    // Precarga todas las imágenes
    for (const testCase of this.cases) {
      const urls = this.getSavedEvidenceUrlsForCase(testCase);
      
      for (const url of urls) {
        const fileName = this.extractFileName(url);
        
        // Solo procesar imágenes, no videos
        if (/\.(jpg|jpeg|png|gif|webp)$/i.test(fileName) && !imageCache.has(url)) {
          
          try {
            const base64 = await this.urlToBase64(url);
            
            if (base64 && base64.length > 20) {
              imageCache.set(url, base64);
              successCount++;
            } else {
              failCount++;
              console.warn(`  ⚠️ ${fileName} - Base64 inválido`);
            }
          } catch (error) {
            failCount++;
            console.warn(`  ❌ ${fileName} - Error: ${error}`);
          }
        }
      }
    }


    // Construir el PDF con el caché de imágenes
    const pdfContent = this.buildPDFContent(imageCache);

    // Generar el PDF
    const docDefinition = {
      content: pdfContent,
      styles: {
        header: {
          fontSize: 18,
          bold: true,
          color: '#2c3e50',
          margin: [0, 0, 0, 10]
        },
        subheader: {
          fontSize: 14,
          bold: true,
          color: '#34495e',
          margin: [0, 10, 0, 5]
        },
        tableHeader: {
          bold: true,
          fontSize: 11,
          color: 'white',
          fillColor: '#34495e'
        }
      }
    };

    // Descargar el PDF
    const fileName = `ejecución-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.pdf`;
    pdfMake.createPdf(docDefinition).download(fileName);
    
  } catch (error) {
    console.error('❌ Error al exportar PDF:', error);
    throw error;
  }
}
```

---

## 2. Conversión de URL a Base64

```typescript
private async urlToBase64(url: string): Promise<string> {
  try {
    // Extraer el nombre del archivo para debugging
    const fileName = this.extractFileName(url);
    
    // Hacer fetch con headers CORS correctos
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
      headers: {
        'Accept': '*/*'
      }
    });

    // Validar respuesta HTTP
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // Convertir a Blob
    const blob = await response.blob();

    // Convertir Blob a Base64 usando FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onloadend = () => {
        const result = reader.result as string;
        
        // Validar que es base64 válido
        if (result && result.startsWith('data:')) {
          resolve(result);
        } else {
          reject(new Error('Invalid base64 data'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('FileReader error'));
      };
      
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    // Si falla, log pero no lance error (fallback a URL)
    console.warn(`⚠️ No se pudo cargar imagen: ${url}`, error);
    return '';
  }
}
```

---

## 3. Construcción del Contenido PDF

```typescript
private buildPDFContent(imageCache: Map<string, string>): any[] {
  const content = [];

  // ========== ENCABEZADO ==========
  content.push({
    text: '📊 Reporte de Ejecución de Pruebas',
    style: 'header',
    alignment: 'center'
  });

  // ========== INFORMACIÓN GENERAL ==========
  content.push({
    text: '📋 Información General',
    style: 'subheader'
  });

  const generalInfo = [
    ['Suite:', this.executionSuiteName || 'Sin nombre'],
    ['Estado:', this.executionStatus || 'Sin completar'],
    ['Ejecutada por:', this.currentUser?.name || 'Usuario desconocido'],
    ['Fecha de inicio:', new Date(this.executionStartDate).toLocaleString()],
    ['Fecha de finalización:', new Date().toLocaleString()],
    ['Total de casos:', this.cases.length.toString()],
    ['Casos pasados:', this.cases.filter(c => c.status === 'passed').length.toString()],
    ['Casos fallidos:', this.cases.filter(c => c.status === 'failed').length.toString()],
    ['Casos bloqueados:', this.cases.filter(c => c.status === 'blocked').length.toString()],
    ['Casos saltados:', this.cases.filter(c => c.status === 'skipped').length.toString()]
  ];

  content.push({
    table: {
      headerRows: 0,
      widths: ['30%', '70%'],
      body: generalInfo.map(row => [
        { text: row[0], bold: true, fillColor: '#ecf0f1' },
        row[1]
      ])
    },
    layout: 'lightHorizontalLines',
    margin: [0, 0, 0, 20]
  });

  // ========== RESUMEN DE RESULTADOS ==========
  const totalCases = this.cases.length;
  const passedCases = this.cases.filter(c => c.status === 'passed').length;
  const successRate = totalCases > 0 ? Math.round((passedCases / totalCases) * 100) : 0;

  content.push({
    text: '📊 Resumen de Resultados',
    style: 'subheader'
  });

  content.push({
    text: `Tasa de Éxito: ${successRate}%`,
    fontSize: 12,
    margin: [0, 0, 0, 15]
  });

  // ========== DETALLES POR TEST CASE ==========
  content.push({
    text: 'Detalles de Cada Caso de Prueba',
    style: 'subheader'
  });

  // Iterar sobre cada caso
  for (let i = 0; i < this.cases.length; i++) {
    const testCase = this.cases[i];
    
    // Número y nombre del test
    const statusIcon = this.getStatusIcon(testCase.status);
    content.push({
      text: `${i + 1}. ${testCase.name} ${statusIcon}`,
      fontSize: 12,
      bold: true,
      margin: [0, 10, 0, 5],
      color: this.getStatusColor(testCase.status)
    });

    // Probador QA
    if (testCase.qa_probador) {
      content.push({
        text: `QA Probador: ${testCase.qa_probador}`,
        fontSize: 10,
        italics: true,
        margin: [10, 0, 0, 5]
      });
    }

    // Anotaciones
    if (testCase.notes && testCase.notes.trim()) {
      content.push({
        text: 'Anotaciones:',
        fontSize: 10,
        bold: true,
        margin: [10, 5, 0, 3]
      });

      content.push({
        text: testCase.notes,
        fontSize: 9,
        margin: [20, 0, 0, 10],
        color: '#555'
      });
    }

    // Evidencias
    const evidenceUrls = this.getSavedEvidenceUrlsForCase(testCase);
    
    if (evidenceUrls.length > 0) {
      content.push({
        text: 'Evidencias:',
        fontSize: 10,
        bold: true,
        margin: [10, 5, 0, 3]
      });

      const evidenceContent = [];

      for (const url of evidenceUrls) {
        const fileName = this.extractFileName(url);
        const isImage = /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName);
        const isVideo = /\.(mp4|webm|mov|avi)$/i.test(fileName);

        if (isImage) {
          // Intentar usar base64 del caché
          if (imageCache.has(url)) {
            const base64Image = imageCache.get(url);
            
            if (base64Image && base64Image.length > 0) {
              // Insertar imagen base64
              evidenceContent.push({
                image: base64Image,
                width: 120,
                height: 'auto',
                fit: [120, 120],
                margin: [0, 0, 10, 0]
              });
            } else {
              // Si base64 está vacío, mostrar como link
              evidenceContent.push({
                text: `📷 ${fileName} (click para ver)`,
                color: '#0066cc',
                decoration: 'underline',
                link: url,
                margin: [0, 0, 5, 0]
              });
            }
          } else {
            // No está en caché, mostrar como link clickeable
            evidenceContent.push({
              text: `📷 ${fileName} (click para ver)`,
              color: '#0066cc',
              decoration: 'underline',
              link: url,
              margin: [0, 0, 5, 0]
            });
          }
        } else if (isVideo) {
          // Videos siempre como enlaces
          const videoPlatform = url.includes('s3.amazonaws.com') ? '📹 AWS S3' : '🎥';
          evidenceContent.push({
            text: `${videoPlatform} ${fileName}`,
            color: '#0066cc',
            decoration: 'underline',
            link: url,
            margin: [0, 0, 5, 0]
          });
        } else {
          // Otros archivos
          evidenceContent.push({
            text: `📎 ${fileName}`,
            color: '#0066cc',
            decoration: 'underline',
            link: url,
            margin: [0, 0, 5, 0]
          });
        }
      }

      // Agregar evidencias al contenido
      if (evidenceContent.length > 0) {
        content.push({
          stack: evidenceContent,
          margin: [20, 0, 0, 10]
        });
      }
    }

    // Separador entre casos
    if (i < this.cases.length - 1) {
      content.push({
        canvas: [
          {
            type: 'line',
            x1: 0,
            y1: 5,
            x2: 515,
            y2: 5,
            lineWidth: 1,
            lineColor: '#bdc3c7'
          }
        ],
        margin: [0, 10, 0, 10]
      });
    }
  }

  // ========== NOTA FINAL ==========
  content.push({
    text: 'ℹ️ Nota: Las imágenes incrustadas se muestran directamente en este PDF. Los enlaces están disponibles para abrir en el navegador.',
    fontSize: 8,
    italics: true,
    color: '#7f8c8d',
    margin: [0, 20, 0, 0]
  });

  // Fecha de generación
  content.push({
    text: `Generado: ${new Date().toLocaleString()}`,
    fontSize: 8,
    color: '#95a5a6',
    alignment: 'right',
    margin: [0, 10, 0, 0]
  });

  return content;
}
```

---

## 4. Helpers

```typescript
private getStatusIcon(status: string): string {
  switch (status) {
    case 'passed':
      return '✓ PASÓ';
    case 'failed':
      return '✗ FALLÓ';
    case 'blocked':
      return '🔒 BLOQUEADO';
    case 'skipped':
      return '⊐ SALTADO';
    default:
      return 'DESCONOCIDO';
  }
}

private getStatusColor(status: string): string {
  switch (status) {
    case 'passed':
      return '#28a745'; // Verde
    case 'failed':
      return '#dc3545'; // Rojo
    case 'blocked':
      return '#ffc107'; // Amarillo
    case 'skipped':
      return '#6c757d'; // Gris
    default:
      return '#000000'; // Negro
  }
}

private extractFileName(url: string): string {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;
    const fileName = pathname.split('/').pop() || 'archivo';
    return decodeURIComponent(fileName.split('?')[0]);
  } catch {
    return url.split('/').pop() || 'archivo';
  }
}

private getSavedEvidenceUrlsForCase(testCase: TestCase): string[] {
  if (!testCase.evidence) return [];
  
  if (typeof testCase.evidence === 'string') {
    return testCase.evidence ? [testCase.evidence] : [];
  }
  
  if (Array.isArray(testCase.evidence)) {
    return testCase.evidence.filter((e: string) => e && typeof e === 'string');
  }
  
  return [];
}
```

---

## 5. Tipos TypeScript

```typescript
interface TestCase {
  id?: string;
  name: string;
  description?: string;
  status: 'passed' | 'failed' | 'blocked' | 'skipped';
  notes?: string;
  qa_probador?: string;
  evidence?: string | string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface ExecutionInfo {
  id: string;
  suite_id: string;
  suite_name: string;
  status: 'pending' | 'in_progress' | 'completed';
  started_at: Date;
  completed_at?: Date;
  created_by: string;
  cases: TestCase[];
}

interface ImageCache extends Map<string, string> {
  // Key: URL de la imagen
  // Value: Base64 dataURL string (ej: "data:image/png;base64,...")
}
```

---

## 6. Manejo de Errores

```typescript
// En el catch del exportToPDF:

try {
  // ... código de exportación
} catch (error) {
  console.error('❌ Error al exportar PDF:', error);
  
  // Determinar tipo de error
  if (error instanceof TypeError && error.message.includes('fetch')) {
    alert('❌ Error de red: No se pudieron cargar las imágenes. Verifica tu conexión.');
  } else if (error instanceof Error && error.message.includes('CORS')) {
    alert('❌ Error de CORS: No se pudieron acceder a las imágenes. Verifica los permisos de S3.');
  } else if (error instanceof Error && error.message.includes('PDF')) {
    alert('❌ Error al generar PDF. Contacta al administrador.');
  } else {
    alert('❌ Error desconocido. Revisa la consola (F12) para más detalles.');
  }
  
  // Re-lanzar para que el usuario vea en consola
  throw error;
}
```

---

## 7. Testing Manual

```javascript
// Ejecutar esto en la consola del navegador para probar:

// Test 1: Verificar que urlToBase64 funciona
const testUrl = 'https://qa-oncredit.s3.amazonaws.com/test-evidence/[image].png';

fetch(testUrl, {
  mode: 'cors',
  credentials: 'omit',
  headers: { 'Accept': '*/*' }
})
  .then(r => {
    return r.blob();
  })
  .then(blob => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result;
      console.log('✅ Base64 creado:', base64.substring(0, 50) + '...');
      console.log('✅ Tamaño base64:', base64.length, 'bytes');
    };
    reader.readAsDataURL(blob);
  })
  .catch(e => console.error('❌ Error:', e));

// Test 2: Verificar permisos de S3
const s3Url = 'https://qa-oncredit.s3.amazonaws.com/test-evidence/[image].png';
fetch(s3Url, { mode: 'cors' })
  .then(r => console.log('S3 Status:', r.status === 200 ? '✅ OK' : '❌ Error'))
  .catch(e => console.log('❌ CORS Error:', e.message));
```

---

## 8. Configuración de pdfMake

```typescript
// En el angular.json o vite.config.ts, asegúrate de que:

{
  "build": {
    "options": {
      "assets": [
        "src/favicon.ico",
        "src/assets"
        // Los fonts de pdfMake se incluyen automáticamente con:
        // import 'pdfmake/build/vfs_fonts';
      ]
    }
  }
}
```

---

## 9. Notas de Optimización

```typescript
// Para mejorar performance:

// 1. Compresión de imágenes (opcional)
// Usar una librería como:
// import * as imageCompression from 'browser-image-compression';

// 2. Lazy loading de pdfMake
// Ya implementado con import dinámico

// 3. Caché de imágenes
// Implementado con Map<string, string>

// 4. Batch processing de imágenes
// Podría limitarse a X imágenes en paralelo:
const MAX_CONCURRENT_IMAGES = 3;
const chunks = chunkArray(imageUrls, MAX_CONCURRENT_IMAGES);
for (const chunk of chunks) {
  await Promise.all(chunk.map(url => this.urlToBase64(url)));
}
```

---

**Archivo Base:** 
`frontend/src/app/modules/testomat/components/test-execution-runner.component.ts`

**Métodos Clave:**
- ✅ `exportToPDF()` - Principal
- ✅ `buildPDFContent()` - Estructura
- ✅ `urlToBase64()` - Conversión
- ✅ Helpers - Utilidades

**Versión:** 1.0
**Última Actualización:** 18 de noviembre de 2025
