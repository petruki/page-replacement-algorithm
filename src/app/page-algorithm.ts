import { AppComponent } from './app.component';

export interface Tile {
  color: string;
  cols: number;
  rows: number;
  text: string;
  border: string;
  log?: string;
}

export abstract class PageAlgorithm {

  // Frame status
  protected ALLOC_FRAME: string = 'lightblue';
  protected NOT_ALLOC_FRAME: string = 'rgb(227, 227, 227)';
  protected FAULT: string = '#e6adad';

  // Cursor status
  protected READING: string = '2px solid #ff000091';
  protected NOT_READING: string = '0px';

  elementIndex: number;
  logHeader: string[] = [];
  log: string = '';
  columns: number;
  capacity: number;
  tiles: Tile[];

  protected delayTime: number = 500;
  private paused: boolean = false;
  private aborted: boolean = false;

  protected async loadBlocks(stream: string, capacity: string) {
    this.tiles = [];

    const entry = stream.split(' ');
    this.columns = entry.length;
    this.capacity = Number(capacity);

    this.prepareBlocks(entry, Number(capacity));
    await this.exeuteAlgorithm(entry, Number(capacity));
  }

  private prepareBlocks(entry: string[], capacity: number): void {
    const totalPositions = entry.length * capacity + (entry.length * 2);

    for (let index = 0; index < totalPositions; index++) {
      if (index < entry.length) { // Draw header
        this.tiles.push({ text: entry[index], cols: 1, rows: 1, color: this.ALLOC_FRAME, border: this.NOT_READING });
        this.logHeader[index] = '';
      } else if (index > totalPositions - entry.length) { // Draw fault footer
        this.tiles.push({ text: ' ', cols: 1, rows: 1, color: this.NOT_ALLOC_FRAME, border: this.NOT_READING });
      } else { // Draw empty frame
        this.tiles.push({ text: ' ', cols: 1, rows: 1, color: this.NOT_ALLOC_FRAME, border: this.NOT_READING });
      }
    }
  }

  protected async verifyFault(fault: number, next: number, numEntries: number, capacity: number, value: any) {
    await this.fulfillFault(fault, numEntries, capacity, value); await this.delay(this.delayTime);
    if (next + 1 < numEntries) {
      this.prepareNextBlock(numEntries, capacity, next); await this.delay(this.delayTime);
    }
  }

  protected prepareNextBlock(numEntries: number, capacity: number, next: number): void {
    for (let cap = 1; cap <= capacity; cap++) {
      this.fulfillFrame(this.tiles[numEntries * cap + next + 1], // Next frame block
        this.tiles[numEntries * cap + next].text); // Copy previous frame block
    }
  }

  protected fulfillFrame(tile: Tile, value: string): void {
    if (value.trim() != '')
      tile.color = this.ALLOC_FRAME;
    else
      tile.color = this.NOT_ALLOC_FRAME;

    tile.text = value;
  }

  protected fulfillPageFault(numEntries: number, capacity: number, next: number): void {
    this.tiles[numEntries * (capacity + 1) + next].text = 'F';
    this.tiles[numEntries * (capacity + 1) + next].color = this.FAULT;
  }

  protected cursor(tile: Tile): void {
    if (tile.border === this.READING)
      tile.border = this.NOT_READING;
    else
      tile.border = this.READING;
  }

  protected isEmpty(tile: Tile): boolean {
    return tile.text === ' ';
  }

  protected addLog(log: string): void {
    this.log += `\n${log}`;

    if (this.elementIndex > -1) {
      this.logHeader[this.elementIndex] += `\n${log}`;
      this.tiles[this.elementIndex].log = this.logHeader[this.elementIndex].trim();
    }
  }

  protected async delay(ms: number) {
    if (this.aborted) {
      this.abort(); 
      throw new Error('Aborted');
    }

    //Ikr, it's a CPU killer. Nothing fancy, but it works.
    while (this.paused)
      await new Promise(resolve => setTimeout(resolve, 500));
      
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  public toggle() {
    this.paused = !this.paused;
  }

  public abort() {
    this.paused = false;
    this.aborted = !this.aborted;
  }

  public async execute(stream: string, capacity: string, speed: any, app: AppComponent) {
    this.log = '';
    this.logHeader = [];
    
    try {
      this.capacity = Number(capacity);
      this.delayTime = Number(speed);
      app.executing = true;
      await this.loadBlocks(stream, capacity);
    } catch (e) {}
    app.executing = false;
  }

  protected abstract async exeuteAlgorithm(entry: string[], capacity: number): Promise<any>

  protected abstract async fulfillFault(fault: number, numEntries: number, capacity: number, value: any): Promise<any>

}