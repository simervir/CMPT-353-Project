import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function LoginPage({ setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const url = isRegister ? 'http://localhost:3001/register' : 'http://localhost:3001/login';
    const body = isRegister
      ? { username, password, display_name: displayName }
      : { username, password };

    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setUser(data);
          navigate('/');
        }
      });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)} /><br />
        <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} /><br />
        {isRegister && (
          <>
            <input type="text" placeholder="Display Name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} /><br />
          </>
        )}
        <button type="submit">{isRegister ? 'Register' : 'Login'}</button>
      </form>
      <br />
      <button onClick={() => setIsRegister(!isRegister)}>
        {isRegister ? 'Already have an account? Login' : 'No account? Register'}
      </button>
    </div>
  );
}

function ChannelList({ user, setUser }) {
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
      <h1>Welcome, {user?.display_name || 'Guest'}!</h1>
      <button onClick={() => setUser(null)}>Logout</button>

      <h2>Create a Channel</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Channel name" value={name} onChange={(e) => setName(e.target.value)} required /><br />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} required /><br />
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

function ChannelMessages({ user }) {
  const { channelId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [imageURL, setImageURL] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyContent, setReplyContent] = useState('');

  const refreshMessages = () => {
    fetch(`http://localhost:3001/channels/${channelId}/messages`)
      .then(res => res.json())
      .then(data => setMessages(data));
  };

  useEffect(() => {
    refreshMessages();
  }, [channelId]);

  const sendNewMessage = (e) => {
    e.preventDefault();
    if (!user) return alert("Login required");
    fetch(`http://localhost:3001/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newMessage,
        image_url: imageURL,
        parent_id: null,
        user_id: user.id
      }),
    })
      .then(res => res.json())
      .then(() => {
        setNewMessage('');
        setImageURL('');
        refreshMessages();
      });
  };

  const sendReply = (e, parentId) => {
    e.preventDefault();
    if (!user) return alert("Login required");
    fetch(`http://localhost:3001/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: replyContent,
        image_url: '',
        parent_id: parentId,
        user_id: user.id
      }),
    })
      .then(res => res.json())
      .then(() => {
        setReplyingTo(null);
        setReplyContent('');
        refreshMessages();
      });
  };

  const topLevelMessages = messages.filter(m => m.parent_id === null);
  const replies = messages.filter(m => m.parent_id !== null);

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/">← Back to Channels</Link>
      <h2>Messages for Channel {channelId}</h2>

      <ul>
        {topLevelMessages.map(msg => (
          <li key={msg.id} style={{ marginBottom: '20px' }}>
            <div>
              <strong>{msg.display_name || 'Anonymous'}:</strong> {msg.content}
            </div>
            {msg.image_url && <img src={msg.image_url} alt="Attached" style={{ maxWidth: '300px', marginTop: '5px' }} />}
            <small>{msg.created_at}</small>
            <br />
            <button onClick={() => setReplyingTo(replyingTo === msg.id ? null : msg.id)}>
              {replyingTo === msg.id ? 'Cancel' : 'Reply'}
            </button>
            <ul style={{ paddingLeft: '20px', marginTop: '10px' }}>
              {replies.filter(r => r.parent_id === msg.id).map(reply => (
                <li key={reply.id}>
                  <strong>{reply.display_name || 'Anonymous'}:</strong> {reply.content}
                  <br />
                  <small>{reply.created_at}</small>
                </li>
              ))}
            </ul>
            {replyingTo === msg.id && (
              <form onSubmit={(e) => sendReply(e, msg.id)} style={{ marginTop: '10px' }}>
                <input type="text" placeholder="Write a reply..." value={replyContent} onChange={(e) => setReplyContent(e.target.value)} required />
                <button type="submit">Send Reply</button>
              </form>
            )}
          </li>
        ))}
      </ul>

      <form onSubmit={sendNewMessage}>
        <input type="text" placeholder="Write a new message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} required /><br />
        <input type="text" placeholder="Optional image URL" value={imageURL} onChange={(e) => setImageURL(e.target.value)} /><br />
        <button type="submit">Send Message</button>
      </form>
    </div>
  );
}

function App() {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <ChannelList user={user} setUser={setUser} /> : <LoginPage setUser={setUser} />} />
        <Route path="/channels/:channelId" element={<ChannelMessages user={user} />} />
      </Routes>
    </Router>
  );
}

export default App;
