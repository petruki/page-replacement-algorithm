import { Component } from '@angular/core';
import { PageAlgorithm } from '../page-algorithm';

@Component({
  selector: 'app-clock',
  templateUrl: './clock.component.html',
  styleUrls: ['../app.component.css'],
  standalone: false
})
export class ClockComponent extends PageAlgorithm {

  constructor() {
    super();
  }

  protected async exeuteAlgorithm(entry: string[], capacity: number) {
    const numEntries = entry.length;

    let next = 0, fault = 0;

    this.addLog('- Starting Clock sequence');
    for (let index = 0; index < entry.length; index++) {
      this.elementIndex = index;
      this.addLog(`\n[${index}] Reading value: ${entry[index]}`);
      
      for (let cap = 1; cap <= capacity; cap++) {
        if (this.isEmpty(this.tiles[numEntries * cap + next])) {
          this.addLog('- Page Fault loading in...');
          this.fulfillFrame(this.tiles[numEntries * cap + next], entry[index] + '*'); await this.delay(this.delayTime);
          this.fulfillPageFault(numEntries, capacity, next);
          this.moveCursor(numEntries, cap, next); await this.delay(this.delayTime);
          this.prepareNextBlock(numEntries, capacity, next); 
          next++;
          break;
        } else if (this.tiles[numEntries * cap + next].text.replace('*', '') === entry[index]) {
            this.addLog('- Page found, referencing the page');
            await this.delay(this.delayTime);

            if (this.tiles[numEntries * cap + next].text.indexOf('*') < 0) {
              this.addLog('-- Page does not have the bit (*)');
              this.tiles[numEntries * cap + next].text = this.tiles[numEntries * cap + next].text + "*";
            }

            if (next + 1 < numEntries) {
              this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
            }
            next++;
            break;
          }
      }

      ({ next, fault } = await this.checkFault(next, fault, numEntries, capacity, entry, index));
    }
  }

  private async checkFault(next: number, fault: number, numEntries: number, capacity: number, entry: string[], index: number) {
    if (next == fault) {
      this.addLog('- Page fault, validating replacement...');
      await this.verifyFault(next, numEntries, capacity, entry[index]);
      next++;
      fault = next;
    } else {
      fault = next;
    }
    return { next, fault };
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
        this.addLog(`-- Replacing page ${this.tiles[numEntries * cap + next].text} with ${value}*`);
        checked = true;
        this.tiles[numEntries * cap + next].text = value + '*'; // replace
        await this.removeBit(numEntries, capacity, next, cap);
        this.skipCursor(numEntries, cap, next); await this.delay(this.delayTime);
        break;
      }
    }

    if (!checked) {
      this.addLog(`-- Replacing page ${this.tiles[numEntries * 1 + next].text} with ${value}*`);
      this.tiles[numEntries * 1 + next].text = value + '*'; // replace
      await this.removeBit(numEntries, capacity, next, 1);
      this.moveCursor(numEntries, 1, next); await this.delay(this.delayTime);
    }

    this.fulfillPageFault(numEntries, capacity, next);
  }

  private async removeBit(numEntries: number, capacity: number, next: number, cap: number) {
    this.addLog(`--- Removing bit from the coming pages...`);
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