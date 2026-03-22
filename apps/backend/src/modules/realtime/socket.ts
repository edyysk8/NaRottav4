import { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';

export function createSocketServer(server: HttpServer) {
  const io = new Server(server, {
    cors: {
      origin: '*'
    }
  });

  io.on('connection', (socket) => {
    socket.on('join:ride', (rideId: string) => {
      socket.join(`ride:${rideId}`);
    });

    socket.on('join:driver', (driverId: string) => {
      socket.join(`driver:${driverId}`);
    });
  });

  return io;
}
