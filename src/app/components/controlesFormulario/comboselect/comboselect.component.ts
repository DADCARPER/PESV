import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-comboselect',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './comboselect.component.html',
  styleUrl: './comboselect.component.css'
})
export class ComboselectComponent implements OnInit {

  @Input() options: string[] = [];
  @Input() label = '';
  @Input() placeholder = '';
  @Input() control!: FormControl;

  selectedIndex = -1;
  showDropdown = false;
  filteredOptions: string[] = [];

  ngOnInit() {
    this.filteredOptions = [...this.options];
    
    // Suscribirse a los cambios del control
    this.control.valueChanges.subscribe(value => {
      this.filterOptions(value);
    });
  }

  filterOptions(value: string = '') {
    const query = value.toLowerCase();
    this.filteredOptions = this.options.filter(option =>
      option.toLowerCase().includes(query)
    );
    this.selectedIndex = -1;
  }

  selectOption(option: string) {
    this.control.setValue(option);
    this.showDropdown = false;
  }

  hideDropdown() {
    setTimeout(() => {
      this.showDropdown = false;
    }, 100);
  }

  onKeyDown(event: KeyboardEvent) {
    if (!this.showDropdown) {
      if (event.key === 'ArrowDown') {
        this.showDropdown = true;
        this.selectedIndex = 0;
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.filteredOptions.length - 1);
        event.preventDefault();
        break;
      case 'ArrowUp':
        this.selectedIndex = Math.max(this.selectedIndex - 1, 0);
        event.preventDefault();
        break;
      case 'Enter':
        if (this.selectedIndex >= 0 && this.filteredOptions[this.selectedIndex]) {
          this.selectOption(this.filteredOptions[this.selectedIndex]);
        }
        event.preventDefault();
        break;
      case 'Escape':
        this.showDropdown = false;
        this.selectedIndex = -1;
        event.preventDefault();
        break;
    }
  }
  
}
