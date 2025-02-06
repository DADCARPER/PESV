import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SVG_ICONS, IconName } from '../../../data/iconos-svg';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-icono-svg',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './icono-svg.component.html',
  styleUrl: './icono-svg.component.css'
})
export class IconoSvgComponent {

  private _mimeType?: string|null;
  
  @Input() set mimeType(value: string| null | undefined) {
    this._mimeType = value;
    this.name = value 
    ? this.getIconNameFromMimeType(value)
    : this.name || 'word';
  }

  @Input() name!: IconName;
  @Input() size: 'sm' | 'md' | 'lg' | 'lg2' | 'auto' = 'sm';
  @Input() color?: string;

  constructor(private sanitizer: DomSanitizer) {}

  get sanitizedIcon(): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(SVG_ICONS[this.name]);
  }

  private getIconNameFromMimeType(mimeType: string): IconName {
    switch (true) {
      case mimeType.startsWith('application/msword'):
      case mimeType.startsWith('application/vnd.openxmlformats-officedocument.wordprocessingml'):
        return 'wordx';
      case mimeType.startsWith('application/vnd.ms-excel'):
      case mimeType.startsWith('application/vnd.openxmlformats-officedocument.spreadsheetml'):
        return 'excelx';
      case mimeType.startsWith('application/vnd.ms-powerpoint'):
      case mimeType.startsWith('application/vnd.openxmlformats-officedocument.presentationml'):
        return 'pptx';
      case mimeType.startsWith('application/pdf'):
        return 'pdf';
      case mimeType.startsWith('image/'):
        return 'photo';
      case mimeType.startsWith('application/zip'):
      case mimeType.startsWith('application/x-zip-compressed'):
        return 'zip';
      default:
        return this.name || 'word';
    }
  }

  getIconColor(): string {
    if (this.color) return this.color;
    
    // Colores por defecto según el tipo de archivo
    switch (this.name) {
      case 'word':
      case 'wordx':
        return '#5d6f98';
      case 'excel':
      case 'excelx':
        return '#16a34a';
      case 'pdf':
        return '#dc2626';
      case 'photo':
        return '#fbbf24';
      case 'ppt':
      case 'pptx':
        return '#ea580c';
      default:
        return 'currentColor';
    }
  }

}
