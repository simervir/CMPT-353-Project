import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';

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

export default ChannelList;
