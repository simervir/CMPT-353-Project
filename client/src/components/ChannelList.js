import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

function ChannelList({ user, setUser }) {
  const [channels, setChannels] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({
    mostActive: null,
    leastActive: null,
    topRanked: null,
    lowestRanked: null
  });

  useEffect(() => {
    fetch('http://localhost:3001/channels')
      .then(res => res.json())
      .then(data => setChannels(data));

    if (user.is_admin) {
      fetch('http://localhost:3001/admin/users')
        .then(res => res.json())
        .then(data => setUsers(data));
    }

    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    const urls = [
      { key: 'mostActive', url: 'http://localhost:3001/stats/most-active' },
      { key: 'leastActive', url: 'http://localhost:3001/stats/least-active' },
      { key: 'topRanked', url: 'http://localhost:3001/stats/top-ranked' },
      { key: 'lowestRanked', url: 'http://localhost:3001/stats/lowest-ranked' }
    ];

    const results = {};
    for (const { key, url } of urls) {
      try {
        const res = await fetch(url);
        const data = await res.json();
        results[key] = data;
      } catch {
        results[key] = { display_name: 'Error', post_count: '?', score: '?' };
      }
    }

    setStats(results);
  };

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
        <input
          type="text"
          placeholder="Channel name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        /><br />
        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        /><br />
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

      <h2>User Stats</h2>
      <ul>
        <li>🏆 <strong>Most Active:</strong> {stats.mostActive?.display_name} ({stats.mostActive?.post_count} posts)</li>
        <li>😴 <strong>Least Active:</strong> {stats.leastActive?.display_name} ({stats.leastActive?.post_count} posts)</li>
        <li>👍 <strong>Top Ranked:</strong> {stats.topRanked?.display_name} (Score: {stats.topRanked?.score})</li>
        <li>👎 <strong>Lowest Ranked:</strong> {stats.lowestRanked?.display_name} (Score: {stats.lowestRanked?.score})</li>
      </ul>
    </div>
  );
}

export default ChannelList;
