import React, { useState, useEffect } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const LLMChat = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [latestImage, setLatestImage] = useState(null);

  useEffect(() => {
    // Fetch the list of annotated images on mount
    fetch(`${BACKEND_URL}/annotated_images_list`)
      .then(res => res.json())
      .then(images => {
        if (images.length > 0) {
          // Sort by name (assuming timestamp in filename) and get the latest
          const sorted = images.sort().reverse();
          setLatestImage(sorted[0]);
        }
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');
    try {
      const formData = new FormData();
      formData.append('prompt', prompt);

      if (latestImage) {
        // Fetch the image as blob and append to formData
        const imgRes = await fetch(`${BACKEND_URL}/annotated_images/${latestImage}`);
        const imgBlob = await imgRes.blob();
        formData.append('image', imgBlob, latestImage);
      }

      const res = await fetch(`${BACKEND_URL}/ask-llm`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResponse(data.response || data.answer || JSON.stringify(data));
    } catch (err) {
      setResponse('Erro ao comunicar com o LLM.');
    }
    setLoading(false);
  };

  return (
    <div style={{ background: '#fff', padding: 24, borderRadius: 16, margin: 0, maxWidth: 400, boxShadow: '0 4px 24px rgba(0,0,0,0.10)' }}>
      <h3 style={{ marginBottom: 16, color: '#6f42c1' }}>Pergunte ao LLM</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ex: Onde estão localizados os painéis solares?"
          style={{ padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16 }}
        />
        <button type="submit" disabled={loading || !prompt} style={{
          padding: '10px 0',
          borderRadius: 6,
          background: '#6f42c1',
          color: '#fff',
          border: 'none',
          fontWeight: 600,
          fontSize: 16,
          cursor: loading ? 'not-allowed' : 'pointer'
        }}>
          {loading ? 'Aguarde...' : 'Perguntar'}
        </button>
      </form>
      {response && (
        <div style={{ marginTop: 20, background: '#f8fafc', padding: 16, borderRadius: 8, minHeight: 40 }}>
          <strong>Resposta:</strong>
          <div style={{ marginTop: 8 }}>{response}</div>
        </div>
      )}
    </div>
  );
};

export default LLMChat;