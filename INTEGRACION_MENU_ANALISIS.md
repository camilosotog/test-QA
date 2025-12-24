<!-- INTEGRACIÓN EN app.component.html -->

<!-- Agregar este item al menú de navegación -->

<li class="nav-item dropdown">
  <a 
    class="nav-link dropdown-toggle" 
    href="#" 
    role="button" 
    data-bs-toggle="dropdown" 
    aria-expanded="false"
  >
    <i class="bi bi-lightbulb"></i> Análisis de Requerimientos
  </a>
  <ul class="dropdown-menu">
    <li>
      <a 
        class="dropdown-item" 
        routerLink="/analisis-requerimientos"
        routerLinkActive="active"
      >
        <i class="bi bi-search"></i> Detectar Ambigüedades
      </a>
    </li>
    <li><hr class="dropdown-divider"></li>
    <li>
      <small class="dropdown-item-text">
        🤖 Powered by Claude + MCP
      </small>
    </li>
  </ul>
</li>

<!-- NOTA: Si el navbar usa un array de opciones (ej: navigationItems[]), agregar: -->

{
  icon: 'bi bi-lightbulb',
  label: 'Análisis de Requerimientos',
  children: [
    {
      icon: 'bi bi-search',
      label: 'Detectar Ambigüedades',
      route: '/analisis-requerimientos'
    }
  ]
}
