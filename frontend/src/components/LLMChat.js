import React, { useState } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const LLMChat = () => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');
    try {
      const res = await fetch(`${BACKEND_URL}/ask-llm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      setResponse(data.response || data.answer || JSON.stringify(data));
    } catch (err) {
      setResponse('Erro ao comunicar com o LLM.');
    }
    setLoading(false);
  };

  return (
    <div style={{ background: '#f8fafc', padding: 20, borderRadius: 8, margin: 20, maxWidth: 600 }}>
      <h3>Pergunte ao LLM</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8 }}>
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ex: Onde estão localizados os painéis solares?"
          style={{ flex: 1, padding: 8, borderRadius: 4, border: '1px solid #ccc' }}
        />
        <button type="submit" disabled={loading || !prompt} style={{ padding: '8px 16px' }}>
          {loading ? 'Aguarde...' : 'Perguntar'}
        </button>
      </form>
      {response && (
        <div style={{ marginTop: 16, background: '#fff', padding: 12, borderRadius: 4, minHeight: 40 }}>
          <strong>Resposta:</strong>
          console.log('Resposta do LLM:', response.data);
          <div>{response}</div>
        </div>
      )}
    </div>
  );
};

export default LLMChat;