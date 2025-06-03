const LLMChat = ({ viewState }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');
    try {
      // 1. Trigger detection for the current screen
      const DEFAULT_ZOOM = viewState.zoom || 18;
      const mapImgRes = await fetch(
        `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${viewState.longitude},${viewState.latitude},${DEFAULT_ZOOM},0,0/800x600?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}`
      );
      const mapImgBlob = await mapImgRes.blob();

      const detectForm = new FormData();
      detectForm.append('image', mapImgBlob, 'map-image.jpg');
      detectForm.append('latitude', viewState.latitude);
      detectForm.append('longitude', viewState.longitude);
      detectForm.append('zoom', DEFAULT_ZOOM);

      await fetch(`${BACKEND_URL}/detect`, {
        method: 'POST',
        body: detectForm
      });

      // 2. Now ask the LLM (it will use the latest detection, which matches the screen)
      const llmForm = new FormData();
      llmForm.append('prompt', prompt);

      const res = await fetch(`${BACKEND_URL}/ask-llm`, {
        method: 'POST',
        body: llmForm,
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
      <h3 style={{ marginBottom: 16, color: '#6f42c1' }}>Ask the Assistant LLM</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Ex: Where are the pools in this image?"
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
          {loading ? 'Wait...' : 'Asking Assistant'}
        </button>
      </form>
      {response && (
        <div style={{ marginTop: 20, background: '#f8fafc', padding: 16, borderRadius: 8, minHeight: 40 }}>
          <strong>Answer:</strong>
          <div style={{ marginTop: 8 }}>{response}</div>
        </div>
      )}
    </div>
  );
};

export default LLMChat;