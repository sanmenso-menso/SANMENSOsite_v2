import React from 'react';
import './HomeArtistBackdrop.css';

const SERVICE_LABELS = ['音楽', 'DJ', '映像', 'デザイン'];

const HomeArtistBackdrop = () => (
  <div className="home-artist-backdrop" aria-hidden="true" data-home-artist-backdrop>
    <div className="home-artist-backdrop__services">
      {SERVICE_LABELS.map((label) => (
        <div className="home-artist-backdrop__service" key={label}>
          <span>{label}</span>
        </div>
      ))}
    </div>
  </div>
);

export default HomeArtistBackdrop;
