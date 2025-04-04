import React, { useState } from 'react';

function ReplyWithScreenshot({ channelId, parentId, user, onReplySent }) {
  const [replyContent, setReplyContent] = useState('');
  const [screenshot, setScreenshot] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    setScreenshot(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setUploading(true);

    try {
      let imageUrl = '';

      if (screenshot) {
        const formData = new FormData();
        formData.append('screenshot', screenshot);

        const uploadRes = await fetch('http://localhost:3001/upload', {
          method: 'POST',
          body: formData
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok || !uploadData.image_url) {
          throw new Error('Upload failed');
        }

        imageUrl = uploadData.image_url;
      }

      const messageRes = await fetch(`http://localhost:3001/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: replyContent,
          image_url: imageUrl,
          parent_id: parentId,
          user_id: user.id
        })
      });

      if (!messageRes.ok) {
        throw new Error('Message sending failed');
      }

      setReplyContent('');
      setScreenshot(null);
      onReplySent();
    } catch (err) {
      console.error(err);
      setError('❌ Error while sending reply.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '10px' }}>
      <textarea
        value={replyContent}
        onChange={(e) => setReplyContent(e.target.value)}
        placeholder="Write your reply..."
        required
      /><br />
      <input type="file" accept="image/*" onChange={handleFileChange} /><br />
      <button type="submit" disabled={uploading}>
        {uploading ? 'Uploading...' : 'Send Reply'}
      </button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

export default ReplyWithScreenshot;
