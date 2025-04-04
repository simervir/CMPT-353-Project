import React, { useState } from 'react';

function ReplyForm({ channelId, parentId, userId, onReplySent }) {
  const [content, setContent] = useState('');
  const [screenshot, setScreenshot] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append('content', content);
    formData.append('user_id', userId);
    formData.append('parent_id', parentId);
    if (screenshot) {
      formData.append('screenshot', screenshot);
    }

    const response = await fetch(`http://localhost:3001/channels/${channelId}/reply-with-image`, {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      setContent('');
      setScreenshot(null);
      onReplySent();
    } else {
      alert('❌ Failed to send reply with screenshot.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <textarea
        placeholder="Write your reply..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      />
      <br />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setScreenshot(e.target.files[0])}
      />
      <br />
      <button type="submit">Reply</button>
    </form>
  );
}

export default ReplyForm;
