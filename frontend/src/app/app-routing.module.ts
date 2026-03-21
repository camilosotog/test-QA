import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { QaItemsListComponent } from './pages/qa-items-list/qa-items-list.component';
import { UsersListComponent } from './pages/users-list/users-list.component';
import { AuthGuard } from './core/auth.guard';
import { QaAdminGuard } from './core/qa-admin.guard';
import { EstadisticasComponent } from './pages/estadisticas/estadisticas.component';
import { AdminGuard } from './core/admin.guard';


import { AutomatedTasksComponent } from './pages/automated-tasks/automated-tasks.component';
import { BugsComponent } from './pages/bugs/bugs.component';
import { BugDetailComponent } from './pages/bug-detail/bug-detail.component';
import { GraficaPruebasComponent } from './pages/grafica-pruebas/grafica-pruebas.component';
import { TestProjectsListComponent } from './modules/testomat/components/test-projects-list.component';
import { TestSuitesComponent } from './modules/testomat/components/test-suites.component';
import { TestCasesLibraryComponent } from './modules/testomat/components/test-cases-library.component';
import { TestExecutionsComponent } from './modules/testomat/components/test-executions.component';
import { TestExecutionRunnerComponent } from './modules/testomat/components/test-execution-runner.component';
import { DibujoColaborativoComponent } from './pages/dibujo-colaborativo/dibujo-colaborativo.component';
import { DibujoGameGuard } from './core/dibujo-game.guard';
import { ReturnsComponent } from './pages/returns/returns.component';
import { RequirementAnalysisComponent } from './modules/requirement-analysis/components/requirement-analysis.component';

const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'qa-items', component: QaItemsListComponent, canActivate: [AuthGuard] },
  { path: 'usuarios', component: UsersListComponent, canActivate: [AuthGuard] },
  { path: 'estadisticas', component: EstadisticasComponent, canActivate: [AdminGuard] },
  { path: 'automated-tasks', component: AutomatedTasksComponent, canActivate: [AuthGuard] },
  { path: 'bugs', component: BugsComponent, canActivate: [QaAdminGuard] },
  { path: 'bugs/:id', component: BugDetailComponent, canActivate: [QaAdminGuard] },
  { path: 'grafica-pruebas', component: GraficaPruebasComponent, canActivate: [AuthGuard] },
  { path: 'returns', component: ReturnsComponent, canActivate: [AuthGuard] },
  { path: 'dibujo-colaborativo', component: DibujoColaborativoComponent, canActivate: [AuthGuard], canDeactivate: [DibujoGameGuard] },
  { path: 'testomat', component: TestProjectsListComponent, canActivate: [AuthGuard] },
  { path: 'testomat/suites', component: TestSuitesComponent, canActivate: [AuthGuard] },
  { path: 'testomat/casos', component: TestCasesLibraryComponent, canActivate: [QaAdminGuard] },
  { path: 'testomat/ejecuciones', component: TestExecutionsComponent, canActivate: [QaAdminGuard] },
  { path: 'testomat/ejecucion/:executionId', component: TestExecutionRunnerComponent, canActivate: [QaAdminGuard] },
  { path: 'analisis-requerimientos', component: RequirementAnalysisComponent, canActivate: [AuthGuard] },
  { path: '', redirectTo: '/qa-items', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
