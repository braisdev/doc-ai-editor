// src/Chat.js

import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Paper } from '@mui/material';
import io from 'socket.io-client';

// Set SOCKET_URL to the backend's base URL
const SOCKET_URL = 'http://127.0.0.1:8000';

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Initialize Socket.IO connection
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      // Path is default '/socket.io', so no need to specify unless changed
    });

    // Handle connection events
    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setMessages((prev) => [...prev, { sender: 'System', text: 'Connected to AI Chat' }]);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setMessages((prev) => [...prev, { sender: 'System', text: 'Disconnected from AI Chat' }]);
    });

    // Listen for responses from the server
    newSocket.on('response', (data) => {
      setMessages((prev) => [...prev, { sender: 'AI', text: data.response }]);
    });

    // Handle connection errors
    newSocket.on('connect_error', (err) => {
      console.error('Connection error:', err);
      setMessages((prev) => [...prev, { sender: 'System', text: 'Connection error. Please try again.' }]);
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
            align={
              msg.sender === 'AI' ? 'left' :
              msg.sender === 'User' ? 'right' :
              'center'
            }
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
