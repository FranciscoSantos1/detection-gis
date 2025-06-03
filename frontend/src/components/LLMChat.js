import React, { useState, useRef } from 'react';
import jsPDF from 'jspdf';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL; 

const LLMChat = ({ viewState }) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); 
  const exportRef = useRef();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResponse('');
    try {
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

      const llmForm = new FormData();
      llmForm.append('prompt', prompt);

      const res = await fetch(`${BACKEND_URL}/ask-llm`, {
        method: 'POST',
        body: llmForm,
      });
      const data = await res.json();
      const finalResponse = data.response || data.answer || JSON.stringify(data);
      setResponse(finalResponse);
      setHistory(prev => [
        { question: prompt, answer: finalResponse },
        ...prev
      ].slice(0, 5));
    } catch (err) {
      setResponse('Erro ao comunicar com o LLM.');
    }
    setLoading(false);
  };

  const exportPDF = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/detections`);
      const detections = await res.json();
      if (!detections.length || !detections[0].annotated_image_url) {
        alert('Nenhuma imagem anotada disponível para exportar.');
        return;
      }
      const imageUrl = `${BACKEND_URL}${detections[0].annotated_image_url}`;
      const imageRes = await fetch(imageUrl);
      const imageBlob = await imageRes.blob();
      const imageDataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(imageBlob);
      });

      const pdf = new jsPDF();
      pdf.setFontSize(12);
      pdf.text(`Pergunta: ${prompt}`, 10, 10);
      pdf.text("Resposta:", 10, 20);

      const lines = pdf.splitTextToSize(response, 180);
      pdf.text(lines, 10, 30);

      pdf.addImage(imageDataUrl, 'JPEG', 10, 40 + lines.length * 5, 180, 100);
      pdf.save('analise-llm.pdf');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      alert('Erro ao exportar PDF. Verifica se existe uma imagem anotada.');
    }
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

      <div ref={exportRef} style={{ marginTop: 20 }}>
        {response && (
          <div style={{ background: '#f8fafc', padding: 16, borderRadius: 8, minHeight: 40 }}>
            <strong>Answer:</strong>
            <div style={{ marginTop: 8 }}>{response}</div>
          </div>
        )}
        {history.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <strong>Histórico:</strong>
            <ul style={{
              paddingLeft: 16,
              maxHeight: 150,
              overflowY: 'auto',
              background: '#f1f5f9',
              borderRadius: 6,
              padding: 8
            }}>
              {history.map((item, index) => (
                <li key={index} style={{ marginBottom: 10 }}>
                  <div><strong>Q:</strong> {item.question}</div>
                  <div><strong>A:</strong> {item.answer}</div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {response && (
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button onClick={exportPDF} style={{
            padding: '8px 12px',
            borderRadius: 6,
            background: '#10b981',
            color: '#fff',
            border: 'none',
            fontWeight: 500,
            fontSize: 14,
            cursor: 'pointer'
          }}>
            Export as PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default LLMChat;
