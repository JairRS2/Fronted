import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-image-modal-component',
  templateUrl: './image-modal-component.component.html',
  styleUrls: ['./image-modal-component.component.css']
})
export class ImageModalComponentComponent {
  constructor(@Inject(MAT_DIALOG_DATA) public data: { imageUrl: string }) {}

}
