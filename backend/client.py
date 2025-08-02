import socket
import threading

# Client configuration
HOST = '127.0.0.1'  # The server's hostname or IP address
PORT = 65432        # The port used by the server

def receive_messages(client_socket):
    while True:
        try:
            message = client_socket.recv(1024).decode('utf-8')
            if message:
                print(message)
            else:
                # Server closed the connection
                print("Disconnected from server.")
                break
        except:
            print("An error occurred!")
            client_socket.close()
            break

def send_messages(client_socket):
    while True:
        message = input()
        client_socket.send(message.encode('utf-8'))

def start_client():
    client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    client.connect((HOST, PORT))
    print("Connected to the chat room!")

    # Start a thread to receive messages from the server
    receive_thread = threading.Thread(target=receive_messages, args=(client,))
    receive_thread.start()

    # Start a thread to send messages from the user
    send_thread = threading.Thread(target=send_messages, args=(client,))
    send_thread.start()

if __name__ == "__main__":
    start_client()
