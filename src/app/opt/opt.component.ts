import { Component, OnInit, Input } from '@angular/core';
import { AppComponent, Tile } from '../app.component';
import { PageAlgorithm } from '../page-algorithm';

@Component({
  selector: 'app-opt',
  templateUrl: './opt.component.html',
  styleUrls: ['../app.component.css']
})
export class OptComponent extends PageAlgorithm implements OnInit {

  oldest: any;
  
  constructor() {
    super();
  }

  ngOnInit(): void {}
  
  protected async exeuteAlgorithm(entry: string[], capacity: number) {
    const numEntries = entry.length;

    let next = 0, fault = 0;
    this.oldest = '';
    for (let index = 0; index < entry.length; index++) {
      const value = entry[index];
      
      for (let cap = 1; cap <= capacity; cap++) {

        this.cursor(this.tile[numEntries * cap + next]); await this.delay(this.delayTime);

        if (this.isEmpty(this.tile[numEntries * cap + next])) {
          this.fulfillFrame(this.tile[numEntries * cap + next], value); await this.delay(this.delayTime);
          this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
          next++;
          break;
        } else {
          if (this.tile[numEntries * cap + next].text === value) {
            await this.delay(this.delayTime);
            if (next + 1 < numEntries) {
              this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
            }
            next++;
            break;
          }
        }

        this.cursor(this.tile[numEntries * cap + next]);
      }

      if (next != fault) fault = next;
      else {
        await this.verifyFault(fault, next,  numEntries, capacity, value);
        next++;
        fault = next;
      }
    }
  }

  protected async fulfillFault(fault: number, numEntries: number, capacity: number, value: any) {
    await this.findOldest(fault, numEntries, capacity);
    for (let cap = 1; cap <= capacity; cap++) {
      this.cursor(this.tile[numEntries * cap + fault]); await this.delay(this.delayTime);
      if (this.tile[numEntries * cap + fault].text === this.oldest) {
        this.tile[numEntries * cap + fault].text = value; // replace

        // Add Fault frame
        this.tile[numEntries * (capacity + 1) + fault].text = 'F';
        this.tile[numEntries * (capacity + 1) + fault].color = this.FAULT;
        break;
      } else {
        this.cursor(this.tile[numEntries * cap + fault]);
      }
    }
  }

  private async findOldest(fault: number, numEntries: number, capacity: number) {
    let pos = -1;
    let oldesPos = -1;
    for (let capRead = 1; capRead <= capacity; capRead++) {
      const valueRead = this.tile[numEntries * capRead + fault].text;

      pos = -1;
      for (let index = fault + 1; index < numEntries; index++) {
        this.tile[index].border = this.READING; await this.delay(this.delayTime);
        let headerValue = this.tile[index].text;

        if (headerValue === valueRead) {
          pos = index;
          this.tile[index].border = this.NOT_READING;
          break;
        }
        this.tile[index].border = this.NOT_READING;
      }

      // Found first oldest - should exit
      if (pos < 0) {
        this.oldest = valueRead;
        break;
      } else if (pos > oldesPos) {
        oldesPos = pos;
        this.oldest = valueRead;
      }
    }
  }
}