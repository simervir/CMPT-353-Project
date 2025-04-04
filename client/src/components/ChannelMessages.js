import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SearchBar from './SearchBar';
import ReplyWithScreenshot from './ReplyWithScreenshot';

function ChannelMessages({ user }) {
  const { channelId } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [newScreenshot, setNewScreenshot] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchMessages = () => {
    let url = `http://localhost:3001/channels/${channelId}/messages`;
    if (searchTerm) {
      url += `?search=${encodeURIComponent(searchTerm)}`;
    }
    fetch(url)
      .then(res => res.json())
      .then(data => setMessages(data));
  };

  useEffect(() => {
    fetchMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendNewMessage = async (e) => {
    e.preventDefault();
    let imageUrl = '';

    if (newScreenshot) {
      const formData = new FormData();
      formData.append('screenshot', newScreenshot);

      const uploadRes = await fetch('http://localhost:3001/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      imageUrl = uploadData.imageUrl;
    }

    fetch(`http://localhost:3001/channels/${channelId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: newMessage,
        image_url: imageUrl,
        parent_id: null,
        user_id: user.id,
      }),
    })
      .then(res => res.json())
      .then(() => {
        setNewMessage('');
        setNewScreenshot(null);
        fetchMessages();
      });
  };

  const vote = (id, type) => {
    fetch(`http://localhost:3001/messages/${id}/${type}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: user.id }),
    })
      .then(res => res.json())
      .then(data => {
        if (data.error) {
          alert(data.error);
        } else {
          fetchMessages();
        }
      });
  };

  const renderMessages = (parentId = null, indent = 0) => {
    return messages
      .filter((m) => m.parent_id === parentId)
      .map((m) => (
        <div
          key={m.id}
          style={{
            marginLeft: `${indent * 30}px`,
            borderLeft: indent ? '1px solid #ccc' : 'none',
            paddingLeft: '10px',
          }}
        >
          <p>
            <strong>{m.display_name || 'Anonymous'}:</strong> {m.content}
            {m.image_url && (
              <img
                src={m.image_url}
                alt="screenshot"
                style={{ maxWidth: '200px', display: 'block', marginTop: '5px' }}
              />
            )}
          </p>
          <p style={{ fontSize: '0.9em' }}>
            {m.created_at}
            <button onClick={() => vote(m.id, 'upvote')} style={{ marginLeft: '10px' }}>
              👍 {m.upvotes}
            </button>
            <button onClick={() => vote(m.id, 'downvote')} style={{ marginLeft: '5px' }}>
              👎 {m.downvotes}
            </button>
            <button
              onClick={() => setReplyingTo(replyingTo === m.id ? null : m.id)}
              style={{ marginLeft: '10px' }}
            >
              {replyingTo === m.id ? 'Cancel' : 'Reply'}
            </button>
          </p>

          {replyingTo === m.id && (
            <ReplyWithScreenshot
              channelId={channelId}
              parentId={m.id}
              user={user}
              onReplySent={() => {
                setReplyingTo(null);
                fetchMessages();
              }}
            />
          )}

          {renderMessages(m.id, indent + 1)}
        </div>
      ));
  };

  return (
    <div style={{ padding: '20px' }}>
      <Link to="/">← Back to Channels</Link>
      <h2>Messages for Channel {channelId}</h2>

      <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} onSearch={fetchMessages} />

      <form onSubmit={sendNewMessage}>
        <input
          type="text"
          placeholder="Write a message"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          required
        /><br />
        <input
          type="file"
          onChange={(e) => setNewScreenshot(e.target.files[0])}
        /><br />
        <button type="submit">Send Message</button>
      </form>

      <hr />
      <div>{renderMessages()}</div>
    </div>
  );
}

export default ChannelMessages;
