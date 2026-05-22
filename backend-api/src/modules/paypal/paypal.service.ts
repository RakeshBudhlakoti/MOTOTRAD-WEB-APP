import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class PaypalService {
  private readonly logger = new Logger(PaypalService.name);
  private accessToken: string;
  private tokenExpiry: number;

  constructor(private configService: ConfigService) {}

  private async getAccessToken(): Promise<string> {
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const secret = this.configService.get<string>('PAYPAL_SECRET');
    const apiUrl = this.configService.get<string>('PAYPAL_API_URL');

    const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

    try {
      const response = await axios.post(
        `${apiUrl}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + response.data.expires_in * 1000 - 60000; // Buffer of 1 minute
      return this.accessToken;
    } catch (error) {
      this.logger.error('Failed to get PayPal access token', error.response?.data || error.message);
      throw error;
    }
  }

  async createOrder(amount: string, currency: string = 'USD', description: string = 'Mototrad Order') {
    const apiUrl = this.configService.get<string>('PAYPAL_API_URL');
    const token = await this.getAccessToken();

    try {
      const payload = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount,
            },
            description: description,
          },
        ],
      };
      
      this.logger.log(`PayPal Order Payload: ${JSON.stringify(payload)}`);

      const response = await axios.post(
        `${apiUrl}/v2/checkout/orders`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      
      this.logger.log(`PayPal Order Response Status: ${response.status}`);
      return response.data;
    } catch (error) {
      const errorDetail = error.response?.data;
      this.logger.error('Failed to create PayPal order', {
        error: errorDetail || error.message,
        payload: { amount, currency, description }
      });
      throw new Error(JSON.stringify(errorDetail) || error.message);
    }
  }

  async captureOrder(orderId: string) {
    const apiUrl = this.configService.get<string>('PAYPAL_API_URL');
    const token = await this.getAccessToken();

    try {
      this.logger.log(`Capturing PayPal order: ${orderId}`);
      const response = await axios.post(
        `${apiUrl}/v2/checkout/orders/${orderId}/capture`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      this.logger.log(`PayPal Capture Response Status: ${response.status}`);
      return response.data;
    } catch (error) {
      const errorDetail = error.response?.data;
      this.logger.error('Failed to capture PayPal order', {
        error: errorDetail || error.message,
        orderId
      });
      throw new Error(JSON.stringify(errorDetail) || error.message);
    }
  }

  async verifyWebhook(headers: any, body: any, webhookId: string) {
    const apiUrl = this.configService.get<string>('PAYPAL_API_URL');
    const token = await this.getAccessToken();

    try {
      const response = await axios.post(
        `${apiUrl}/v1/notifications/verify-webhook-signature`,
        {
          auth_algo: headers['paypal-auth-algo'],
          cert_url: headers['paypal-cert-url'],
          transmission_id: headers['paypal-transmission-id'],
          transmission_sig: headers['paypal-transmission-sig'],
          transmission_time: headers['paypal-transmission-time'],
          webhook_id: webhookId,
          webhook_event: body,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data.verification_status === 'SUCCESS';
    } catch (error) {
      this.logger.error('Failed to verify PayPal webhook', error.response?.data || error.message);
      return false;
    }
  }
}
