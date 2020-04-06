import { Tile, AppComponent } from './app.component';

export abstract class PageAlgorithm {

  // Frame status
  protected ALLOC_FRAME: string = 'lightblue';
  protected NOT_ALLOC_FRAME: string = 'rgb(227, 227, 227)';
  protected FAULT: string = '#e6adad';

  // Cursor status
  protected READING: string = '2px solid #ff000091';
  protected NOT_READING: string = '0px';

  columns: number;
  capacity: number;
  tiles: Tile[];

  protected delayTime: number = 500;
  private paused: boolean = false;

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

  protected cursor(tile: Tile): void {
    if (tile.border === this.READING)
      tile.border = this.NOT_READING;
    else
      tile.border = this.READING;
  }

  protected isEmpty(tile: Tile): boolean {
    return tile.text === ' ';
  }

  protected async delay(ms: number) {
    while (this.paused) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  toggle() {
    this.paused = !this.paused;
  }

  public async execute(stream: string, capacity: string, speed: any, app: AppComponent) {
    this.capacity = Number(capacity);
    this.delayTime = Number(speed);
    app.executing = true;
    await this.loadBlocks(stream, capacity);
    app.executing = false;
  }

  protected abstract async exeuteAlgorithm(entry: string[], capacity: number): Promise<any>

  protected abstract async fulfillFault(fault: number, numEntries: number, capacity: number, value: any): Promise<any>

}