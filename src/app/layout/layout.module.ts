import { NgModule } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HeaderComponent } from './header/header.component'
import { FooterComponent } from './footer/footer.component'
import { MatMenuModule, MatButtonModule } from '@angular/material'

@NgModule({
  imports: [CommonModule, MatMenuModule, MatButtonModule],
  declarations: [HeaderComponent, FooterComponent],
  exports: [HeaderComponent, FooterComponent],
})
export class LayoutModule {}
