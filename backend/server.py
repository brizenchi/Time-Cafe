import asyncio
import websockets

# Set to store connected clients
clients = set()

async def handler(websocket, path):
    # Add new client to the set
    clients.add(websocket)
    print(f"New connection: {websocket.remote_address}")
    try:
        # Listen for messages from the client
        async for message in websocket:
            print(f"Received message from {websocket.remote_address}: {message}")
            # Create a list of tasks to send message to all other clients
            tasks = [client.send(message) for client in clients if client != websocket]
            if tasks:
                await asyncio.wait(tasks)
    except websockets.exceptions.ConnectionClosed:
        print(f"Connection closed: {websocket.remote_address}")
    finally:
        # Remove client from the set upon disconnection
        clients.remove(websocket)

async def main():
    # Start the WebSocket server
    async with websockets.serve(handler, "localhost", 8765):
        print("WebSocket server started at ws://localhost:8765")
        await asyncio.Future()  # Run forever

if __name__ == "__main__":
    asyncio.run(main())

