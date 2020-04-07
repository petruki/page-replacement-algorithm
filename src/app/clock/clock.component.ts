import { Component, OnInit, Input } from '@angular/core';
import { AppComponent, Tile } from '../app.component';
import { PageAlgorithm } from '../page-algorithm';

@Component({
  selector: 'app-clock',
  templateUrl: './clock.component.html',
  styleUrls: ['../app.component.css']
})
export class ClockComponent extends PageAlgorithm implements OnInit {

  constructor() {
    super();
  }

  ngOnInit(): void {}

  protected async exeuteAlgorithm(entry: string[], capacity: number) {
    const numEntries = entry.length;

    let next = 0, fault = 0;

    this.log = '- Starting Clock sequence';
    for (let index = 0; index < entry.length; index++) {
      this.log += '\n\n[' + index + '] Reading value:' + entry[index];
      
      for (let cap = 1; cap <= capacity; cap++) {
        if (this.isEmpty(this.tiles[numEntries * cap + next])) {
          this.log += '\n- Empty page, inserting new page...';
          this.fulfillFrame(this.tiles[numEntries * cap + next], entry[index] + '*'); await this.delay(this.delayTime);
          this.moveCursor(numEntries, cap, next); await this.delay(this.delayTime);
          this.prepareNextBlock(numEntries, capacity, next); 
          next++;
          break;
        } else {
          if (this.tiles[numEntries * cap + next].text.replace('*', '') === entry[index]) {
            this.log += '\n- Page found, referencing the page';
            await this.delay(this.delayTime);
            if (this.tiles[numEntries * cap + next].text.indexOf('*') < 0) {
              this.log += '\n-- Page does not have the bit (*)';
              this.tiles[numEntries * cap + next].text = this.tiles[numEntries * cap + next].text + "*";
            }
            if (next + 1 < numEntries) {
              this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
            }
            next++;
            break;
          }
        }
      }

      if (next != fault) fault = next;
      else {
        this.log += '\n- Page fault, validating replacement...';
        await this.verifyFault(next,  numEntries, capacity, entry[index]);
        next++;
        fault = next;
      }
    }
  }

  protected async verifyFault(next: number,  numEntries: number, capacity: number, value: any) {
    await this.fulfillFault(numEntries, capacity, value, next); await this.delay(this.delayTime);
    if (next + 1 < numEntries) {
      this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
    }
  }

  protected async fulfillFault(numEntries: number, capacity: number, value: any, next: number) {
    let checked = false;
    for (let cap = 1; cap <= capacity; cap++) {

      if (this.tiles[numEntries * cap + next].text.indexOf('*') < 0) {
        this.log += '\n-- Replacing page ' + this.tiles[numEntries * cap + next].text + ' with ' + value + '*';
        checked = true;
        this.tiles[numEntries * cap + next].text = value + '*'; // replace
        await this.removeBit(numEntries, capacity, next, cap);
        this.skipCursor(numEntries, cap, next); await this.delay(this.delayTime);
        break;
      }
    }

    if (!checked) {
      this.log += '\n-- Replacing page ' + this.tiles[numEntries * 1 + next].text + ' with ' + value + '*';
      this.tiles[numEntries * 1 + next].text = value + '*'; // replace
      await this.removeBit(numEntries, capacity, next, 1);
      this.moveCursor(numEntries, 1, next); await this.delay(this.delayTime);
    }

    // Add Fault frame
    this.tiles[numEntries * (capacity + 1) + next].text = 'F';
    this.tiles[numEntries * (capacity + 1) + next].color = this.FAULT;
  
  }

  private async removeBit(numEntries: number, capacity: number, next: number, cap: number) {
    this.log += '\n--- Removing bit from the coming pages...';
    if (cap + 1 < capacity) {
      for (let index = cap + 1; index <= capacity; index++) {
        this.tiles[numEntries * index + next].text = this.tiles[numEntries * index + next].text.replace('*', ''); await this.delay(this.delayTime);
      }
    }
  }

  protected prepareNextBlock(numEntries: number, capacity: number, next: number): void {
    for (let cap = 1; cap <= capacity; cap++) {
      this.tiles[numEntries * cap + next + 1].border = this.tiles[numEntries * cap + next].border;
      this.fulfillFrame(this.tiles[numEntries * cap + next + 1], // Next frame block
        this.tiles[numEntries * cap + next].text); // Copy previous frame block
    }
  }

  private skipCursor(numEntries: number, cap: number, next: number): void {
    for (let index = 1; index <= this.capacity; index++) {
      if (this.tiles[numEntries * index + next].border === this.READING) {
        this.tiles[numEntries * index + next].border = this.NOT_READING;
        break;
      }
    }
    this.tiles[numEntries * (cap + 1 <= this.capacity ? cap + 1 : 1) + next].border = this.READING;
  }

  private moveCursor(numEntries: number, cap: number, next: number): void {
    let noCursor = true;
    for (let cap = 1; cap <= this.capacity; cap++) {
      if (this.tiles[numEntries * cap + next].border === this.READING) {
        this.tiles[numEntries * cap + next].border = this.NOT_READING;
        this.tiles[numEntries * (cap + 1 <= this.capacity ? cap + 1 : 1) + next].border = this.READING;
        noCursor = false;
        break;
      }
    }

    if (noCursor) {
      this.tiles[numEntries * (cap + 1) + next].border = this.READING;
    }
  }
}