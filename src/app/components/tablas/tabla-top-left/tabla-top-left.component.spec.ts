import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaTopLeftComponent } from './tabla-top-left.component';

describe('TablaTopLeftComponent', () => {
  let component: TablaTopLeftComponent;
  let fixture: ComponentFixture<TablaTopLeftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaTopLeftComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TablaTopLeftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
