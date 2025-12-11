import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { DibujoColaborativoComponent } from '../pages/dibujo-colaborativo/dibujo-colaborativo.component';

@Injectable({ providedIn: 'root' })
export class DibujoGameGuard implements CanDeactivate<DibujoColaborativoComponent> {
  canDeactivate(component: DibujoColaborativoComponent): boolean {
    // Si el juego está activo, mostrar confirmación
    if (component.isGameActive && component.isGameActive()) {
      return confirm('Si sales del juego no podrás retomarlo. ¿Estás seguro de salir?');
    }
    return true;
  }
}
