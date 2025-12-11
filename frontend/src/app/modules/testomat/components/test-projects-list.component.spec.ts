import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TestProjectsListComponent } from './test-projects-list.component';
import { TestomatService } from '../services/testomat.service';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

describe('TestProjectsListComponent', () => {
  let component: TestProjectsListComponent;
  let fixture: ComponentFixture<TestProjectsListComponent>;
  let testomatService: jasmine.SpyObj<TestomatService>;

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('TestomatService', ['getTestProjects', 'createTestProject', 'updateTestProject']);

    await TestBed.configureTestingModule({
      declarations: [TestProjectsListComponent],
      imports: [ReactiveFormsModule, FormsModule],
      providers: [{ provide: TestomatService, useValue: spy }]
    }).compileComponents();

    testomatService = TestBed.inject(TestomatService) as jasmine.SpyObj<TestomatService>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TestProjectsListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load projects on init', () => {
    const mockProjects = [
      { id: 1, name: 'Proyecto 1', status: 'draft' as const },
      { id: 2, name: 'Proyecto 2', status: 'ready' as const }
    ];
    testomatService.getTestProjects.and.returnValue(of(mockProjects));

    fixture.detectChanges();

    expect(testomatService.getTestProjects).toHaveBeenCalled();
    expect(component.projects).toEqual(mockProjects);
    expect(component.loading).toBeFalse();
  });

  it('should handle error when loading projects', () => {
    testomatService.getTestProjects.and.returnValue(throwError(() => new Error('Test error')));

    fixture.detectChanges();

    expect(component.error).toBeTruthy();
    expect(component.loading).toBeFalse();
  });

  it('should open create form', () => {
    component.openCreateForm();

    expect(component.showForm).toBeTrue();
    expect(component.editingProjectId).toBeNull();
  });

  it('should close form', () => {
    component.showForm = true;
    component.closeForm();

    expect(component.showForm).toBeFalse();
  });

  it('should save new project', () => {
    const newProject = { name: 'Nuevo Proyecto', description: 'Test', status: 'draft' as const };
    testomatService.createTestProject.and.returnValue(of({ id: 3, ...newProject }));

    component.projectForm.patchValue(newProject);
    component.saveProject();

    expect(testomatService.createTestProject).toHaveBeenCalledWith(newProject);
  });

  it('should get correct status class', () => {
    expect(component.getStatusClass('draft')).toBe('badge-warning');
    expect(component.getStatusClass('ready')).toBe('badge-success');
    expect(component.getStatusClass('deprecated')).toBe('badge-danger');
  });

  it('should get correct status text', () => {
    expect(component.getStatusText('ready')).toBe('Listo');
    expect(component.getStatusText('deprecated')).toBe('Deprecado');
  });
});
