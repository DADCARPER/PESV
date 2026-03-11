import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InformacionOrganizacionComponent } from './informacion-organizacion.component';

describe('InformacionOrganizacionComponent', () => {
  let component: InformacionOrganizacionComponent;
  let fixture: ComponentFixture<InformacionOrganizacionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InformacionOrganizacionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InformacionOrganizacionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
