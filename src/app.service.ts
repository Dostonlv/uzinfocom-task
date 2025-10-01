import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  mainPage(): string {
    return 'Hello World!';
  }
}
