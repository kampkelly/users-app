import { Injectable } from '@nestjs/common';

@Injectable()
export class ReqresService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = 'https://reqres.in/api';
  }

  async makeRequest(path: string, method: string, body?: any): Promise<any> {
    const options: RequestInit = {
      method: method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      options.body = JSON.stringify(body);
    }
    const response = await fetch(`${this.baseUrl}/${path}`, options);
    if (response.status == 404) {
      return {};
    }

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  }
}
