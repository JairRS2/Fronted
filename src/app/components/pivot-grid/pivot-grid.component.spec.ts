import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PivotGridComponent } from './pivot-grid.component';

describe('PivotGridComponent', () => {
  let component: PivotGridComponent;
  let fixture: ComponentFixture<PivotGridComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [PivotGridComponent]
    });
    fixture = TestBed.createComponent(PivotGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
