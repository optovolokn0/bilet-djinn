import React from 'react';

export default function MapPage() {
  return (
    <main className="map-page" style={{ padding: 20 }}>
      <h1 style={{ color: '#A8C0A6' }}>Карта библиотеки</h1>

      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
        alignItems: 'center'
      }}>
        {/* Изображение карты: положи файл в public/library-map.jpg */}
        <div style={{
          width: '100%',
          maxWidth: 1100,
          borderRadius: 12,
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
        }}>
          <img
            src='../../../public/map.jpg'
            alt="Карта библиотеки"
            className="map-image"
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              objectFit: 'contain'
            }}
          />
        </div>

        <section className="map-description" style={{ maxWidth: 1100, width: '100%' }}>
          <h2 style={{ marginTop: 0, color: '#A8C0A6' }}>Краткая легенда</h2>
          <ul className="map-legend" style={{ lineHeight: 1.6 }}>
            <li><strong>Входная зона</strong> – арт-объект «Голос города» (метка 6 на схеме)</li>
            <li><strong>5</strong> – Абонемент для детей</li>
            <li><strong>7</strong> – Гардероб</li>
            <li><strong>9</strong> – Абонемент</li>
            <li><strong>14</strong> – Читальный зал (стилизован под вагон поезда)</li>
            <li><strong>10</strong> – Событийный зал (мультимедиа)</li>
            <li><strong>11</strong> – Хранение книг</li>
            <li><strong>12</strong> – Молодежный зал (с амфитеатром)</li>
            <li><strong>13</strong> – Зал искусств (арт-галерея)</li>
            <li><strong>13.1</strong> – Проектный офис</li>
            <li><strong>13.2</strong> – Медиасреда (подкастерная)</li>
          </ul>
        </section>
      </div>
    </main>
  );
}
