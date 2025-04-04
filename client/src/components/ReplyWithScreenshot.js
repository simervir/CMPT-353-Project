// src/components/ReplyWithScreenshot.js
import React, { useState } from 'react';

function ReplyWithScreenshot({ channelId, parentId, user, onReplySent }) {
  const [replyContent, setReplyContent] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let imageUrl = '';

    if (imageFile) {
      const formData = new FormData();
      formData.append('screenshot', imageFile);
      try {
        const res = await fetch('http://localhost:3001/upload', {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        imageUrl = data.url;
      } catch (err) {
        alert('❌ Failed to upload screenshot.');
        return;
      }
    }

    try {
      const res = await fetch(`http://localhost:3001/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          image_url: imageUrl,
          parent_id: parentId,
          user_id: user.id
        })
      });

      if (res.ok) {
        setReplyContent('');
        setImageFile(null);
        onReplySent(); // Refresh messages
      } else {
        alert('❌ Failed to send reply.');
      }
    } catch (err) {
      alert('❌ Error while sending reply.');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '10px' }}>
      <input
        type="text"
        placeholder="Reply message"
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        required
      />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setImageFile(e.target.files[0])}
      />
      <button type="submit">Reply with Screenshot</button>
    </form>
  );
}

export default ReplyWithScreenshot;
