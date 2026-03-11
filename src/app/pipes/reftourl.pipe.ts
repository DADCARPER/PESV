import { Pipe, PipeTransform, inject } from '@angular/core';
import { StorageService } from '../services/shared/storage.service';

@Pipe({
  name: 'reftourl',
  standalone: true
})
export class ReftourlPipe implements PipeTransform {

  storegeSevice: StorageService = inject(StorageService);

  async transform(value: string){
    const url = await this.storegeSevice.getDownloadURL(value);
    return url;
  }

}
