// client/src/App.js

import { BrowserRouter as Router, Routes, Route, Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

function ChannelList() {
  const [channels, setChannels] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    fetch('http://localhost:3001/channels')
      .then(res => res.json())
      .then(data => setChannels(data));
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    fetch('http://localhost:3001/channels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description }),
    })
      .then(res => res.json())
      .then(newChannel => {
        setChannels([...channels, newChannel]);
        setName('');
        setDescription('');
      });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Programming Forum</h1>

      <p>Welcome! You can create channels to post programming questions and view answers from others.</p>

      <h2>Create a Channel</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Channel name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <br />
        <textarea
          placeholder="Channel description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
        <br />
        <button type="submit">Create Channel</button>
      </form>

      <h2>Available Channels</h2>
      <ul>
        {channels.map(channel => (
          <li key={channel.id}>
            <Link to={`/channels/${channel.id}`}>
              <strong>{channel.name}</strong>: {channel.description}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ChannelMessages() {
  const { channelId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageURL, setImageURL] = useState('');

  useEffect(() => {
    fetch(`http://localhost:3001/channels/${channelId}/messages`)
      .then(res => res.json())
      .then(data => setMessages(data));
  }, [channelId]);

  const handleSendMessage = (e) => {
    e.preventDefault();

    fetch(`http://localhost:3001/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newMessage, image_url: imageURL }),
    })
      .then(res => res.json())
      .then(() => {
        setNewMessage('');
        setImageURL('');
        fetch(`http://localhost:3001/channels/${channelId}/messages`)
          .then(res => res.json())
          .then(data => setMessages(data));
      });
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/">← Back to Channels</Link>
      <h2>Messages for Channel {channelId}</h2>

      <ul>
        {messages.map(msg => (
          <li key={msg.id} style={{ marginBottom: '20px' }}>
            <div>{msg.content}</div>
            {msg.image_url && msg.image_url.startsWith('http') && (
              <img
                src={msg.image_url}
                alt="Attached screenshot"
                style={{ maxWidth: '300px', marginTop: '5px', display: 'block' }}
              />
            )}
            <small>{msg.created_at}</small>
          </li>
        ))}
      </ul>

      <form onSubmit={handleSendMessage}>
        <input
          type="text"
          placeholder="Write a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          required
        />
        <br />
        <input
          type="text"
          placeholder="Optional image URL"
          value={imageURL}
          onChange={(e) => setImageURL(e.target.value)}
        />
        <br />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<ChannelList />} />
        <Route path="/channels/:channelId" element={<ChannelMessages />} />
      </Routes>
    </Router>
  );
}

export default App;
