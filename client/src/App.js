import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

function LoginPage({ setUser }) {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
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
          alert(data.error);
        } else {
          setUser(data);
          navigate('/');
        }
      });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>{isRegister ? 'Register' : 'Login'}</h2>
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)} /><br />
        <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} /><br />
        {isRegister && (
          <input type="text" placeholder="Display Name" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
        )}<br />
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
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('http://localhost:3001/channels')
      .then(res => res.json())
      .then(data => setChannels(data));

    if (user.is_admin) {
      fetch('http://localhost:3001/admin/users')
        .then(res => res.json())
        .then(data => setUsers(data));
    }
  }, [user]);

  const handleCreateChannel = (e) => {
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

  const deleteUser = (id) => {
    fetch('http://localhost:3001/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_user_id: user.id, user_id: id }),
    }).then(() => setUsers(users.filter(u => u.id !== id)));
  };

  const deleteChannel = (id) => {
    fetch('http://localhost:3001/admin/delete-channel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ admin_user_id: user.id, channel_id: id }),
    }).then(() => setChannels(channels.filter(c => c.id !== id)));
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Welcome, {user.display_name}!</h1>
      <button onClick={() => setUser(null)}>Logout</button>

      <h2>Create a Channel</h2>
      <form onSubmit={handleCreateChannel}>
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
            {user.is_admin && (
              <button style={{ marginLeft: '10px' }} onClick={() => deleteChannel(channel.id)}>❌ Delete</button>
            )}
          </li>
        ))}
      </ul>

      {user.is_admin && (
        <>
          <h2>Admin Panel: Users</h2>
          <ul>
            {users.map(u => (
              <li key={u.id}>
                {u.display_name} ({u.username})
                {!u.is_admin && (
                  <button style={{ marginLeft: '10px' }} onClick={() => deleteUser(u.id)}>❌ Delete</button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
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

  const fetchMessages = () => {
    fetch(`http://localhost:3001/channels/${channelId}/messages`)
      .then(res => res.json())
      .then(data => setMessages(data));
  };

  useEffect(() => {
    fetchMessages();
  }, [channelId]);

  const sendNewMessage = (e) => {
    e.preventDefault();
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
        fetchMessages();
      });
  };

  const sendReply = (e, parentId) => {
    e.preventDefault();
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
        fetchMessages();
      });
  };

  const vote = (id, type) => {
    fetch(`http://localhost:3001/messages/${id}/${type}`, {
      method: 'POST'
    }).then(() => fetchMessages());
  };

  const renderMessages = (parentId = null, indent = 0) => {
    return messages
      .filter(m => m.parent_id === parentId)
      .map(m => (
        <div key={m.id} style={{ marginLeft: `${indent * 30}px`, borderLeft: indent ? '1px solid #ccc' : 'none', paddingLeft: '10px' }}>
          <p>
            <strong>{m.display_name || 'Anonymous'}:</strong> {m.content}
            {m.image_url && <img src={m.image_url} alt="" style={{ maxWidth: '200px', display: 'block' }} />}
          </p>
          <p style={{ fontSize: '0.9em' }}>
            {m.created_at}
            <button onClick={() => vote(m.id, 'upvote')} style={{ marginLeft: '10px' }}>👍 {m.upvotes}</button>
            <button onClick={() => vote(m.id, 'downvote')} style={{ marginLeft: '5px' }}>👎 {m.downvotes}</button>
            <button onClick={() => setReplyingTo(replyingTo === m.id ? null : m.id)} style={{ marginLeft: '10px' }}>
              {replyingTo === m.id ? 'Cancel' : 'Reply'}
            </button>
          </p>

          {replyingTo === m.id && (
            <form onSubmit={(e) => sendReply(e, m.id)}>
              <input
                type="text"
                placeholder="Your reply..."
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                required
              />
              <button type="submit">Send</button>
            </form>
          )}

          {/* Render replies */}
          {renderMessages(m.id, indent + 1)}
        </div>
      ));
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/">← Back to Channels</Link>
      <h2>Messages for Channel {channelId}</h2>

      <form onSubmit={sendNewMessage}>
        <input
          type="text"
          placeholder="Write a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          required
        /><br />
        <input
          type="text"
          placeholder="Optional image URL"
          value={imageURL}
          onChange={(e) => setImageURL(e.target.value)}
        /><br />
        <button type="submit">Send Message</button>
      </form>

      <hr />
      <div>{renderMessages()}</div>
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
