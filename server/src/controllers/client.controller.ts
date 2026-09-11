import { Request, Response, NextFunction } from 'express';
import { ClientService } from '../services/client.service';

export class ClientController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const clients = await ClientService.listClients();
      res.status(200).json({
        success: true,
        data: { clients },
      });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const client = await ClientService.createClient(req.body);
      res.status(201).json({
        success: true,
        data: { client },
        message: 'Client created successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
