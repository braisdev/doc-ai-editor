import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import io from 'socket.io-client';

const SOCKET_URL = 'http://127.0.0.1:8000/ws'; // Backend Socket.IO endpoint

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(SOCKET_URL, { transports: ['websocket'] });

    // Handle connection events
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    // Listen for responses from the server
    newSocket.on('response', (data) => {
      setMessages((prev) => [...prev, { sender: 'AI', text: data.response }]);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => newSocket.close();
  }, []);

  const sendMessage = () => {
    if (input.trim() !== '' && socket) {
      // Send message to the server
      socket.emit('message', {
        user_id: 'user123', // Replace with dynamic user ID as needed
        message: input,
        document_id: 'doc1', // Replace with dynamic document ID as needed
        selected_text: '', // Replace with dynamic selected text as needed
      });

      // Add user message to the chat
      setMessages((prev) => [...prev, { sender: 'User', text: input }]);
      setInput('');
    }
  };

  return (
    <Box
      sx={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        width: 300,
        bgcolor: 'background.paper',
        boxShadow: 3,
        borderRadius: 2,
        p: 2,
        zIndex: 1000, // Ensure it stays above other elements
      }}
    >
      <Typography variant="h6" gutterBottom>
        Chat
      </Typography>
      <Paper
        sx={{
          height: 200,
          overflowY: 'auto',
          mb: 2,
          p: 1,
        }}
      >
        {messages.map((msg, idx) => (
          <Typography
            key={idx}
            variant="body2"
            align={msg.sender === 'AI' ? 'left' : 'right'}
            sx={{ mb: 1 }}
          >
            <strong>{msg.sender}:</strong> {msg.text}
          </Typography>
        ))}
      </Paper>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField
          variant="outlined"
          size="small"
          fullWidth
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <Button variant="contained" onClick={sendMessage}>
          Send
        </Button>
      </Box>
    </Box>
  );
};

export default Chat;
