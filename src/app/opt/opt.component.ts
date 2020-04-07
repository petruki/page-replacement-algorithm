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
    this.log = '- Starting OPT sequence';
    for (let index = 0; index < entry.length; index++) {
      const value = entry[index];
      this.log += '\n\n[' + index + '] Reading value:' + value;

      for (let cap = 1; cap <= capacity; cap++) {

        this.cursor(this.tiles[numEntries * cap + next]); await this.delay(this.delayTime);

        if (this.isEmpty(this.tiles[numEntries * cap + next])) {
          this.log += '\n- Empty page, inserting new page...';
          this.fulfillFrame(this.tiles[numEntries * cap + next], value); await this.delay(this.delayTime);
          this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
          next++;
          break;
        } else {
          if (this.tiles[numEntries * cap + next].text === value) {
            this.log += '\n- Page found, referencing the page';
            await this.delay(this.delayTime);
            if (next + 1 < numEntries) {
              this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
            }
            next++;
            break;
          }
        }

        this.cursor(this.tiles[numEntries * cap + next]);
      }

      if (next != fault) fault = next;
      else {
        this.log += '\n- Page fault, validating replacement...';
        await this.verifyFault(fault, next,  numEntries, capacity, value);
        next++;
        fault = next;
      }
    }
  }

  protected async fulfillFault(fault: number, numEntries: number, capacity: number, value: any) {
    await this.findOldest(fault, numEntries, capacity);
    for (let cap = 1; cap <= capacity; cap++) {
      this.cursor(this.tiles[numEntries * cap + fault]); await this.delay(this.delayTime);
      if (this.tiles[numEntries * cap + fault].text === this.oldest) {
        this.log += '\n-- Replacing page ' + this.oldest + ' with ' + value;
        this.tiles[numEntries * cap + fault].text = value; // replace

        // Add Fault frame
        this.tiles[numEntries * (capacity + 1) + fault].text = 'F';
        this.tiles[numEntries * (capacity + 1) + fault].color = this.FAULT;
        break;
      } else {
        this.cursor(this.tiles[numEntries * cap + fault]);
      }
    }
  }

  private async findOldest(fault: number, numEntries: number, capacity: number) {
    let pos = -1;
    let oldesPos = -1;
    this.log += '\n-- Finding the oldest value...';
    for (let capRead = 1; capRead <= capacity; capRead++) {
      const valueRead = this.tiles[numEntries * capRead + fault].text;

      pos = -1;
      for (let index = fault + 1; index < numEntries; index++) {
        this.tiles[index].border = this.READING; await this.delay(this.delayTime);
        let headerValue = this.tiles[index].text;

        if (headerValue === valueRead) {
          pos = index;
          this.tiles[index].border = this.NOT_READING;
          break;
        }
        this.tiles[index].border = this.NOT_READING;
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
    this.log += '\n-- Found oldest: ' + this.oldest;
  }
}