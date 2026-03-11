import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Form2ColaboradoresComponent } from './form2-colaboradores.component';

describe('Form2ColaboradoresComponent', () => {
  let component: Form2ColaboradoresComponent;
  let fixture: ComponentFixture<Form2ColaboradoresComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Form2ColaboradoresComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(Form2ColaboradoresComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
