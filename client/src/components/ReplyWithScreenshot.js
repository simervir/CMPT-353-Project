import React, { useState } from 'react';

function ReplyWithScreenshot({ channelId, parentId, user, onReplySent }) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploading(true);

    let imageUrl = '';

    // If there's a file, upload it first
    if (file) {
      const formData = new FormData();
      formData.append('screenshot', file);

      try {
        const uploadRes = await fetch('http://localhost:3001/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadData = await uploadRes.json();
        imageUrl = uploadData.imageUrl;
      } catch (err) {
        console.error('❌ Failed to upload screenshot:', err);
        alert('❌ Failed to upload screenshot.');
        setUploading(false);
        return;
      }
    }

    // Then send the reply with the image URL
    try {
      await fetch(`http://localhost:3001/channels/${channelId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          image_url: imageUrl,
          parent_id: parentId,
          user_id: user.id,
        }),
      });

      setContent('');
      setFile(null);
      onReplySent(); // trigger parent to refresh messages
    } catch (err) {
      console.error('❌ Error while sending reply:', err);
      alert('❌ Error while sending reply.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: '10px', paddingLeft: '20px' }}>
      <textarea
        placeholder="Write a reply..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        required
      /><br />
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setFile(e.target.files[0])}
      /><br />
      <button type="submit" disabled={uploading}>
        {uploading ? 'Sending...' : 'Send Reply'}
      </button>
    </form>
  );
}

export default ReplyWithScreenshot;
