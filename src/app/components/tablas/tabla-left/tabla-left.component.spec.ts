import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TablaLeftComponent } from './tabla-left.component';

describe('TablaLeftComponent', () => {
  let component: TablaLeftComponent;
  let fixture: ComponentFixture<TablaLeftComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TablaLeftComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TablaLeftComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
