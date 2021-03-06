import { Component, OnInit } from '@angular/core'
import { Config } from 'src/app/types/togglz.endpoint'
import { TogglzService } from 'src/app/core/togglz/togglz.service'

@Component({
  selector: 'app-statistics',
  templateUrl: './statistics.component.html',
  styleUrls: ['./statistics.component.scss'],
  preserveWhitespaces: true,
})
export class StatisticsComponent implements OnInit {
  togglz: Config
  constructor(_togglz: TogglzService) {
    _togglz.getTogglz().subscribe(data => {
      this.togglz = data
    })
  }

  ngOnInit() {}
}
