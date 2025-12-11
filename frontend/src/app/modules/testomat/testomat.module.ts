import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TestProjectsListComponent } from './components/test-projects-list.component';
import { TestSuitesComponent } from './components/test-suites.component';
import { TestCasesLibraryComponent } from './components/test-cases-library.component';
import { TestExecutionsComponent } from './components/test-executions.component';
import { TestExecutionRunnerComponent } from './components/test-execution-runner.component';

// ============================================
// 🏗️ MÓDULO TESTOMAT
// ============================================

/**
 * Módulo TestOmat - Sistema de Gestión de Casos de Prueba
 * 
 * Características:
 * - Gestión de proyectos de prueba
 * - Organización por suites
 * - Creación y edición de casos de prueba
 * - Ejecución de pruebas
 * - Visualización de resultados
 * - Importación desde TestOmat.io
 * 
 * Componentes:
 * - TestProjectsListComponent: Lista y gestión de proyectos
 * - TestSuitesComponent: Lista y gestión de suites
 * - TestCasesLibraryComponent: Biblioteca de casos de prueba
 */
@NgModule({
  declarations: [
    TestProjectsListComponent,
    TestSuitesComponent,
    TestCasesLibraryComponent,
    TestExecutionsComponent,
    TestExecutionRunnerComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    ReactiveFormsModule,
    FormsModule,
    RouterModule
  ],
  exports: [
    TestProjectsListComponent,
    TestSuitesComponent,
    TestCasesLibraryComponent,
    TestExecutionsComponent,
    TestExecutionRunnerComponent
  ]
})
export class TestomatModule { }
