import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImageModalComponentComponent } from './image-modal-component.component';

describe('ImageModalComponentComponent', () => {
  let component: ImageModalComponentComponent;
  let fixture: ComponentFixture<ImageModalComponentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ImageModalComponentComponent]
    });
    fixture = TestBed.createComponent(ImageModalComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
