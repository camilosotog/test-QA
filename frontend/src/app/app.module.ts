
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AppRoutingModule } from './app-routing.module';
import { DibujoGameGuard } from './core/dibujo-game.guard';
import { AppComponent } from './app.component';
import { LoginComponent } from './pages/login/login.component';
import { QaItemsListComponent } from './pages/qa-items-list/qa-items-list.component';
import { UsersListComponent } from './pages/users-list/users-list.component';
import { AuthInterceptor } from './core/auth.interceptor';

import { EstadisticasComponent } from './pages/estadisticas/estadisticas.component';
import { AutomatedTasksComponent } from './pages/automated-tasks/automated-tasks.component';
import { TimerPipe } from './shared/timer.pipe';
import { BugsComponent } from './pages/bugs/bugs.component';
import { BugDetailComponent } from './pages/bug-detail/bug-detail.component';
import { GraficaPruebasComponent } from './pages/grafica-pruebas/grafica-pruebas.component';
import { TestomatModule } from './modules/testomat/testomat.module';
import { DibujoColaborativoComponent } from './pages/dibujo-colaborativo/dibujo-colaborativo.component';
import { ReturnsComponent } from './pages/returns/returns.component';
import { RequirementAnalysisModule } from './modules/requirement-analysis/requirement-analysis.module';
import { AvalesComponent } from './pages/avales/avales.component';

@NgModule({
  declarations: [
    AppComponent,
    LoginComponent,
    QaItemsListComponent,
    UsersListComponent,
  BugsComponent,
    BugDetailComponent,
  GraficaPruebasComponent,
    DibujoColaborativoComponent,
    EstadisticasComponent,
    AutomatedTasksComponent,
    TimerPipe,
    ReturnsComponent,
    AvalesComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    CommonModule,
    TestomatModule,
    RequirementAnalysisModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    DibujoGameGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
